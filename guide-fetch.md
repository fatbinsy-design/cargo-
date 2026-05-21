# 🚛 Guide Pratique - Fetch pour Projet Cargaison

## Comment utiliser les fetch dans votre projet de cargaison

### 📋 Table des matières
1. [Démarrage rapide](#démarrage-rapide)
2. [Exemples simples](#exemples-simples)
3. [Gestion des erreurs](#gestion-des-erreurs)
4. [Authentification](#authentification)
5. [Interface utilisateur](#interface-utilisateur)
6. [Bonnes pratiques](#bonnes-pratiques)

---

## 🚀 Démarrage rapide

### 1. Démarrer votre serveur JSON
```bash
cd "/home/syllafall/Documents/projet tsc/jsonserveur cargaisn"
npm start
```

### 2. Tester dans le navigateur
Ouvrez le fichier `test-api.html` dans votre navigateur pour une interface de test complète.

### 3. Utiliser dans votre code JavaScript
```javascript
// Inclure le fichier exemples-fetch.js
const api = new CargaisonAPI();

// Exemple simple
api.getCargaisons().then(cargaisons => {
    console.log('Cargaisons récupérées:', cargaisons);
});
```

---

## 📝 Exemples simples

### Récupérer des données
```javascript
// 1. Toutes les cargaisons
async function getCargaisons() {
    try {
        const response = await fetch('http://localhost:3000/cargaisons');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// 2. Cargaisons par statut
async function getCargaisonsParStatut(statut) {
    const response = await fetch(`http://localhost:3000/cargaisons?statut=${statut}`);
    return response.json();
}

// 3. Une cargaison spécifique
async function getCargaison(id) {
    const response = await fetch(`http://localhost:3000/cargaisons/${id}`);
    return response.json();
}
```

### Créer des données
```javascript
async function creerCargaison(donnees) {
    const response = await fetch('http://localhost:3000/cargaisons', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(donnees)
    });
    return response.json();
}
```

### Mettre à jour des données
```javascript
// Mise à jour complète
async function modifierCargaison(id, donnees) {
    const response = await fetch(`http://localhost:3000/cargaisons/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(donnees)
    });
    return response.json();
}

// Mise à jour partielle (recommandée)
async function changerStatut(id, nouveauStatut) {
    const response = await fetch(`http://localhost:3000/cargaisons/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statut: nouveauStatut })
    });
    return response.json();
}
```

---

## ⚠️ Gestion des erreurs

### Approche simple
```javascript
async function fetchAvecGestionErreur() {
    try {
        const response = await fetch('http://localhost:3000/cargaisons');
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération:', error);
        // Afficher un message à l'utilisateur
        alert('Impossible de récupérer les données. Vérifiez votre connexion.');
        return null;
    }
}
```

### Fonction utilitaire pour tous vos fetch
```javascript
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur API:', error);
        throw error; // Relancer pour que l'appelant puisse gérer
    }
}

// Utilisation
apiCall('http://localhost:3000/cargaisons')
    .then(data => console.log(data))
    .catch(error => console.log('Erreur:', error.message));
```

---

## 🔐 Authentification

### Connexion simple
```javascript
async function seConnecter(username, password) {
    try {
        // 1. Vérifier les identifiants
        const admins = await fetch(`http://localhost:3000/admins?username=${username}&password=${password}`)
            .then(r => r.json());
        
        if (admins.length === 0) {
            throw new Error('Identifiants incorrects');
        }
        
        // 2. Sauvegarder les infos utilisateur
        localStorage.setItem('currentUser', JSON.stringify(admins[0]));
        
        // 3. Créer une session (optionnel)
        const session = await creerSession(admins[0].id);
        localStorage.setItem('sessionToken', session.token);
        
        return admins[0];
    } catch (error) {
        console.error('Erreur de connexion:', error);
        throw error;
    }
}

async function creerSession(adminId) {
    const sessionData = {
        admin_id: adminId,
        token: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date_creation: new Date().toISOString(),
        date_expiration: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        actif: true
    };
    
    return fetch('http://localhost:3000/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
    }).then(r => r.json());
}

// Vérifier si l'utilisateur est connecté
function estConnecte() {
    return localStorage.getItem('currentUser') !== null;
}

