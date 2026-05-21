// =============================================================================
// EXEMPLES DE FETCH POUR LE PROJET CARGAISON SÉNÉGAL
// =============================================================================

const BASE_URL = 'http://localhost:3000';

// =============================================================================
// 1. GESTION DES CARGAISONS
// =============================================================================

// Récupérer toutes les cargaisons
async function obtenirToutesLesCargaisons() {
    try {
        const response = await fetch(`${BASE_URL}/cargaisons`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const cargaisons = await response.json();
        console.log('Toutes les cargaisons:', cargaisons);
        return cargaisons;
    } catch (error) {
        console.error('Erreur lors de la récupération des cargaisons:', error);
        throw error;
    }
}

// Récupérer une cargaison par ID
async function obtenirCargaisonParId(id) {
    try {
        const response = await fetch(`${BASE_URL}/cargaisons/${id}`);
        if (!response.ok) {
            throw new Error(`Cargaison non trouvée: ${response.status}`);
        }
        const cargaison = await response.json();
        console.log('Cargaison trouvée:', cargaison);
        return cargaison;
    } catch (error) {
        console.error('Erreur lors de la récupération de la cargaison:', error);
        throw error;
    }
}

// Filtrer les cargaisons par statut
async function obtenirCargaisonsParStatut(statut) {
    try {
        const response = await fetch(`${BASE_URL}/cargaisons?statut=${statut}`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const cargaisons = await response.json();
        console.log(`Cargaisons avec statut ${statut}:`, cargaisons);
        return cargaisons;
    } catch (error) {
        console.error('Erreur lors du filtrage:', error);
        throw error;
    }
}

// Créer une nouvelle cargaison
async function creerNouvelleCargaison(donneesCargaison) {
    try {
        const response = await fetch(`${BASE_URL}/cargaisons`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(donneesCargaison)
        });
        
        if (!response.ok) {
            throw new Error(`Erreur lors de la création: ${response.status}`);
        }
        
        const nouvelleCargaison = await response.json();
        console.log('Cargaison créée:', nouvelleCargaison);
        return nouvelleCargaison;
    } catch (error) {
        console.error('Erreur lors de la création de la cargaison:', error);
        throw error;
    }
}

// Mettre à jour une cargaison
async function mettreAJourCargaison(id, donneesModifiees) {
    try {
        const response = await fetch(`${BASE_URL}/cargaisons/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(donneesModifiees)
        });
        
        if (!response.ok) {
            throw new Error(`Erreur lors de la mise à jour: ${response.status}`);
        }
        
        const cargaisonModifiee = await response.json();
        console.log('Cargaison mise à jour:', cargaisonModifiee);
        return cargaisonModifiee;
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        throw error;
    }
}

// Mettre à jour partiellement une cargaison (PATCH)
async function mettreAJourStatutCargaison(id, nouveauStatut) {
    try {
        const response = await fetch(`${BASE_URL}/cargaisons/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ statut: nouveauStatut })
        });
        
        if (!response.ok) {
            throw new Error(`Erreur lors de la mise à jour du statut: ${response.status}`);
        }
        
        const cargaisonModifiee = await response.json();
        console.log('Statut mis à jour:', cargaisonModifiee);
        return cargaisonModifiee;
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        throw error;
    }
}

// =============================================================================
// 2. GESTION DES TRANSPORTEURS
// =============================================================================

