import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
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
  const { colors, dark } = useTheme();
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

  const verifyPayment = useCallback(async () => {
    const params = getPaymentParams();
    
    if (!params) {
      Alert.alert('Erreur', 'Paramètres de paiement manquants');
      return;
    }

    setIsLoading(true);
    
    try {
      let response;
      
      if (params.donationId) {
        response = await donationService.getDonationById(params.donationId);
      
        if (response.data.success) {
          const donation = response.data.data.donation;

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
                          
                          setVerificationResult({
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
                    
                    setVerificationResult({
                      success: isSuccess,
                      message,
                      details: {
                        amount: payment.amount,
                        currency: payment.currency,
                        status: payment.status,
                        transactionId: payment.transaction?.externalId || payment.transactionId,
                        provider: payment.provider,
                        paymentUrl: payment.moneyfusion?.paymentUrl || payment.fusionpay?.paymentUrl || null,
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
                            
                            setVerificationResult({
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
                      
                      setVerificationResult({
                        success: isSuccess,
                        message,
                        details: {
                          amount: payment.amount,
                          currency: payment.currency,
                          status: payment.status,
                          transactionId: payment.transaction?.externalId || payment.transactionId,
                          provider: payment.provider,
                          paymentUrl: payment.moneyfusion?.paymentUrl || payment.fusionpay?.paymentUrl || null,
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
                  setVerificationResult({
                    success: false,
                    message: `Aucun paiement trouvé pour cette donation après ${maxRetries} tentatives.\n\nLes webhooks de paiement peuvent prendre jusqu'à quelques minutes pour se traiter.`,
                  });
                  return false;
                }
                
              } catch (attemptError: any) {
                console.log(`❌ Erreur tentative ${attempt}:`, attemptError);
                if (attempt === maxRetries) {
            setVerificationResult({
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
          setVerificationResult({
            success: false,
            message: 'Donation non trouvée',
          });
        }
      } else {
        // Vérification globale des paiements
        response = await donationService.verifyAllPayments();
        
        if (response.data.success) {
          const stats = response.data.data;
          setVerificationResult({
            success: true,
            message: `Vérification terminée: ${stats.completed} paiements complétés`,
            details: stats,
          });
        } else {
          setVerificationResult({
            success: false,
            message: response.data.errors || 'Échec de la vérification',
          });
        }
      }
    } catch (error: any) {
      setVerificationResult({
        success: false,
        message: error.response?.data?.error || 'Erreur lors de la vérification',
      });
    } finally {
      setIsLoading(false);
    }
  }, [getPaymentParams, lastDeepLink, clearLastDeepLink]);

  useEffect(() => {
    verifyPayment();
    if (lastDeepLink) {
      clearLastDeepLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = useCallback(() => {
    setVerificationResult(null);
    verifyPayment();
  }, [verifyPayment]);

  const handleViewDonation = () => {
    const params = getPaymentParams();
    if (params?.donationId) {
      navigation.navigate('DonationDetail', { donationId: params.donationId });
    }
  };

  const getStatusIcon = () => {
    if (!verificationResult) return null;
    
    const status = verificationResult.details?.status;
    
    if (verificationResult.success) {
      return (
        <View style={[styles.statusIcon, { backgroundColor: COLORS.success }]}>
          <MaterialIcons name="check" size={32} color={COLORS.white} />
        </View>
      );
    } else if (['processing', 'pending', 'initialized'].includes(status)) {
      return (
        <View style={[styles.statusIcon, { backgroundColor: COLORS.warning || '#FF9800' }]}>
          <MaterialIcons name="hourglass-empty" size={32} color={COLORS.white} />
        </View>
      );
    } else {
      return (
        <View style={[styles.statusIcon, { backgroundColor: COLORS.error }]}>
          <MaterialIcons name="error" size={32} color={COLORS.white} />
        </View>
      );
    }
  };

  const getStatusColor = () => {
    if (!verificationResult) return COLORS.gray;
    
    const status = verificationResult.details?.status;
    
    if (verificationResult.success) {
      return COLORS.success;
    } else if (['processing', 'pending', 'initialized'].includes(status)) {
      return COLORS.warning || '#FF9800';
    } else {
      return COLORS.error;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
        >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            Vérification du Paiement
        </Text>
        </View>

        {/* Contenu principal */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Vérification en cours...
            </Text>
            </View>
          ) : verificationResult ? (
            <View style={styles.resultContainer}>
              {/* Icône de statut */}
              {getStatusIcon()}
              
              {/* Message de résultat */}
              <Text style={[
                styles.resultMessage, 
                { color: getStatusColor() }
              ]}>
                {verificationResult.message}
              </Text>

              {/* Détails du paiement */}
              {verificationResult.details && (
                <View style={[styles.detailsContainer, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
                  <Text style={[styles.detailsTitle, { color: colors.text }]}>
                    Détails du Paiement
                  </Text>
                  
                  {verificationResult.details.amount != null && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                        Montant:
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {verificationResult.details.amount} {verificationResult.details.currency || 'XOF'}
                  </Text>
                </View>
              )}
              
                  {verificationResult.details.status && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                        Statut:
                  </Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {(() => {
                          switch (verificationResult.details.status) {
                            case 'paid': return 'Payé';
                            case 'pending': return 'En attente';
                            case 'failed': return 'Échoué';
                            case 'processing': return 'En cours';
                            case 'completed': return 'Complété';
                            case 'cancelled': return 'Annulé';
                            case 'expired': return 'Expiré';
                            case 'initialized': return 'Initialisé';
                            default: return verificationResult.details.status;
                          }
                        })()}
                  </Text>
                </View>
              )}

                  {verificationResult.details.transactionId && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                        Transaction ID:
                  </Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {verificationResult.details.transactionId}
                  </Text>
                </View>
              )}

              {verificationResult.details.fees != null && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    Frais MoneyFusion:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {verificationResult.details.fees} F CFA
                  </Text>
                </View>
              )}

              {verificationResult.details.customerName && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    Client:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {verificationResult.details.customerName}
                  </Text>
                </View>
              )}

              {verificationResult.details.customerPhone && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    Téléphone:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {verificationResult.details.customerPhone}
                  </Text>
                </View>
              )}
                </View>
              )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
                {/* Bouton Continuer le paiement désactivé */}

                

                {/* Masquer "Vérifier à nouveau" si le paiement est payé */}
                {verificationResult?.details?.status !== 'paid' && (
                <TouchableOpacity
                  onPress={handleRetry}
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                >
                  <MaterialIcons name="refresh" size={20} color={COLORS.white} />
                  <Text style={[styles.actionButtonText, { color: COLORS.white }]}>
                    Vérifier à nouveau
                  </Text>
                </TouchableOpacity>
                )}

                {getPaymentParams()?.donationId && (
                               <TouchableOpacity
                    onPress={handleViewDonation}
                    style={[styles.actionButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale300 }]}
               >
                    <MaterialIcons name="receipt" size={20} color={colors.text} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>
                      Voir le don
                 </Text>
               </TouchableOpacity>
              )}
              </View>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color={COLORS.error} />
              <Text style={[styles.errorText, { color: colors.text }]}>
                Impossible de récupérer les informations de paiement
            </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resultMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  detailsContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default PaymentVerificationScreen; 