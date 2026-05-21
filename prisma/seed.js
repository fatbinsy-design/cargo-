const { PrismaClient } = require('@prisma/client');
const db = require('../db.json');

const prisma = new PrismaClient();

function withDates(item, fields) {
  const data = { ...item };

  for (const field of fields) {
    if (data[field]) {
      data[field] = new Date(data[field]);
    }
  }

  return data;
}

async function resetTables() {
  await prisma.logConnexion.deleteMany();
  await prisma.session.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.role.deleteMany();
  await prisma.statut.deleteMany();
  await prisma.typeMarchandise.deleteMany();
  await prisma.ville.deleteMany();
  await prisma.transporteur.deleteMany();
  await prisma.cargaison.deleteMany();
}

async function resetSequence(tableName) {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"${tableName}"', 'id'),
      COALESCE((SELECT MAX(id) FROM "${tableName}"), 1),
      true
    )
  `);
}

async function main() {
  await resetTables();

  await prisma.cargaison.createMany({
    data: db.cargaisons.map((item) => withDates(item, ['date_expedition', 'date_arrivee_prevue'])),
  });

  await prisma.transporteur.createMany({ data: db.transporteurs });
  await prisma.ville.createMany({ data: db.villes });
  await prisma.typeMarchandise.createMany({ data: db.types_marchandises });
  await prisma.statut.createMany({ data: db.statuts });

  await prisma.admin.createMany({
    data: db.admins.map((item) => withDates(item, ['date_creation', 'derniere_connexion'])),
  });

  await prisma.session.createMany({
    data: db.sessions.map((item) => withDates(item, ['date_creation', 'date_expiration'])),
  });

  await prisma.logConnexion.createMany({
    data: db.logs_connexion.map((item) => withDates(item, ['date_connexion'])),
  });

  await prisma.role.createMany({ data: db.roles });

  await resetSequence('Cargaison');
  await resetSequence('Transporteur');
  await resetSequence('Ville');
  await resetSequence('TypeMarchandise');
  await resetSequence('Statut');
  await resetSequence('Admin');
  await resetSequence('Session');
  await resetSequence('LogConnexion');
  await resetSequence('Role');

  console.log('Seed termine avec succes.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
