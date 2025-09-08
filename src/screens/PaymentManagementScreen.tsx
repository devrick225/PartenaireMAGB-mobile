import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import paymentService, { Payment } from '../store/services/paymentService';
import donationService from '../store/services/donationService';

interface PaymentManagementScreenProps {
  navigation: any;
}

const PaymentManagementScreen: React.FC<PaymentManagementScreenProps> = ({ navigation }) => {
  const { dark, colors } = useTheme();
  
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      setIsLoading(true);
      
      // Charger les paiements en attente
      const response = await paymentService.getPayments({
        status: 'pending',
        limit: 50,
        page: 1,
      });

      if (response.data.success) {
        setPendingPayments(response.data.data.payments);
      }
    } catch (error) {
      console.error('Erreur chargement paiements en attente:', error);
      Alert.alert('Erreur', 'Impossible de charger les paiements en attente');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingPayments();
    setRefreshing(false);
  };

  const verifyAllPendingPayments = async () => {
    Alert.alert(
      'Vérifier tous les paiements',
      `Lancer la vérification de ${pendingPayments.length} paiements en attente ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vérifier',
          onPress: async () => {
            try {
              setIsVerifying(true);

              // Appeler l'API de vérification manuelle
              const response = await donationService.verifyAllPayments();
              
              if (response.data.success) {
                const stats = response.data.data;
                
                Alert.alert(
                  'Vérification terminée',
                  `✅ ${stats.completed} paiements complétés\n❌ ${stats.failed} paiements échoués\n🔍 ${stats.checked} paiements vérifiés\n⚠️ ${stats.errors} erreurs`,
                  [{ text: 'OK', onPress: () => loadPendingPayments() }]
                );
              }
            } catch (error: any) {
              console.error('Erreur vérification:', error);
              Alert.alert('Erreur', error.response?.data?.error || 'Erreur lors de la vérification');
            } finally {
              setIsVerifying(false);
            }
          },
        },
      ]
    );
  };

  const verifyIndividualPayment = async (payment: Payment) => {
    try {
      Alert.alert(
        'Vérifier ce paiement',
        `Vérifier le paiement de ${paymentService.formatAmount(payment.amount, payment.currency)} ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Vérifier',
            onPress: async () => {
              try {
                const response = await paymentService.verifyPayment(payment._id);
                
                if (response.data.success) {
                  const result = response.data.data;
                  Alert.alert(
                    'Vérification terminée',
                    `Statut: ${paymentService.formatStatus(result.status)}\n${result.message || ''}`,
                    [{ text: 'OK', onPress: () => loadPendingPayments() }]
                  );
                }
              } catch (error: any) {
                Alert.alert('Erreur', error.response?.data?.error || 'Erreur lors de la vérification');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erreur vérification individuelle:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <TouchableOpacity
      style={[styles.paymentCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
      onPress={() => verifyIndividualPayment(item)}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={[styles.paymentAmount, { color: colors.text }]}>
            {paymentService.formatAmount(item.amount, item.currency)}
          </Text>
          <Text style={[styles.paymentProvider, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {paymentService.formatProvider(item.provider)}
          </Text>
        </View>
        
        <View style={styles.paymentMeta}>
          <View style={[styles.statusBadge, { backgroundColor: paymentService.getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: paymentService.getStatusColor(item.status) }]}>
              {paymentService.formatStatus(item.status)}
            </Text>
          </View>
          <MaterialIcons name="refresh" size={20} color={colors.primary} />
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="receipt" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
          <Text style={[styles.detailText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Don: {item.donation.category} - {item.donation.type === 'recurring' ? 'Récurrent' : 'Unique'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialIcons name="schedule" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
          <Text style={[styles.detailText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="person" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
          <Text style={[styles.detailText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {item.user.firstName} {item.user.lastName}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Chargement des paiements...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Gestion des paiements
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Statistiques */}
        <View style={[styles.statsCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            Paiements en attente
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {pendingPayments.length}
              </Text>
              <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                En attente
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FF9800' }]}>
                {pendingPayments.filter(p => p.provider === 'moneyfusion').length}
              </Text>
              <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                MoneyFusion
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#2196F3' }]}>
                {pendingPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Total XOF
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.actionsCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <TouchableOpacity
            style={[styles.verifyAllButton, { backgroundColor: colors.primary }]}
            onPress={verifyAllPendingPayments}
            disabled={isVerifying || pendingPayments.length === 0}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIcons name="sync" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.verifyAllButtonText}>
              {isVerifying ? 'Vérification...' : `Vérifier tous (${pendingPayments.length})`}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.helpText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            La vérification interroge directement MoneyFusion et met à jour automatiquement les statuts et statistiques.
          </Text>
        </View>

        {/* Liste des paiements */}
        {pendingPayments.length > 0 ? (
          <View style={styles.paymentsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Paiements en attente ({pendingPayments.length})
            </Text>
            
            <FlatList
              data={pendingPayments}
              keyExtractor={(item) => item._id}
              renderItem={renderPaymentItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="check-circle" size={64} color={COLORS.success} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aucun paiement en attente
            </Text>
            <Text style={[styles.emptySubtitle, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Tous les paiements ont été traités !
            </Text>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
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
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
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
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  actionsCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  verifyAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  paymentsSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  paymentCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentProvider: {
    fontSize: 14,
  },
  paymentMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default PaymentManagementScreen; 