// Palette de couleurs officielle PartenaireMAGB
export const MODERN_COLORS = {
  // Couleurs principales
  PRIMARY: '#26335F',      // Bleu principal
  SECONDARY: '#FFD61D',    // Jaune secondaire
  TERTIARY: '#D32235',     // Rouge principal
  
  // Variations du bleu principal
  PRIMARY_LIGHT: '#3A4A7A',
  PRIMARY_DARK: '#1a2347',
  PRIMARY_10: '#26335F1A',  // 10% opacity
  PRIMARY_20: '#26335F33',  // 20% opacity
  PRIMARY_30: '#26335F4D',  // 30% opacity
  
  // Variations du jaune secondaire
  SECONDARY_LIGHT: '#FFE04D',
  SECONDARY_DARK: '#E6C119',
  SECONDARY_10: '#FFD61D1A',
  SECONDARY_20: '#FFD61D33',
  SECONDARY_30: '#FFD61D4D',
  
  // Variations du rouge principal
  TERTIARY_LIGHT: '#E5455A',
  TERTIARY_DARK: '#B02A3A',
  TERTIARY_10: '#D322351A',
  TERTIARY_20: '#D3223533',
  TERTIARY_30: '#D322354D',
  
  // Couleurs de statut
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#D32235',
  INFO: '#26335F',
  
  // Couleurs neutres
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_LIGHT: '#F8F9FA',
  GRAY_MEDIUM: '#6C757D',
  GRAY_DARK: '#343A40',
  
  // Couleurs pour le mode sombre
  DARK_BACKGROUND: '#121212',
  DARK_SURFACE: '#1E1E1E',
  DARK_CARD: '#2D2D2D',
};

// Gradients prédéfinis
export const MODERN_GRADIENTS = {
  PRIMARY: [MODERN_COLORS.PRIMARY, MODERN_COLORS.PRIMARY_DARK],
  SECONDARY: [MODERN_COLORS.SECONDARY, MODERN_COLORS.SECONDARY_DARK],
  TERTIARY: [MODERN_COLORS.TERTIARY, MODERN_COLORS.TERTIARY_DARK],
  
  // Gradients combinés
  PRIMARY_TO_SECONDARY: [MODERN_COLORS.PRIMARY, MODERN_COLORS.SECONDARY],
  PRIMARY_TO_TERTIARY: [MODERN_COLORS.PRIMARY, MODERN_COLORS.TERTIARY],
  SECONDARY_TO_TERTIARY: [MODERN_COLORS.SECONDARY, MODERN_COLORS.TERTIARY],
  
  // Gradients spéciaux
  HEADER: [MODERN_COLORS.PRIMARY, MODERN_COLORS.PRIMARY_DARK],
  CARD_DONATION: [MODERN_COLORS.TERTIARY, MODERN_COLORS.TERTIARY_LIGHT],
  CARD_HISTORY: [MODERN_COLORS.PRIMARY, MODERN_COLORS.PRIMARY_LIGHT],
  CARD_PAYMENT: [MODERN_COLORS.SECONDARY, MODERN_COLORS.SECONDARY_LIGHT],
  
  // Gradients pour les dashboards
  DASHBOARD_VISUAL: ['#4ECDC4', '#44A08D'],
  DASHBOARD_MODERN: ['#667eea', '#764ba2'],
  DASHBOARD_GRID: ['#F093FB', '#F5576C'],
};

// Configuration des couleurs par écran
export const SCREEN_COLORS = {
  LoginModern: {
    header: MODERN_GRADIENTS.HEADER,
    button: MODERN_GRADIENTS.PRIMARY,
    accent: MODERN_COLORS.SECONDARY,
  },
  SignupModern: {
    header: MODERN_GRADIENTS.HEADER,
    button: MODERN_GRADIENTS.PRIMARY,
    accent: MODERN_COLORS.TERTIARY,
    step1: MODERN_COLORS.PRIMARY,
    step2: MODERN_COLORS.SECONDARY,
  },
  DashboardGridModern: {
    header: MODERN_GRADIENTS.HEADER,
    donation: MODERN_COLORS.TERTIARY,
    history: MODERN_COLORS.PRIMARY,
    payment: MODERN_COLORS.SECONDARY,
    profile: MODERN_COLORS.PRIMARY,
    missions: MODERN_COLORS.SECONDARY,
    support: MODERN_COLORS.PRIMARY,
    social: MODERN_COLORS.TERTIARY,
    help: MODERN_COLORS.SECONDARY,
    settings: MODERN_COLORS.PRIMARY,
  },
  CreateDonationScreenModern: {
    header: MODERN_GRADIENTS.HEADER,
    amount: MODERN_GRADIENTS.PRIMARY,
    category: MODERN_COLORS.SECONDARY,
    payment: MODERN_COLORS.TERTIARY,
    confirmation: ['#4CAF50', '#45A049'],
  },
};

// Utilitaires pour les couleurs
export const getColorWithOpacity = (color, opacity) => {
  const hex = color.replace('#', '');
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `#${hex}${alpha}`;
};

export const getScreenColors = (screenName) => {
  return SCREEN_COLORS[screenName] || {
    header: MODERN_GRADIENTS.HEADER,
    button: MODERN_GRADIENTS.PRIMARY,
    accent: MODERN_COLORS.SECONDARY,
  };
};

// Couleurs pour les icônes par catégorie
export const ICON_COLORS = {
  donation: MODERN_COLORS.TERTIARY,
  history: MODERN_COLORS.PRIMARY,
  payment: MODERN_COLORS.SECONDARY,
  profile: MODERN_COLORS.PRIMARY,
  missions: MODERN_COLORS.SECONDARY,
  support: MODERN_COLORS.PRIMARY,
  social: MODERN_COLORS.TERTIARY,
  help: MODERN_COLORS.SECONDARY,
  settings: MODERN_COLORS.PRIMARY,
  recurring: MODERN_COLORS.TERTIARY,
};

// Export par défaut
export default MODERN_COLORS;