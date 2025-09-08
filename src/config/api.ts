// Configuration de l'API pour différents environnements
const API_CONFIG = {
  development: {
    baseURL: 'https://64556dd02f0b.ngrok-free.app/api', // URL ngrok synchronisée
    //baseURL: 'https://partenairemagb-backend.onrender.com/api',

    timeout: 30000,
    retryAttempts: 3,
    enableLogging: true,
  },
  staging: {
    baseURL: 'https://partenairemagb-backend.onrender.com/api',
    timeout: 15000,
    retryAttempts: 2,
    enableLogging: false,
  },
  production: {
    baseURL: 'https://partenairemagb-backend.onrender.com/api',
    timeout: 20000,
    retryAttempts: 2,
    enableLogging: false,
  },
};

// Déterminer l'environnement actuel
const getEnvironment = () => {
  if (__DEV__) {
    return 'development';
  }
  // Vous pouvez ajouter ici une logique pour différencier staging et production
  // Par exemple, en utilisant une variable d'environnement ou un flag
  return 'production';
};

export const currentConfig = API_CONFIG[getEnvironment() as keyof typeof API_CONFIG];

// Export de l'URL de base pour compatibilité avec les services existants
export const API_BASE_URL = currentConfig.baseURL;

// Fonction utilitaire pour changer d'environnement dynamiquement (pour les tests)
export const switchEnvironment = (env: keyof typeof API_CONFIG) => {
  const newConfig = API_CONFIG[env];
  Object.assign(currentConfig, newConfig);
  return newConfig;
};

// Constantes pour les endpoints
export const ENDPOINTS = {
  // Authentification
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    ME: '/auth/me',
    // Nouveaux endpoints pour SMS
    REQUEST_PASSWORD_RESET_CODE: '/auth/request-password-reset-code',
    RESET_PASSWORD_WITH_CODE: '/auth/reset-password-with-code',
    REQUEST_PASSWORD_RESET_SMS_CODE: '/auth/request-password-reset-sms-code',
    RESET_PASSWORD_WITH_SMS_CODE: '/auth/reset-password-with-sms-code',
    SEND_PHONE_VERIFICATION_CODE: '/auth/send-phone-verification-code',
    VERIFY_PHONE_CODE: '/auth/verify-phone-code',
  },

  // Utilisateurs
  USERS: {
    PROFILE: '/users/profile',
    ALL: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    UPLOAD_AVATAR: '/users/upload-avatar',
    UPLOAD_AVATAR_BASE64: '/users/upload-avatar-base64',
    PREFERENCES: '/users/preferences',
    STATS: '/users/my-stats',
    CHANGE_ROLE: (id: string) => `/users/${id}/role`,
    DELETE: (id: string) => `/users/${id}`,
  },

  // Donations
  DONATIONS: {
    ALL: '/donations',
    MY_DONATIONS: '/donations/my-donations',
    BY_ID: (id: string) => `/donations/${id}`,
    CREATE: '/donations',
    PROCESS_PAYMENT: '/donations/process-payment',
    CATEGORIES: '/donations/categories',
    STATS: '/donations/stats',
    REFUND: (id: string) => `/donations/${id}/refund`,
    RECEIPT: (id: string) => `/donations/${id}/receipt`,
  },

  // Paiements
  PAYMENTS: {
    ALL: '/payments',
    BY_ID: (id: string) => `/payments/${id}`,
    BY_DONATION_ID: (donationId: string) => `/payments/donation/${donationId}`,
    ALL_BY_DONATION_ID: (donationId: string) => `/payments/donation/${donationId}/all`,
    INITIALIZE: '/payments/initialize',
    VERIFY: (id: string) => `/payments/${id}/verify`,
    REFUND: (id: string) => `/payments/${id}/refund`,
    STATS: '/payments/stats',
  },

  // Événements
  EVENTS: {
    ALL: '/events',
    MY_EVENTS: '/events/my-events',
    MY_INSCRIPTIONS: '/events/my-inscriptions',
    BY_ID: (id: string) => `/events/${id}`,
    CREATE: '/events',
    INSCRIBE: (id: string) => `/events/${id}/inscribe`,
    INSCRIPTIONS: (id: string) => `/events/${id}/inscriptions`,
    UPLOAD_IMAGE: (id: string) => `/events/${id}/image`,
    STATS: (id: string) => `/events/${id}/stats`,
  },
};

// Configuration pour les timeouts spécifiques
export const TIMEOUTS = {
  SHORT: 5000,    // Pour les requêtes rapides
  MEDIUM: 10000,  // Pour les requêtes normales
  LONG: 30000,    // Pour les uploads ou téléchargements
};

// Messages d'erreur par défaut
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion réseau',
  TIMEOUT_ERROR: 'La requête a expiré',
  SERVER_ERROR: 'Erreur du serveur',
  UNAUTHORIZED: 'Non autorisé',
  NOT_FOUND: 'Ressource non trouvée',
  VALIDATION_ERROR: 'Erreur de validation',
  UNKNOWN_ERROR: 'Une erreur inconnue s\'est produite',
};

// Configuration pour la pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Configuration centralisée pour tous les services
export const API_CONFIG_CENTRALIZED = {
  ...currentConfig,
  endpoints: ENDPOINTS,
  timeouts: TIMEOUTS,
  errorMessages: ERROR_MESSAGES,
  pagination: PAGINATION,
};

export default API_CONFIG_CENTRALIZED; 