/**
 * httpErrors.ts
 *
 * Centralise la traduction des erreurs HTTP en messages lisibles pour l'utilisateur.
 * Utilisé par l'intercepteur Axios dans apiClient.ts — s'applique à toute l'app.
 */

export interface AppError {
  /** Message court affiché dans le titre de l'alerte */
  title: string;
  /** Message détaillé affiché dans le corps de l'alerte */
  message: string;
  /** Code HTTP d'origine */
  status?: number;
  /** Indique si l'erreur est liée à l'authentification (session expirée, etc.) */
  isAuthError?: boolean;
  /** Indique si l'erreur est récupérable (l'utilisateur peut réessayer) */
  isRetryable?: boolean;
}

// ─── Messages par code HTTP ───────────────────────────────────────────────────

const HTTP_MESSAGES: Record<number, { title: string; message: string; isRetryable?: boolean }> = {
  400: {
    title: 'Données invalides',
    message: 'Certaines informations saisies sont incorrectes. Vérifiez le formulaire et réessayez.',
  },
  401: {
    title: 'Session expirée',
    message: 'Votre session a expiré. Veuillez vous reconnecter.',
    isRetryable: false,
  },
  403: {
    title: 'Accès refusé',
    message: 'Vous n\'avez pas les droits nécessaires pour effectuer cette action.',
    isRetryable: false,
  },
  404: {
    title: 'Introuvable',
    message: 'La ressource demandée n\'existe pas ou a été supprimée.',
    isRetryable: false,
  },
  409: {
    title: 'Conflit',
    message: 'Cette action entre en conflit avec une donnée existante (ex: email déjà utilisé).',
  },
  413: {
    title: 'Fichier trop volumineux',
    message: 'Le fichier envoyé dépasse la taille maximale autorisée.',
  },
  422: {
    title: 'Données non traitables',
    message: 'Le format des données envoyées est incorrect.',
  },
  429: {
    title: 'Trop de tentatives',
    message: 'Vous avez effectué trop de requêtes. Attendez quelques instants avant de réessayer.',
    isRetryable: true,
  },
  500: {
    title: 'Erreur serveur',
    message: 'Une erreur inattendue s\'est produite sur le serveur. Réessayez dans quelques instants.',
    isRetryable: true,
  },
  502: {
    title: 'Serveur indisponible',
    message: 'Le serveur est temporairement indisponible. Réessayez dans quelques instants.',
    isRetryable: true,
  },
  503: {
    title: 'Service indisponible',
    message: 'Le service est en maintenance. Réessayez dans quelques minutes.',
    isRetryable: true,
  },
  504: {
    title: 'Délai dépassé',
    message: 'Le serveur met trop de temps à répondre. Vérifiez votre connexion et réessayez.',
    isRetryable: true,
  },
};

// ─── Messages spéciaux par route/action ──────────────────────────────────────

