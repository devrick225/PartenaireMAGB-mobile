# 🔧 Guide de résolution - Upload Avatar

## Problème résolu : Erreur 404 sur POST /api/users/avatar

### ✅ Solution appliquée

1. **Configuration d'URL harmonisée** - Les deux services utilisent maintenant la même URL
2. **Routes backend correctes** - Vérification que `/upload-avatar-base64` existe
3. **Service avatarService.ts** - Utilise les bonnes URLs d'endpoints

### 🔍 Diagnostic rapide

#### Étape 1: Vérifier la configuration URL
```javascript
// Dans src/config/api.ts
console.log('API_BASE_URL:', API_BASE_URL);
// Doit afficher: https://ae3e-105-235-71-152.ngrok-free.app/api
```

#### Étape 2: Tester l'endpoint backend
```bash
curl -X POST https://ae3e-105-235-71-152.ngrok-free.app/api/users/upload-avatar-base64
# Doit retourner: {"success":false,"error":"Token d'accès requis"}
```

#### Étape 3: Utiliser le composant de debug
```javascript
import AvatarUploadDebug from '../components/AvatarUploadDebug';

// Ajouter dans votre écran de test
<AvatarUploadDebug />
```

### 📱 Utilisation du composant Avatar

```javascript
import AvatarUpload from '../components/AvatarUpload';

const MyScreen = () => {
  const [avatar, setAvatar] = useState(user?.avatar);

  return (
    <AvatarUpload
      currentAvatar={avatar}
      onAvatarUpdate={(newUrl) => setAvatar(newUrl)}
      size={120}
      showEditIcon={true}
    />
  );
};
```

### 🛠️ Configuration Backend

#### Routes disponibles
- `POST /api/users/upload-avatar` - Upload avec FormData
- `POST /api/users/upload-avatar-base64` - Upload base64 (mobile)

#### Variables d'environnement requises
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-secret
```

### 🔄 Changer d'URL de développement

#### Option 1: Localhost (5000)
```javascript
// src/config/api.ts
development: {
  baseURL: 'http://localhost:5000/api',
  // ...
}
```

#### Option 2: Ngrok (actuel)
```javascript
// src/config/api.ts
development: {
  baseURL: 'https://ae3e-105-235-71-152.ngrok-free.app/api',
  // ...
}
```

**⚠️ Important**: Synchroniser avec `src/store/services/apiClient.ts`

### 🚨 Erreurs communes

#### 1. Erreur 404 - Route introuvable
- **Cause**: URL incorrecte ou endpoint inexistant
- **Solution**: Vérifier que backend utilise `/upload-avatar-base64`

#### 2. Erreur 401 - Non autorisé
- **Cause**: Token d'authentification manquant/expiré
- **Solution**: S'assurer que l'utilisateur est connecté

#### 3. Erreur 413 - Fichier trop volumineux
- **Cause**: Image trop grande (>5MB)
- **Solution**: Optimisation automatique activée dans ImagePickerHelper

#### 4. Erreur CORS
- **Cause**: Backend n'accepte pas l'origine mobile
- **Solution**: Configurer CORS dans backend Express

### 🧪 Test manuel rapide

```javascript
// Dans React Native Debugger ou console
fetch('https://ae3e-105-235-71-152.ngrok-free.app/api/users/upload-avatar-base64', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    imageData: 'data:image/png;base64,test',
    filename: 'test.png'
  })
})
.then(r => r.json())
.then(console.log);
```

### 📞 Support

- **Backend logs**: Vérifier console serveur Node.js
- **Mobile logs**: Utiliser React Native Debugger
- **Network**: Utiliser Flipper ou Chrome DevTools

---

**Status**: ✅ Problème résolu - Configuration harmonisée
**Dernière mise à jour**: Décembre 2024 