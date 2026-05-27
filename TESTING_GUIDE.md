# Guide de test - Améliorations MoneyFusion

## 🧪 Tests rapides

### 1. Test du logger conditionnel

#### En mode développement
```typescript
import logger from './src/utils/logger';

// Ces logs doivent s'afficher
logger.log('Test log');
logger.payment('Test payment');
logger.moneyfusion('Test moneyfusion');
logger.success('Test success');
logger.failure('Test failure');
```

**Résultat attendu**: Tous les logs s'affichent avec leurs préfixes colorés

#### En mode production
```bash
# Build de production
expo build:android --release
# ou
expo build:ios --release
```

**Résultat attendu**: Aucun log ne s'affiche dans la console

---

### 2. Test du timeout

```typescript
import paymentService from './src/store/services/paymentService';

// Test avec timeout court (devrait échouer)
const testTimeout = async () => {
  try {
    await paymentService.verifyPayment('PAYMENT_ID', 1000); // 1 seconde
  } catch (error) {
    console.log('✅ Timeout détecté:', error.message);
    // Devrait afficher: "Timeout de vérification du paiement (1000ms)"
  }
};

testTimeout();
```

**Résultat attendu**: Erreur de timeout après 1 seconde

---

### 3. Test du retry automatique

```typescript
import paymentService from './src/store/services/paymentService';

// Test avec retry (devrait réessayer 3 fois)
const testRetry = async () => {
  try {
    const response = await paymentService.verifyPaymentWithRetry(
      'INVALID_PAYMENT_ID', // ID invalide pour forcer l'échec
      3,     // 3 tentatives
      2000,  // 2 secondes entre chaque
      5000   // 5 secondes de timeout
    );
  } catch (error) {
    console.log('✅ Échec après 3 tentatives:', error.message);
  }
};

testRetry();
```

**Résultat attendu**: 
```
🔵 [MoneyFusion] Tentative de vérification 1/3 pour paiement: INVALID_PAYMENT_ID
⚠️ Tentative 1/3 échouée: ...
ℹ️ Attente de 2000ms avant la prochaine tentative...
🔵 [MoneyFusion] Tentative de vérification 2/3 pour paiement: INVALID_PAYMENT_ID
⚠️ Tentative 2/3 échouée: ...
ℹ️ Attente de 2000ms avant la prochaine tentative...
🔵 [MoneyFusion] Tentative de vérification 3/3 pour paiement: INVALID_PAYMENT_ID
❌ Échec définitif après 3 tentatives
```

---

### 4. Test des frais MoneyFusion

```typescript
import paymentService from './src/store/services/paymentService';

const testFees = () => {
  const fees = paymentService.calculateFees(10000, 'moneyfusion', 'XOF');
  
  console.log('Montant:', 10000, 'XOF');
  console.log('Frais en %:', fees.percentageFee, 'XOF'); // 250 XOF (2.5%)
  console.log('Frais fixes:', fees.fixedFee, 'XOF');    // 125 XOF
  console.log('Frais totaux:', fees.totalFee, 'XOF');   // 375 XOF
  console.log('Montant net:', fees.netAmount, 'XOF');   // 9625 XOF
  
  // Vérifications
  console.assert(fees.fixedFee === 125, '❌ Frais fixes incorrects');
  console.assert(fees.percentageFee === 250, '❌ Frais en % incorrects');
  console.assert(fees.totalFee === 375, '❌ Frais totaux incorrects');
  console.assert(fees.netAmount === 9625, '❌ Montant net incorrect');
  
  console.log('✅ Tous les frais sont corrects');
};

testFees();
```

**Résultat attendu**: Tous les asserts passent

---

### 5. Test de validation des statuts

```typescript
import { useDeepLinking } from './src/hooks/useDeepLinking';

const testStatusValidation = () => {
  const { parsePaymentDeepLink } = useDeepLinking();
  
  // Statut valide
  const validLink = {
    type: 'payment' as const,
    url: 'partenaireMagb://payment/return',
    params: {
      transactionId: 'TX123',
      donationId: 'DON456',
      status: 'completed'
    }
  };
  
  const result1 = parsePaymentDeepLink(validLink);
  console.assert(result1 !== null, '✅ Statut valide accepté');
  
  // Statut invalide
  const invalidLink = {
    type: 'payment' as const,
    url: 'partenaireMagb://payment/return',
    params: {
      transactionId: 'TX123',
      donationId: 'DON456',
      status: 'invalid_status'
    }
  };
  
  const result2 = parsePaymentDeepLink(invalidLink);
  console.assert(result2 === null, '✅ Statut invalide rejeté');
  
  console.log('✅ Validation des statuts fonctionne');
};

testStatusValidation();
```

**Résultat attendu**: Les deux asserts passent

---

### 6. Test du deep linking

#### iOS Simulator
```bash
xcrun simctl openurl booted "partenaireMagb://payment/return?transactionId=TEST123&donationId=DON456&status=completed"
```

#### Android Emulator
```bash
adb shell am start -W -a android.intent.action.VIEW -d "partenaireMagb://payment/return?transactionId=TEST123&donationId=DON456&status=completed"
```

