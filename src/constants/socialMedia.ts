// Constantes pour les réseaux sociaux et activités de MAGB

export interface SocialMediaPlatform {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  color: string;
  isActive: boolean;
  followers?: string;
  category: 'social' | 'video' | 'music' | 'website' | 'other';
}

export const SOCIAL_MEDIA_PLATFORMS: SocialMediaPlatform[] = [
  // Réseaux sociaux principaux
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Suivez nos actualités et événements',
    url: 'https://web.facebook.com/MinistereAdorationGenevieveBrou', // À remplacer par votre URL
    icon: 'facebook',
    color: '#1877F2',
    isActive: true,
    followers: '295 K+',
    category: 'social',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Photos et moments de nos activités',
    url: 'https://www.instagram.com/genevieve__brou?igsh=MWtubmU4dHRwODh3eQ==', // À remplacer par votre URL
    icon: 'language',
    color: '#E4405F',
    isActive: true,
    followers: '12K+',
    category: 'social',
  },
 

  // Plateformes vidéo
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Chaîne officielle avec sermons et événements',
    url: 'https://www.youtube.com/@MINISTEREDADORATIONGENEBROU', // À remplacer par votre URL
    icon: 'youtube-searched-for',
    color: '#FF0000',
    isActive: true,
    followers: '134K+',
    category: 'video',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Contenus courts et inspirants',
    url: 'https://www.tiktok.com/@genevievebrou0', // À remplacer par votre URL
    icon: 'music-note', // TikTok icon alternative
    color: '#000000',
    isActive: true,
    followers: '103K+',
    category: 'video',
  },

  // Plateformes audio/musique
  

  // Site web et autres
  {
    id: 'website',
    name: 'Site Web Officiel',
    description: 'Notre site web principal',
    url: 'https://www.genevievebrou.com/', // À remplacer par votre URL
    icon: 'language',
    color: '#6366F1',
    isActive: true,
    category: 'website',
  },
  
  
];

// Fonctions utilitaires

/**
 * Obtenir les plateformes par catégorie
 */
export const getPlatformsByCategory = (category: string): SocialMediaPlatform[] => {
  return SOCIAL_MEDIA_PLATFORMS.filter(platform => platform.category === category && platform.isActive);
};

/**
 * Obtenir toutes les plateformes actives
 */
export const getActivePlatforms = (): SocialMediaPlatform[] => {
  return SOCIAL_MEDIA_PLATFORMS.filter(platform => platform.isActive);
};

/**
 * Obtenir une plateforme par ID
 */
export const getPlatformById = (id: string): SocialMediaPlatform | undefined => {
  return SOCIAL_MEDIA_PLATFORMS.find(platform => platform.id === id);
};

/**
 * Catégories disponibles avec leurs métadonnées
 */
export const SOCIAL_MEDIA_CATEGORIES = [
  {
    id: 'social',
    name: 'Réseaux Sociaux',
    description: 'Facebook, Instagram, Twitter, LinkedIn',
    icon: 'share',
    color: '#3B82F6',
  },
  {
    id: 'video',
    name: 'Vidéos',
    description: 'YouTube, TikTok',
    icon: 'play-circle-filled',
    color: '#EF4444',
  },
  {
    id: 'music',
    name: 'Audio & Musique',
    description: 'Spotify, Apple Music, SoundCloud',
    icon: 'library-music',
    color: '#10B981',
  },
  {
    id: 'website',
    name: 'Site Web',
    description: 'Site officiel et ressources',
    icon: 'language',
    color: '#8B5CF6',
  },
];

/**
 * Configuration pour les actions de partage
 */
export const SHARE_CONFIG = {
  title: 'Suivez MAGB sur nos réseaux sociaux',
  message: 'Découvrez toutes nos activités et restez connectés avec la communauté MAGB !',
  dialogTitle: 'Partager les réseaux sociaux MAGB',
};

/**
 * Messages d'erreur pour les liens brisés
 */
export const ERROR_MESSAGES = {
  linkNotAvailable: 'Ce lien n\'est pas encore disponible',
  networkError: 'Erreur de connexion. Vérifiez votre connexion internet.',
  platformUnavailable: 'Cette plateforme n\'est temporairement pas disponible',
};