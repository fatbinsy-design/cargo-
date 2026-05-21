const resources = [
  {
    path: 'cargaisons',
    model: 'cargaison',
    schema: 'Cargaison',
    dateFields: ['date_expedition', 'date_arrivee_prevue'],
  },
  {
    path: 'transporteurs',
    model: 'transporteur',
    schema: 'Transporteur',
  },
  {
    path: 'villes',
    model: 'ville',
    schema: 'Ville',
  },
  {
    path: 'types_marchandises',
    model: 'typeMarchandise',
    schema: 'TypeMarchandise',
  },
  {
    path: 'statuts',
    model: 'statut',
    schema: 'Statut',
  },
  {
    path: 'admins',
    model: 'admin',
    schema: 'Admin',
    dateFields: ['date_creation', 'derniere_connexion'],
  },
  {
    path: 'sessions',
    model: 'session',
    schema: 'Session',
    dateFields: ['date_creation', 'date_expiration'],
  },
  {
    path: 'logs_connexion',
    model: 'logConnexion',
    schema: 'LogConnexion',
    dateFields: ['date_connexion'],
  },
  {
    path: 'roles',
    model: 'role',
    schema: 'Role',
  },
];

module.exports = { resources };
