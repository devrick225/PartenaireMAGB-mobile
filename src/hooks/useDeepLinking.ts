import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import logger from '../utils/logger';

interface DeepLinkData {
  url: string;
  type: 'payment' | 'donation' | 'other';
  params: { [key: string]: string };
}

interface PaymentDeepLinkData {
  transactionId: string;
  status: 'success' | 'failed' | 'cancelled' | 'completed';
  donationId?: string;
  paymentId?: string;
}

export const useDeepLinking = (navigation?: any) => {
  const [lastDeepLink, setLastDeepLink] = useState<DeepLinkData | null>(null);

  useEffect(() => {
    // Vérifier s'il y a un lien au démarrage de l'app
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Écouter les nouveaux liens
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription?.remove();
    };
  }, [navigation]);

  const handleDeepLink = (url: string) => {
    logger.info('Deep link received:', url);
    
    try {
      const parsedUrl = new URL(url);
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      
      let type: 'payment' | 'donation' | 'other' = 'other';
      const params: { [key: string]: string } = {};

      // Extraire les paramètres de l'URL
      parsedUrl.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // Déterminer le type de lien
      if (pathSegments.includes('payment')) {
        type = 'payment';
      } else if (pathSegments.includes('donation')) {
        type = 'donation';
      }

      const deepLinkData: DeepLinkData = {
        url,
        type,
        params,
      };

      setLastDeepLink(deepLinkData);
      logger.debug('Parsed deep link:', deepLinkData);
      
      // Navigation automatique si navigation est disponible
      if (navigation && deepLinkData.type === 'payment') {
        const paymentData = parsePaymentDeepLink(deepLinkData);
        if (paymentData) {
          logger.payment('Navigation vers PaymentVerification avec:', paymentData);
          navigation.navigate('PaymentVerification', {
            transactionId: paymentData.transactionId,
            donationId: paymentData.donationId,
            paymentId: paymentData.paymentId,
            status: paymentData.status,
          });
        }
      }
      
    } catch (error) {
      logger.error('Error parsing deep link:', error);
      
      // Fallback pour les liens mal formés
      setLastDeepLink({
        url,
        type: 'other',
        params: {},
      });
    }
  };

  const parsePaymentDeepLink = (deepLink: DeepLinkData): PaymentDeepLinkData | null => {
    if (deepLink.type !== 'payment') return null;

    const { params } = deepLink;
    
    // Validation des statuts possibles
    const VALID_STATUSES = ['success', 'failed', 'cancelled', 'completed'] as const;
    
    if (!params.transactionId || !params.status) {
      logger.warn('Missing required payment deep link parameters:', params);
      return null;
    }
    
    const status = params.status as PaymentDeepLinkData['status'];
    
    if (!VALID_STATUSES.includes(status)) {
      logger.warn('Invalid payment status:', status, '- Valid statuses:', VALID_STATUSES);
      return null;
    }

    return {
      transactionId: params.transactionId,
      status,
      donationId: params.donationId,
      paymentId: params.paymentId,
    };
  };

  const clearLastDeepLink = () => {
    setLastDeepLink(null);
  };

  const generatePaymentReturnUrl = (transactionId: string, donationId: string) => {
    return `partenaireMagb://payment/return?transactionId=${transactionId}&donationId=${donationId}`;
  };

  return {
    lastDeepLink,
    parsePaymentDeepLink,
    clearLastDeepLink,
    generatePaymentReturnUrl,
  };
};

export default useDeepLinking; 