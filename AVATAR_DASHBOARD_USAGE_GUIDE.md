# 🎯 Guide d'Utilisation - Avatar dans le Dashboard Moderne

## 📋 Vue d'ensemble

Ce guide explique comment utiliser les composants d'avatar dans votre dashboard PartenaireMAGB pour créer une interface utilisateur moderne et élégante.

## 🔧 Composants Disponibles

### 1. **Avatar** - Composant de base
- Affichage d'image ou d'initiales
- Support des statuts (en ligne/hors ligne)
- Badges de notification
- Bordures personnalisables
- Gestion automatique des fallbacks

### 2. **UserCard** - Carte utilisateur complète
- Mode normal (complet) et compact
- Statistiques utilisateur
- Niveaux de partenariat
- Badges de vérification
- Actions d'édition

### 3. **DashboardHeader** - En-tête moderne
- Gradient de fond adaptatif
- Avatar utilisateur intégré
- Statistiques rapides
- Actions de navigation
- Design responsive

## 🚀 Utilisation Pratique

### Configuration de Base

```javascript
import { useSelector } from 'react-redux';
import Avatar from '../components/Avatar';
import UserCard from '../components/UserCard';
import DashboardHeader from '../components/DashboardHeader';

const MyDashboard = () => {
  // Récupérer les données utilisateur
  const user = useSelector((state) => state.auth.user);
  
  return (
    <View>
      {/* Votre contenu ici */}
    </View>
  );
};
```

### 1. Avatar Simple

```javascript
// Avatar avec image
<Avatar
  source={user.avatar}
  name={`${user.firstName} ${user.lastName}`}
  size={60}
  borderColor="#8B5CF6"
/>

// Avatar avec initiales (fallback automatique)
<Avatar
  name="Marie Dupont"
  size={80}
  showStatus={true}
  isOnline={true}
/>

// Avatar avec badge de notification
<Avatar
  source={user.avatar}
  name={user.fullName}
  size={50}
  showBadge={true}
  badgeCount={5}
/>
```

### 2. Carte Utilisateur Complète

```javascript
<UserCard
  user={user}
  onPress={() => navigation.navigate('Profile')}
  onEditPress={() => navigation.navigate('EditProfile')}
  showStats={true}
  showEditButton={true}
/>
```

### 3. Carte Utilisateur Compacte

```javascript
<UserCard
  user={user}
  onPress={() => navigation.navigate('Profile')}
  compact={true}
  showEditButton={false}
/>
```

### 4. Header Dashboard

```javascript
<DashboardHeader
  user={user}
  onProfilePress={() => navigation.navigate('Profile')}
  onNotificationPress={() => navigation.navigate('Notifications')}
  onMenuPress={() => navigation.openDrawer()}
  notificationCount={3}
  showMenu={true}
  showNotifications={true}
/>
```

## 🎨 Exemples d'Intégration

### Dashboard Principal

```javascript
import React from 'react';
import { ScrollView, SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';

const DashboardScreen = ({ navigation }) => {
  const user = useSelector((state) => state.auth.user);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        {/* Header avec avatar et actions */}
        <DashboardHeader
          user={user}
          onProfilePress={() => navigation.navigate('Profile')}
          onNotificationPress={() => navigation.navigate('Notifications')}
          onMenuPress={() => navigation.openDrawer()}
          notificationCount={5}
        />

        {/* Carte utilisateur détaillée */}
        <UserCard
          user={user}
          onPress={() => navigation.navigate('ProfileDetails')}
          onEditPress={() => navigation.navigate('EditProfile')}
          showStats={true}
        />

        {/* Autres contenus... */}
      </ScrollView>
    </SafeAreaView>
  );
};
```

### Liste d'Utilisateurs

```javascript
const UserList = ({ users }) => {
  return (
    <View>
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          compact={true}
          onPress={() => navigateToUserProfile(user.id)}
          showEditButton={false}
        />
      ))}
    </View>
  );
};
```

