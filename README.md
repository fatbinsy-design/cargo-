# API REST - Gestion des Cargaisons Sénégal

Cette application expose une vraie API REST pour la gestion des cargaisons au Sénégal.

Stack utilisée :
- Express
- Prisma
- PostgreSQL
- Swagger / OpenAPI

## Installation

1. Installer les dépendances :

```bash
npm install
```

2. Créer une base PostgreSQL :

```sql
CREATE DATABASE cargaison_db;
```

3. Créer le fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

Puis adapter `DATABASE_URL` si ton utilisateur ou mot de passe PostgreSQL est différent :

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cargaison_db?schema=public"
PORT=3000
```

4. Générer Prisma et créer les tables :

```bash
npm run prisma:generate
npm run db:push
```

5. Remplir la base avec les seeds :

```bash
npm run db:seed
```

6. Démarrer l’API :

```bash
npm start
```

Le serveur sera accessible sur `http://localhost:3000`.

## Documentation Swagger

- Interface Swagger : `http://localhost:3000/docs`
- OpenAPI JSON : `http://localhost:3000/swagger.json`
- Healthcheck PostgreSQL : `http://localhost:3000/health`

## Endpoints REST

Chaque ressource expose les méthodes REST :

- `GET /ressource`
- `GET /ressource/:id`
- `POST /ressource`
- `PUT /ressource/:id`
- `PATCH /ressource/:id`
- `DELETE /ressource/:id`

Ressources disponibles :

- `/cargaisons`
- `/transporteurs`
- `/villes`
- `/types_marchandises`
- `/statuts`
- `/admins`
- `/sessions`
- `/logs_connexion`
- `/roles`

## Exemples

### Lister les cargaisons

```bash
curl http://localhost:3000/cargaisons
```

### Filtrer par statut

```bash
curl "http://localhost:3000/cargaisons?statut=en_transit"
```

### Créer une cargaison

```bash
curl -X POST http://localhost:3000/cargaisons \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "CAR-SN-2026-001",
    "date_expedition": "2026-05-21",
    "date_arrivee_prevue": "2026-06-01",
    "statut": "en_preparation",
    "origine": { "ville": "Dakar", "pays": "Sénégal" },
    "destination": { "ville": "Touba", "pays": "Sénégal" },
    "transporteur": { "nom": "Transport Mouride Express" },
    "marchandises": [],
    "poids_total": 1000,
    "valeur_totale": 500000,
    "devise": "FCFA"
  }'
```

## Scripts utiles

```bash
npm run dev              # Lance l'API avec watch mode
npm run prisma:generate  # Genere le client Prisma
npm run db:push          # Cree/met a jour les tables PostgreSQL
npm run db:seed          # Insere les donnees initiales
npm run studio           # Ouvre Prisma Studio
```

## TP DevOps AWS

Le depot contient maintenant un socle complet pour le TP MediShop :

- `terraform/` provisionne la VPC, les sous-reseaux, les 3 instances EC2 et les Security Groups.
- `ansible/site.yml` installe Docker, Nginx, Certbot et PostgreSQL selon le role de chaque instance.
- `frontend/` contient une petite Todo App statique servie en conteneur Nginx.
- `.github/workflows/deploy.yml` construit, pousse et deploie les images Front/Back sur `main`.
- `scripts/remote-deploy-*.sh` gerent le premier deploiement et le rollback.

Le guide de passage complet est dans [docs/tp-devops.md](docs/tp-devops.md).

## CI/CD avec GitHub Actions

Le workflow CI reste dans `.github/workflows/ci.yml` et verifie l'API avec PostgreSQL.

Le deploiement continu est dans `.github/workflows/deploy.yml`. Il utilise les secrets GitHub suivants :

```text
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
EC2_SSH_KEY
FRONT_HOST
BACK_PRIVATE_IP
DB_PRIVATE_IP
POSTGRES_PASSWORD
```

Les images publiees sont :

```text
<DOCKERHUB_USERNAME>/medishop-back:latest
<DOCKERHUB_USERNAME>/medishop-back:<sha-du-commit>
<DOCKERHUB_USERNAME>/medishop-front:latest
<DOCKERHUB_USERNAME>/medishop-front:<sha-du-commit>
```
