const db = require('../db.json');
const { resources } = require('./resources');

function inferSchema(value) {
  if (Array.isArray(value)) {
    return {
      type: 'array',
      items: value.length > 0 ? inferSchema(value[0]) : {},
      example: value,
    };
  }

  if (value && typeof value === 'object') {
    const properties = {};
    const required = [];

    for (const [key, childValue] of Object.entries(value)) {
      properties[key] = inferSchema(childValue);
      required.push(key);
    }

    return { type: 'object', properties, required, example: value };
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { type: 'integer', example: value }
      : { type: 'number', example: value };
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean', example: value };
  }

  return { type: 'string', example: value };
}

function buildSchemas() {
  return resources.reduce((schemas, resource) => {
    schemas[resource.schema] = inferSchema(db[resource.path][0] || {});
    return schemas;
  }, {});
}

function buildPaths() {
  return resources.reduce((paths, resource) => {
    const schemaRef = { $ref: `#/components/schemas/${resource.schema}` };
    const tag = resource.schema;

    paths[`/${resource.path}`] = {
      get: {
        tags: [tag],
        summary: `Lister les ${resource.path}`,
        parameters: [
          { name: '_page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: '_limit', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: '_sort', in: 'query', schema: { type: 'string' } },
          { name: '_order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: {
            description: 'Liste des elements.',
            content: {
              'application/json': {
                schema: { type: 'array', items: schemaRef },
              },
            },
          },
        },
      },
      post: {
        tags: [tag],
        summary: `Creer un element dans ${resource.path}`,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: schemaRef } },
        },
        responses: {
          201: {
            description: 'Element cree.',
            content: { 'application/json': { schema: schemaRef } },
          },
        },
      },
    };

    paths[`/${resource.path}/{id}`] = {
      get: {
        tags: [tag],
        summary: `Obtenir un element de ${resource.path}`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Element trouve.', content: { 'application/json': { schema: schemaRef } } },
          404: { description: 'Element introuvable.' },
        },
      },
      put: {
        tags: [tag],
        summary: `Remplacer un element de ${resource.path}`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: schemaRef } } },
        responses: {
          200: { description: 'Element remplace.', content: { 'application/json': { schema: schemaRef } } },
          404: { description: 'Element introuvable.' },
        },
      },
      patch: {
        tags: [tag],
        summary: `Modifier partiellement un element de ${resource.path}`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
        },
        responses: {
          200: { description: 'Element modifie.', content: { 'application/json': { schema: schemaRef } } },
          404: { description: 'Element introuvable.' },
        },
      },
      delete: {
        tags: [tag],
        summary: `Supprimer un element de ${resource.path}`,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Element supprime.' },
          404: { description: 'Element introuvable.' },
        },
      },
    };

    return paths;
  }, {});
}

function openApiDocument(port) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'API REST Cargaison Senegal',
      version: '1.0.0',
      description: 'API REST Express + Prisma + PostgreSQL pour la gestion des cargaisons.',
    },
    servers: [{ url: `http://localhost:${port}`, description: 'Serveur local' }],
    tags: resources.map((resource) => ({
      name: resource.schema,
      description: `Endpoints ${resource.path}`,
    })),
    paths: {
      '/health': {
        get: {
          tags: ['Systeme'],
          summary: 'Verifier la connexion API et PostgreSQL',
          responses: { 200: { description: 'API disponible.' }, 503: { description: 'Base indisponible.' } },
        },
      },
      ...buildPaths(),
    },
    components: { schemas: buildSchemas() },
  };
}

function swaggerHtml() {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <title>Swagger - API REST Cargaison Senegal</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <style>
      body { margin: 0; background: #f7f7f7; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        SwaggerUIBundle({
          url: '/swagger.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis],
        });
      };
    </script>
  </body>
</html>`;
}

module.exports = { openApiDocument, swaggerHtml };
