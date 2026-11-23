/**
 * Ouvre la page de paiement (GeniusPay, MoneyFusion…) dans une session de
 * navigateur intégrée qui se referme automatiquement au retour dans l'app.
 *
 * Flux : page de paiement → success_url / error_url du backend
 *        (/api/payments/mobile-callback) → redirection vers
 *        partenaireMagb://payment/return?... → la session se ferme
 *        et l'app reprend la main avec les paramètres du lien.
 *
 * - iOS     : ASWebAuthenticationSession (intercepte la redirection vers le schéma de l'app)
 * - Android : Chrome Custom Tab, refermé quand le lien de retour revient dans l'app
 *
 * Si l'utilisateur ferme la fenêtre lui-même, `returned` vaut false : l'appelant
 * envoie quand même vers l'écran de vérification, qui interroge le backend.
 */
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';
import logger from './logger';

export interface PaymentPageResult {
  /** true si la page a redirigé vers l'application (fin du parcours de paiement) */
  returned: boolean;
  /** Statut indicatif renvoyé par le lien de retour (completed, failed, cancelled, pending) */
  status?: string;
  /** Paramètres du lien de retour (donationId, transactionId, status…) */
  params: Record<string, string>;
}

// Pendant une session de paiement, c'est l'écran appelant qui gère la navigation :
// useDeepLinking ne doit pas naviguer une seconde fois sur le même lien de retour.
let paymentSessionActive = false;
export const isPaymentSessionActive = () => paymentSessionActive;

export async function openPaymentPage(paymentUrl: string): Promise<PaymentPageResult> {
  // Préfixe du lien de retour : partenaireMagb://payment/return (prod / dev client)
  // ou exp://…/--/payment/return (Expo Go)
  const returnUrl = ExpoLinking.createURL('payment/return');

  paymentSessionActive = true;
  try {
    const result = await WebBrowser.openAuthSessionAsync(paymentUrl, returnUrl, {
      // iOS : pas de popup « … souhaite utiliser … pour se connecter », pas de cookies partagés
      preferEphemeralSession: true,
    });

    if (result.type === 'success' && result.url) {
      const { queryParams } = ExpoLinking.parse(result.url);
      const params: Record<string, string> = {};
      Object.entries(queryParams || {}).forEach(([key, value]) => {
        if (value != null) params[key] = Array.isArray(value) ? String(value[0]) : String(value);
      });
      logger.log('↩️ Retour de la page de paiement:', params.status, params.donationId);
      return { returned: true, status: params.status, params };
    }

    logger.log('ℹ️ Page de paiement fermée sans retour automatique:', result.type);
    return { returned: false, params: {} };
  } finally {
    // Sur Android, le lien de retour peut aussi arriver via Linking juste après :
    // on garde la navigation automatique désactivée un court instant.
    setTimeout(() => {
      paymentSessionActive = false;
    }, 2000);
  }
}
