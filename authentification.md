# Guide d'Authentification - API Cargaison Sénégal

## Comptes Administrateurs Pré-configurés

### 1. Super Administrateur
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@cargaison-senegal.sn`
- **Rôle**: Super Administrateur
- **Permissions**: Accès complet au système

### 2. Administrateur
- **Username**: `fseck`
- **Password**: `fatou2025`
- **Email**: `fatou.seck@cargaison-senegal.sn`
- **Rôle**: Administrateur
- **Permissions**: Gestion des opérations courantes

### 3. Opérateur
- **Username**: `oba`
- **Password**: `ousmane456`
- **Email**: `ousmane.ba@cargaison-senegal.sn`
- **Rôle**: Opérateur
- **Permissions**: Gestion des cargaisons et consultation

## Exemples d'API d'Authentification

### 1. Récupérer tous les administrateurs
```bash
curl -X GET http://localhost:3000/admins
```

### 2. Authentifier un administrateur (par username)
```bash
curl -X GET "http://localhost:3000/admins?username=admin"
```

### 3. Créer une nouvelle session (connexion)
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "admin_id": 1,
    "token": "nouveau_token_unique",
    "date_creation": "2025-08-11T12:00:00Z",
    "date_expiration": "2025-08-12T12:00:00Z",
    "ip_address": "192.168.1.105",
    "user_agent": "Mon Application",
    "actif": true
  }' \
  http://localhost:3000/sessions
```

### 4. Créer un log de connexion
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "admin_id": 1,
    "username": "admin",
    "date_connexion": "2025-08-11T12:00:00Z",
    "ip_address": "192.168.1.105",
    "user_agent": "Mon Application",
    "statut": "succès"
  }' \
  http://localhost:3000/logs_connexion
```

### 5. Vérifier les permissions d'un rôle
```bash
curl -X GET "http://localhost:3000/roles?nom=admin"
```

### 6. Récupérer les sessions actives
```bash
curl -X GET "http://localhost:3000/sessions?actif=true"
```

### 7. Créer un nouvel administrateur
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Ndiaye",
    "prenom": "Aminata",
    "email": "aminata.ndiaye@cargaison-senegal.sn",
    "username": "andiaye",
    "password": "aminata789",
    "role": "operateur",
    "telephone": "+221 77 999 88 77",
    "date_creation": "2025-08-11",
    "actif": true,
    "permissions": [
      "gestion_cargaisons",
      "consultation_rapports"
    ]
  }' \
  http://localhost:3000/admins
```

### 8. Mettre à jour le statut d'un administrateur
```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"actif": false}' \
  http://localhost:3000/admins/3
```

### 9. Déconnexion (supprimer une session)
```bash
curl -X DELETE http://localhost:3000/sessions/1
```

### 10. Filtrer les logs par statut
```bash
# Logs de connexions réussies
curl -X GET "http://localhost:3000/logs_connexion?statut=succès"

# Logs d'échecs de connexion
curl -X GET "http://localhost:3000/logs_connexion?statut=échec"
```

## Simulation d'un Workflow d'Authentification

### Étape 1: Vérification des identifiants
```bash
# Rechercher l'utilisateur par username
curl -X GET "http://localhost:3000/admins?username=admin&password=admin123"
```

### Étape 2: Création d'une session si authentification réussie
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "admin_id": 1,
    "token": "session_token_' $(date +%s) '",
    "date_creation": "' $(date -u +%Y-%m-%dT%H:%M:%SZ) '",
    "date_expiration": "' $(date -u -d "+12 hours" +%Y-%m-%dT%H:%M:%SZ) '",
    "ip_address": "192.168.1.100",
    "user_agent": "Curl/Test",
    "actif": true
  }' \
  http://localhost:3000/sessions
```

### Étape 3: Enregistrement du log de connexion
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "admin_id": 1,
    "username": "admin",
    "date_connexion": "' $(date -u +%Y-%m-%dT%H:%M:%SZ) '",
    "ip_address": "192.168.1.100",
    "user_agent": "Curl/Test",
    "statut": "succès"
  }' \
  http://localhost:3000/logs_connexion
```

### Étape 4: Vérification des permissions
```bash
# Récupérer les informations de l'admin connecté
curl -X GET http://localhost:3000/admins/1

# Vérifier les permissions du rôle
curl -X GET "http://localhost:3000/roles?nom=super_admin"
```

## Sécurité et Bonnes Pratiques

### Note Important
⚠️ **Les mots de passe sont stockés en clair dans ce projet de démonstration. Dans un environnement de production, utilisez toujours un hashage sécurisé (bcrypt, scrypt, etc.).**

### Recommandations pour la production
1. Hasher tous les mots de passe
2. Utiliser des tokens JWT sécurisés
3. Implémenter l'expiration automatique des sessions
4. Ajouter des limitations de tentatives de connexion
5. Utiliser HTTPS pour toutes les communications
6. Implémenter une politique de mots de passe forts
