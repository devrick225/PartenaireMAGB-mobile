/**
 * PaymentWebViewScreen
 *
 * Affiche la page de paiement MoneyFusion dans une WebView intégrée.
 * Intercepte la navigation vers le deep link (exp:// ou partenaireMagb://)
 * pour revenir automatiquement dans l'app après le paiement.
 *
 * Avantages vs Linking.openURL :
 * - Pas de sortie vers le navigateur externe
 * - Interception directe du deep link → pas de blocage iOS
 * - UX fluide : l'utilisateur reste dans l'app
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView, WebViewNavigation } from 'react-native-webview';
import logger from '../utils/logger';

import { useDS, AppText, IconButton, formatAmount } from '../design/components';
import { spacing } from '../design/tokens';
interface PaymentWebViewScreenProps {
  navigation: any;
  route: {
    params: {
      paymentUrl: string;
      donationId: string;
      paymentId?: string;
      transactionId?: string;
      amount?: number;
      currency?: string;
    };
  };
}

const PaymentWebViewScreen: React.FC<PaymentWebViewScreenProps> = ({ navigation, route }) => {
  const { c, gradient } = useDS();
  const insets = useSafeAreaInsets();
  const { paymentUrl, donationId, paymentId, transactionId, amount, currency } = route.params;

  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [pageTitle, setPageTitle] = useState('Paiement sécurisé');

  /**
   * Intercepte chaque navigation dans la WebView.
   * Si l'URL est un deep link (exp:// ou partenaireMagb://),
   * on ferme la WebView et on navigue vers PaymentVerification.
   */
  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    if (navState.title) setPageTitle(navState.title);

    const url = navState.url;
    logger.log('WebView navigation:', url);

    // Intercepter le callback backend
    if (url.includes('/api/payments/mobile-callback') || url.includes('mobile-callback')) {
      try {
        const queryStart = url.indexOf('?');
        const queryString = queryStart >= 0 ? url.slice(queryStart + 1) : '';
        const params = new URLSearchParams(queryString);

        const returnDonationId = params.get('donationId') || donationId;
        const statut = params.get('statut') || params.get('status') || '';
        const returnStatus =
          statut === 'paid' ? 'completed' :
          statut === 'failed' ? 'failed' :
          statut === 'cancelled' ? 'cancelled' :
          'pending';

        navigation.replace('PaymentVerification', {
          donationId: returnDonationId,
          paymentId,
          transactionId: params.get('token') || params.get('transactionId') || transactionId,
          status: returnStatus,
        });
      } catch {
        navigation.replace('PaymentVerification', { donationId, paymentId, transactionId, status: 'pending' });
      }
      return false;
    }

    // Intercepter les deep links
    const isDeepLink =
      url.startsWith('exp://') ||
      url.startsWith('partenaireMagb://') ||
      url.startsWith('com.ericsou.PartenaireMAGB://');

    if (isDeepLink) {
      try {
        const normalized = url.replace('/--/', '/');
        const queryStart = normalized.indexOf('?');
        const queryString = queryStart >= 0 ? normalized.slice(queryStart + 1) : '';
        const params = new URLSearchParams(queryString);

        navigation.replace('PaymentVerification', {
          donationId: params.get('donationId') || donationId,
          paymentId,
          transactionId: params.get('transactionId') || transactionId,
          status: params.get('status') || 'pending',
        });
      } catch {
        navigation.replace('PaymentVerification', { donationId, paymentId, transactionId, status: 'pending' });
      }
      return false;
    }

    return true;
  }, [donationId, paymentId, transactionId, navigation]);

  const handleShouldStartLoadWithRequest = useCallback((request: any) => {
    const url = request.url;

    // Intercepter le callback backend — c'est là que MoneyFusion redirige après paiement
    // On extrait les paramètres directement sans charger la page HTML
    if (url.includes('/api/payments/mobile-callback') || url.includes('mobile-callback')) {
      logger.log('Callback backend intercepté dans WebView:', url);

      try {
        const queryStart = url.indexOf('?');
        const queryString = queryStart >= 0 ? url.slice(queryStart + 1) : '';
        const params = new URLSearchParams(queryString);

        const returnDonationId = params.get('donationId') || donationId;
        const statut = params.get('statut') || params.get('status') || '';
        const returnStatus =
          statut === 'paid' ? 'completed' :
          statut === 'failed' ? 'failed' :
          statut === 'cancelled' ? 'cancelled' :
          'pending';

        navigation.replace('PaymentVerification', {
          donationId: returnDonationId,
          paymentId: paymentId,
          transactionId: params.get('token') || params.get('transactionId') || transactionId,
          status: returnStatus,
        });
      } catch (error) {
        logger.error('Erreur parsing callback URL:', error);
        navigation.replace('PaymentVerification', {
          donationId,
          paymentId,
          transactionId,
          status: 'pending',
        });
      }

      return false; // Ne pas charger la page HTML du backend
    }

    // Bloquer aussi les deep links directs (sécurité)
    if (
      url.startsWith('exp://') ||
      url.startsWith('partenaireMagb://') ||
      url.startsWith('com.ericsou.PartenaireMAGB://')
    ) {
      logger.log('Deep link intercepté dans WebView:', url);

      try {
        const normalized = url.replace('/--/', '/');
        const queryStart = normalized.indexOf('?');
        const queryString = queryStart >= 0 ? normalized.slice(queryStart + 1) : '';
        const params = new URLSearchParams(queryString);

        navigation.replace('PaymentVerification', {
          donationId: params.get('donationId') || donationId,
          paymentId: paymentId,
          transactionId: params.get('transactionId') || transactionId,
          status: params.get('status') || 'pending',
        });
      } catch {
        navigation.replace('PaymentVerification', {
          donationId,
          paymentId,
          transactionId,
          status: 'pending',
        });
      }

      return false;
    }

    return true;
  }, [donationId, paymentId, transactionId, navigation]);

  const handleCancel = () => {
    Alert.alert(
      'Annuler le paiement',
      'Voulez-vous vraiment annuler ce paiement ?',
      [
        { text: 'Continuer le paiement', style: 'cancel' },
        {
          text: 'Annuler',
          style: 'destructive',
          onPress: () => navigation.replace('PaymentVerification', {
            donationId,
            paymentId,
            transactionId,
            status: 'cancelled',
          }),
        },
      ]
    );
  };


  return (
    <View style={[styles.flex, { backgroundColor: c.background }]}>
      {/* Barre sécurisée */}
      <View style={[styles.bar, { paddingTop: insets.top + spacing.xs, backgroundColor: gradient[0] }]}>
        <IconButton
          icon={canGoBack ? 'chevron-back' : 'close'}
          tone="hero"
          accessibilityLabel={canGoBack ? 'Page précédente' : 'Annuler le paiement'}
          onPress={canGoBack ? () => webViewRef.current?.goBack() : handleCancel}
        />
        <View style={styles.center}>
          <View style={styles.secure}>
            <Ionicons name="lock-closed" size={12} color={c.gold} />
            <AppText variant="caption" color={c.heroTextMuted}>Paiement sécurisé</AppText>
          </View>
          <AppText variant="bodyStrong" color={c.heroText} numberOfLines={1}>{pageTitle}</AppText>
        </View>
        {amount && currency ? (
          <View style={[styles.amount, { backgroundColor: c.heroChip }]}>
            <AppText variant="smallStrong" color={c.heroText}>{formatAmount(amount, currency)}</AppText>
          </View>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        style={styles.flex}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          logger.error('WebView error:', nativeEvent.description);
          Alert.alert(
            'Erreur de chargement',
            'Impossible de charger la page de paiement. Vérifiez votre connexion.',
            [
              { text: 'Réessayer', onPress: () => webViewRef.current?.reload() },
              { text: 'Annuler', onPress: handleCancel },
            ]
          );
        }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // User agent mobile pour MoneyFusion
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
      />

      {isLoading ? (
        <View style={[styles.loading, { backgroundColor: c.background }]} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={c.primary} />
          <AppText variant="small" color={c.mutedForeground}>Chargement de la page de paiement…</AppText>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  center: { flex: 1, alignItems: 'center' },
  secure: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amount: { borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 4 },
  loading: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 120, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
});

export default PaymentWebViewScreen;
