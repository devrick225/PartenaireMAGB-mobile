import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import donationService, { Donation } from '../store/services/donationService';
import paymentService, { Payment } from '../store/services/paymentService';
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
  const { dark, colors } = useTheme();
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
    
    console.log(`Sélection du meilleur paiement parmi ${payments.length} paiements pour donation ${donation._id}`);
    
    // Si un seul paiement, le retourner
    if (payments.length === 1) {
      console.log('Un seul paiement trouvé:', payments[0]._id);
      return payments[0];
    }
    
    // Logique de sélection selon le type de don
    if (donation.type === 'recurring') {
      console.log('Don récurrent détecté - sélection du paiement le plus approprié');
      
      // Pour les dons récurrents, priorité aux paiements en cours ou récents
      // 1. D'abord chercher un paiement pending/processing
      let pendingPayments = payments.filter(p => ['pending', 'processing', 'initialized'].includes(p.status));
      if (pendingPayments.length > 0) {
        // Prendre le plus récent parmi les pending
        const latest = pendingPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        console.log('Paiement pending/processing sélectionné pour don récurrent:', latest._id);
        return latest;
      }
      
      // 2. Sinon, prendre le plus récent (completed ou failed)
      const sortedByDate = payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      console.log('Paiement le plus récent sélectionné pour don récurrent:', sortedByDate[0]._id);
      return sortedByDate[0];
    } else {
      console.log('Don unique détecté - sélection selon priorité de statut');
      
      // Pour les dons uniques, priorité aux statuts actifs
      // 1. Pending/processing en premier
      let activePayments = payments.filter(p => ['pending', 'processing', 'initialized'].includes(p.status));
      if (activePayments.length > 0) {
        const latest = activePayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        console.log('Paiement actif sélectionné pour don unique:', latest._id);
        return latest;
      }
      
      // 2. Puis completed
      let completedPayments = payments.filter(p => ['completed', 'paid'].includes(p.status));
      if (completedPayments.length > 0) {
        const latest = completedPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        console.log('Paiement complété sélectionné pour don unique:', latest._id);
        return latest;
      }
      
      // 3. Enfin failed (le plus récent)
      const sortedByDate = payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      console.log('Paiement par défaut (plus récent) sélectionné pour don unique:', sortedByDate[0]._id);
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
          console.log('🔍 Recherche intelligente des paiements pour donation:', donationData._id);
          
          // 1. D'abord essayer de récupérer TOUS les paiements pour cette donation
          const allPaymentsResponse = await paymentService.getAllPaymentsByDonationId(donationData._id);
          
          if (allPaymentsResponse.data.success && allPaymentsResponse.data.data.payments) {
            const allPayments = allPaymentsResponse.data.data.payments;
            console.log(`📋 ${allPayments.length} paiement(s) trouvé(s) pour cette donation`);
            
                         if (allPayments.length > 1) {
               console.warn(`⚠️ ALERTE: ${allPayments.length} paiements trouvés pour la même donation!`);
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
              console.log('❌ Aucun paiement sélectionné par la logique intelligente');
              setPayment(null);
            }
          } else {
            console.log('📭 Aucun paiement trouvé dans la réponse');
            setPayment(null);
          }
          
        } catch (paymentError: any) {
          console.error('❌ Erreur lors de la recherche intelligente des paiements:', paymentError);
          
          // Fallback : essayer la méthode classique avec l'ID direct si disponible
          if (donationData.payment?._id) {
            try {
              console.log('🔄 Fallback: tentative via ID direct:', donationData.payment._id);
              const paymentResponse = await paymentService.getPaymentById(donationData.payment._id);
              if (paymentResponse.data.success) {
                setPayment(paymentResponse.data.data.payment);
                loadedPayment = paymentResponse.data.data.payment;
              } else {
                setPayment(null);
              }
            } catch (fallbackError) {
              console.error('❌ Fallback échoué:', fallbackError);
              setPayment(null);
            }
          } else {
            console.log('💭 Aucun paiement associé à ce don - statut:', donationData.status);
            setPayment(null);
          }
        }
      }
    } catch (error: any) {
      console.error('Erreur chargement don:', error?.message);
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
              Alert.alert('Erreur', error.response?.data?.error || 'Erreur lors de l\'annulation');
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
      console.error('Erreur téléchargement reçu:', error);
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
      console.error('Erreur partage:', error);
    }
  };

  const handleInitiatePayment = async () => {
    if (!donation) return;

    switch (donation.status) {
      case 'pending':
        // Don en attente - vérifier d'abord s'il existe un paiement réutilisable
        console.log('🔍 Initiation paiement pour don pending:', donation._id);
        console.log('📋 Type de don:', donation.type, '- Récurrent:', donation.type === 'recurring');
        
        setIsInitiateLoading(true);
        try {
          let paymentResponse;
          let existingPayment = null;
          
          // 1. Chercher les paiements existants pour éviter les doublons
          if (donation.type !== 'recurring') {
            console.log('🔍 Don unique détecté - recherche de paiements existants pour réutilisation');
            
            try {
              const allPaymentsResponse = await paymentService.getAllPaymentsByDonationId(donation._id);
              
              if (allPaymentsResponse.data.success && allPaymentsResponse.data.data.payments) {
                const allPayments = allPaymentsResponse.data.data.payments;
                console.log(`📋 ${allPayments.length} paiement(s) existant(s) trouvé(s)`);
                
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
                  
                  console.log(`♻️ Paiement réutilisable trouvé: ${existingPayment._id} (statut: ${existingPayment.status})`);
                  console.log(`📅 Créé le: ${new Date(existingPayment.createdAt).toLocaleString('fr-FR')}`);
                  
                  if (allPayments.length > 1) {
                    console.warn(`⚠️ ${allPayments.length} paiements trouvés - réutilisation pour éviter les doublons`);
                  }
                }
              }
            } catch (searchError) {
              console.log('🔄 Erreur recherche paiements existants, création d\'un nouveau:', searchError);
            }
          } else {
            console.log('🔄 Don récurrent détecté - création d\'un nouveau paiement (normal pour les récurrences)');
          }
          
          // 2. Décider de réutiliser ou créer un nouveau paiement
          if (existingPayment && donation.type !== 'recurring') {
            console.log(`♻️ Réutilisation du paiement existant: ${existingPayment._id}`);
            
            // Réutiliser le lien seulement s'il est récent (les liens MoneyFusion expirent)
            const linkAgeMinutes = (Date.now() - new Date(existingPayment.createdAt).getTime()) / 60000;
            if ((existingPayment.moneyfusion?.paymentUrl || existingPayment.fusionpay?.paymentUrl) && linkAgeMinutes < 30) {
              const paymentUrl = existingPayment.moneyfusion?.paymentUrl || existingPayment.fusionpay?.paymentUrl;
              console.log('✅ URL de paiement existante trouvée, réutilisation directe');
              
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
                        await Linking.openURL(paymentUrl);
                        navigation.navigate('PaymentVerification', {
                          paymentId: existingPayment._id,
                          donationId: donation._id,
                          transactionId: existingPayment.moneyfusion?.token || existingPayment.fusionpay?.transactionId,
                          paymentUrl: paymentUrl,
                        });
                      } catch (error) {
                        console.error('Erreur ouverture URL existante:', error);
                        Alert.alert('Erreur', 'Impossible d\'ouvrir la page de paiement. Création d\'un nouveau paiement...');
                        // Fallback: créer un nouveau paiement
                        const newPaymentData = {
                          donationId: donation._id,
                          provider: (!donation.paymentMethod || donation.paymentMethod === 'moneyfusion') ? 'moneyfusion' : 'fusionpay',
                          paymentMethod: donation.paymentMethod || 'moneyfusion',
                        };
                        const newPaymentResponse = await donationService.initializePayment(newPaymentData);
                        if (newPaymentResponse.data.success) {
                          const newPaymentUrl = newPaymentResponse.data.data.paymentUrl;
                          if (newPaymentUrl) {
                            await Linking.openURL(newPaymentUrl);
                            navigation.navigate('PaymentVerification', {
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
              console.log('🔄 Paiement existant sans URL valide, recréation de l\'URL de paiement');
              // Le paiement existe mais sans URL valide, en recréer une
              const paymentData = {
                donationId: donation._id,
                provider: (!donation.paymentMethod || donation.paymentMethod === 'moneyfusion') ? 'moneyfusion' : 'fusionpay',
                paymentMethod: donation.paymentMethod || 'moneyfusion',
                existingPaymentId: existingPayment._id, // Indiquer qu'il faut mettre à jour ce paiement
              };
              paymentResponse = await donationService.initializePayment(paymentData);
            }
          } else {
            console.log('🆕 Création d\'un nouveau paiement');
            // Créer un nouveau paiement
            const paymentData = {
              donationId: donation._id,
              provider: (!donation.paymentMethod || donation.paymentMethod === 'moneyfusion') ? 'moneyfusion' : 'fusionpay',
              paymentMethod: donation.paymentMethod || 'moneyfusion',
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
                        // Rediriger vers MoneyFusion
                        await Linking.openURL(paymentUrl);
                        
                        // Naviguer vers l'écran de vérification
                        navigation.navigate('PaymentVerification', {
                          paymentId: paymentInfo.paymentId,
                          donationId: donation._id,
                          transactionId: paymentInfo.transactionId,
                          paymentUrl: paymentUrl,
                        });
                      } catch (error) {
                        console.error('Erreur ouverture URL:', error);
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
          console.error('Erreur initialisation paiement:', error);
          Alert.alert(
            'Erreur',
            error.response?.data?.error || error.message || 'Une erreur est survenue lors de l\'initialisation du paiement'
          );
        } finally {
          setIsInitiateLoading(false);
        }
        break;

      case 'failed':
        // Don échoué - créer un nouveau don avec les mêmes données
        console.log('Création nouveau don après échec:', donation._id);
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
      console.error('Erreur vérification paiement:', error?.message);
      Alert.alert('Erreur', 'Impossible de vérifier le paiement pour le moment. Réessayez dans quelques instants.');
    } finally {
      setIsVerifyLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNextPaymentDate = () => {
    if (!donation?.recurring?.nextPaymentDate) return null;
    return formatDate(donation.recurring.nextPaymentDate);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Chargement des détails...
        </Text>
      </SafeAreaView>
    );
  }

  if (!donation) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <MaterialIcons name="error-outline" size={64} color={dark ? COLORS.grayTie : COLORS.gray} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Don introuvable
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.headerButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Détails du don</Text>
        <TouchableOpacity
          onPress={handleShare}
          style={[styles.headerButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
        >
          <MaterialIcons name="share" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Alerte pour don sans paiement selon le statut */}
        {!payment && donation && (
          <View style={[
            styles.verificationAlert, 
            { 
              backgroundColor: donation.status === 'completed' ? '#E8F5E8' : 
                              donation.status === 'pending' ? '#E3F2FD' : 
                              donation.status === 'failed' ? '#FFEBEE' : '#FFF3E0'
            }
          ]}>
            <View style={styles.verificationAlertContent}>
              <MaterialIcons 
                name={
                  donation.status === 'completed' ? 'check-circle' :
                  donation.status === 'pending' ? 'hourglass-empty' :
                  donation.status === 'failed' ? 'error' : 'info'
                } 
                size={24} 
                color={
                  donation.status === 'completed' ? '#2E7D32' :
                  donation.status === 'pending' ? '#1976D2' :
                  donation.status === 'failed' ? '#C62828' : '#F57C00'
                }
              />
              <View style={styles.verificationAlertText}>
                <Text style={[
                  styles.verificationAlertTitle, 
                  { 
                    color: donation.status === 'completed' ? '#1B5E20' :
                           donation.status === 'pending' ? '#0D47A1' :
                           donation.status === 'failed' ? '#B71C1C' : '#E65100'
                  }
                ]}>
                  {donation.status === 'completed' ? 'Don complété sans paiement associé' :
                   donation.status === 'pending' ? 'Don en attente de paiement' :
                   donation.status === 'failed' ? 'Don échoué sans paiement' :
                   'Don sans paiement associé'}
                </Text>
                <Text style={[
                  styles.verificationAlertSubtitle, 
                  { 
                    color: donation.status === 'completed' ? '#2E7D32' :
                           donation.status === 'pending' ? '#1565C0' :
                           donation.status === 'failed' ? '#C62828' : '#F57C00'
                  }
                ]}>
                  {donation.status === 'completed' ? 'Vérifier pour synchroniser les données de paiement' :
                   donation.status === 'pending' ? `Le paiement via ${donation?.paymentMethod === 'moneyfusion' ? 'MoneyFusion' : donation?.paymentMethod} n'a pas encore été initialisé` :
                   donation.status === 'failed' ? 'Vérifier le statut ou réessayer le paiement' :
                   'Vérifier le statut de ce don'}
                </Text>
              </View>
              <MaterialIcons 
                name={donation.status === 'completed' ? 'sync' : 'refresh'} 
                size={20} 
                color={
                  donation.status === 'completed' ? '#2E7D32' :
                  donation.status === 'pending' ? '#1976D2' :
                  donation.status === 'failed' ? '#C62828' : '#F57C00'
                }
              />
            </View>
            <TouchableOpacity
              style={[
                styles.verificationAlertButton, 
                { 
                  backgroundColor: donation.status === 'completed' ? '#2E7D32' :
                                  donation.status === 'pending' ? '#1976D2' :
                                  donation.status === 'failed' ? '#C62828' : '#F57C00'
                }
              ]}
              onPress={
                donation.status === 'completed' 
                  ? handleVerifyPayment
                  : handleInitiatePayment
              }
              disabled={donation.status === 'completed' ? isVerifyLoading : isInitiateLoading}
            >
              {(donation.status === 'completed' ? isVerifyLoading : isInitiateLoading) ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons 
                  name={
                    donation.status === 'pending' ? 'payment' :
                    donation.status === 'failed' ? 'refresh' :
                    donation.status === 'completed' ? 'sync' : 'help'
                  } 
                  size={16} 
                  color="#FFFFFF" 
                />
              )}
              <Text style={styles.verificationAlertButtonText}>
                {(donation.status === 'completed' ? isVerifyLoading : isInitiateLoading) ? 'Traitement...' :
                 donation.status === 'pending' ? 'Initier le paiement' :
                 donation.status === 'failed' ? 'Réessayer le paiement' :
                 donation.status === 'completed' ? 'Vérifier le statut' : 
                 'Action'}
              </Text>
            </TouchableOpacity>
          </View>
        )}



        {/* Montant principal */}
        <View style={[styles.amountCard, { backgroundColor: colors.primary }]}>
          <Text
            style={styles.amountValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {donationService.formatAmount(donation.amount, donation.currency)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: donationService.getStatusColor(donation.status) }]}>
            <Text style={styles.statusText} numberOfLines={1}>
              {donationService.formatStatus(donation.status)}
            </Text>
          </View>
          <Text style={styles.amountSubtext} numberOfLines={1}>
            {donationService.formatCategory(donation.category)}
          </Text>
          <Text style={styles.receiptNumber} numberOfLines={1}>
            {donation.receipt?.number ? `Reçu : ${donation.receipt.number}` : 'Reçu disponible après paiement'}
          </Text>
        </View>

        {/* Informations générales */}
        <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Informations générales
          </Text>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="category" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Catégorie
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {donationService.formatCategory(donation.category)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="schedule" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Type
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {donation.type === 'one_time' ? 'Don unique' : 'Don récurrent'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Date de création
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(donation.createdAt)}
              </Text>
            </View>
          </View>

          {donation.isAnonymous && (
            <View style={styles.infoRow}>
              <MaterialIcons name="visibility-off" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Anonymat
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  Don anonyme
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Message personnel */}
        {donation.message && (
          <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Message personnel
            </Text>
            <Text style={[styles.messageText, { color: colors.text }]}>
              "{donation.message}"
            </Text>
          </View>
        )}

        {/* Informations de récurrence */}
        {donation.type === 'recurring' && donation.recurring && (
          <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Récurrence
              </Text>
              {donation.recurring.isActive && (
                <View style={[styles.activeBadge, { backgroundColor: COLORS.success + '20' }]}>
                  <Text style={[styles.activeBadgeText, { color: COLORS.success }]}>
                    Actif
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="repeat" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Fréquence
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {donation.recurring.frequency === 'daily' ? 'Quotidien' :
                   donation.recurring.frequency === 'weekly' ? 'Hebdomadaire' :
                   donation.recurring.frequency === 'monthly' ? 'Mensuel' :
                   donation.recurring.frequency === 'quarterly' ? 'Trimestriel' :
                   donation.recurring.frequency === 'yearly' ? 'Annuel' : donation.recurring.frequency}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="event" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Date de début
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {formatDate(donation.recurring.startDate)}
                </Text>
              </View>
            </View>

            {getNextPaymentDate() && (
              <View style={styles.infoRow}>
                <MaterialIcons name="event-available" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    Prochain paiement
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {getNextPaymentDate()}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <MaterialIcons name="timeline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Occurrences
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {`${donation.recurring.currentOccurrence || 1}${donation.recurring.maxOccurrences ? ` / ${donation.recurring.maxOccurrences}` : ''}`}
                </Text>
              </View>
            </View>

            {donation.recurring.isActive && (
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: COLORS.error + '20' }]}
                onPress={handleCancelRecurring}
                disabled={isVerifyLoading}
              >
                <MaterialIcons name="cancel" size={20} color={COLORS.error} />
                <Text style={[styles.cancelButtonText, { color: COLORS.error }]}>
                  Annuler la récurrence
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Informations de paiement */}
        <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Paiement
          </Text>

          {payment ? (
            <>
              <View style={styles.infoRow}>
                <MaterialIcons 
                  name={paymentService.getProviderIcon(payment.provider) as any} 
                  size={20} 
                  color={colors.primary} 
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    Méthode
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {paymentService.formatProvider(payment.provider)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="info" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    Statut
                  </Text>
                  <View style={styles.paymentStatusContainer}>
                    <View style={[styles.paymentStatusBadge, { backgroundColor: paymentService.getStatusColor(payment.status) + '20' }]}>
                      <Text style={[styles.paymentStatusText, { color: paymentService.getStatusColor(payment.status) }]}>
                        {paymentService.formatStatus(payment.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {false && payment?.fees && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="account-balance" size={20} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                      Frais
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {paymentService.formatAmount(payment?.fees?.processingFee || 0, payment?.fees?.currency || 'XOF')}
                    </Text>
                  </View>
                </View>
              )}

              {(['pending', 'processing', 'initialized'].includes(payment.status)) && (
                <TouchableOpacity
                  style={[styles.verifyButton, { backgroundColor: colors.primary + '20' }]}
                  onPress={handleVerifyPayment}
                  disabled={isVerifyLoading}
                >
                  {isVerifyLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <MaterialIcons name="refresh" size={20} color={colors.primary} />
                  )}
                  <Text style={[styles.verifyButtonText, { color: colors.primary }]}>
                    {isVerifyLoading ? 'Vérification...' : 'Vérifier le paiement'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <MaterialIcons name="payment" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    Méthode prévue
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {donation?.paymentMethod === 'moneyfusion' ? 'MoneyFusion' : donation?.paymentMethod || 'Non définie'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons 
                  name={
                    donation?.status === 'completed' ? 'check-circle' :
                    donation?.status === 'pending' ? 'hourglass-empty' :
                    donation?.status === 'failed' ? 'error' : 'help'
                  } 
                  size={20} 
                  color={
                    donation?.status === 'completed' ? COLORS.success :
                    donation?.status === 'pending' ? '#FF9800' :
                    donation?.status === 'failed' ? COLORS.error : colors.primary
                  } 
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    Statut
                  </Text>
                  <View style={styles.paymentStatusContainer}>
                    <View style={[
                      styles.paymentStatusBadge, 
                      { 
                        backgroundColor: (
                          donation?.status === 'completed' ? COLORS.success :
                          donation?.status === 'pending' ? '#FF9800' :
                          donation?.status === 'failed' ? COLORS.error : colors.primary
                        ) + '20' 
                      }
                    ]}>
                      <Text style={[
                        styles.paymentStatusText, 
                        { 
                          color: donation?.status === 'completed' ? COLORS.success :
                                 donation?.status === 'pending' ? '#FF9800' :
                                 donation?.status === 'failed' ? COLORS.error : colors.primary
                        }
                      ]}>
                        {donation?.status === 'completed' ? 'Complété sans paiement' :
                         donation?.status === 'pending' ? 'En attente d\'initialisation' :
                         donation?.status === 'failed' ? 'Échec sans paiement' :
                         'Statut inconnu'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.verifyButton, { backgroundColor: colors.primary + '20' }]}
                onPress={handleInitiatePayment}
                disabled={isInitiateLoading}
              >
                {isInitiateLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialIcons 
                    name={
                      donation?.status === 'pending' ? 'payment' :
                      donation?.status === 'failed' ? 'refresh' :
                      donation?.status === 'completed' ? 'sync' : 'help'
                    } 
                    size={20} 
                    color={colors.primary} 
                  />
                )}
                <Text style={[styles.verifyButtonText, { color: colors.primary }]}>
                  {isInitiateLoading ? 'Traitement...' :
                   donation?.status === 'pending' ? 'Initier le paiement' :
                   donation?.status === 'failed' ? 'Réessayer le paiement' :
                   donation?.status === 'completed' ? 'Vérifier le statut' : 
                   'Action'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Actions */}
        <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Actions
          </Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDownloadReceipt}
            disabled={isDownloadingReceipt}
          >
            {isDownloadingReceipt ? (
              <ActivityIndicator size={24} color={colors.primary} />
            ) : (
              <MaterialIcons name="receipt" size={24} color={colors.primary} />
            )}
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Télécharger le reçu
              </Text>
              <Text style={[styles.actionSubtitle, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Reçu fiscal pour vos impôts
              </Text>
            </View>
            {!isDownloadingReceipt && (
              <MaterialIcons name="chevron-right" size={24} color={dark ? COLORS.grayTie : COLORS.gray} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
          >
            <MaterialIcons name="share" size={24} color={colors.primary} />
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Partager
              </Text>
              <Text style={[styles.actionSubtitle, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Partager ce don avec vos proches
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={dark ? COLORS.grayTie : COLORS.gray} />
          </TouchableOpacity>

          {/* Action de vérification du paiement ou don */}
          {(
            (payment && (['pending', 'processing', 'initialized', 'failed'].includes(payment.status))) ||
            (!payment && donation && ['pending', 'completed', 'failed'].includes(donation.status))
          ) && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleVerifyPayment}
              disabled={isVerifyLoading}
            >
              {isVerifyLoading ? (
                <ActivityIndicator size={24} color={colors.primary} />
              ) : (
                <MaterialIcons name="refresh" size={24} color={colors.primary} />
              )}
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>
                  {isVerifyLoading ? 'Vérification en cours...' : 
                   payment ? 'Vérifier le paiement' : 'Vérifier le don'}
                </Text>
                <Text style={[styles.actionSubtitle, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  {payment ? 
                    `Mettre à jour le statut auprès de ${paymentService.formatProvider(payment.provider)}` :
                    `Synchroniser le statut du don${donation?.paymentMethod ? ` et créer le paiement ${donation.paymentMethod}` : ''}`
                  }
                </Text>
              </View>
              {!isVerifyLoading && (
                <MaterialIcons name="chevron-right" size={24} color={dark ? COLORS.grayTie : COLORS.gray} />
              )}
            </TouchableOpacity>
          )}

          {/* Bouton d'action selon le statut du don */}
          {donation?.status === 'pending' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleInitiatePayment}
              disabled={isInitiateLoading}
            >
              {isInitiateLoading ? (
                <ActivityIndicator size={24} color={colors.primary} />
              ) : (
                <MaterialIcons name="payment" size={24} color={colors.primary} />
              )}
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>
                  {isInitiateLoading ? 'Préparation du paiement...' : 'Payer maintenant'}
                </Text>
                <Text style={[styles.actionSubtitle, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Aller directement à la page de paiement pour ce don
                </Text>
              </View>
              {!isInitiateLoading && (
                <MaterialIcons name="chevron-right" size={24} color={dark ? COLORS.grayTie : COLORS.gray} />
              )}
            </TouchableOpacity>
          )}

          {donation?.status === 'failed' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleInitiatePayment}
              disabled={isInitiateLoading}
            >
              {isInitiateLoading ? (
                <ActivityIndicator size={24} color={colors.primary} />
              ) : (
                <MaterialIcons name="refresh" size={24} color={colors.primary} />
              )}
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>
                  {isInitiateLoading ? 'Création en cours...' : 'Réessayer le paiement'}
                </Text>
                <Text style={[styles.actionSubtitle, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Créer un nouveau don avec les mêmes données
                </Text>
              </View>
              {!isInitiateLoading && (
                <MaterialIcons name="chevron-right" size={24} color={dark ? COLORS.grayTie : COLORS.gray} />
              )}
            </TouchableOpacity>
          )}

          {/* Toujours afficher le bouton "Nouveau don" */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateDonation')}
          >
            <MaterialIcons name="add" size={24} color={colors.primary} />
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Nouveau don
              </Text>
              <Text style={[styles.actionSubtitle, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Faire un autre don
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={dark ? COLORS.grayTie : COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Suppression de la section "Document" qui redirigeait vers l'écran Documents */}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  amountCard: {
    margin: 20,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    width: '100%',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  amountSubtext: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 8,
    textAlign: 'center',
  },
  receiptNumber: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    margin: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
  },
  bottomPadding: {
    height: 20,
  },
  verificationAlert: {
    margin: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verificationAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationAlertText: {
    flex: 1,
    marginHorizontal: 12,
  },
  verificationAlertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  verificationAlertSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  verificationAlertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  verificationAlertButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionSection: {
    margin: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});

export default DonationDetailScreen; 