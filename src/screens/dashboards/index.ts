// Export de tous les dashboards disponibles
export { default as DashboardGrid } from '../DashboardGrid';
export { default as DashboardGridModern } from '../DashboardGridModern';
export { default as DashboardVisual } from '../DashboardVisual';
export { default as DashboardModern } from '../DashboardModern';
export { default as DashboardWithAvatar } from '../DashboardWithAvatar';

// Types pour la sélection de dashboard
export type DashboardType = 
  | 'grid' 
  | 'gridModern' 
  | 'visual' 
  | 'modern' 
  | 'withAvatar';

// Configuration des dashboards disponibles
export const DASHBOARD_CONFIGS = {
  grid: {
    name: 'Dashboard Grid',
    description: 'Dashboard avec layout en grille simple et coloré',
    component: 'DashboardGrid',
    features: ['Grid Layout', 'Cartes colorées', 'Actions rapides'],
  },
  gridModern: {
    name: 'Dashboard Grid Moderne',
    description: 'Dashboard avec animations et effets visuels avancés',
    component: 'DashboardGridModern',
    features: ['Animations', 'Effets visuels', 'Design moderne', 'Badges'],
  },
  visual: {
    name: 'Dashboard Visuel',
    description: 'Dashboard avec emojis, images et layout masonry',
    component: 'DashboardVisual',
    features: ['Emojis', 'Layout Masonry', 'Design visuel', 'Motifs décoratifs'],
  },
  modern: {
    name: 'Dashboard Moderne',
    description: 'Dashboard moderne avec statistiques détaillées',
    component: 'DashboardModern',
    features: ['Statistiques', 'Graphiques', 'Badges utilisateur'],
  },
  withAvatar: {
    name: 'Dashboard avec Avatar',
    description: 'Dashboard centré sur l\'avatar et le profil utilisateur',
    component: 'DashboardWithAvatar',
    features: ['Avatar personnalisé', 'Profil utilisateur', 'Cartes utilisateur'],
  },
} as const;