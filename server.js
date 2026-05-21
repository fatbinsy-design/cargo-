require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { openApiDocument, swaggerHtml } = require('./src/openapi');
const { resources } = require('./src/resources');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function parseValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value !== '' && !Number.isNaN(Number(value))) return Number(value);
  return value;
}

function normalizePayload(resource, payload) {
  const data = { ...payload };
  delete data.id;

  for (const field of resource.dateFields || []) {
    if (data[field]) {
      data[field] = new Date(data[field]);
    }
  }

  return data;
}

function getSearchParams(req) {
  return new URL(req.originalUrl, `http://localhost:${PORT}`).searchParams;
}

function buildWhere(searchParams) {
  const reserved = new Set(['_page', '_limit', '_sort', '_order', 'q']);
  const where = {};

  for (const [key, value] of searchParams.entries()) {
    if (reserved.has(key)) {
      continue;
    }

    if (key.endsWith('_like')) {
      const field = key.replace(/_like$/, '');
      where[field] = {
        contains: value,
        mode: 'insensitive',
      };
      continue;
    }

    if (key.includes('.')) {
      const [field, ...path] = key.split('.');
      where[field] = {
        path,
        equals: parseValue(value),
      };
      continue;
    }

    where[key] = parseValue(value);
  }

  return where;
}

function sendNotFound(res, resourceName) {
  return res.status(404).json({
    message: `${resourceName} introuvable`,
  });
}

function handleError(res, error) {
  if (error.code === 'P2025') {
    return res.status(404).json({ message: 'Ressource introuvable' });
  }

  console.error(error);
  return res.status(500).json({
    message: 'Erreur serveur',
    details: process.env.NODE_ENV === 'production' ? undefined : error.message,
  });
}

app.get('/', (req, res) => {
  res.redirect('/docs');
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

app.get('/docs', (req, res) => {
  res.type('html').send(swaggerHtml());
});

app.get('/swagger.json', (req, res) => {
  res.json(openApiDocument(PORT));
});

for (const resource of resources) {
  app.get(`/${resource.path}`, async (req, res) => {
    try {
      const searchParams = getSearchParams(req);
      const page = Number(searchParams.get('_page') || 1);
      const limit = searchParams.get('_limit') ? Number(searchParams.get('_limit')) : undefined;
      const skip = limit ? (page - 1) * limit : undefined;
      const orderBy = searchParams.get('_sort')
        ? { [searchParams.get('_sort')]: searchParams.get('_order') === 'desc' ? 'desc' : 'asc' }
        : { id: 'asc' };

      const where = buildWhere(searchParams);
      const [data, total] = await Promise.all([
        prisma[resource.model].findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        prisma[resource.model].count({ where }),
      ]);

      res.set('X-Total-Count', String(total));
      res.set('Access-Control-Expose-Headers', 'X-Total-Count');
      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`/${resource.path}/search`, async (req, res) => {
    try {
      const where = buildWhere(getSearchParams(req));
      const data = await prisma[resource.model].findMany({
        where,
        orderBy: { id: 'asc' },
      });

      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`/${resource.path}/:id`, async (req, res) => {
    try {
      const data = await prisma[resource.model].findUnique({
        where: { id: Number(req.params.id) },
      });

      if (!data) return sendNotFound(res, resource.path);
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  });

  app.post(`/${resource.path}`, async (req, res) => {
    try {
      const data = await prisma[resource.model].create({
        data: normalizePayload(resource, req.body),
      });

      res.status(201).json(data);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.put(`/${resource.path}/:id`, async (req, res) => {
    try {
      const data = await prisma[resource.model].update({
        where: { id: Number(req.params.id) },
        data: normalizePayload(resource, req.body),
      });

      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch(`/${resource.path}/:id`, async (req, res) => {
    try {
      const data = await prisma[resource.model].update({
        where: { id: Number(req.params.id) },
        data: normalizePayload(resource, req.body),
      });

      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete(`/${resource.path}/:id`, async (req, res) => {
    try {
      await prisma[resource.model].delete({
        where: { id: Number(req.params.id) },
      });

      res.json({});
    } catch (error) {
      handleError(res, error);
    }
  });
}

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint introuvable' });
});

const httpServer = app.listen(PORT, () => {
  httpServer.ref();
  console.log(`API REST Cargaison: http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/docs`);
  console.log(`Healthcheck: http://localhost:${PORT}/health`);
});

const keepAlive = setInterval(() => {}, 1 << 30);

process.on('SIGINT', async () => {
  clearInterval(keepAlive);
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
});

module.exports = { app, httpServer };
