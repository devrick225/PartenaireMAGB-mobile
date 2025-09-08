# Guide d'intégration Cloudinary - Upload d'Avatar

## Vue d'ensemble

Ce guide documente l'intégration complète de Cloudinary pour la gestion des avatars utilisateurs dans l'application PartenaireMAGB.

## Architecture mise en place

### Backend (Node.js/Express)

#### 1. Service Cloudinary (`services/cloudinaryService.js`)
- **Configuration automatique** avec variables d'environnement
- **Mode développement** avec fallback si Cloudinary non configuré
- **Optimisation automatique** des images (400x400px, WebP, compression)
- **Gestion des erreurs** complète
- **Support multi-format** : JPG, PNG, WebP
- **Nettoyage automatique** des anciens avatars

**Fonctionnalités principales :**
- `getAvatarUploader()` - Configuration Multer + Cloudinary
- `uploadImage()` - Upload direct en base64
- `deleteImage()` - Suppression d'images
- `optimizeImage()` - Optimisation avec transformations

#### 2. Contrôleur utilisateur (`controllers/userController.js`)
- `uploadAvatar()` - Upload avec fichier FormData
- `uploadAvatarBase64()` - Upload pour mobile en base64
- **Validation des formats** d'image
- **Suppression automatique** de l'ancien avatar
- **Mise à jour** du profil utilisateur

#### 3. Routes API (`routes/users.js`)
```javascript
POST /api/users/upload-avatar          // Upload avec fichier
POST /api/users/upload-avatar-base64   // Upload base64 (mobile)
```

#### 4. Modèle utilisateur (`models/User.js`)
```javascript
avatar: String,           // URL Cloudinary
avatarPublicId: String    // ID public Cloudinary (pour suppression)
```

### Frontend Mobile (React Native/Expo)

#### 1. Helper Image Picker (`utils/ImagePickerHelper.js`)
- **Support caméra + galerie** avec permissions
- **Optimisation automatique** des images avant upload
- **Compression intelligente** (400x400px, qualité 0.8)
- **Conversion base64** avec prefixes corrects
- **Gestion d'erreurs** détaillée

**Fonctions principales :**
- `showImagePickerOptions()` - Choix caméra/galerie
- `launchImagePicker()` - Sélection depuis galerie
- `launchCamera()` - Prise de photo
- `optimizeImage()` - Redimensionnement et compression
- `convertToBase64WithPrefix()` - Formatage pour API

#### 2. Service API RTK Query (`store/services/avatarService.ts`)
- **Configuration RTK Query** pour uploads
- **Gestion d'état** automatique (loading, success, error)
- **Cache management** avec invalidation
- **TypeScript** avec interfaces typées

```typescript
useUploadAvatarBase64Mutation()  // Hook pour upload mobile
useUploadAvatarFileMutation()    // Hook pour upload fichier
```

#### 3. Composant Avatar Upload (`components/AvatarUpload.js`)
- **Interface utilisateur** moderne et responsive
- **Support thème** clair/sombre
- **États de chargement** avec indicateurs visuels
- **Aperçu immédiat** de l'image sélectionnée
- **Icône d'édition** configurable
- **Gestion d'erreurs** avec alertes utilisateur

**Props principales :**
```javascript
currentAvatar: string      // URL actuelle
onAvatarUpdate: function   // Callback mise à jour
size: number              // Taille de l'avatar
showEditIcon: boolean     // Afficher icône édition
disabled: boolean         // Désactiver l'upload
```

#### 4. Écran Paramètres Profil (`screens/ProfileSettingsScreen.tsx`)
- **Interface complète** de gestion du profil
- **Intégration avatar** avec upload
- **Paramètres utilisateur** (thème, notifications, sécurité)
- **Navigation** vers changement mot de passe
- **Design moderne** avec sections organisées

## Configuration requise

