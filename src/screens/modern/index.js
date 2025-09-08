// Export de tous les écrans modernes
export { default as LoginModern } from '../LoginModern';
export { default as SignupModern } from '../SignupModern';
export { default as DashboardGridModern } from '../DashboardGridModern';
export { default as CreateDonationScreenModern } from '../CreateDonationScreenModern';
export { default as DashboardVisual } from '../DashboardVisual';
export { default as DashboardSelector } from '../DashboardSelector';

// Export des dashboards depuis le dossier dashboards
export { 
  DashboardGrid, 
  DashboardGridModern as DashboardGridModernFromDashboards, 
  DashboardVisual as DashboardVisualFromDashboards,
  DashboardModern,
  DashboardWithAvatar,
  DASHBOARD_CONFIGS,
  DashboardType
} from '../dashboards';

// Types pour TypeScript
export type ModernScreenType = 
  | 'LoginModern'
  | 'SignupModern' 
  | 'DashboardGridModern'
  | 'CreateDonationScreenModern'
  | 'DashboardVisual'
  | 'DashboardSelector';

// Configuration des écrans modernes
export const MODERN_SCREENS_CONFIG = {
  LoginModern: {
    name: 'Connexion Moderne',
    description: 'Écran de connexion avec design moderne et animations',
    features: ['Animations fluides', 'InputModern', 'Actions rapides', 'Gradient header'],
    colors: ['#26335F', '#FFD61D', '#D32235'],
  },
  SignupModern: {
    name: 'Inscription Moderne',
    description: 'Inscription en 2 étapes avec validation complète',
    features: ['Processus guidé', 'Sélecteurs visuels', 'Indicatifs téléphoniques', 'Validation temps réel'],
    colors: ['#26335F', '#FFD61D', '#D32235'],
  },
  DashboardGridModern: {
    name: 'Dashboard Grid Moderne',
    description: 'Dashboard principal avec grille et bordures colorées',
    features: ['Grille 2x5', 'Bordures colorées', 'Actions rapides', 'Badges'],
    colors: ['#26335F', '#FFD61D', '#D32235'],
  },
  CreateDonationScreenModern: {
    name: 'Création Don Moderne',
    description: 'Processus de don en 4 étapes avec design moderne',
    features: ['4 étapes guidées', 'Montants suggérés', 'Cartes colorées', 'Confirmation visuelle'],
    colors: ['#26335F', '#FFD61D', '#D32235'],
  },
  DashboardVisual: {
    name: 'Dashboard Visuel',
    description: 'Dashboard avec emojis et layout masonry',
    features: ['Emojis expressifs', 'Layout masonry', 'Motifs décoratifs', 'Design ludique'],
    colors: ['#26335F', '#FFD61D', '#D32235'],
  },
  DashboardSelector: {
    name: 'Sélecteur Dashboard',
    description: 'Interface pour choisir son style de dashboard',
    features: ['Prévisualisations', 'Descriptions détaillées', 'Sauvegarde préférences'],
    colors: ['#26335F', '#FFD61D', '#D32235'],
  },
} as const;

// Utilitaires
export const getModernScreenConfig = (screenName: ModernScreenType) => {
  return MODERN_SCREENS_CONFIG[screenName];
};

export const getAllModernScreens = () => {
  return Object.keys(MODERN_SCREENS_CONFIG) as ModernScreenType[];
};

export const getScreensByFeature = (feature: string) => {
  return Object.entries(MODERN_SCREENS_CONFIG)
    .filter(([_, config]) => config.features.includes(feature))
    .map(([name, _]) => name as ModernScreenType);
};