### Profil Rapide

```javascript
const QuickProfile = ({ user }) => {
  return (
    <View style={styles.quickProfile}>
      <Avatar
        source={user.avatar}
        name={`${user.firstName} ${user.lastName}`}
        size={40}
        showStatus={true}
        isOnline={user.isOnline}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.firstName}</Text>
        <Text style={styles.userRole}>{user.role}</Text>
      </View>
    </View>
  );
};
```

## 🎭 Customisation des Niveaux de Partenaire

Le système gère automatiquement les couleurs selon le niveau :

```javascript
const partnerLevels = {
  'classique': ['#8B5CF6', '#A78BFA'], // Violet
  'bronze': ['#CD7F32', '#D4933A'],    // Bronze
  'argent': ['#C0C0C0', '#D3D3D3'],    // Argent
  'or': ['#FFD700', '#FFF176'],        // Or
};

// Utilisation automatique dans UserCard
<UserCard
  user={{ ...user, partnerLevel: 'or' }}
  // La couleur sera automatiquement dorée
/>
```

## 🔄 Gestion des États

### Chargement

```javascript
const DashboardWithLoading = () => {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Avatar
          name="Utilisateur"
          size={80}
        />
        <Text>Chargement du profil...</Text>
      </View>
    );
  }

  return <DashboardContent user={user} />;
};
```

### Erreurs

```javascript
const SafeAvatar = ({ user }) => {
  if (!user) {
    return (
      <Avatar
        name="Invité"
        size={50}
        borderColor="#9E9E9E"
      />
    );
  }

  return (
    <Avatar
      source={user.avatar}
      name={`${user.firstName} ${user.lastName}`}
      size={50}
    />
  );
};
```

## 📱 Responsive Design

Les composants s'adaptent automatiquement :

```javascript
// Tailles recommandées par contexte
const AVATAR_SIZES = {
  header: 60,        // Header principal
  card: 80,          // Cartes utilisateur
  list: 50,          // Listes
  compact: 40,       // Mode compact
  large: 120,        // Vue détaillée
};

// Utilisation
<Avatar size={AVATAR_SIZES.header} />
```

## 🎯 Bonnes Pratiques

### 1. **Performance**
```javascript
// Éviter les re-renders inutiles
const memoizedUser = useMemo(() => user, [user.id, user.avatar]);

<UserCard user={memoizedUser} />
```

### 2. **Accessibilité**
```javascript
<Avatar
  source={user.avatar}
  name={user.fullName}
  size={60}
  accessible={true}
  accessibilityLabel={`Photo de profil de ${user.fullName}`}
/>
```

### 3. **Gestion d'erreurs**
```javascript
const handleImageError = () => {
  console.log('Erreur de chargement avatar');
  // Fallback automatique vers les initiales
};

<Avatar
  source={user.avatar}
  name={user.fullName}
  onError={handleImageError}
/>
```

## 🔗 Intégration Redux

```javascript
// Dans votre slice Redux
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
  },
  reducers: {
    updateAvatar: (state, action) => {
      if (state.user) {
        state.user.avatar = action.payload;
      }
    },
  },
});

// Dans votre composant
const dispatch = useDispatch();

const handleAvatarUpdate = (newAvatarUrl) => {
  dispatch(updateAvatar(newAvatarUrl));
};
```

## 🚀 Prochaines Étapes

1. **Testez** les composants dans votre dashboard
2. **Personnalisez** les couleurs selon votre charte
3. **Ajoutez** des animations pour plus de fluidité
4. **Intégrez** avec votre système de notifications
5. **Optimisez** les performances si nécessaire

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que tous les props sont correctement passés
2. Assurez-vous que Redux contient les données utilisateur
3. Consultez les logs pour les erreurs de chargement d'image
4. Testez d'abord avec des données mockées

---

🎉 **Votre dashboard moderne avec avatars est maintenant prêt !** 