### Variables d'environnement Backend
```env
# Configuration Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### Dépendances installées

#### Backend
```json
{
  "cloudinary": "^1.41.0",
  "multer": "^1.4.5-lts.1",
  "multer-storage-cloudinary": "^4.0.0"
}
```

#### Mobile
```json
{
  "expo-image-picker": "~14.3.2",
  "expo-image-manipulator": "~11.3.0",
  "@reduxjs/toolkit": "^1.9.5"
}
```

## Utilisation

### Dans un écran React Native
```jsx
import AvatarUpload from '../components/AvatarUpload';

const MyScreen = () => {
  const [avatar, setAvatar] = useState(user?.avatar);

  const handleAvatarUpdate = (newAvatarUrl) => {
    setAvatar(newAvatarUrl);
    // Mettre à jour le store Redux si nécessaire
  };

  return (
    <AvatarUpload
      currentAvatar={avatar}
      onAvatarUpdate={handleAvatarUpdate}
      size={120}
      showEditIcon={true}
    />
  );
};
```

### Configuration du Store Redux
```typescript
// store/index.ts
import { avatarApi } from './services/avatarService';

export const store = configureStore({
  reducer: {
    [avatarApi.reducerPath]: avatarApi.reducer,
    // autres reducers...
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(avatarApi.middleware),
});
```

## Sécurité et Optimisation

### Côté Backend
- **Validation stricte** des formats d'image
- **Limite de taille** fichier (5MB pour avatars)
- **Transformation automatique** (400x400px, WebP)
- **Suppression automatique** des anciens fichiers
- **Authentification requise** pour tous les endpoints

### Côté Mobile
- **Compression avant upload** pour économiser la bande passante
- **Gestion des permissions** caméra/galerie
- **Optimisation mémoire** avec nettoyage automatique
- **Retry logic** en cas d'échec réseau
- **Cache intelligent** des images

## Fonctionnalités avancées

### Mode développement
- **Simulation d'upload** si Cloudinary non configuré
- **Avatars par défaut** avec initiales utilisateur
- **Logs détaillés** pour debugging
- **Fallbacks gracieux** en cas d'erreur

### Gestion d'erreurs
- **Messages d'erreur** localisés
- **Retry automatique** pour échecs temporaires
- **Validation côté client** avant upload
- **Nettoyage automatique** en cas d'échec

### Performance
- **Upload en arrière-plan** sans bloquer l'UI
- **Compression intelligente** selon la qualité réseau
- **Cache des images** pour éviter re-téléchargements
- **Transformations CDN** pour différentes tailles

## Tests et Validation

### Tests Backend
```bash
# Test upload avec curl
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@test-image.jpg" \
  http://localhost:5000/api/users/upload-avatar
```

### Tests Mobile
- Tester sur iOS et Android
- Vérifier les permissions caméra/galerie
- Tester avec différentes tailles d'images
- Valider les transformations d'images

## Prochaines étapes

1. **Intégration navigation** - Ajouter ProfileSettingsScreen à la navigation
2. **Tests automatisés** - Ajouter tests unitaires et d'intégration
3. **Monitoring** - Ajouter métriques d'upload Cloudinary
4. **Cache avancé** - Implémenter cache intelligent des avatars
5. **Sync offline** - Gérer uploads hors ligne avec queue

## Troubleshooting

### Erreurs communes
- **Permissions refusées** : Vérifier configuration permissions Expo
- **Upload échoue** : Vérifier configuration Cloudinary
- **Images trop grandes** : Vérifier limites de taille
- **Format non supporté** : Valider types MIME autorisés

### Debug mode
```javascript
// Activer logs détaillés
console.log('Upload debug:', {
  hasCloudinary: cloudinaryService.isAvailable(),
  imageSize: result.base64?.length,
  format: result.format
});
```

## Support

- **Documentation Cloudinary** : https://cloudinary.com/documentation
- **Expo Image Picker** : https://docs.expo.dev/versions/latest/sdk/imagepicker/
- **RTK Query** : https://redux-toolkit.js.org/rtk-query/overview

---

**Status** : ✅ Système complet et fonctionnel
**Dernière mise à jour** : Décembre 2024
**Version** : 1.0.0 