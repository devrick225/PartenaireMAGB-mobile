# Structure Redux pour PARTENAIRE MAGB Mobile

## Architecture

La structure Redux de l'application mobile PARTENAIRE MAGB est organisée comme suit :

```
src/store/
├── index.ts                 # Configuration du store principal
├── hooks.ts                 # Hooks Redux personnalisés
├── slices/                  # Slices Redux Toolkit
│   ├── authSlice.ts        # Gestion de l'authentification
│   ├── userSlice.ts        # Gestion des utilisateurs
│   ├── donationSlice.ts    # Gestion des donations
│   ├── eventSlice.ts       # Gestion des événements
│   ├── reportSlice.ts      # Gestion des rapports
│   ├── notificationSlice.ts # Gestion des notifications
│   └── networkSlice.ts     # Gestion de la connectivité
├── services/               # Services API
│   ├── apiClient.ts        # Client HTTP principal
│   ├── authService.ts      # Service d'authentification
│   ├── userService.ts      # Service utilisateurs
│   ├── donationService.ts  # Service donations
│   └── eventService.ts     # Service événements
└── README.md              # Cette documentation
```

## Configuration du Store

Le store Redux est configuré avec :
- **Redux Toolkit** pour une gestion simplifiée de l'état
- **Redux Persist** pour sauvegarder l'état entre les sessions
- **AsyncStorage** pour le stockage local React Native

### Persistance

Seuls les slices `auth` et `user` sont persistés localement. Les autres slices (`network`, `notification`) ne sont pas persistés pour éviter les problèmes de performances.

## Utilisation

### 1. Hooks personnalisés

Utilisez les hooks personnalisés pour accéder à l'état Redux :

```typescript
import { useAuth, useDonations, useEvents } from '../store/hooks';

const MyComponent = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { donations, myDonations } = useDonations();
  const { events, currentEvent } = useEvents();
  
  // Votre composant...
};
```

### 2. Actions asynchrones

Utilisez `useAppDispatch` pour déclencher des actions :

```typescript
import { useAppDispatch } from '../store/hooks';
import { loginUser } from '../store/slices/authSlice';

const LoginComponent = () => {
  const dispatch = useAppDispatch();
  
  const handleLogin = async () => {
    try {
      await dispatch(loginUser({ email, password })).unwrap();
      // Connexion réussie
    } catch (error) {
      // Gestion d'erreur
    }
  };
};
```

### 3. Notifications

Utilisez le slice notification pour afficher des messages :

```typescript
import { showSuccess, showError } from '../store/slices/notificationSlice';

// Succès
dispatch(showSuccess({
  title: 'Succès',
  message: 'Opération réussie'
}));

// Erreur
dispatch(showError({
  title: 'Erreur',
  message: 'Quelque chose a mal tourné'
}));
```

## Slices disponibles

### AuthSlice
- **Actions**: `loginUser`, `registerUser`, `logoutUser`, `verifyEmail`, `forgotPassword`, `resetPassword`
- **État**: `user`, `token`, `isAuthenticated`, `isLoading`, `error`

### UserSlice
- **Actions**: `getUserProfile`, `updateUserProfile`, `uploadAvatar`, `getAllUsers`
- **État**: `profile`, `users`, `isLoading`, `uploadingAvatar`

### DonationSlice
- **Actions**: `createDonation`, `getDonations`, `getMyDonations`, `processPayment`
- **État**: `donations`, `myDonations`, `currentDonation`, `isProcessingPayment`

### EventSlice
- **Actions**: `getEvents`, `createEvent`, `inscribeToEvent`, `getMyEvents`
- **État**: `events`, `myEvents`, `currentEvent`, `isLoading`

### NotificationSlice
- **Actions**: `showSuccess`, `showError`, `showWarning`, `showInfo`, `markAsRead`
- **État**: `notifications`, `unreadCount`, `isVisible`, `current`

### NetworkSlice
- **Actions**: `setConnectionStatus`, `addPendingRequest`, `clearPendingRequests`
- **État**: `isConnected`, `connectionType`, `pendingRequests`

### ReportSlice
- **Actions**: `setDashboardStats`, `addReport`, `updateFilters`
- **État**: `reports`, `dashboardStats`, `filters`, `isGenerating`

## Services API

### Configuration

L'API client est configuré pour :
- **Base URL**: Configurable selon l'environnement (dev/staging/prod)
- **Authentification**: Gestion automatique des tokens JWT
- **Refresh Token**: Renouvellement automatique des tokens expirés
- **Intercepteurs**: Gestion des erreurs et des timeouts

### Utilisation des services

Les services sont automatiquement utilisés par les slices Redux. Vous n'avez généralement pas besoin de les appeler directement.

## Gestion des erreurs

### Erreurs réseau
- Détection automatique de la connectivité
- Mise en file d'attente des requêtes hors ligne
- Retry automatique lors de la reconnexion

### Erreurs d'authentification
- Refresh automatique des tokens
- Redirection vers l'écran de connexion si nécessaire
- Nettoyage automatique des données sensibles

## Bonnes pratiques

### 1. Utilisation des hooks
Toujours utiliser les hooks personnalisés plutôt que `useSelector` directement :

```typescript
// ✅ Bon
const { user, isLoading } = useAuth();

// ❌ Éviter
const auth = useAppSelector(state => state.auth);
```

### 2. Gestion des états de chargement
Toujours vérifier les états de chargement avant d'afficher les données :

```typescript
const { donations, isLoading } = useDonations();

if (isLoading) {
  return <LoadingSpinner />;
}
```

### 3. Gestion des erreurs
Toujours gérer les erreurs des actions asynchrones :

```typescript
try {
  await dispatch(createDonation(data)).unwrap();
  // Succès
} catch (error) {
  // Gestion d'erreur
  dispatch(showError({
    title: 'Erreur',
    message: error.message
  }));
}
```

### 4. Nettoyage
Nettoyer les erreurs et états temporaires quand nécessaire :

```typescript
useEffect(() => {
  dispatch(clearError());
}, []);
```

## Configuration environnement

Ajustez la configuration API dans `src/config/api.ts` selon vos environnements :

```typescript
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
  },
  production: {
    baseURL: 'https://api.partenairemagb.com/api',
    timeout: 20000,
  },
};
```

## Intégration avec React Navigation

Pour utiliser Redux avec la navigation, assurez-vous que le Provider Redux englobe votre NavigationContainer :

```typescript
<Provider store={store}>
  <PersistGate loading={null} persistor={persistor}>
    <NavigationContainer>
      {/* Vos écrans */}
    </NavigationContainer>
  </PersistGate>
</Provider>
``` 