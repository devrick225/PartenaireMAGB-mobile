import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useDS,
  AppText,
  Screen,
  HeroHeader,
  Card,
  InfoRow,
  Button,
  LoadingState,
  StatusBadge,
  formatAmount,
  IconName,
} from '../design/components';
import { spacing } from '../design/tokens';
import { useDeepLinking } from '../hooks/useDeepLinking';
import donationService from '../store/services/donationService';
import paymentService from '../store/services/paymentService';

interface PaymentVerificationScreenProps {
  navigation: any;
  route?: any;
}

// Fonction centralisée — évite la duplication 3× dans le fichier
const getStatusInFrench = (status: string): string => {
  const map: Record<string, string> = {
    paid: 'Payé',
    pending: 'En attente',
    failed: 'Échoué',
    processing: 'En cours',
    completed: 'Complété',
    cancelled: 'Annulé',
    expired: 'Expiré',
    initialized: 'Initialisé',
  };
  return map[status] ?? status;
};

const PaymentVerificationScreen: React.FC<PaymentVerificationScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { c } = useDS();
  const { lastDeepLink, parsePaymentDeepLink, clearLastDeepLink } = useDeepLinking();
  
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const getPaymentParams = useCallback(() => {
    if (route?.params) {
      return {
        transactionId: route.params.transactionId,
        donationId: route.params.donationId,
        paymentId: route.params.paymentId,
        status: route.params.status,
      };
    }
    if (lastDeepLink) {
      return parsePaymentDeepLink(lastDeepLink);
    }
    return null;
  }, [route?.params, lastDeepLink, parsePaymentDeepLink]);

  // La vérification retry peut prendre jusqu'à ~9s ; si l'utilisateur quitte
  // l'écran avant la fin, on évite un setState sur un composant démonté.
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const setVerificationResultSafe = useCallback((result: typeof verificationResult) => {
    if (isMountedRef.current) setVerificationResult(result);
  }, []);
  const setIsLoadingSafe = useCallback((loading: boolean) => {
    if (isMountedRef.current) setIsLoading(loading);
  }, []);

  const verifyingRef = useRef(false);
  const verifyPayment = useCallback(async () => {
    // Retour d'app + lien de retour peuvent arriver en même temps : une seule vérification à la fois
    if (verifyingRef.current) return;
    const params = getPaymentParams();
    
    if (!params) {
      Alert.alert('Erreur', 'Paramètres de paiement manquants');
      return;
    }

    verifyingRef.current = true;
    setIsLoadingSafe(true);

    try {
      let response;
      
      if (params.donationId) {
        response = await donationService.getDonationById(params.donationId);
      
        if (response.data.success) {
          const donation = response.data.data.donation;

          // Si la donation est déjà complétée, afficher le résultat directement
          // sans chercher de paiement (cas où le webhook a traité sans créer de Payment)
          if (donation.status === 'completed') {
            setVerificationResultSafe({
              success: true,
              message: '✅ Don confirmé avec succès',
              details: {
                amount: donation.amount,
                currency: donation.currency,
                status: 'completed',
                transactionId: donation.receipt?.number,
                provider: donation.paymentMethod,
              },
            });
            return;
          }

          // Retry progressif pour laisser le temps aux webhooks (1s, 3s, 5s)
          const verifyWithRetry = async (maxRetries = 3) => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              if (attempt > 1) {
                const delay = attempt * 2000 - 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
              }
              
              try {
                const allPaymentsResponse = await paymentService.getAllPaymentsByDonationId(donation._id);
                
                if (allPaymentsResponse.data.success && allPaymentsResponse.data.data.payments) {
                  const allPayments = allPaymentsResponse.data.data.payments;
                  
                  if (allPayments.length > 0) {
                    const payment = allPayments.sort((a: any, b: any) => 
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )[0];

                    // MoneyFusion : vérifier le statut directement via l'API
                    if (payment.provider === 'moneyfusion' && payment.moneyfusion?.token) {
                      try {
                        const verifyResponse = await paymentService.verifyPayment(payment._id);
                        
                        if (verifyResponse.data.statut !== undefined) {
                          const moneyFusionData = verifyResponse.data.data;
                          const realStatus = moneyFusionData?.statut;
                          const isSuccess = realStatus === 'paid';
                          const isProcessing = realStatus === 'pending';
                          
                          let message = '';
                          if (isSuccess) {
                            message = `✅ Paiement confirmé par MoneyFusion${attempt > 1 ? ` (tentative ${attempt})` : ''}`;
                          } else if (isProcessing) {
                            message = `⏳ Paiement en attente chez MoneyFusion\n\nStatut: ${getStatusInFrench(realStatus)}`;
                          } else {
                            message = `❌ Paiement échoué chez MoneyFusion\n\nStatut: ${getStatusInFrench(realStatus)}`;
                          }
                          
                          setVerificationResultSafe({
                            success: isSuccess,
                            message,
                            details: {
                              amount: moneyFusionData?.Montant || payment.amount,
                              currency: payment.currency,
                              status: realStatus || payment.status,
                              transactionId: moneyFusionData?.numeroTransaction || payment.transaction?.externalId,
                              provider: payment.provider,
                              paymentUrl: payment.moneyfusion?.paymentUrl,
                              fees: moneyFusionData?.frais,
                              customerName: moneyFusionData?.nomclient,
                              customerPhone: moneyFusionData?.numeroSend,
                            },
                          });
                          return true;
                        }
                      } catch {
                        // Continuer avec le statut local en cas d'erreur MoneyFusion
                      }
                    }
                    
                    // Autres fournisseurs (GeniusPay, PayDunya…) : tant que le paiement n'est pas
                    // finalisé localement, demander au backend de le vérifier auprès du fournisseur
                    // au lieu d'attendre uniquement le webhook.
                    if (
                      payment.provider !== 'moneyfusion' &&
                      ['processing', 'pending', 'initialized'].includes(payment.status)
                    ) {
                      try {
                        const verifyResponse = await paymentService.verifyPayment(payment._id);
                        const backendStatus = verifyResponse.data?.data?.status;
                        if (backendStatus) {
                          payment.status = backendStatus;
                        }
                      } catch {
                        // Garder le statut local si la vérification échoue
                      }
                    }

                    // Fallback : statut local (autres providers ou erreur MoneyFusion)
                    const isSuccess = ['completed', 'paid'].includes(payment.status);
                    const isProcessing = ['processing', 'pending', 'initialized'].includes(payment.status);
                    
                    let message = '';
                    if (isSuccess) {
                      message = `✅ Paiement confirmé avec succès${attempt > 1 ? ` (tentative ${attempt})` : ''}`;
                    } else if (isProcessing) {
                      message = `⏳ Paiement en cours de traitement\n\nStatut: ${getStatusInFrench(payment.status)}`;
                    } else {
                      message = `❌ Paiement échoué\n\nStatut: ${getStatusInFrench(payment.status)}`;
                    }
                    
                    setVerificationResultSafe({
                      success: isSuccess,
                      message,
                      details: {
                        amount: payment.amount,
                        currency: payment.currency,
                        status: payment.status,
                        transactionId: payment.transaction?.externalId || payment.transactionId,
                        provider: payment.provider,
                        paymentUrl: payment.moneyfusion?.paymentUrl || payment.fusionpay?.paymentUrl || payment.geniuspay?.paymentUrl || null,
                      },
                    });
                    return true;
                  }
                } else {
                  // Fallback vers getPaymentByDonationId
                  try {
                    const paymentResponse = await paymentService.getPaymentByDonationId(donation._id);
                    if (paymentResponse.data.success && paymentResponse.data.data.payment) {
                      const payment = paymentResponse.data.data.payment;
                      
                      if (payment.provider === 'moneyfusion' && payment.moneyfusion?.token) {
                        try {
                          const verifyResponse = await paymentService.verifyPayment(payment._id);
                          
                          if (verifyResponse.data.statut !== undefined) {
                            const moneyFusionData = verifyResponse.data.data;
                            const realStatus = moneyFusionData?.statut;
                            const isSuccess = realStatus === 'paid';
                            const isProcessing = realStatus === 'pending';
                            
                            let message = '';
                            if (isSuccess) {
                              message = `✅ Paiement confirmé par MoneyFusion${attempt > 1 ? ` (tentative ${attempt})` : ''}`;
                            } else if (isProcessing) {
                              message = `⏳ Paiement en attente chez MoneyFusion\n\nStatut: ${getStatusInFrench(realStatus)}`;
                            } else {
                              message = `❌ Paiement échoué chez MoneyFusion\n\nStatut: ${getStatusInFrench(realStatus)}`;
                            }
                            
                            setVerificationResultSafe({
                              success: isSuccess,
                              message,
                              details: {
                                amount: moneyFusionData?.Montant || payment.amount,
                                currency: payment.currency,
                                status: realStatus || payment.status,
                                transactionId: moneyFusionData?.numeroTransaction || payment.transaction?.externalId,
                                provider: payment.provider,
                                paymentUrl: payment.moneyfusion?.paymentUrl,
                                fees: moneyFusionData?.frais,
                                customerName: moneyFusionData?.nomclient,
                                customerPhone: moneyFusionData?.numeroSend,
                              },
                            });
                            return true;
                          }
                        } catch {
                          // Continuer avec le statut local
                        }
                      }
                      
                      const isSuccess = ['completed', 'paid'].includes(payment.status);
                      const isProcessing = ['processing', 'pending', 'initialized'].includes(payment.status);
                      
                      let message = '';
                      if (isSuccess) {
                        message = `✅ Paiement confirmé avec succès${attempt > 1 ? ` (tentative ${attempt})` : ''}`;
                      } else if (isProcessing) {
                        message = `⏳ Paiement en cours de traitement\n\nStatut: ${getStatusInFrench(payment.status)}`;
                      } else {
                        message = `❌ Paiement échoué\n\nStatut: ${getStatusInFrench(payment.status)}`;
                      }
                      
                      setVerificationResultSafe({
                        success: isSuccess,
                        message,
                        details: {
                          amount: payment.amount,
                          currency: payment.currency,
                          status: payment.status,
                          transactionId: payment.transaction?.externalId || payment.transactionId,
                          provider: payment.provider,
                          paymentUrl: payment.moneyfusion?.paymentUrl || payment.fusionpay?.paymentUrl || payment.geniuspay?.paymentUrl || null,
                        },
                      });
                      return true; // Succès
                    }
                  } catch (fallbackError) {
                    console.log(`❌ Fallback échoué (tentative ${attempt}):`, fallbackError);
                  }
                }
                
                console.log(`❌ Tentative ${attempt}: Aucun paiement trouvé`);
                
                if (attempt === maxRetries) {
                  // Dernière tentative échouée
                  setVerificationResultSafe({
                    success: false,
                    message: `Aucun paiement trouvé pour cette donation après ${maxRetries} tentatives.\n\nLes webhooks de paiement peuvent prendre jusqu'à quelques minutes pour se traiter.`,
                  });
                  return false;
                }
                
              } catch (attemptError: any) {
                console.log(`❌ Erreur tentative ${attempt}:`, attemptError);
                if (attempt === maxRetries) {
            setVerificationResultSafe({
              success: false,
              message: 'Aucun paiement trouvé pour cette donation',
            });
                  return false;
                }
              }
          }
            return false;
          };
          
          await verifyWithRetry();
        } else {
          setVerificationResultSafe({
            success: false,
            message: 'Donation non trouvée',
          });
        }
      } else if (params.paymentId) {
        // Pas de don dans le lien de retour : vérifier directement le paiement
        const verifyResponse = await paymentService.verifyPayment(params.paymentId);
        const realStatus = verifyResponse.data?.data?.statut || verifyResponse.data?.data?.status;
        const isSuccess = ['paid', 'completed'].includes(realStatus);
        setVerificationResultSafe({
          success: isSuccess,
          message: isSuccess
            ? '✅ Paiement confirmé'
            : ['pending', 'processing', 'initialized'].includes(realStatus)
              ? '⏳ Paiement en cours de traitement'
              : '❌ Paiement non abouti',
          details: { status: realStatus },
        });
      } else {
        // Avant : vérification globale réservée aux admins (refusée pour un fidèle)
        setVerificationResultSafe({
          success: false,
          message: 'Impossible d\'identifier ce paiement. Retrouvez son statut dans « Mes dons ».',
        });
      }
    } catch (error: any) {
      // Network Error = backend en veille ou problème réseau — ne pas afficher comme un échec de paiement
      const isNetworkError = !error.response && (
        error.message === 'Network Error' ||
        error.message?.includes('network') ||
        error.code === 'ECONNABORTED'
      );

      setVerificationResultSafe({
        success: false,
        message: isNetworkError
          ? '⚠️ Impossible de contacter le serveur.\n\nLe serveur est peut-être en train de démarrer (jusqu\'à 60s). Appuyez sur « Vérifier à nouveau ».'
          : (error?.appError?.message || error.response?.data?.error || 'Erreur lors de la vérification'),
      });
    } finally {
      setIsLoadingSafe(false);
      verifyingRef.current = false;
    }
  }, [getPaymentParams, lastDeepLink, clearLastDeepLink]);

  // Vérifier à l'ouverture ET à chaque nouveau lien de retour : l'écran est affiché dès
  // l'ouverture de MoneyFusion, puis le retour de paiement renvoie ici avec de nouveaux paramètres.
  const paramsKey = `${route?.params?.donationId || ''}|${route?.params?.paymentId || ''}|${route?.params?.transactionId || ''}|${route?.params?.status || ''}`;
  useEffect(() => {
    verifyPayment();
    if (lastDeepLink) {
      clearLastDeepLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  // Revérifier quand l'utilisateur revient dans l'app (ex: retour manuel depuis le navigateur)
  const lastResultRef = useRef(verificationResult);
  lastResultRef.current = verificationResult;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !lastResultRef.current?.success) {
        verifyPayment();
      }
    });
    return () => sub.remove();
  }, [verifyPayment]);

  const handleRetry = useCallback(() => {
    setVerificationResultSafe(null);
    verifyPayment();
  }, [verifyPayment]);

  const handleViewDonation = () => {
    const params = getPaymentParams();
    if (params?.donationId) {
      navigation.navigate('DonationDetail', { donationId: params.donationId });
    }
  };


  // Présentation du résultat : succès, en attente ou échec
  const pendingStatuses = ['processing', 'pending', 'initialized'];
  const resultStatus = verificationResult?.details?.status;
  const tone: 'success' | 'warning' | 'danger' = verificationResult?.success
    ? 'success'
    : pendingStatuses.includes(resultStatus)
      ? 'warning'
      : 'danger';
  const toneColor = tone === 'success' ? c.success : tone === 'warning' ? c.warning : c.destructive;
  const toneSoft = tone === 'success' ? c.successSoft : tone === 'warning' ? c.warningSoft : c.destructiveSoft;
  const toneIcon: IconName = tone === 'success' ? 'checkmark' : tone === 'warning' ? 'hourglass-outline' : 'close';
  const toneTitle = tone === 'success' ? 'Paiement confirmé' : tone === 'warning' ? 'Paiement en attente' : 'Paiement non abouti';
  const isPaid = verificationResult?.success || resultStatus === 'paid' || resultStatus === 'completed';
  const details = verificationResult?.details;
  const donationId = getPaymentParams()?.donationId;

  const detailRows: { label: string; value: React.ReactNode }[] = [];
  if (details) {
    if (details.amount != null) detailRows.push({ label: 'Montant', value: formatAmount(details.amount, details.currency || 'XOF') });
    if (details.status) detailRows.push({ label: 'Statut', value: <StatusBadge status={details.status} /> });
    if (details.provider) detailRows.push({ label: 'Moyen de paiement', value: paymentService.formatProvider(details.provider) });
    if (details.transactionId) detailRows.push({ label: 'Référence', value: String(details.transactionId) });
    if (details.fees != null) detailRows.push({ label: 'Frais', value: formatAmount(details.fees, 'XOF') });
    if (details.customerName) detailRows.push({ label: 'Donateur', value: details.customerName });
    if (details.customerPhone) detailRows.push({ label: 'Téléphone', value: details.customerPhone });
  }

  return (
    <Screen
      hero={
        <HeroHeader
          eyebrow="Paiement"
          eyebrowIcon="shield-checkmark-outline"
          title="Vérification du paiement"
          subtitle="Nous confirmons votre paiement auprès du prestataire."
          onBack={() => navigation.goBack()}
        />
      }
      footer={
        !isLoading && verificationResult ? (
          <View style={styles.footer}>
            {!isPaid && <Button title="Vérifier à nouveau" icon="refresh" onPress={handleRetry} />}
            {donationId ? (
              <Button title="Voir le don" icon="receipt-outline" variant={isPaid ? 'primary' : 'outline'} onPress={handleViewDonation} />
            ) : null}
            {isPaid ? (
              <Button title="Retour à l'accueil" variant="ghost" onPress={() => navigation.navigate('Dashboard')} />
            ) : null}
          </View>
        ) : undefined
      }
    >
      {isLoading ? (
        <Card>
          <LoadingState message="Vérification en cours… Cela peut prendre quelques secondes." />
        </Card>
      ) : verificationResult ? (
        <>
          <Card style={styles.result}>
            <View style={[styles.resultIcon, { backgroundColor: toneSoft }]} accessibilityElementsHidden>
              <View style={[styles.resultIconInner, { backgroundColor: toneColor }]}>
                <Ionicons name={toneIcon} size={30} color="#FFFFFF" />
              </View>
            </View>
            <AppText variant="title" center accessibilityRole="header">
              {toneTitle}
            </AppText>
            <AppText variant="body" color={c.mutedForeground} center accessibilityLiveRegion="polite">
              {/* L'icône et le titre portent déjà le statut : retirer l'émoji en tête du message */}
              {verificationResult.message.replace(/^(?:✅|⏳|❌|⚠️|⚠)\s*/u, '')}
            </AppText>
          </Card>

          {detailRows.length > 0 && (
            <Card>
              <AppText variant="overline" color={c.mutedForeground} style={{ marginBottom: spacing.xs }}>
                Détails du paiement
              </AppText>
              {detailRows.map((r, i) => (
                <InfoRow key={r.label} label={r.label} value={r.value} last={i === detailRows.length - 1} />
              ))}
            </Card>
          )}

          {tone === 'warning' ? (
            <Card style={styles.notice}>
              <Ionicons name="information-circle-outline" size={20} color={c.primary} />
              <AppText variant="small" color={c.mutedForeground} style={styles.flex}>
                La confirmation du prestataire peut prendre quelques minutes. Votre don sera mis à jour automatiquement.
              </AppText>
            </Card>
          ) : null}
        </>
      ) : (
        <Card>
          <View style={styles.result}>
            <Ionicons name="alert-circle-outline" size={44} color={c.destructive} />
            <AppText variant="body" center>
              Impossible de récupérer les informations de paiement.
            </AppText>
            <Button title="Réessayer" icon="refresh" variant="outline" onPress={handleRetry} />
          </View>
        </Card>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { gap: spacing.sm },
  result: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  resultIcon: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  resultIconInner: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
});

export default PaymentVerificationScreen;
