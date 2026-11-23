import logger from '../utils/logger';
import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useDS,
  AppText,
  Screen,
  HeroHeader,
  HeroChip,
  IconButton,
  Card,
  Section,
  Row,
  InfoRow,
  Badge,
  StatusBadge,
  Button,
  LoadingState,
  EmptyState,
  formatAmount,
  formatDate,
  statusInfo,
  IconName,
} from '../design/components';
import { spacing } from '../design/tokens';
import donationService, { Donation } from '../store/services/donationService';
import paymentService, { Payment } from '../store/services/paymentService';
import { showApiError } from '../store/services/apiClient';
import { openPaymentPage } from '../utils/openPaymentPage';
import { buildPaymentReturnDeepLink } from '../utils/deepLinkScheme';
import documentsService from '../store/services/documentsService';
import Constants from 'expo-constants';

interface DonationDetailScreenProps {
  navigation: any;
  route: {
    params: {
      donationId: string;
    };
  };
}

const DonationDetailScreen: React.FC<DonationDetailScreenProps> = ({ navigation, route }) => {
  const { c } = useDS();
  const { donationId } = route.params;
  
  const [donation, setDonation] = useState<Donation | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [isInitiateLoading, setIsInitiateLoading] = useState(false);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  // Recharge à l'ouverture et au retour sur l'écran (ex: après la page de paiement)
  useFocusEffect(
    useCallback(() => {
      loadDonationDetails(donation !== null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [donationId])
  );

  // Fonction pour sélectionner le bon paiement en cas de multiples
  const selectBestPayment = (payments: Payment[], donation: Donation): Payment | null => {
    if (!payments || payments.length === 0) return null;
    
    logger.log(`Sélection du meilleur paiement parmi ${payments.length} paiements pour donation ${donation._id}`);
    
    // Si un seul paiement, le retourner
    if (payments.length === 1) {
      logger.log('Un seul paiement trouvé:', payments[0]._id);
      return payments[0];
    }
    
    // Logique de sélection selon le type de don
    if (donation.type === 'recurring') {
      logger.log('Don récurrent détecté - sélection du paiement le plus approprié');
      
      // Pour les dons récurrents, priorité aux paiements en cours ou récents
      // 1. D'abord chercher un paiement pending/processing
      let pendingPayments = payments.filter(p => ['pending', 'processing', 'initialized'].includes(p.status));
      if (pendingPayments.length > 0) {
        // Prendre le plus récent parmi les pending
        const latest = pendingPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        logger.log('Paiement pending/processing sélectionné pour don récurrent:', latest._id);
        return latest;
      }
      
      // 2. Sinon, prendre le plus récent (completed ou failed)
      const sortedByDate = payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      logger.log('Paiement le plus récent sélectionné pour don récurrent:', sortedByDate[0]._id);
      return sortedByDate[0];
    } else {
      logger.log('Don unique détecté - sélection selon priorité de statut');
      
      // Pour les dons uniques, priorité aux statuts actifs
      // 1. Pending/processing en premier
      let activePayments = payments.filter(p => ['pending', 'processing', 'initialized'].includes(p.status));
      if (activePayments.length > 0) {
        const latest = activePayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        logger.log('Paiement actif sélectionné pour don unique:', latest._id);
        return latest;
      }
      
      // 2. Puis completed
      let completedPayments = payments.filter(p => ['completed', 'paid'].includes(p.status));
      if (completedPayments.length > 0) {
        const latest = completedPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        logger.log('Paiement complété sélectionné pour don unique:', latest._id);
        return latest;
      }
      
      // 3. Enfin failed (le plus récent)
      const sortedByDate = payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      logger.log('Paiement par défaut (plus récent) sélectionné pour don unique:', sortedByDate[0]._id);
      return sortedByDate[0];
    }
  };

  const loadDonationDetails = async (silent = false): Promise<{ donation: Donation | null; payment: Payment | null }> => {
    let loadedDonation: Donation | null = null;
    let loadedPayment: Payment | null = null;
    try {
      if (!silent) setIsLoading(true);
      
      // Charger les détails du don
      const donationResponse = await donationService.getDonationById(donationId);
      
      if (donationResponse.data.success) {
        const donationData = donationResponse.data.data.donation;
        setDonation(donationData);
        loadedDonation = donationData;

        // Stratégie intelligente pour gérer les paiements multiples
        let selectedPayment = null;
        
        try {
          logger.log('🔍 Recherche intelligente des paiements pour donation:', donationData._id);
          
          // 1. D'abord essayer de récupérer TOUS les paiements pour cette donation
          const allPaymentsResponse = await paymentService.getAllPaymentsByDonationId(donationData._id);
          
          if (allPaymentsResponse.data.success && allPaymentsResponse.data.data.payments) {
            const allPayments = allPaymentsResponse.data.data.payments;
            logger.log(`📋 ${allPayments.length} paiement(s) trouvé(s) pour cette donation`);
            
                         if (allPayments.length > 1) {
               logger.warn(`⚠️ ALERTE: ${allPayments.length} paiements trouvés pour la même donation!`);
               console.table(allPayments.map((p: Payment) => ({
                 id: p._id,
                 status: p.status,
                 amount: p.amount,
                 created: p.createdAt,
                 provider: p.provider
               })));
             }
             
             // Utiliser la logique intelligente pour sélectionner le meilleur paiement
             selectedPayment = selectBestPayment(allPayments, donationData);
            
            if (selectedPayment) {
              setPayment(selectedPayment);
              loadedPayment = selectedPayment;
            } else {
              logger.log('❌ Aucun paiement sélectionné par la logique intelligente');
              setPayment(null);
            }
          } else {
            logger.log('📭 Aucun paiement trouvé dans la réponse');
            setPayment(null);
          }
          
        } catch (paymentError: any) {
          logger.error('❌ Erreur lors de la recherche intelligente des paiements:', paymentError);
          
          // Fallback : essayer la méthode classique avec l'ID direct si disponible
          if (donationData.payment?._id) {
            try {
              logger.log('🔄 Fallback: tentative via ID direct:', donationData.payment._id);
              const paymentResponse = await paymentService.getPaymentById(donationData.payment._id);
              if (paymentResponse.data.success) {
                setPayment(paymentResponse.data.data.payment);
                loadedPayment = paymentResponse.data.data.payment;
              } else {
                setPayment(null);
              }
            } catch (fallbackError) {
              logger.error('❌ Fallback échoué:', fallbackError);
              setPayment(null);
            }
          } else {
            logger.log('💭 Aucun paiement associé à ce don - statut:', donationData.status);
            setPayment(null);
          }
        }
      }
    } catch (error: any) {
      logger.error('Erreur chargement don:', error?.message);
      if (!silent) {
        Alert.alert('Erreur', 'Impossible de charger les détails du don');
        navigation.goBack();
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
    return { donation: loadedDonation, payment: loadedPayment };
  };

  const handleCancelRecurring = async () => {
    if (!donation?.recurring?.isActive) return;

    Alert.alert(
      'Annuler le don récurrent',
      'Êtes-vous sûr de vouloir annuler ce don récurrent ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsVerifyLoading(true);
              await donationService.cancelRecurringDonation(donationId, 'Annulé par l\'utilisateur');
              Alert.alert('Don récurrent annulé', 'Aucune nouvelle échéance ne sera générée.');
              await loadDonationDetails(true);
            } catch (error: any) {
              showApiError(error, 'Erreur lors de l\'annulation du don récurrent');
            } finally {
              setIsVerifyLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDownloadReceipt = async () => {
    if (!donation) return;
    if (donation.status !== 'completed') {
      Alert.alert('Information', 'Le reçu sera disponible une fois le don complété.');
      return;
    }

    try {
      setIsDownloadingReceipt(true);
      const result = await documentsService.downloadDonationReceipt(donation._id);
      if (!result.success || !result.filePath) {
        Alert.alert('Erreur', result.error || 'Impossible de télécharger le reçu');
        return;
      }

      // Ouvrir avec viewer natif si dispo, sinon partager (surtout en Expo Go)
      try {
        if (Constants.executionEnvironment === 'storeClient') { // Expo Go : pas de module natif file-viewer
          await documentsService.shareFile(result.filePath, 'pdf');
        } else {
          const { default: FileViewer } = await import('react-native-file-viewer');
          await FileViewer.open(result.filePath, { showOpenWithDialog: true });
        }
      } catch (openErr) {
        await documentsService.shareFile(result.filePath, 'pdf');
      }
    } catch (error: any) {
      logger.error('Erreur téléchargement reçu:', error);
      Alert.alert('Erreur', error.message || 'Impossible de télécharger le reçu');
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  const handleShare = async () => {
    if (!donation) return;

    try {
      const receiptPart = donation.receipt?.number ? ` Reçu : ${donation.receipt.number}` : '';
      const message = `J'ai fait un don de ${donationService.formatAmount(donation.amount, donation.currency)} (${donationService.formatCategory(donation.category)}) via PARTENAIRE MAGB.${receiptPart}`;
      
      await Share.share({
        message,
        title: 'Mon don PARTENAIRE MAGB',
      });
    } catch (error) {
      logger.error('Erreur partage:', error);
    }
  };

  const handleInitiatePayment = async () => {
    if (!donation) return;

    switch (donation.status) {
      case 'pending':
        // Don en attente - vérifier d'abord s'il existe un paiement réutilisable
        logger.log('🔍 Initiation paiement pour don pending:', donation._id);
        logger.log('📋 Type de don:', donation.type, '- Récurrent:', donation.type === 'recurring');
        
        setIsInitiateLoading(true);
        try {
          let paymentResponse;
          let existingPayment = null;
          
          // 1. Chercher les paiements existants pour éviter les doublons
          if (donation.type !== 'recurring') {
            logger.log('🔍 Don unique détecté - recherche de paiements existants pour réutilisation');
            
            try {
              const allPaymentsResponse = await paymentService.getAllPaymentsByDonationId(donation._id);
              
              if (allPaymentsResponse.data.success && allPaymentsResponse.data.data.payments) {
                const allPayments = allPaymentsResponse.data.data.payments;
                logger.log(`📋 ${allPayments.length} paiement(s) existant(s) trouvé(s)`);
                
                                 // Chercher un paiement réutilisable (pending, failed, ou processing récent)
                 // Un paiement échoué n'est pas « réutilisable » tel quel : son lien n'est plus valide
                 const reusablePayments = allPayments.filter((p: Payment) =>
                   ['pending', 'processing', 'initialized'].includes(p.status)
                 );
                 
                 if (reusablePayments.length > 0) {
                   // Prendre le plus récent parmi les réutilisables
                   existingPayment = reusablePayments.sort((a: Payment, b: Payment) => 
                     new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                   )[0];
                  
                  logger.log(`♻️ Paiement réutilisable trouvé: ${existingPayment._id} (statut: ${existingPayment.status})`);
                  logger.log(`📅 Créé le: ${new Date(existingPayment.createdAt).toLocaleString('fr-FR')}`);
                  
                  if (allPayments.length > 1) {
                    logger.warn(`⚠️ ${allPayments.length} paiements trouvés - réutilisation pour éviter les doublons`);
                  }
                }
              }
            } catch (searchError) {
              logger.log('🔄 Erreur recherche paiements existants, création d\'un nouveau:', searchError);
            }
          } else {
            logger.log('🔄 Don récurrent détecté - création d\'un nouveau paiement (normal pour les récurrences)');
          }
          
          // 2. Décider de réutiliser ou créer un nouveau paiement
          if (existingPayment && donation.type !== 'recurring') {
            logger.log(`♻️ Réutilisation du paiement existant: ${existingPayment._id}`);
            
            // Réutiliser le lien seulement s'il est récent (les liens MoneyFusion expirent)
            const linkAgeMinutes = (Date.now() - new Date(existingPayment.createdAt).getTime()) / 60000;
            if ((existingPayment.moneyfusion?.paymentUrl || existingPayment.fusionpay?.paymentUrl || existingPayment.geniuspay?.paymentUrl) && linkAgeMinutes < 30) {
              const paymentUrl = existingPayment.moneyfusion?.paymentUrl || existingPayment.fusionpay?.paymentUrl || existingPayment.geniuspay?.paymentUrl;
              logger.log('✅ URL de paiement existante trouvée, réutilisation directe');
              
              // Utiliser directement l'URL existante
              Alert.alert(
                'Paiement existant trouvé',
                `Un paiement est déjà en cours pour ce don.\n\nVous allez être redirigé vers la page de paiement existante.`,
                [
                  {
                    text: 'Annuler',
                    style: 'cancel',
                  },
                  {
                    text: 'Continuer le paiement',
                    onPress: async () => {
                      try {
                        const ret = await openPaymentPage(paymentUrl);
                        navigation.navigate('PaymentVerification', {
                          ...(ret.status ? { status: ret.status } : {}),
                          paymentId: existingPayment._id,
                          donationId: donation._id,
                          transactionId: existingPayment.moneyfusion?.token || existingPayment.fusionpay?.transactionId || existingPayment.geniuspay?.reference,
                          paymentUrl: paymentUrl,
                        });
                      } catch (error) {
                        logger.error('Erreur ouverture URL existante:', error);
                        Alert.alert('Erreur', 'Impossible d\'ouvrir la page de paiement. Création d\'un nouveau paiement...');
                        // Fallback: créer un nouveau paiement
                        const newPaymentData = {
                          donationId: donation._id,
                          provider: !donation.paymentMethod ? 'moneyfusion' : ['moneyfusion', 'geniuspay'].includes(donation.paymentMethod) ? donation.paymentMethod : 'fusionpay',
                          paymentMethod: donation.paymentMethod || 'moneyfusion',
                          callbackUrl: buildPaymentReturnDeepLink(donation._id),
                        };
                        const newPaymentResponse = await donationService.initializePayment(newPaymentData);
                        if (newPaymentResponse.data.success) {
                          const newPaymentUrl = newPaymentResponse.data.data.paymentUrl;
                          if (newPaymentUrl) {
                            const ret = await openPaymentPage(newPaymentUrl);
                            navigation.navigate('PaymentVerification', {
                              ...(ret.status ? { status: ret.status } : {}),
                              paymentId: newPaymentResponse.data.data.paymentId,
                              donationId: donation._id,
                              transactionId: newPaymentResponse.data.data.transactionId,
                              paymentUrl: newPaymentUrl,
                            });
                          }
                        }
                      }
                    },
                  },
                ]
              );
              return; // Sortir de la fonction
            } else {
              logger.log('🔄 Paiement existant sans URL valide, recréation de l\'URL de paiement');
              // Le paiement existe mais sans URL valide, en recréer une
              const paymentData = {
                donationId: donation._id,
                provider: !donation.paymentMethod ? 'moneyfusion' : ['moneyfusion', 'geniuspay'].includes(donation.paymentMethod) ? donation.paymentMethod : 'fusionpay',
                paymentMethod: donation.paymentMethod || 'moneyfusion',
                callbackUrl: buildPaymentReturnDeepLink(donation._id),
                existingPaymentId: existingPayment._id, // Indiquer qu'il faut mettre à jour ce paiement
              };
              paymentResponse = await donationService.initializePayment(paymentData);
            }
          } else {
            logger.log('🆕 Création d\'un nouveau paiement');
            // Créer un nouveau paiement
            const paymentData = {
              donationId: donation._id,
              provider: !donation.paymentMethod ? 'moneyfusion' : ['moneyfusion', 'geniuspay'].includes(donation.paymentMethod) ? donation.paymentMethod : 'fusionpay',
              paymentMethod: donation.paymentMethod || 'moneyfusion',
              callbackUrl: buildPaymentReturnDeepLink(donation._id),
            };
            paymentResponse = await donationService.initializePayment(paymentData);
          }

          
          if (paymentResponse.data.success) {
            const paymentInfo = paymentResponse.data.data;
            const paymentUrl = paymentInfo.paymentUrl;
            
            // Toute URL de paiement renvoyée doit être ouverte (avant, une méthode absente faisait planter .includes)
            if (paymentUrl) {
              const method = donation.paymentMethod || 'moneyfusion';
              const providerName = method === 'moneyfusion'
                ? 'MoneyFusion'
                : method === 'geniuspay'
                  ? 'GeniusPay'
                  : method.includes('paydunya') ? 'PayDunya' : 'la page de paiement';
              
              Alert.alert(
                'Paiement initié',
                `Le paiement de ${donationService.formatAmount(donation.amount, donation.currency)} va être initié.\n\nVous allez être redirigé vers ${providerName}.`,
                [
                  {
                    text: 'Annuler',
                    style: 'cancel',
                  },
                  {
                    text: 'Continuer le paiement',
                    onPress: async () => {
                      try {
                        // Ouvrir la page de paiement : se referme automatiquement au retour dans l'app
                        const ret = await openPaymentPage(paymentUrl);

                        // Naviguer vers l'écran de vérification (le backend confirme le statut réel)
                        navigation.navigate('PaymentVerification', {
                          ...(ret.status ? { status: ret.status } : {}),
                          paymentId: paymentInfo.paymentId,
                          donationId: donation._id,
                          transactionId: paymentInfo.transactionId,
                          paymentUrl: paymentUrl,
                        });
                      } catch (error) {
                        logger.error('Erreur ouverture URL:', error);
                        Alert.alert('Erreur', 'Impossible d\'ouvrir la page de paiement. Veuillez réessayer.');
                      }
                    },
                  },
                ]
              );
            } else {
              Alert.alert(
                'Paiement initié',
                `Le paiement de ${donationService.formatAmount(donation.amount, donation.currency)} a été initié.`
              );
            }
          } else {
            Alert.alert('Erreur', 'Erreur lors de l\'initialisation du paiement');
          }
        } catch (error: any) {
          logger.error('Erreur initialisation paiement:', error);
          showApiError(error, 'Une erreur est survenue lors de l\'initialisation du paiement');
          // 409 : le don a déjà été payé entre-temps — recharger pour afficher son vrai statut
          if ((error?.response?.status ?? error?.status) === 409) {
            await loadDonationDetails();
          }
        } finally {
          setIsInitiateLoading(false);
        }
        break;

      case 'failed':
        // Don échoué - créer un nouveau don avec les mêmes données
        logger.log('Création nouveau don après échec:', donation._id);
        navigation.navigate('CreateDonation', {
          mode: 'retry_failed', // Mode retry après échec
          previousDonationData: {
            amount: donation.amount,
            currency: donation.currency,
            category: donation.category,
            type: donation.type,
            message: donation.message,
            isAnonymous: donation.isAnonymous,
            paymentMethod: donation.paymentMethod || 'moneyfusion',
            recurring: donation.recurring
          }
        });
        break;

      case 'completed':
        // Don complété - pas d'action
        Alert.alert(
          'Don déjà complété',
          'Ce don a déjà été complété avec succès. Aucune action supplémentaire n\'est nécessaire.',
          [{ text: 'OK' }]
        );
        break;

      default:
        // Statut inconnu - proposer vérification
        Alert.alert(
          'Statut non reconnu',
          'Le statut de ce don n\'est pas reconnu. Voulez-vous vérifier le statut ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Vérifier', onPress: handleVerifyPayment }
          ]
        );
        break;
    }
  };

  // Vérification du paiement : le backend interroge l'opérateur et met lui-même à jour
  // le paiement ET le don ; l'app recharge ensuite et affiche le statut réel.
  const handleVerifyPayment = async () => {
    if (!donation || isVerifyLoading) return;

    try {
      setIsVerifyLoading(true);

      // 1. Trouver le paiement à vérifier
      let paymentToVerify = payment;
      if (!paymentToVerify) {
        try {
          const res = await paymentService.getAllPaymentsByDonationId(donation._id);
          paymentToVerify = selectBestPayment(res.data?.data?.payments || [], donation);
        } catch (e) {
          paymentToVerify = null;
        }
      }

      if (!paymentToVerify) {
        Alert.alert(
          'Aucun paiement',
          'Aucun paiement n\'a encore été lancé pour ce don.',
          [
            { text: 'Fermer', style: 'cancel' },
            ...(donation.status === 'pending' ? [{ text: 'Payer maintenant', onPress: handleInitiatePayment }] : []),
          ]
        );
        return;
      }

      // 2. Demander au backend de vérifier auprès de l'opérateur
      let serverMessage = '';
      try {
        const verifyResponse = await paymentService.verifyPayment(paymentToVerify._id);
        serverMessage = verifyResponse.data?.message || '';
      } catch (e: any) {
        serverMessage = e?.response?.data?.error || e?.response?.data?.message || '';
      }

      // 3. Recharger et afficher le statut réel enregistré
      const { donation: fresh } = await loadDonationDetails(true);
      const status = fresh?.status || donation.status;

      if (status === 'completed') {
        Alert.alert('Paiement confirmé ✅', 'Merci ! Votre don est validé et votre reçu est disponible.');
      } else if (status === 'failed' || status === 'cancelled') {
        Alert.alert(
          'Paiement non abouti',
          'Le paiement n\'a pas été effectué. Vous pouvez réessayer.',
          [
            { text: 'Fermer', style: 'cancel' },
            { text: 'Réessayer', onPress: handleInitiatePayment },
          ]
        );
      } else {
        Alert.alert(
          'Paiement en attente',
          `${serverMessage ? serverMessage + '\n\n' : ''}Si vous venez de payer, la confirmation de l'opérateur peut prendre quelques minutes. Elle est aussi vérifiée automatiquement.`,
          [
            { text: 'OK', style: 'cancel' },
            { text: 'Revérifier', onPress: () => setTimeout(handleVerifyPayment, 300) },
          ]
        );
      }
    } catch (error: any) {
      logger.error('Erreur vérification paiement:', error?.message);
      Alert.alert('Erreur', 'Impossible de vérifier le paiement pour le moment. Réessayez dans quelques instants.');
    } finally {
      setIsVerifyLoading(false);
    }
  };


  const getNextPaymentDate = () =>
    donation?.recurring?.nextPaymentDate ? formatDate(donation.recurring.nextPaymentDate) : null;

  const FREQUENCY_LABELS: Record<string, string> = {
    daily: 'Quotidienne',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuelle',
    quarterly: 'Trimestrielle',
    yearly: 'Annuelle',
  };

  const providerLabel = (method?: string) =>
    method === 'moneyfusion' ? 'MoneyFusion' : method === 'geniuspay' ? 'GeniusPay' : method || 'Non défini';

  const hero = (
    <HeroHeader
      eyebrow="Détail du don"
      eyebrowIcon="heart-outline"
      title={donation ? formatAmount(donation.amount, donation.currency) : 'Don'}
      subtitle={donation ? `${donationService.formatCategory(donation.category)} · ${formatDate(donation.createdAt, true)}` : undefined}
      onBack={() => navigation.goBack()}
      right={donation ? <IconButton icon="share-outline" tone="hero" accessibilityLabel="Partager ce don" onPress={handleShare} /> : undefined}
    >
      {donation ? (
        <View style={styles.chips}>
          <HeroChip icon={statusInfo(donation.status).icon} label={statusInfo(donation.status).label} />
          <HeroChip icon={donation.type === 'recurring' ? 'repeat' : 'flash-outline'} label={donation.type === 'recurring' ? 'Récurrent' : 'Ponctuel'} />
        </View>
      ) : null}
    </HeroHeader>
  );

  if (isLoading) {
    return (
      <Screen hero={hero}>
        <Card>
          <LoadingState message="Chargement du don…" />
        </Card>
      </Screen>
    );
  }

  if (!donation) {
    return (
      <Screen hero={hero}>
        <Card>
          <EmptyState
            icon="alert-circle-outline"
            title="Don introuvable"
            message="Ce don n'existe plus ou n'est pas accessible."
            action={<Button title="Retour" variant="outline" onPress={() => navigation.goBack()} />}
          />
        </Card>
      </Screen>
    );
  }

  // Bandeau d'action quand aucun paiement n'est associé au don
  const noPaymentBanner = (() => {
    if (payment) return null;
    const map: Record<string, { tone: 'success' | 'warning' | 'danger' | 'info'; icon: IconName; title: string; text: string; action: string; onPress: () => void; loading: boolean }> = {
      completed: {
        tone: 'success',
        icon: 'checkmark-circle-outline',
        title: 'Don complété',
        text: 'Aucun paiement n\'est rattaché à ce don. Vérifiez pour synchroniser les données.',
        action: 'Vérifier le statut',
        onPress: handleVerifyPayment,
        loading: isVerifyLoading,
      },
      pending: {
        tone: 'info',
        icon: 'hourglass-outline',
        title: 'En attente de paiement',
        text: `Le paiement via ${providerLabel(donation.paymentMethod)} n'a pas encore été lancé.`,
        action: 'Payer maintenant',
        onPress: handleInitiatePayment,
        loading: isInitiateLoading,
      },
      failed: {
        tone: 'danger',
        icon: 'close-circle-outline',
        title: 'Paiement échoué',
        text: 'Vérifiez le statut ou relancez le paiement.',
        action: 'Réessayer le paiement',
        onPress: handleInitiatePayment,
        loading: isInitiateLoading,
      },
    };
    const b = map[donation.status] ?? {
      tone: 'warning' as const,
      icon: 'information-circle-outline' as IconName,
      title: 'Aucun paiement associé',
      text: 'Vérifiez le statut de ce don.',
      action: 'Vérifier',
      onPress: handleInitiatePayment,
      loading: isInitiateLoading,
    };
    const fg = b.tone === 'success' ? c.success : b.tone === 'danger' ? c.destructive : b.tone === 'info' ? c.info : c.warning;
    const bg = b.tone === 'success' ? c.successSoft : b.tone === 'danger' ? c.destructiveSoft : b.tone === 'info' ? c.infoSoft : c.warningSoft;
    return (
      <Card style={{ backgroundColor: bg, borderColor: fg, gap: spacing.md }}>
        <View style={styles.bannerTop}>
          <Ionicons name={b.icon} size={24} color={fg} />
          <View style={styles.flex}>
            <AppText variant="bodyStrong" color={fg}>{b.title}</AppText>
            <AppText variant="small" color={fg}>{b.text}</AppText>
          </View>
        </View>
        <Button title={b.loading ? 'Traitement…' : b.action} onPress={b.onPress} loading={b.loading} />
      </Card>
    );
  })();

  const canVerify =
    (payment && ['pending', 'processing', 'initialized', 'failed'].includes(payment.status)) ||
    (!payment && ['pending', 'completed', 'failed'].includes(donation.status));

  const recurring = donation.type === 'recurring' ? donation.recurring : undefined;
  const nextPayment = getNextPaymentDate();

  return (
    <Screen hero={hero}>
      {noPaymentBanner}

      <Card>
        <AppText variant="overline" color={c.mutedForeground} style={styles.cardTitle}>Informations</AppText>
        <InfoRow label="Catégorie" value={donationService.formatCategory(donation.category)} />
        <InfoRow label="Type" value={donation.type === 'one_time' ? 'Don ponctuel' : 'Don récurrent'} />
        <InfoRow label="Créé le" value={formatDate(donation.createdAt, true)} />
        <InfoRow label="Statut" value={<StatusBadge status={donation.status} />} />
        <InfoRow
          label="Reçu"
          value={donation.receipt?.number ? `n°${donation.receipt.number}` : 'Après paiement'}
          last={!donation.isAnonymous}
        />
        {donation.isAnonymous ? <InfoRow label="Anonymat" value="Don anonyme" last /> : null}
      </Card>

      {donation.message ? (
        <Card>
          <AppText variant="overline" color={c.mutedForeground} style={styles.cardTitle}>Message</AppText>
          <AppText variant="body" style={{ fontStyle: 'italic' }}>« {donation.message} »</AppText>
        </Card>
      ) : null}

      {recurring ? (
        <Card>
          <View style={styles.cardHeader}>
            <AppText variant="overline" color={c.mutedForeground}>Récurrence</AppText>
            <Badge label={recurring.isActive ? 'Active' : 'Arrêtée'} tone={recurring.isActive ? 'success' : 'neutral'} />
          </View>
          <InfoRow label="Fréquence" value={FREQUENCY_LABELS[recurring.frequency] ?? recurring.frequency} />
          <InfoRow label="Début" value={formatDate(recurring.startDate)} />
          {nextPayment ? <InfoRow label="Prochaine échéance" value={nextPayment} /> : null}
          <InfoRow
            label="Échéances"
            value={`${recurring.currentOccurrence || 1}${recurring.maxOccurrences ? ` / ${recurring.maxOccurrences}` : ''}`}
            last
          />
          {recurring.isActive ? (
            <Button
              title="Arrêter la récurrence"
              variant="outline"
              icon="stop-circle-outline"
              onPress={handleCancelRecurring}
              disabled={isVerifyLoading}
              style={{ marginTop: spacing.md }}
            />
          ) : null}
        </Card>
      ) : null}

      <Card>
        <AppText variant="overline" color={c.mutedForeground} style={styles.cardTitle}>Paiement</AppText>
        {payment ? (
          <>
            <InfoRow label="Moyen de paiement" value={paymentService.formatProvider(payment.provider)} />
            <InfoRow label="Statut" value={<StatusBadge status={payment.status} />} last />
            {['pending', 'processing', 'initialized'].includes(payment.status) ? (
              <Button
                title={isVerifyLoading ? 'Vérification…' : 'Vérifier le paiement'}
                icon="refresh"
                variant="outline"
                onPress={handleVerifyPayment}
                loading={isVerifyLoading}
                style={{ marginTop: spacing.md }}
              />
            ) : null}
          </>
        ) : (
          <>
            <InfoRow label="Moyen prévu" value={providerLabel(donation.paymentMethod)} />
            <InfoRow label="Paiement" value="Non lancé" last />
          </>
        )}
      </Card>

      <Section title="Actions">
        <Row
          icon="document-text-outline"
          label="Télécharger le reçu"
          sublabel={donation.status === 'completed' ? 'Reçu fiscal au format PDF' : 'Disponible une fois le don payé'}
          onPress={isDownloadingReceipt ? undefined : handleDownloadReceipt}
          right={isDownloadingReceipt ? <ActivityIndicator color={c.primary} /> : undefined}
          chevron={!isDownloadingReceipt}
        />
        <Row icon="share-social-outline" label="Partager" sublabel="Partager ce don avec vos proches" onPress={handleShare} chevron />
        {canVerify ? (
          <Row
            icon="sync-outline"
            label={isVerifyLoading ? 'Vérification en cours…' : payment ? 'Vérifier le paiement' : 'Vérifier le don'}
            sublabel={payment ? `Mettre à jour le statut auprès de ${paymentService.formatProvider(payment.provider)}` : 'Synchroniser le statut du don'}
            onPress={isVerifyLoading ? undefined : handleVerifyPayment}
            right={isVerifyLoading ? <ActivityIndicator color={c.primary} /> : undefined}
            chevron={!isVerifyLoading}
          />
        ) : null}
        {donation.status === 'pending' || donation.status === 'failed' ? (
          <Row
            icon={donation.status === 'failed' ? 'refresh' : 'card-outline'}
            label={isInitiateLoading ? 'Préparation du paiement…' : donation.status === 'failed' ? 'Réessayer le paiement' : 'Payer maintenant'}
            sublabel={donation.status === 'failed' ? 'Créer un nouveau don avec les mêmes informations' : 'Ouvrir la page de paiement de ce don'}
            onPress={isInitiateLoading ? undefined : handleInitiatePayment}
            right={isInitiateLoading ? <ActivityIndicator color={c.primary} /> : undefined}
            chevron={!isInitiateLoading}
          />
        ) : null}
        <Row icon="add-circle-outline" label="Nouveau don" sublabel="Faire un autre don" onPress={() => navigation.navigate('CreateDonation')} chevron last />
      </Section>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  cardTitle: { marginBottom: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  bannerTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
});

export default DonationDetailScreen;