// Récupérer tous les transporteurs
async function obtenirTousLesTransporteurs() {
    try {
        const response = await fetch(`${BASE_URL}/transporteurs`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const transporteurs = await response.json();
        console.log('Tous les transporteurs:', transporteurs);
        return transporteurs;
    } catch (error) {
        console.error('Erreur lors de la récupération des transporteurs:', error);
        throw error;
    }
}

// Rechercher un transporteur par nom
async function rechercherTransporteurParNom(nom) {
    try {
        const response = await fetch(`${BASE_URL}/transporteurs?nom_like=${encodeURIComponent(nom)}`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const transporteurs = await response.json();
        console.log('Transporteurs trouvés:', transporteurs);
        return transporteurs;
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        throw error;
    }
}

// =============================================================================
// 3. AUTHENTIFICATION
// =============================================================================

// Connexion d'un administrateur
async function connecterAdmin(username, password) {
    try {
        const response = await fetch(`${BASE_URL}/admins?username=${username}&password=${password}`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const admins = await response.json();
        if (admins.length === 0) {
            throw new Error('Identifiants incorrects');
        }
        
        const admin = admins[0];
        console.log('Connexion réussie:', admin);
        
        // Créer une session
        const session = await creerSession(admin.id);
        
        // Enregistrer le log de connexion
        await enregistrerLogConnexion(admin.id, username, 'succès');
        
        return { admin, session };
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        // Enregistrer le log d'échec
        await enregistrerLogConnexion(null, username, 'échec');
        throw error;
    }
}

// Créer une session
async function creerSession(adminId) {
    try {
        const sessionData = {
            admin_id: adminId,
            token: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date_creation: new Date().toISOString(),
            date_expiration: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 heures
            ip_address: "192.168.1.100", // À récupérer dynamiquement
            user_agent: navigator.userAgent,
            actif: true
        };
        
        const response = await fetch(`${BASE_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData)
        });
        
        if (!response.ok) {
            throw new Error(`Erreur lors de la création de session: ${response.status}`);
        }
        
        const session = await response.json();
        console.log('Session créée:', session);
        return session;
    } catch (error) {
        console.error('Erreur lors de la création de session:', error);
        throw error;
    }
}

// Enregistrer un log de connexion
async function enregistrerLogConnexion(adminId, username, statut) {
    try {
        const logData = {
            admin_id: adminId,
            username: username,
            date_connexion: new Date().toISOString(),
            ip_address: "192.168.1.100", // À récupérer dynamiquement
            user_agent: navigator.userAgent,
            statut: statut
        };
        
        const response = await fetch(`${BASE_URL}/logs_connexion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logData)
        });
        
        if (!response.ok) {
            console.warn(`Erreur lors de l'enregistrement du log: ${response.status}`);
        }
        
        const log = await response.json();
        console.log('Log enregistré:', log);
        return log;
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du log:', error);
        // Ne pas faire échouer la connexion pour un problème de log
    }
}

// =============================================================================
// 4. FONCTIONS UTILITAIRES ET RECHERCHES AVANCÉES
// =============================================================================

// Recherche avec pagination
async function obtenirCargaisonsAvecPagination(page = 1, limite = 10) {
    try {
        const response = await fetch(`${BASE_URL}/cargaisons?_page=${page}&_limit=${limite}`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const cargaisons = await response.json();
        const totalCount = response.headers.get('X-Total-Count');
        
        console.log(`Page ${page}, Total: ${totalCount}`, cargaisons);
        return {
            data: cargaisons,
            pagination: {
                page,
                limite,
                total: parseInt(totalCount) || 0
            }
        };
    } catch (error) {
        console.error('Erreur lors de la pagination:', error);
        throw error;
    }
}

// Recherche avec tri
async function obtenirCargaisonsTriees(champTri = 'date_expedition', ordre = 'asc') {
    try {
        const response = await fetch(`${BASE_URL}/cargaisons?_sort=${champTri}&_order=${ordre}`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const cargaisons = await response.json();
        console.log(`Cargaisons triées par ${champTri} (${ordre}):`, cargaisons);
        return cargaisons;
    } catch (error) {
        console.error('Erreur lors du tri:', error);
        throw error;
    }
}

// Recherche complexe avec filtres multiples
async function rechercherCargaisonsAvecFiltres(filtres) {
    try {
        let url = `${BASE_URL}/cargaisons?`;
        const params = new URLSearchParams();
        
        Object.keys(filtres).forEach(key => {
            if (filtres[key] !== null && filtres[key] !== undefined && filtres[key] !== '') {
                params.append(key, filtres[key]);
            }
        });
        
        url += params.toString();
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const cargaisons = await response.json();
        console.log('Cargaisons filtrées:', cargaisons);
        return cargaisons;
    } catch (error) {
        console.error('Erreur lors de la recherche avec filtres:', error);
        throw error;
    }
}

// =============================================================================
// 5. EXEMPLES D'UTILISATION
// =============================================================================

// Exemple d'utilisation complète
async function exempleUtilisationComplete() {
    try {
        console.log('=== DÉBUT DES TESTS ===');
        
        // 1. Récupérer toutes les cargaisons
        const cargaisons = await obtenirToutesLesCargaisons();
        
        // 2. Filtrer par statut
        const cargaisonsEnTransit = await obtenirCargaisonsParStatut('en_transit');
        
        // 3. Créer une nouvelle cargaison
        const nouvelleCargaison = {
            numero: "CAR-SN-2025-010",
            date_expedition: "2025-08-11",
            date_arrivee_prevue: "2025-08-18",
            statut: "en_preparation",
            origine: {
                ville: "Thiès",
                port: "Gare de Thiès",
                pays: "Sénégal"
            },
            destination: {
                ville: "Louga",
                adresse: "Marché de Louga",
                pays: "Sénégal"
            },
            transporteur: {
                nom: "Express du Nord",
                telephone: "+221 77 111 22 33",
                email: "contact@express-nord.sn"
            },
            marchandises: [
                {
                    type: "Bissap",
                    quantite: 50,
                    unite: "sacs de 25kg",
                    valeur: 1250000,
                    devise: "FCFA"
                }
            ],
            poids_total: 1250,
            valeur_totale: 1250000,
            devise: "FCFA"
        };
        
        const cargaisonCreee = await creerNouvelleCargaison(nouvelleCargaison);
        
        // 4. Mettre à jour le statut
        await mettreAJourStatutCargaison(cargaisonCreee.id, 'en_transit');
        
        // 5. Test de connexion
        const resultatConnexion = await connecterAdmin('admin', 'admin123');
        
        console.log('=== TESTS TERMINÉS AVEC SUCCÈS ===');
        
    } catch (error) {
        console.error('Erreur dans les tests:', error);
    }
}

// =============================================================================
// 6. CLASSE POUR GÉRER L'API
// =============================================================================

class CargaisonAPI {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('authToken');
    }
    
    // Headers par défaut
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }
    
    // Méthode générique pour les requêtes
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Erreur API sur ${endpoint}:`, error);
            throw error;
        }
    }
    
    // Méthodes spécifiques
    async getCargaisons(filtres = {}) {
        const params = new URLSearchParams(filtres);
        const endpoint = `/cargaisons${params.toString() ? '?' + params.toString() : ''}`;
        return this.request(endpoint);
    }
    
    async getCargaison(id) {
        return this.request(`/cargaisons/${id}`);
    }
    
    async createCargaison(data) {
        return this.request('/cargaisons', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async updateCargaison(id, data) {
        return this.request(`/cargaisons/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async deleteCargaison(id) {
        return this.request(`/cargaisons/${id}`, {
            method: 'DELETE'
        });
    }
    
    async login(username, password) {
        try {
            const admins = await this.request(`/admins?username=${username}&password=${password}`);
            
            if (admins.length === 0) {
                throw new Error('Identifiants incorrects');
            }
            
            const admin = admins[0];
            const session = await this.createSession(admin.id);
            
            this.token = session.token;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('currentUser', JSON.stringify(admin));
            
            return { admin, session };
        } catch (error) {
            throw error;
        }
    }
    
    async createSession(adminId) {
        const sessionData = {
            admin_id: adminId,
            token: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date_creation: new Date().toISOString(),
            date_expiration: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
            ip_address: "192.168.1.100",
            user_agent: navigator.userAgent,
            actif: true
        };
        
        return this.request('/sessions', {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
    }
    
    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }
}

// =============================================================================
// 7. EXPORT ET UTILISATION
// =============================================================================

// Pour utiliser dans un module ES6
// export { CargaisonAPI, obtenirToutesLesCargaisons, connecterAdmin };

// Pour utiliser dans Node.js
// module.exports = { CargaisonAPI, obtenirToutesLesCargaisons, connecterAdmin };

// Exemple d'utilisation de la classe
const api = new CargaisonAPI();

// Utilisation simple
// api.getCargaisons().then(cargaisons => console.log(cargaisons));
// api.login('admin', 'admin123').then(result => console.log('Connecté:', result));

console.log('Fichier d\'exemples de fetch chargé. Utilisez les fonctions selon vos besoins.');