const ROUTE_MESSAGES: Array<{
  match: RegExp;
  status: number;
  title: string;
  message: string;
}> = [
  // Auth
  { match: /\/auth\/login/,           status: 401, title: 'Connexion échouée',         message: 'Email ou mot de passe incorrect.' },
  { match: /\/auth\/login/,           status: 429, title: 'Compte temporairement bloqué', message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  { match: /\/auth\/register/,        status: 409, title: 'Email déjà utilisé',          message: 'Un compte existe déjà avec cet email. Essayez de vous connecter.' },
  { match: /\/auth\/refresh/,         status: 401, title: 'Session expirée',             message: 'Votre session a expiré. Reconnectez-vous pour continuer.' },
  { match: /\/auth\/forgot-password/, status: 429, title: 'Trop de demandes',            message: 'Vous avez demandé trop de réinitialisations. Attendez 15 minutes.' },
  { match: /verify-email/,            status: 400, title: 'Code invalide',               message: 'Le code de vérification est incorrect ou a expiré. Demandez un nouveau code.' },
  { match: /verify-phone/,            status: 400, title: 'Code SMS invalide',           message: 'Le code SMS est incorrect ou a expiré. Demandez un nouveau code.' },
  { match: /reset-password/,          status: 400, title: 'Code expiré',                 message: 'Le code de réinitialisation est invalide ou expiré. Recommencez la procédure.' },

  // Profil
  { match: /\/users\/profile/,        status: 400, title: 'Profil non mis à jour',       message: 'Certains champs contiennent des valeurs incorrectes. Vérifiez et réessayez.' },
  { match: /\/users\/profile/,        status: 413, title: 'Photo trop lourde',           message: 'La photo de profil dépasse 5 Mo. Choisissez une image plus légère.' },

  // Dons
  { match: /\/donations/,             status: 400, title: 'Don invalide',                message: 'Les informations du don sont incorrectes. Vérifiez le montant et la catégorie.' },
  { match: /\/donations/,             status: 402, title: 'Paiement refusé',             message: 'Votre paiement a été refusé. Vérifiez votre moyen de paiement.' },

  // Paiements
  { match: /\/payments/,              status: 400, title: 'Paiement invalide',           message: 'Les informations de paiement sont incorrectes.' },
  { match: /\/payments/,              status: 402, title: 'Paiement échoué',             message: 'Le paiement n\'a pas pu être traité. Vérifiez votre solde ou essayez un autre moyen de paiement.' },

  // Tickets
  { match: /\/tickets/,               status: 400, title: 'Ticket invalide',             message: 'Veuillez renseigner un sujet et une description pour votre demande.' },
  { match: /\/tickets/,               status: 404, title: 'Ticket introuvable',          message: 'Ce ticket n\'existe pas ou a été supprimé.' },

  // Upload
  { match: /upload-avatar/,           status: 400, title: 'Image invalide',              message: 'Format non supporté. Utilisez une image JPEG, PNG ou WebP.' },
  { match: /upload-avatar/,           status: 413, title: 'Image trop lourde',           message: 'La photo dépasse la taille maximale (5 Mo). Choisissez une image plus légère.' },
];

// ─── Erreurs réseau (pas de réponse HTTP) ────────────────────────────────────

const NETWORK_ERRORS: Record<string, { title: string; message: string }> = {
  ECONNABORTED: {
    title: 'Connexion trop lente',
    message: 'La requête a pris trop de temps. Vérifiez votre connexion internet et réessayez.',
  },
  ERR_NETWORK: {
    title: 'Pas de connexion',
    message: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
  },
  ERR_CANCELED: {
    title: 'Requête annulée',
    message: 'La requête a été annulée.',
  },
  ENOTFOUND: {
    title: 'Serveur introuvable',
    message: 'Impossible de joindre le serveur. Vérifiez votre connexion internet.',
  },
};

// ─── Fonction principale ──────────────────────────────────────────────────────

/**
 * Transforme une erreur Axios en AppError lisible.
 * Priorité : message backend > route spécifique > code HTTP générique > réseau.
 */
export function parseHttpError(error: any): AppError {
  const status: number | undefined = error.response?.status;
  const url: string = error.config?.url || '';
  const backendMessage: string | undefined =
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.response?.data?.errors?.[0]?.msg;

  // ── 1. Erreurs réseau (pas de réponse) ──────────────────────────────────
  if (!error.response) {
    const networkKey = error.code as string;
    const networkError = NETWORK_ERRORS[networkKey];
    if (networkError) {
      return { ...networkError, isRetryable: true };
    }
    return {
      title: 'Erreur de connexion',
      message: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
      isRetryable: true,
    };
  }

  // ── 2. Route + status spécifiques ────────────────────────────────────────
  for (const route of ROUTE_MESSAGES) {
    if (status === route.status && route.match.test(url)) {
      return {
        title: route.title,
        // Préférer le message backend s'il est court et utile
        message: (backendMessage && backendMessage.length < 120)
          ? backendMessage
          : route.message,
        status,
        isRetryable: false,
      };
    }
  }

  // ── 3. Message backend brut (400 validation express-validator) ───────────
  if (status === 400 && error.response?.data?.errors) {
    const fields: string[] = error.response.data.errors
      .map((e: any) => e.msg || e.message)
      .filter(Boolean)
      .slice(0, 3); // max 3 erreurs
    return {
      title: 'Formulaire incomplet',
      message: fields.length > 0
        ? `Corrigez les erreurs suivantes :\n• ${fields.join('\n• ')}`
        : 'Certains champs sont invalides. Vérifiez le formulaire.',
      status,
    };
  }

  // ── 4. Code HTTP générique ────────────────────────────────────────────────
  if (status && HTTP_MESSAGES[status]) {
    const generic = HTTP_MESSAGES[status];
    return {
      title: generic.title,
      message: (backendMessage && backendMessage.length < 120)
        ? backendMessage
        : generic.message,
      status,
      isAuthError: status === 401 || status === 403,
      isRetryable: generic.isRetryable,
    };
  }

  // ── 5. Fallback ───────────────────────────────────────────────────────────
  return {
    title: 'Erreur inattendue',
    message: backendMessage || 'Une erreur inattendue s\'est produite. Réessayez.',
    status,
    isRetryable: true,
  };
}

/**
 * Retourne uniquement le message string (pour les catch qui n'utilisent pas Alert).
 */
export function getErrorMessage(error: any): string {
  const parsed = parseHttpError(error);
  return parsed.message;
}
