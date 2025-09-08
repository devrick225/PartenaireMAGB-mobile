import { useEffect, useState } from 'react';
import { Linking } from 'react-native';

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
    console.log('Deep link received:', url);
    
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
      console.log('Parsed deep link:', deepLinkData);
      
      // Navigation automatique si navigation est disponible
      if (navigation && deepLinkData.type === 'payment') {
        const paymentData = parsePaymentDeepLink(deepLinkData);
        if (paymentData) {
          navigation.navigate('PaymentVerification', {
            transactionId: paymentData.transactionId,
            donationId: paymentData.donationId,
            paymentId: paymentData.paymentId,
            status: paymentData.status,
          });
        }
      }
      
    } catch (error) {
      console.error('Error parsing deep link:', error);
      
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
    
    if (!params.transactionId || !params.status) {
      console.warn('Missing required payment deep link parameters');
      return null;
    }

    return {
      transactionId: params.transactionId,
      status: params.status as PaymentDeepLinkData['status'],
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