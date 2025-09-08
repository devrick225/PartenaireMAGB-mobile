# Guide d'Installation - Contact Ministère

## 📋 Vue d'ensemble

L'écran `ContactMinistere` permet aux utilisateurs de :
- Voir la localisation du Ministère de l'Agriculture sur une carte
- Accéder aux informations de contact complètes
- Envoyer un message directement au ministère
- Obtenir des itinéraires vers le ministère

## 📦 Dépendances Requises

### 1. React Native Maps
```bash
npm install react-native-maps
```

### 2. Configuration iOS (si applicable)
Ajouter dans `ios/Podfile` :
```ruby
pod 'react-native-google-maps', :path => '../node_modules/react-native-maps'
```

Puis exécuter :
```bash
cd ios && pod install
```

### 3. Configuration Android
Ajouter dans `android/app/src/main/AndroidManifest.xml` :
```xml
<application>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="VOTRE_CLE_API_GOOGLE_MAPS"/>
</application>
```

## 🗺️ Configuration Google Maps

### 1. Obtenir une clé API Google Maps
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API Maps SDK for Android/iOS
4. Créer une clé API dans "Credentials"

### 2. Configurer les permissions Android
Ajouter dans `android/app/src/main/AndroidManifest.xml` :
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

## 🏛️ Informations du Ministère

### Coordonnées GPS
- **Latitude**: 14.6928
- **Longitude**: -17.4467
- **Adresse**: Building Administratif, Dakar, Sénégal

### Contacts
- **Téléphone**: +221 33 849 54 54
- **Email**: contact@agriculture.gouv.sn
- **Site web**: https://www.agriculture.gouv.sn

### Horaires
- **Lundi - Vendredi**: 8h00 - 17h00
- **Samedi**: 8h00 - 12h00
- **Dimanche**: Fermé

## 🚀 Fonctionnalités Implémentées

### 1. Carte Interactive
```javascript
<MapView
  style={styles.map}
  provider={PROVIDER_GOOGLE}
  initialRegion={MINISTERE_LOCATION}
  showsUserLocation={true}
  showsMyLocationButton={true}
>
  <Marker
    coordinate={MINISTERE_LOCATION}
    title={CONTACT_INFO.name}
    description={CONTACT_INFO.address}
    pinColor="#26335F"
  />
</MapView>
```

### 2. Actions de Contact
- **Appel téléphonique** : `Linking.openURL('tel:+221338495454')`
- **Email** : `Linking.openURL('mailto:contact@agriculture.gouv.sn')`
- **Site web** : `Linking.openURL('https://www.agriculture.gouv.sn')`
- **Itinéraire** : Intégration avec Google Maps/Apple Maps

### 3. Formulaire de Contact
```javascript
const contactData = {
  name: string,
  email: string,
  subject: string,
  message: string,
  type: 'ministere_contact',
  recipient: 'ministere_agriculture'
};
```

## 🔧 API Backend

### Endpoint de Contact
```
POST /api/contact/ministere
```

### Structure de la Requête
```json
{
  "name": "Nom complet",
  "email": "email@example.com",
  "subject": "Objet du message",
  "message": "Contenu du message",
  "type": "ministere_contact",
  "recipient": "ministere_agriculture"
}
```

### Réponse Attendue
```json
{
  "success": true,
  "message": "Message envoyé avec succès",
  "data": {
    "id": "contact_id",
    "status": "sent",
    "timestamp": "2024-12-18T10:00:00Z"
  }
}
```

## 📱 Navigation

### Ajout au Dashboard
```javascript
{
  id: 'ministere',
  title: 'Ministère',
  subtitle: '🏛️ Contact officiel',
  icon: 'account-balance',
  iconType: 'MaterialIcons',
  route: 'ContactMinistere',
  isNew: true,
  iconColor: '#D32235',
}
```

### Configuration de la Navigation
```javascript
// Dans AppNavigator.js
import ContactMinistere from "../screens/ContactMinistere";

<Stack.Screen name="ContactMinistere" component={ContactMinistere} />
```

## 🎨 Design et UX

### Palette de Couleurs
- **Primaire**: #26335F (Bleu officiel)
- **Secondaire**: #FFD61D (Jaune)
- **Accent**: #D32235 (Rouge)

### Animations
- Fade in pour l'apparition des éléments
- Slide up pour les animations d'entrée
- Transitions fluides entre les sections

### Responsive Design
- Adaptation automatique à la taille d'écran
- Support mode sombre/clair
- Optimisation pour tablettes

## 🧪 Tests

### Tests de Fonctionnalité
1. **Carte** : Vérifier l'affichage et l'interaction
2. **Contacts** : Tester tous les liens (tel, email, web)
3. **Formulaire** : Validation et envoi
4. **Navigation** : Itinéraires vers le ministère

### Tests d'Intégration
1. **API** : Envoi de messages de contact
2. **Géolocalisation** : Permissions et localisation
3. **Liens externes** : Ouverture des applications

## ⚠️ Gestion d'Erreurs

### Erreurs Communes
- **Pas de connexion internet** : Message d'erreur approprié
- **Permissions refusées** : Demande de réactivation
- **API indisponible** : Mode dégradé avec contacts de base

### Fallbacks
- **Carte non disponible** : Affichage de l'adresse textuelle
- **Géolocalisation désactivée** : Coordonnées statiques
- **Email non configuré** : Copie automatique de l'adresse

## 📞 Support

### Dépannage
1. Vérifier les permissions de géolocalisation
2. Contrôler la clé API Google Maps
3. Tester la connectivité réseau
4. Valider la configuration des liens profonds

### Logs Utiles
```javascript
console.log('📍 Coordonnées ministère:', MINISTERE_LOCATION);
console.log('📤 Envoi message contact:', contactData);
console.log('🗺️ Ouverture itinéraire:', url);
```

---

*Dernière mise à jour : Décembre 2024*