**Résultat attendu**: 
- L'app s'ouvre
- Navigation vers l'écran PaymentVerification
- Logs affichés:
  ```
  ℹ️ Deep link received: partenaireMagb://payment/return?...
  🐛 Parsed deep link: { type: 'payment', params: {...} }
  💳 [Payment] Navigation vers PaymentVerification avec: {...}
  ```

---

### 7. Test de paiement complet (E2E)

#### Étape 1: Initialiser un paiement
```typescript
// Dans votre écran de donation
const initializePayment = async () => {
  try {
    const response = await donationService.initializePayment({
      donationId: 'DON_123',
      provider: 'moneyfusion',
      paymentMethod: 'mobile_money',
      customerPhone: '0123456789'
    });
    
    console.log('✅ Paiement initialisé:', response.data);
    
    // Ouvrir la WebView avec l'URL de paiement
    const paymentUrl = response.data.data.paymentUrl;
    // ...
  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
  }
};
```

#### Étape 2: Effectuer le paiement
- Ouvrir la WebView avec l'URL MoneyFusion
- Effectuer le paiement
- Attendre la redirection

#### Étape 3: Vérifier le callback
- L'app doit se rouvrir automatiquement
- Navigation vers PaymentVerification
- Vérification automatique avec retry

#### Étape 4: Vérifier le résultat
```typescript
// Dans PaymentVerificationScreen
const verifyPayment = async () => {
  try {
    const response = await paymentService.verifyPaymentWithRetry(paymentId);
    
    if (response.data.statut) {
      const data = response.data.data;
      
      if (data.statut === 'paid') {
        console.log('✅ Paiement confirmé');
        // Afficher écran de succès
      } else if (data.statut === 'pending') {
        console.log('⏳ Paiement en attente');
        // Afficher écran d'attente
      } else {
        console.log('❌ Paiement échoué');
        // Afficher écran d'échec
      }
    }
  } catch (error) {
    console.error('❌ Erreur vérification:', error);
  }
};
```

**Résultat attendu**: 
- Paiement initialisé avec succès
- WebView s'ouvre
- Après paiement, retour dans l'app
- Vérification automatique (avec retry si nécessaire)
- Affichage du résultat correct

---

## 🔍 Checklist de test

### Tests unitaires
- [ ] Logger en mode développement
- [ ] Logger en mode production
- [ ] Timeout de vérification
- [ ] Retry automatique
- [ ] Calcul des frais MoneyFusion
- [ ] Validation des statuts
- [ ] Parsing du deep link

### Tests d'intégration
- [ ] Deep linking iOS
- [ ] Deep linking Android
- [ ] Initialisation de paiement
- [ ] Vérification de paiement
- [ ] Retry en cas d'échec
- [ ] Timeout en cas de lenteur

### Tests E2E
- [ ] Flux complet de paiement MoneyFusion
- [ ] Paiement réussi
- [ ] Paiement échoué
- [ ] Paiement en attente
- [ ] Retour dans l'app après paiement

### Tests de performance
- [ ] Temps de vérification < 5 secondes
- [ ] Retry ne dépasse pas 20 secondes
- [ ] Pas de logs en production
- [ ] Pas de memory leaks

---

## 🐛 Debugging

### Activer les logs détaillés

```typescript
// Temporairement forcer les logs en production
// Dans src/utils/logger.ts
const isDevelopment = true; // Au lieu de __DEV__
```

### Vérifier la configuration

```typescript
import paymentService from './src/store/services/paymentService';

// Vérifier les frais
const fees = paymentService.calculateFees(10000, 'moneyfusion');
console.log('Frais fixes:', fees.fixedFee); // Doit être 125

// Vérifier le provider
const provider = paymentService.formatProvider('moneyfusion');
console.log('Provider:', provider); // Doit être "MoneyFusion"
```

### Simuler des erreurs

```typescript
// Simuler un timeout
await paymentService.verifyPayment('PAYMENT_ID', 100); // 100ms

// Simuler un échec
await paymentService.verifyPaymentWithRetry('INVALID_ID');

// Simuler un statut invalide
const result = parsePaymentDeepLink({
  type: 'payment',
  url: '...',
  params: { transactionId: 'TX', status: 'invalid' }
});
```

---

## ✅ Résultats attendus

Après avoir exécuté tous les tests:

- ✅ Tous les logs fonctionnent en développement
- ✅ Aucun log en production
- ✅ Timeout fonctionne correctement
- ✅ Retry fonctionne (3 tentatives)
- ✅ Frais MoneyFusion corrects (125 XOF)
- ✅ Validation des statuts fonctionne
- ✅ Deep linking fonctionne sur iOS et Android
- ✅ Flux de paiement complet fonctionne

---

## 📞 Support

Si un test échoue:
1. Vérifier les logs détaillés
2. Consulter `PAYMENT_SERVICE_IMPROVEMENTS.md`
3. Consulter `MONEYFUSION_MOBILE_AUDIT.md`
4. Vérifier la configuration backend

---

*Guide de test créé le 23 Mars 2026*
