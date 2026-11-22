# 🎯 Guide de Centralisation API

## Problème résolu : Configuration API dupliquée

### ✅ Avant vs Après

**AVANT** (Problématique)
```
📁 src/
├── config/api.ts          // Configuration 1 (localhost:5000)
├── store/services/
│   ├── apiClient.ts       // Configuration 2 (ngrok hardcodée)
│   └── avatarService.ts   // Utilise config/api.ts
└── ...
```

**APRÈS** (Solution centralisée)
```
📁 src/
├── config/api.ts          // ✅ Source unique de configuration
├── services/
│   └── apiService.ts      // ✅ Service unifié (remplace apiClient.ts)
├── store/services/
│   └── avatarService.ts   // ✅ Utilise la config centralisée
└── ...
```

### 🔧 Changements appliqués

#### 1. Configuration unifiée (`config/api.ts`)
```typescript
// Centralisation complète avec tous les environnements
const API_CONFIG = {
  development: {
    baseURL: 'https://ae3e-105-235-71-152.ngrok-free.app/api',
    timeout: 10000,
    retryAttempts: 3,
    enableLogging: true,
  },
  // staging, production...
};

export const API_BASE_URL = currentConfig.baseURL; // Compatibility
export const API_CONFIG_CENTRALIZED = { /* tout centralisé */ };
```

#### 2. Service API unifié (`services/apiService.ts`)
```typescript
import { currentConfig, ENDPOINTS } from '../config/api';

class ApiService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: currentConfig.baseURL,  // ✅ Source unique
      timeout: currentConfig.timeout,  // ✅ Configuration centralisée
    });
  }

  // Méthodes pratiques intégrées
  auth = {
    login: (creds) => this.post(ENDPOINTS.AUTH.LOGIN, creds),
    // ...
  };
  
  users = {
    uploadAvatarBase64: (data, filename) => 
      this.post(ENDPOINTS.USERS.UPLOAD_AVATAR_BASE64, { imageData: data, filename }),
    // ...
  };
}
```

#### 3. Migration `apiClient.ts` → `apiService.ts`
```typescript
// AVANT
import apiClient from '../store/services/apiClient';

// APRÈS  
import apiService from '../services/apiService';
```

### 🚀 Utilisation du nouveau service

#### Méthode 1: Service direct (recommandé)
```typescript
import apiService from '../services/apiService';

// Upload avatar
const response = await apiService.users.uploadAvatarBase64(imageData, 'avatar.jpg');

// Authentification
const loginResponse = await apiService.auth.login({ email, password });

// Requête personnalisée
const customResponse = await apiService.post('/custom-endpoint', data);
```

#### Méthode 2: RTK Query (existant - garde compatibilité)
```typescript
import { useUploadAvatarBase64Mutation } from '../store/services/avatarService';

const [uploadAvatar] = useUploadAvatarBase64Mutation();
// Fonctionne toujours, utilise maintenant la config centralisée
```

### 🔄 Migration étape par étape

#### Étape 1: Remplacer les imports apiClient
```bash
# Rechercher tous les usages
grep -r "apiClient" src/

# Remplacer par apiService
# AVANT: import apiClient from '../store/services/apiClient';
# APRÈS: import apiService from '../services/apiService';
```

#### Étape 2: Mettre à jour les appels de méthodes
```typescript
// AVANT
const response = await apiClient.post('/users/profile', data);

// APRÈS
const response = await apiService.users.updateProfile(data);
// OU
const response = await apiService.post(ENDPOINTS.USERS.PROFILE, data);
```

#### Étape 3: Nettoyer les fichiers obsolètes
```bash
# Une fois la migration terminée
rm src/store/services/apiClient.ts
```

### 🌍 Changer d'environnement facilement

#### Option 1: Modification du code
```typescript
import { switchEnvironment } from '../config/api';

// Pour les tests
switchEnvironment('development');  // localhost
switchEnvironment('staging');      // staging URL  
switchEnvironment('production');   // production URL
```

#### Option 2: Configuration dynamique
```typescript
import apiService from '../services/apiService';

// Changer l'URL à la volée
apiService.updateConfig({
  baseURL: 'http://localhost:5000/api',
  timeout: 5000
});
```

### 🛠️ Fonctionnalités avancées du service unifié

#### 1. Retry automatique
```typescript
// Configuré automatiquement selon l'environnement
// development: 3 tentatives
// staging/production: 2 tentatives
```

#### 2. Logs de debug
```typescript
// Activé automatiquement en développement
// 🌐 API Request: POST /users/upload-avatar-base64
// ✅ API Response: 200 { success: true, ... }
// ❌ API Error: 401 Token d'accès requis
```

#### 3. Gestion avancée des tokens
```typescript
// Refresh automatique des tokens expirés
// Queue des requêtes en attente pendant le refresh
// Nettoyage automatique en cas d'échec de refresh
```

#### 4. Normalisation des erreurs
```typescript
try {
  await apiService.users.uploadAvatarBase64(data);
} catch (error) {
  console.log(error.status);  // 401, 404, 500...
  console.log(error.message); // Message normalisé
  console.log(error.data);    // Données serveur si disponibles
}
```

### 📋 Checklist de migration

- [ ] ✅ `config/api.ts` centralisé
- [ ] ✅ `services/apiService.ts` créé
- [ ] ✅ `store/services/apiClient.ts` mis à jour
- [ ] ✅ `store/services/avatarService.ts` utilise config centralisée
- [ ] 🔄 Migrer les autres services existants
- [ ] 🔄 Mettre à jour les composants React
- [ ] 🔄 Tester tous les endpoints
- [ ] 🔄 Supprimer `apiClient.ts` obsolète

### 🚨 Points d'attention

#### 1. Compatibilité RTK Query
- Les services RTK Query existants continuent de fonctionner
- Ils utilisent maintenant la configuration centralisée
- Migration progressive possible

#### 2. Gestion des tokens
- Même système de stockage (AsyncStorage)
- Mêmes clés (`auth_token`, `refresh_token`)
- Comportement identique pour l'utilisateur

#### 3. URLs de développement
- Actuellement configuré sur ngrok
- Facile à changer pour localhost si nécessaire
- Configuration synchronisée partout

### 🧪 Tests

#### Test de l'upload avatar
```typescript
import apiService from '../services/apiService';

// Test avec le nouveau service
const testUpload = async () => {
  try {
    const response = await apiService.users.uploadAvatarBase64(
      'data:image/png;base64,iVBOR...', 
      'test.png'
    );
    console.log('✅ Upload OK:', response.data);
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
};
```

#### Test de configuration
```typescript
import { currentConfig } from '../config/api';

console.log('Current API config:', {
  baseURL: currentConfig.baseURL,
  timeout: currentConfig.timeout,
  retryAttempts: currentConfig.retryAttempts
});
```

### 📞 Support

- **Un seul fichier de config** : `src/config/api.ts`
- **Un seul service API** : `src/services/apiService.ts`
- **Logs centralisés** : Console en mode développement
- **Migration progressive** : RTK Query reste compatible

---

**Status** : ✅ Configuration centralisée et service unifié
**Prochaines étapes** : Migration progressive des composants existants
**Dernière mise à jour** : Décembre 2024 