// Déconnexion
function seDeconnecter() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionToken');
}
```

---

## 🎨 Interface utilisateur

### Exemple avec affichage dans le DOM
```javascript
// Afficher la liste des cargaisons
async function afficherCargaisons() {
    try {
        const cargaisons = await fetch('http://localhost:3000/cargaisons')
            .then(r => r.json());
        
        const container = document.getElementById('cargaisons-list');
        container.innerHTML = '';
        
        cargaisons.forEach(cargaison => {
            const div = document.createElement('div');
            div.className = 'cargaison-item';
            div.innerHTML = `
                <h3>${cargaison.numero}</h3>
                <p>Statut: <span class="statut-${cargaison.statut}">${cargaison.statut}</span></p>
                <p>De: ${cargaison.origine.ville} → Vers: ${cargaison.destination.ville}</p>
                <p>Valeur: ${cargaison.valeur_totale.toLocaleString()} ${cargaison.devise}</p>
                <button onclick="changerStatutCargaison(${cargaison.id})">Changer statut</button>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        document.getElementById('cargaisons-list').innerHTML = 
            '<p style="color: red;">Erreur lors du chargement des cargaisons</p>';
    }
}

// Formulaire de création de cargaison
async function soumettreFormulaire() {
    const formData = {
        numero: document.getElementById('numero').value,
        statut: document.getElementById('statut').value,
        origine: {
            ville: document.getElementById('ville-origine').value,
            pays: 'Sénégal'
        },
        destination: {
            ville: document.getElementById('ville-destination').value,
            pays: 'Sénégal'
        },
        // ... autres champs
    };
    
    try {
        const nouvelleCargaison = await fetch('http://localhost:3000/cargaisons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        }).then(r => r.json());
        
        alert('Cargaison créée avec succès !');
        afficherCargaisons(); // Rafraîchir la liste
    } catch (error) {
        alert('Erreur lors de la création de la cargaison');
    }
}
```

### Filtres et recherche
```javascript
// Filtrer les cargaisons
async function filtrerCargaisons() {
    const statut = document.getElementById('filtre-statut').value;
    const ville = document.getElementById('filtre-ville').value;
    
    let url = 'http://localhost:3000/cargaisons?';
    const params = new URLSearchParams();
    
    if (statut) params.append('statut', statut);
    if (ville) params.append('origine.ville', ville);
    
    try {
        const cargaisons = await fetch(url + params.toString())
            .then(r => r.json());
        
        afficherResultatsFiltres(cargaisons);
    } catch (error) {
        console.error('Erreur de filtrage:', error);
    }
}

// Recherche en temps réel
function configurerRechercheTempsReel() {
    const champRecherche = document.getElementById('recherche');
    let timeoutId;
    
    champRecherche.addEventListener('input', (e) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            rechercherCargaisons(e.target.value);
        }, 300); // Attendre 300ms après la dernière frappe
    });
}

async function rechercherCargaisons(terme) {
    if (!terme.trim()) {
        afficherCargaisons(); // Afficher toutes si recherche vide
        return;
    }
    
    try {
        const cargaisons = await fetch(`http://localhost:3000/cargaisons?numero_like=${terme}`)
            .then(r => r.json());
        
        afficherResultatsRecherche(cargaisons);
    } catch (error) {
        console.error('Erreur de recherche:', error);
    }
}
```

---

## ✅ Bonnes pratiques

### 1. Constantes et configuration
```javascript
// Configuration centralisée
const CONFIG = {
    API_BASE_URL: 'http://localhost:3000',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3
};

// URLs centralisées
const ENDPOINTS = {
    CARGAISONS: '/cargaisons',
    TRANSPORTEURS: '/transporteurs',
    ADMINS: '/admins',
    SESSIONS: '/sessions'
};
```

### 2. Fonctions réutilisables
```javascript
// Fonction générique pour tous les appels API
class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }
    
    // Méthodes de commodité
    get(endpoint) {
        return this.request(endpoint);
    }
    
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
    
    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Utilisation
const api = new ApiService(CONFIG.API_BASE_URL);

// Exemples d'utilisation
api.get('/cargaisons').then(console.log);
api.post('/cargaisons', nouvelleCargaison).then(console.log);
api.patch('/cargaisons/1', { statut: 'livre' }).then(console.log);
```

### 3. Gestion d'état simple
```javascript
// État global de l'application
const AppState = {
    currentUser: null,
    cargaisons: [],
    transporteurs: [],
    loading: false,
    
    // Méthodes pour modifier l'état
    setLoading(loading) {
        this.loading = loading;
        this.updateUI();
    },
    
    setCargaisons(cargaisons) {
        this.cargaisons = cargaisons;
        this.updateUI();
    },
    
    updateUI() {
        // Mettre à jour l'interface utilisateur
        if (this.loading) {
            document.getElementById('spinner').style.display = 'block';
        } else {
            document.getElementById('spinner').style.display = 'none';
        }
    }
};
```

### 4. Exemple complet pour votre projet
```javascript
// app.js - Fichier principal de votre application
document.addEventListener('DOMContentLoaded', async () => {
    const api = new ApiService('http://localhost:3000');
    
    // Vérifier si l'utilisateur est connecté
    const user = localStorage.getItem('currentUser');
    if (user) {
        AppState.currentUser = JSON.parse(user);
        await chargerDonnees();
    } else {
        afficherPageConnexion();
    }
    
    async function chargerDonnees() {
        try {
            AppState.setLoading(true);
            
            const [cargaisons, transporteurs] = await Promise.all([
                api.get('/cargaisons'),
                api.get('/transporteurs')
            ]);
            
            AppState.setCargaisons(cargaisons);
            AppState.setTransporteurs(transporteurs);
            
            afficherTableauDeBord();
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            afficherErreur('Impossible de charger les données');
        } finally {
            AppState.setLoading(false);
        }
    }
    
    // Gestionnaires d'événements
    document.getElementById('btn-nouvelle-cargaison').addEventListener('click', 
        () => afficherFormulaireCreation());
    
    document.getElementById('btn-rafraichir').addEventListener('click', 
        () => chargerDonnees());
});
```

---

## 🎯 Points clés à retenir

1. **Toujours gérer les erreurs** avec try/catch
2. **Utiliser async/await** pour un code plus lisible
3. **Centraliser la configuration** (URLs, endpoints)
4. **Créer des fonctions réutilisables**
5. **Afficher des indicateurs de chargement**
6. **Valider les données** avant de les envoyer
7. **Tester avec l'interface HTML** fournie

---

## 📞 Assistance

Si vous avez des questions, consultez :
- Le fichier `exemples-fetch.js` pour des exemples détaillés
- Le fichier `test-api.html` pour tester dans le navigateur
- Le fichier `authentification.md` pour l'authentification

Bon développement ! 🚀
