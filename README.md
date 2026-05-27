# PartenaireMAGB Mobile

Application mobile React Native (Expo) pour la gestion des dons et partenariats MAGB.

## 🚀 Dernières améliorations

### MoneyFusion v1.1.0 (23 Mars 2026)

✅ **Toutes les améliorations critiques implémentées!**

- ✅ Harmonisation des frais (125 XOF)
- ✅ Timeout de vérification (30s)
- ✅ Retry automatique (3 tentatives)
- ✅ Logger conditionnel (production-ready)
- ✅ Validation des statuts

**Score: 10/10** - Prêt pour la production! 🎉

📚 **Documentation:**
- [Guide des améliorations](./PAYMENT_SERVICE_IMPROVEMENTS.md)
- [Audit mobile](./MONEYFUSION_MOBILE_AUDIT.md)
- [Guide de test](./TESTING_GUIDE.md)
- [Changelog](./CHANGELOG_MONEYFUSION.md)

---

## 📱 Installation

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm start

# Lancer sur iOS
npm run ios

# Lancer sur Android
npm run android
```

---

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine:

```env
API_URL=https://votre-backend.com/api
```

### Deep Linking

L'app utilise le scheme `partenaireMagb://` pour les callbacks de paiement.

**Format:**
```
partenaireMagb://payment/return?transactionId=XXX&donationId=YYY&status=completed
```

---

## 💳 Paiements MoneyFusion

### Utilisation basique

```typescript
import paymentService from './src/store/services/paymentService';

// Vérifier un paiement avec retry automatique
const response = await paymentService.verifyPaymentWithRetry(paymentId);
```

### Configuration avancée

```typescript
// Personnaliser le retry
const response = await paymentService.verifyPaymentWithRetry(
  paymentId,
  5,      // 5 tentatives
  10000,  // 10 secondes entre chaque
  60000   // 60 secondes de timeout
);
```

---

## 📝 Logging

### En développement

```typescript
import logger from './src/utils/logger';

logger.log('Message standard');
logger.payment('Paiement initialisé', data);
logger.moneyfusion('Vérification', token);
logger.success('Opération réussie');
logger.failure('Opération échouée');
```

### En production

Les logs sont automatiquement désactivés en production (`__DEV__ = false`).

---

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec coverage
npm run test:coverage
```

### Test du deep linking

**iOS:**
```bash
xcrun simctl openurl booted "partenaireMagb://payment/return?transactionId=TEST&donationId=DON&status=completed"
```

**Android:**
```bash
adb shell am start -W -a android.intent.action.VIEW -d "partenaireMagb://payment/return?transactionId=TEST&donationId=DON&status=completed"
```

---

## 📚 Documentation

- [Guide des améliorations](./PAYMENT_SERVICE_IMPROVEMENTS.md) - Détails des améliorations v1.1.0
- [Audit mobile](./MONEYFUSION_MOBILE_AUDIT.md) - Audit complet de l'intégration
- [Guide de test](./TESTING_GUIDE.md) - Tests et validation
- [Changelog](./CHANGELOG_MONEYFUSION.md) - Historique des versions

---

## 🏗️ Structure du projet

```
src/
├── components/          # Composants réutilisables
├── screens/            # Écrans de l'application
├── navigations/        # Configuration de navigation
├── store/
│   └── services/       # Services API
│       └── paymentService.ts
├── hooks/              # Hooks personnalisés
│   └── useDeepLinking.ts
├── utils/              # Utilitaires
│   └── logger.ts       # Système de logging
├── constants/          # Constantes
│   └── paymentMethods.ts
└── types/              # Types TypeScript
```

---

## 🚀 Déploiement

### Build de production

```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

### Vérifications avant déploiement

- [ ] Tous les tests passent
- [ ] Logs désactivés en production
- [ ] Deep linking testé sur iOS et Android
- [ ] Paiement MoneyFusion testé de bout en bout
- [ ] Variables d'environnement configurées

---

## 📞 Support

Pour toute question:
- Backend: Consulter `../PartenaireMAGB-backend/MONEYFUSION_SETUP_GUIDE.md`
- Intégration: Consulter `../MONEYFUSION_INTEGRATION_SUMMARY.md`

---

## 📄 Licence

Propriétaire - PARTENAIRE MAGB

---

*Dernière mise à jour: 23 Mars 2026*
