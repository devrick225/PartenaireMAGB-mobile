import React, { useEffect, useState } from 'react';
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

  // Récupérer les paramètres depuis la route ou le deep link
  const getPaymentParams = () => {
    // Priorité aux paramètres de route (navigation directe)
    if (route?.params) {
      return {
        transactionId: route.params.transactionId,
        donationId: route.params.donationId,
        paymentId: route.params.paymentId,
        status: route.params.status,
      };
    }

    // Fallback sur le deep link
    if (lastDeepLink) {
      const paymentData = parsePaymentDeepLink(lastDeepLink);
      return paymentData;
    }

    return null;
  };

  const verifyPayment = async () => {
    const params = getPaymentParams();
    
    if (!params) {
      Alert.alert('Erreur', 'Paramètres de paiement manquants');
      return;
    }

    setIsLoading(true);
    
    try {
      let response;
      
      if (params.donationId) {
        // Récupérer les détails de la donation
        response = await donationService.getDonationById(params.donationId);
        console.log('Donation response:', response.data.data);
      
        if (response.data.success) {
          const donation = response.data.data.donation;
          console.log('donation', donation);
          
          // Récupérer le paiement avec système de retry pour laisser le temps aux webhooks
          const verifyWithRetry = async (maxRetries = 3) => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              console.log(`🔄 Tentative de récupération du paiement ${attempt}/${maxRetries}`);
              
              // Délai progressif : 1s, 3s, 5s
              if (attempt > 1) {
                const delay = attempt * 2000 - 1000;
                console.log(`⏳ Attente de ${delay/1000}s pour laisser le temps aux webhooks...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
              
              try {
                // Essayer d'abord getAllPaymentsByDonationId pour une recherche plus complète
                const allPaymentsResponse = await paymentService.getAllPaymentsByDonationId(donation._id);
                console.log(`Tentative ${attempt} - Payment response:`, allPaymentsResponse.data);
                
                if (allPaymentsResponse.data.success && allPaymentsResponse.data.data.payments) {
                  const allPayments = allPaymentsResponse.data.data.payments;
                  console.log(`📋 Tentative ${attempt}: ${allPayments.length} paiement(s) trouvé(s)`);
                  
                  if (allPayments.length > 0) {
                    // Prendre le paiement le plus récent
                    const payment = allPayments.sort((a: any, b: any) => 
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )[0];

                    
                    console.log(`✅ Payment trouvé (tentative ${attempt}):`, payment);

                    // Si c'est MoneyFusion, vérifier le statut directement avec l'API selon la documentation
                    if (payment.provider === 'moneyfusion' && payment.moneyfusion?.token) {
                      console.log(`🔍 Vérification MoneyFusion directe avec token: ${payment.moneyfusion.token}`);
                      try {
                        const verifyResponse = await paymentService.verifyPayment(payment._id);
                        console.log('Réponse vérification MoneyFusion:', verifyResponse.data);
                        
                        // Selon la doc MoneyFusion, la structure de réponse contient statut/message/data
                        if (verifyResponse.data.statut !== undefined) {
                          const moneyFusionData = verifyResponse.data.data;
                          const realStatus = moneyFusionData?.statut; // "pending", "paid", ou "failed"
                          
                          console.log(`✅ Statut MoneyFusion réel: ${realStatus}`);
                          
                          // Utiliser les statuts MoneyFusion officiels selon la documentation
                          const isSuccess = realStatus === 'paid';
                          const isProcessing = realStatus === 'pending';
                          const isFailed = realStatus === 'failed';
                          
                          // Convertir le statut en français
                          const getStatusInFrench = (status: string) => {
                            switch (status) {
                              case 'paid': return 'Payé';
                              case 'pending': return 'En attente';
                              case 'failed': return 'Échoué';
                              case 'processing': return 'En cours';
                              case 'completed': return 'Complété';
                              case 'cancelled': return 'Annulé';
                              case 'expired': return 'Expiré';
                              case 'initialized': return 'Initialisé';
                              default: return status;
                            }
                          };
                          
                          let message = '';
                          if (isSuccess) {
                            message = `✅ Paiement confirmé par MoneyFusion${attempt > 1 ? ` (vérifié à la tentative ${attempt})` : ''}`;
                          } else if (isProcessing) {
                            message = `⏳ Paiement en attente chez MoneyFusion${attempt > 1 ? ` (vérifié à la tentative ${attempt})` : ''}\n\nStatut: ${getStatusInFrench(realStatus)}`;
                          } else if (isFailed) {
                            message = `❌ Paiement échoué chez MoneyFusion${attempt > 1 ? ` (vérifié à la tentative ${attempt})` : ''}\n\nStatut: ${getStatusInFrench(realStatus)}`;
                          } else {
                            message = `📊 Statut MoneyFusion: ${getStatusInFrench(realStatus)}${attempt > 1 ? ` (vérifié à la tentative ${attempt})` : ''}`;
                          }
                          
                          setVerificationResult({
                            success: isSuccess,
                            message: message,
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
                      } catch (verifyError) {
                        console.log(`❌ Erreur vérification MoneyFusion directe:`, verifyError);
                        // Continuer avec le statut local en cas d'erreur
                      }
                    }
                    
                    // Fallback: utiliser le statut local (pour autres providers ou en cas d'erreur MoneyFusion)
                    const isSuccess = ['completed', 'paid'].includes(payment.status);
                    const isProcessing = ['processing', 'pending', 'initialized'].includes(payment.status);
                    const isFailed = ['failed', 'cancelled', 'expired'].includes(payment.status);
                    
                    let message = '';
                    if (isSuccess) {
                      message = `✅ Paiement confirmé avec succès${attempt > 1 ? ` (trouvé à la tentative ${attempt})` : ''}`;
                    } else if (isProcessing) {
                      message = `⏳ Paiement en cours de traitement${attempt > 1 ? ` (vérifié à la tentative ${attempt})` : ''}\n\nStatut local: ${payment.status}`;
                    } else if (isFailed) {
                      message = `❌ Paiement échoué${attempt > 1 ? ` (vérifié à la tentative ${attempt})` : ''}\n\nStatut: ${payment.status}`;
                    } else {
                      message = `📊 Statut du paiement: ${payment.status}${attempt > 1 ? ` (vérifié à la tentative ${attempt})` : ''}`;
                    }
                    
            setVerificationResult({
                      success: isSuccess,
                      message: message,
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
                } else {
                  // Fallback vers getPaymentByDonationId
                  try {
                    const paymentResponse = await paymentService.getPaymentByDonationId(donation._id);
                    if (paymentResponse.data.success && paymentResponse.data.data.payment) {
                      const payment = paymentResponse.data.data.payment;
                      console.log(`✅ Payment trouvé via fallback (tentative ${attempt}):`, payment);
                      
                                            // Si c'est MoneyFusion, vérifier le statut directement selon la documentation
                      if (payment.provider === 'moneyfusion' && payment.moneyfusion?.token) {
                        console.log(`🔍 Vérification MoneyFusion directe (fallback) avec token: ${payment.moneyfusion.token}`);
                        try {
                          const verifyResponse = await paymentService.verifyPayment(payment._id);
                          console.log('Réponse vérification MoneyFusion (fallback):', verifyResponse.data);
                          
                          if (verifyResponse.data.statut !== undefined) {
                            const moneyFusionData = verifyResponse.data.data;
                            const realStatus = moneyFusionData?.statut;
                            
                            const isSuccess = realStatus === 'paid';
                            const isProcessing = realStatus === 'pending';
                            const isFailed = realStatus === 'failed';
                            
                            // Convertir le statut en français
                            const getStatusInFrench = (status: string) => {
                              switch (status) {
                                case 'paid': return 'Payé';
                                case 'pending': return 'En attente';
                                case 'failed': return 'Échoué';
                                case 'processing': return 'En cours';
                                case 'completed': return 'Complété';
                                case 'cancelled': return 'Annulé';
                                case 'expired': return 'Expiré';
                                case 'initialized': return 'Initialisé';
                                default: return status;
                              }
                            };
                            
                            let message = '';
                            if (isSuccess) {
                              message = `✅ Paiement confirmé par MoneyFusion${attempt > 1 ? ` (trouvé à la tentative ${attempt})` : ''}`;
                            } else if (isProcessing) {
                              message = `⏳ Paiement en attente chez MoneyFusion${attempt > 1 ? ` (vérifié à la tentative ${attempt})` : ''}\n\nStatut: ${getStatusInFrench(realStatus)}`;
                            } else if (isFailed) {
                              message = `❌ Paiement échoué chez MoneyFusion${attempt > 1 ? ` (vérifié à la tentative ${attempt})` : ''}\n\nStatut: ${getStatusInFrench(realStatus)}`;
                            } else {
                              message = `📊 Statut MoneyFusion: ${getStatusInFrench(realStatus)}${attempt > 1 ? ` (vérifié à la tentative ${attempt})` : ''}`;
                            }
                            
                            setVerificationResult({
                              success: isSuccess,
                              message: message,
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
                        } catch (verifyError) {
                          console.log(`❌ Erreur vérification MoneyFusion directe (fallback):`, verifyError);
                        }
                      }
                      
                                            // Fallback final: utiliser le statut local
                      const isSuccess = ['completed', 'paid'].includes(payment.status);
                      const isProcessing = ['processing', 'pending', 'initialized'].includes(payment.status);
                      const isFailed = ['failed', 'cancelled', 'expired'].includes(payment.status);
                      
                      // Convertir le statut en français
                      const getStatusInFrench = (status: string) => {
                        switch (status) {
                          case 'paid': return 'Payé';
                          case 'pending': return 'En attente';
                          case 'failed': return 'Échoué';
                          case 'processing': return 'En cours';
                          case 'completed': return 'Complété';
                          case 'cancelled': return 'Annulé';
                          case 'expired': return 'Expiré';
                          case 'initialized': return 'Initialisé';
                          default: return status;
                        }
                      };
                      
                      let message = '';
                      if (isSuccess) {
                        message = `✅ Paiement confirmé avec succès${attempt > 1 ? ` (trouvé à la tentative ${attempt})` : ''}`;
                      } else if (isProcessing) {
                        message = `⏳ Paiement en cours de traitement${attempt > 1 ? ` (vérifié à la tentative ${attempt})` : ''}\n\nStatut: ${getStatusInFrench(payment.status)}`;
                      } else if (isFailed) {
                        message = `❌ Paiement échoué${attempt > 1 ? ` (vérifié à la tentative ${attempt})` : ''}\n\nStatut: ${getStatusInFrench(payment.status)}`;
          } else {
                        message = `📊 Statut du paiement: ${getStatusInFrench(payment.status)}${attempt > 1 ? ` (vérifié à la tentative ${attempt})` : ''}`;
                      }
                      
                      setVerificationResult({
                        success: isSuccess,
                        message: message,
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
      console.error('Erreur vérification paiement:', error);
      setVerificationResult({
        success: false,
        message: error.response?.data?.error || 'Erreur lors de la vérification',
            });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Vérifier automatiquement le paiement au chargement
    verifyPayment();
    
    // Nettoyer le deep link après utilisation
    if (lastDeepLink) {
      clearLastDeepLink();
    }
  }, []);

  const handleRetry = () => {
    setVerificationResult(null);
    verifyPayment();
  };

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
                  
                  {verificationResult.details.amount && (
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

              {verificationResult.details.fees && (
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