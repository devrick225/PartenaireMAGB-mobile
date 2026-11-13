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
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import logger from '../utils/logger';

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
  const { colors, dark } = useTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          onPress={canGoBack ? () => webViewRef.current?.goBack() : handleCancel}
          style={styles.headerBtn}
        >
          <MaterialIcons
            name={canGoBack ? 'arrow-back' : 'close'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <MaterialIcons name="lock" size={14} color="rgba(255,255,255,0.8)" />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {pageTitle}
          </Text>
        </View>

        {amount && currency && (
          <View style={styles.headerAmount}>
            <Text style={styles.headerAmountText}>
              {amount.toLocaleString()} {currency}
            </Text>
          </View>
        )}
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(syntheticEvent) => {
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
        // Sécurité
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        // Permettre les redirections
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // User agent mobile pour MoneyFusion
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
      />

      {/* Indicateur de chargement */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement du paiement...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  headerAmount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerAmountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
});

export default PaymentWebViewScreen;
