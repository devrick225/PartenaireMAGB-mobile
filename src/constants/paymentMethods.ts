// Constantes pour les méthodes de paiement et opérateurs PayDunya

export interface PaymentOperator {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  icon: string;
  color: string;
  description: string;
  provider: string;
}

export const PAYDUNYA_OPERATORS: PaymentOperator[] = [
  // (conservé pour référence mais non utilisé dans l'UI tant que désactivé)
];

// Cartes bancaires PayDunya
export const PAYDUNYA_CARD_OPTION: PaymentOperator = {
  id: 'card',
  name: 'Carte bancaire',
  country: 'International',
  countryCode: 'INT',
  flag: '💳',
  icon: 'credit-card',
  color: '#6366F1',
  description: 'Visa, Mastercard',
  provider: 'paydunya',
};

// Fonction utilitaire pour obtenir les opérateurs par pays
export const getOperatorsByCountry = (countryCode: string): PaymentOperator[] => {
  return PAYDUNYA_OPERATORS.filter(operator => operator.countryCode === countryCode);
};

// Fonction utilitaire pour obtenir un opérateur par ID
export const getOperatorById = (id: string): PaymentOperator | undefined => {
  const allOperators: PaymentOperator[] = []; // Désactivé
  return allOperators.find(operator => operator.id === id);
};

// Pays supportés par PayDunya
export const PAYDUNYA_SUPPORTED_COUNTRIES: Array<{ code: string; name: string; flag: string }> = [];

// Méthodes de paiement par défaut (existantes)
export const DEFAULT_PAYMENT_METHODS = [
  {
    id: 'moneyfusion',
    name: 'MoneyFusion',
    icon: 'account-balance-wallet',
    color: '#2196F3',
    description: 'MoneyFusion.net',
    provider: 'moneyfusion',
  },
  {
    id: 'fusionpay',
    name: 'FusionPay',
    icon: 'payment',
    color: '#4CAF50',
    description: 'FusionPay',
    provider: 'fusionpay',
  },
];

// Toutes les méthodes de paiement combinées
export const ALL_PAYMENT_METHODS = [
  ...DEFAULT_PAYMENT_METHODS,
  // PayDunya désactivé
];