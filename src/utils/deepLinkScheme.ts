/**
 * Utilitaire pour obtenir le bon deep link de retour de paiement.
 *
 * Comportement selon l'environnement :
 * - Expo Go     → exp://192.168.1.8:8081/--/payment/return?...
 *                 (le "--" est le préfixe Expo Go pour les paths)
 * - Dev Client  → com.ericsou.PartenaireMAGB://payment/return?...
 * - Production  → partenaireMagb://payment/return?...
 */

import * as ExpoLinking from 'expo-linking';

/**
 * Construit l'URL de retour de paiement complète adaptée à l'environnement.
 * Utilise expo-linking qui gère automatiquement le bon format selon le contexte.
 */
export const buildPaymentReturnDeepLink = (
  donationId: string,
  paymentId?: string
): string => {
  const params: Record<string, string> = {
    donationId,
    status: 'pending',
  };
  if (paymentId) params.paymentId = paymentId;

  // expo-linking génère automatiquement :
  // - En Expo Go  : exp://192.168.1.8:8081/--/payment/return?donationId=...
  // - En dev client / prod : partenaireMagb://payment/return?donationId=...
  return ExpoLinking.createURL('payment/return', { queryParams: params });
};
