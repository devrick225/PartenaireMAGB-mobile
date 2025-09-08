# Guide des Dashboards - PartenaireMAGB Mobile

## 📱 Nouveaux Dashboards Disponibles

Ce guide présente les nouveaux dashboards créés pour l'application mobile PartenaireMAGB, chacun offrant une expérience utilisateur unique avec des styles visuels différents.

## 🎯 Dashboards Créés

### 1. DashboardGrid.tsx
**Style**: Grid classique avec cartes colorées
**Caractéristiques**:
- Layout en grille 2 colonnes
- Cartes avec gradients colorés
- Header avec image de fond
- Statistiques rapides
- Actions express
- Design simple et efficace

**Utilisation**:
```typescript
import DashboardGrid from './src/screens/DashboardGrid';
// Navigation: navigation.navigate('DashboardGrid')
```

### 2. DashboardGridModern.tsx
**Style**: Grid moderne avec animations et effets
**Caractéristiques**:
- Animations fluides au chargement
- Effets visuels avancés (brillance, ombres)
- Badges interactifs (NOUVEAU, POPULAIRE)
- Motifs décoratifs
- Header avec gradient et cercles décoratifs
- Actions rapides avec icônes spécialisées

**Utilisation**:
```typescript
import DashboardGridModern from './src/screens/DashboardGridModern';
// Navigation: navigation.navigate('DashboardGridModern')
```

### 3. DashboardVisual.tsx
**Style**: Interface visuelle avec emojis et layout masonry
**Caractéristiques**:
- Emojis expressifs pour chaque section
- Layout masonry (cartes de tailles différentes)
- Motifs décoratifs sur les cartes
- Design ludique et coloré
- Header avec motifs de fond animés
- Cartes avec différentes tailles (large, medium, small)

**Utilisation**:
```typescript
import DashboardVisual from './src/screens/DashboardVisual';
// Navigation: navigation.navigate('DashboardVisual')
```

### 4. DashboardSelector.tsx
**Style**: Sélecteur de dashboard avec prévisualisations
**Caractéristiques**:
- Interface de sélection de dashboard
- Prévisualisations des différents styles
- Sauvegarde des préférences utilisateur
- Description détaillée de chaque dashboard
- Navigation directe vers le dashboard choisi

**Utilisation**:
```typescript
import DashboardSelector from './src/screens/DashboardSelector';
// Navigation: navigation.navigate('DashboardSelector')
```

## 🎨 Caractéristiques Communes

### Thème et Couleurs
- Support du mode sombre/clair
- Utilisation du système de thème existant
- Gradients colorés personnalisés
- Couleurs cohérentes avec la charte graphique

### Navigation
- Navigation vers tous les écrans existants
- Actions rapides intégrées
- Boutons de déconnexion stylisés
- Gestion des erreurs et redirections

### Données
- Intégration avec les services existants
- Affichage des statistiques utilisateur
- Gestion du refresh des données
- États de chargement

### Responsive Design
- Adaptation aux différentes tailles d'écran
- Calculs dynamiques des dimensions
- Grilles flexibles
- Espacement adaptatif

## 🔧 Configuration et Intégration

### 1. Ajout dans la Navigation
```typescript
// Dans votre navigateur principal
import { 
  DashboardGrid, 
  DashboardGridModern, 
  DashboardVisual,
  DashboardSelector 
} from './src/screens/dashboards';

// Ajout des routes
<Stack.Screen name="DashboardGrid" component={DashboardGrid} />
<Stack.Screen name="DashboardGridModern" component={DashboardGridModern} />
<Stack.Screen name="DashboardVisual" component={DashboardVisual} />
<Stack.Screen name="DashboardSelector" component={DashboardSelector} />
```

### 2. Gestion des Préférences
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sauvegarder la préférence
await AsyncStorage.setItem('selectedDashboard', 'gridModern');

// Récupérer la préférence
const selectedDashboard = await AsyncStorage.getItem('selectedDashboard');
```

### 3. Images et Assets
Assurez-vous d'avoir les images nécessaires dans le dossier `assets/images/`:
- `church-bg.jpg` - Image de fond pour le header
- Autres images selon vos besoins

## 📋 Menu Cards Configuration

Chaque dashboard utilise une configuration de cartes menu personnalisable :

```typescript
interface MenuCard {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  iconType: 'MaterialIcons' | 'Ionicons' | 'FontAwesome5';
  gradient: string[];
  route: string;
  badge?: number;
  isNew?: boolean;
  isPopular?: boolean;
}
```

## 🎯 Actions Rapides

Tous les dashboards incluent des actions rapides personnalisables :
- Don Express
- Portefeuille
- Aide/Support
- QR Code (selon le dashboard)

## 🔄 Refresh et États

- Pull-to-refresh intégré
- Boutons de refresh flottants
- Gestion des états de chargement
- Gestion des erreurs réseau

## 🎨 Personnalisation

### Couleurs et Gradients
Modifiez les gradients dans chaque dashboard :
```typescript
const menuCards: MenuCard[] = [
  {
    // ...
    gradient: ['#FF6B6B', '#FF8E8E', '#FFB3B3'], // Personnalisez ici
    // ...
  }
];
```

### Icônes
Changez les icônes selon vos besoins :
```typescript
// Supports: MaterialIcons, Ionicons, FontAwesome5, AntDesign, Feather
icon: 'favorite',
iconType: 'MaterialIcons',
```

### Layout
Ajustez les dimensions des cartes :
```typescript
const cardWidth = (width - 48) / 2; // 2 colonnes
const cardHeight = 140; // Hauteur fixe
```

## 🚀 Utilisation Recommandée

1. **DashboardGridModern** - Pour une expérience moderne et fluide
2. **DashboardVisual** - Pour une interface ludique et expressive
3. **DashboardGrid** - Pour une interface simple et efficace
4. **DashboardSelector** - Pour permettre à l'utilisateur de choisir

## 📱 Compatibilité

- ✅ iOS
- ✅ Android
- ✅ Mode sombre/clair
- ✅ Différentes tailles d'écran
- ✅ Orientation portrait

## 🔧 Dépendances Requises

```json
{
  "@expo/vector-icons": "^13.0.0",
  "expo-linear-gradient": "~12.3.0",
  "react-native-safe-area-context": "4.6.3",
  "@react-native-async-storage/async-storage": "1.18.2"
}
```

## 📝 Notes de Développement

- Tous les dashboards utilisent TypeScript
- Intégration complète avec Redux
- Gestion des erreurs et états
- Code réutilisable et modulaire
- Documentation inline complète

## 🎉 Prochaines Améliorations

- [ ] Animations de transition entre dashboards
- [ ] Thèmes personnalisés
- [ ] Widgets configurables
- [ ] Mode hors ligne
- [ ] Notifications push intégrées

---

**Créé pour PartenaireMAGB Mobile** 🙏
*Dashboard moderne et intuitif pour une meilleure expérience utilisateur*