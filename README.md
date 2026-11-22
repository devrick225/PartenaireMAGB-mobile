# PartenaireMAGB Mobile

Application mobile React Native (Expo SDK 58) de gestion des dons et partenariats MAGB.

## Démarrage

```bash
npm install
npx expo start --go     # dans Expo Go (scanner le QR code)
npm run ios             # build natif iOS (simulateur)
npm run android         # build natif Android
```

> `expo-dev-client` est installé : sans `--go`, `expo start` cherche le build de développement au lieu d'Expo Go.

Aucun script de test ni de lint n'est configuré. Pour vérifier le code :

```bash
npx tsc --noEmit                      # types (des erreurs anciennes existent encore)
npx expo export --platform ios        # bundle complet : tous les imports doivent se résoudre
npx expo-doctor                       # cohérence des dépendances Expo
```

## Configuration

- **API** : l'URL du backend est définie dans `src/config/api.ts`
  (`https://partenairemagb-backend.onrender.com/api`).
- **Deep linking** : scheme `partenaireMagb://`, utilisé pour le retour de paiement :
  `partenaireMagb://payment/return?transactionId=XXX&donationId=YYY&status=completed`

Tester le retour de paiement :

```bash
# iOS (simulateur)
xcrun simctl openurl booted "partenaireMagb://payment/return?transactionId=TEST&donationId=DON&status=completed"
# Android
adb shell am start -W -a android.intent.action.VIEW -d "partenaireMagb://payment/return?transactionId=TEST&donationId=DON&status=completed"
```

## Structure

```
App.tsx / index.ts        Point d'entrée
src/
├── navigations/          RootNavigator : AuthNavigator (non connecté) / AppNavigator (connecté)
├── screens/              Écrans (seuls ceux enregistrés dans les navigateurs sont utilisés)
├── components/           Composants réutilisables
├── store/                Redux Toolkit + redux-persist (slices, services API) — voir src/store/README.md
├── config/api.ts         URL de l'API
├── hooks/                Hooks (dont useDeepLinking pour le retour de paiement)
├── utils/                Utilitaires (biometricAuth, openLink, logger…)
├── constants/ theme/     Couleurs, polices, images, thème clair/sombre
└── types/                Types TypeScript
docs/                     Documentation (voir docs/README.md)
```

Points à connaître :

- **Navigation** : la connexion / déconnexion bascule automatiquement entre `AuthNavigator`
  et `AppNavigator` selon `isAuthenticated`. Ne pas faire `navigation.reset` vers `Login`
  depuis un écran connecté (la route n'existe pas dans ce navigateur).
- **Paiements** : MoneyFusion uniquement côté mobile, en FCFA. Le backend met à jour le
  paiement et le don lors d'une vérification ; les dons récurrents génèrent côté backend
  un don « échéance » à chaque date prévue.
- **Mot de passe mémorisé / Face ID** : stocké chiffré avec `expo-secure-store`
  (`src/utils/biometricAuth.js`), jamais dans AsyncStorage.

## Déploiement

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

Avant un build natif, régénérer le dossier `ios/` pour le SDK courant : `npx expo prebuild --clean`.
Voir aussi [docs/guides/deploiement-google-play.md](docs/guides/deploiement-google-play.md).

## Licence

Propriétaire — PARTENAIRE MAGB
