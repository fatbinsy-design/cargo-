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

## CI/CD avec GitHub Actions

Le workflow CI est dans `.github/workflows/ci.yml`.

Il se lance automatiquement sur :

- `push` vers `main` ou `master`
- `pull_request` vers `main` ou `master`

Ce qu'il fait :

1. Demarre une base PostgreSQL de test.
2. Installe les dependances avec `npm ci`.
3. Genere le client Prisma.
4. Cree les tables avec `npm run db:push`.
5. Insere les donnees initiales avec `npm run db:seed`.
6. Demarre l'API et verifie `/health`.

Pour l'activer :

1. Initialiser Git si ce n'est pas encore fait :

```bash
git init
git add .
git commit -m "Initial commit"
```

2. Creer un depot GitHub et pousser le projet :

```bash
git branch -M main
git remote add origin <URL_DU_DEPOT_GITHUB>
git push -u origin main
```

3. Aller dans l'onglet **Actions** du depot GitHub pour voir l'execution du pipeline.
# cargo-
