# Guide d'Intégration API - SignupModern

## 📋 Vue d'ensemble

L'écran `SignupModern` a été intégré avec l'API réelle pour gérer l'inscription des partenaires. Cette intégration remplace la simulation précédente par des appels API authentiques.

## 🔧 Fonctionnalités Intégrées

### 1. Inscription Utilisateur
- **Endpoint**: `POST /auth/register`
- **Service**: `apiService.auth.register()`
- **Données envoyées**:
  ```javascript
  {
    firstName: string,
    lastName: string,
    email: string,
    phone: string, // Format: +221771234567
    country: string,
    city: string,
    gender: string,
    password: string,
    role: 'partner',
    isPhoneVerified: false,
    isEmailVerified: false
  }
  ```

### 2. Vérification Email en Temps Réel
- **Endpoint**: `GET /auth/check-email?email=...`
- **Fonctionnalité**: Vérification automatique de la disponibilité de l'email
- **Délai**: 1 seconde après la saisie
- **Indicateur visuel**: Icône de chargement et statut

### 3. Formatage Automatique du Téléphone
- **Sénégal**: Format `77 123 45 67`
- **France**: Format `06 12 34 56 78`
- **Autres pays**: Format générique avec espaces

### 4. Validation Avancée
- **Email**: Vérification de format + disponibilité
- **Téléphone**: Validation spécifique par pays
- **Mots de passe**: Correspondance et longueur minimale

## 🚀 Flux d'Inscription

```mermaid
graph TD
    A[Étape 1: Infos Personnelles] --> B[Validation Côté Client]
    B --> C[Étape 2: Sécurité]
    C --> D[Validation Finale]
    D --> E[Appel API Register]
    E --> F{Succès?}
    F -->|Oui| G[Sauvegarde Tokens]
    G --> H{Email Vérifié?}
    H -->|Oui| I[Dashboard]
    H -->|Non| J[Écran Vérification Email]
    F -->|Non| K[Affichage Erreur]
```

## 📱 Écrans Créés

### 1. SignupModern.js (Modifié)
- Intégration API complète
- Validation en temps réel
- Gestion d'erreurs robuste
- Formatage automatique des données

### 2. EmailVerification.js (Nouveau)
- Écran de vérification d'email
- Renvoi d'email avec countdown
- Vérification du statut
- Option "Passer pour le moment"

## 🔐 Gestion des Tokens

```javascript
// Sauvegarde automatique après inscription réussie
if (token && refreshToken) {
  await apiService.setTokens(token, refreshToken);
}
```

## ⚠️ Gestion d'Erreurs

### Erreurs Serveur
- **409**: Email déjà existant
- **422**: Données invalides
- **500**: Erreur serveur

### Erreurs Réseau
- Timeout de connexion
- Perte de réseau
- Serveur indisponible

### Messages Utilisateur
```javascript
// Exemples de messages d'erreur
"Un compte avec cet email existe déjà"
"Données invalides. Veuillez vérifier vos informations."
"Problème de connexion. Vérifiez votre connexion internet."
```

## 🌍 Support International

### Pays Supportés
- **Sénégal**: Validation téléphone spécifique
- **France**: Validation téléphone spécifique
- **Autres**: Validation générique

### Chargement Dynamique des Pays
- API REST Countries pour l'Afrique
- Pays européens et américains populaires
- Fallback sur liste statique

## 🧪 Tests et Validation

### Tests Côté Client
- Validation des formats email
- Validation des numéros de téléphone
- Correspondance des mots de passe
- Champs obligatoires

### Tests API
- Vérification de la disponibilité email
- Inscription avec données valides
- Gestion des erreurs de validation
- Gestion des erreurs réseau

## 📋 Configuration Requise

### Dépendances
```json
{
  "@react-native-async-storage/async-storage": "^1.x.x",
  "axios": "^1.x.x",
  "expo-linear-gradient": "^12.x.x",
  "@expo/vector-icons": "^13.x.x"
}
```

### Services Utilisés
- `apiService`: Service principal pour les appels API
- `AsyncStorage`: Stockage des tokens
- `Redux`: Gestion des notifications

## 🔄 Navigation Post-Inscription

```javascript
// Logique de navigation basée sur le statut de vérification
if (user.isEmailVerified && user.isPhoneVerified) {
  navigation.navigate("DashboardGridModern");
} else if (!user.isEmailVerified) {
  navigation.navigate("EmailVerification", { email, userId, firstName });
} else if (!user.isPhoneVerified) {
  navigation.navigate("PhoneVerification", { phone, userId, firstName });
}
```

## 🎨 Améliorations UX

### Indicateurs Visuels
- Chargement lors de la vérification email
- Statut de disponibilité de l'email
- Progression des étapes d'inscription
- Animations fluides

### Formatage Automatique
- Numéros de téléphone selon le pays
- Capitalisation automatique des noms
- Nettoyage des espaces superflus

## 🚨 Points d'Attention

### Sécurité
- Mots de passe non stockés en local
- Tokens sécurisés dans AsyncStorage
- Validation côté serveur obligatoire

### Performance
- Debounce sur la vérification email (1s)
- Nettoyage des timeouts
- Gestion mémoire optimisée

### Accessibilité
- Labels appropriés pour les lecteurs d'écran
- Contrastes de couleurs respectés
- Navigation clavier supportée

## 📞 Support et Maintenance

Pour toute question ou problème :
1. Vérifier les logs de l'API dans la console
2. Tester la connectivité réseau
3. Valider la configuration des endpoints
4. Consulter la documentation de l'API backend

---

*Dernière mise à jour : Décembre 2024*