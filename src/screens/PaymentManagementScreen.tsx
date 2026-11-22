import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import paymentService, { Payment } from '../store/services/paymentService';

interface PaymentManagementScreenProps {
  navigation: any;
}

const PaymentManagementScreen: React.FC<PaymentManagementScreenProps> = ({ navigation }) => {
  const { dark, colors } = useTheme();
  
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async (showSpinner = true) => {
    try {
      if (showSpinner) setIsLoading(true);
      setLoadError(false);

      // Charger les paiements en attente
      const response = await paymentService.getPayments({
        status: 'pending',
        limit: 50,
        page: 1,
      });

      if (response.data.success) {
        const list = response.data.data.payments || [];
        setPendingPayments(list);
        // Nombre réel côté serveur (la liste est limitée à 50)
        setTotalPending(response.data.data.pagination?.totalDocs ?? list.length);
      }
    } catch (error) {
      console.error('Erreur chargement paiements en attente:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingPayments(false); // pas d'écran de chargement plein pendant le tirer-pour-rafraîchir
    setRefreshing(false);
  };

  // Vérification ciblée d'un paiement (ex: un fidèle signale un paiement non pris en compte)
  const verifyIndividualPayment = (payment: Payment) => {
    if (verifyingId) return;
    Alert.alert(
      'Vérifier ce paiement',
      `Interroger ${paymentService.formatProvider(payment.provider)} pour le paiement de ${paymentService.formatAmount(payment.amount, payment.currency)} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vérifier',
          onPress: async () => {
            try {
              setVerifyingId(payment._id);
              const response = await paymentService.verifyPayment(payment._id);
              if (response.data.success) {
                const result = response.data.data;
                Alert.alert(
                  'Vérification terminée',
                  `Statut : ${paymentService.formatStatus(result.status)}${result.message ? `\n${result.message}` : ''}`
                );
                await loadPendingPayments(false);
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.error || 'Erreur lors de la vérification');
            } finally {
              setVerifyingId(null);
            }
          },
        },
      ]
    );
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
      disabled={!!verifyingId}
      accessibilityRole="button"
      accessibilityLabel={`Vérifier le paiement de ${paymentService.formatAmount(item.amount, item.currency)}`}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text
            style={[styles.paymentAmount, { color: colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {paymentService.formatAmount(item.amount, item.currency)}
          </Text>
          <Text style={[styles.paymentProvider, { color: dark ? COLORS.grayTie : COLORS.gray }]} numberOfLines={1}>
            {paymentService.formatProvider(item.provider)}
          </Text>
        </View>
        
        <View style={styles.paymentMeta}>
          <View style={[styles.statusBadge, { backgroundColor: paymentService.getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: paymentService.getStatusColor(item.status) }]}>
              {paymentService.formatStatus(item.status)}
            </Text>
          </View>
          {verifyingId === item._id ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialIcons name="refresh" size={20} color={colors.primary} />
          )}
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="receipt" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
          <Text style={[styles.detailText, { color: dark ? COLORS.grayTie : COLORS.gray }]} numberOfLines={1}>
            {item.donation
              ? `Don : ${paymentService.formatCategory(item.donation.category)} · ${item.donation.type === 'recurring' ? 'Récurrent' : 'Unique'}`
              : 'Don introuvable'}
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
          <Text style={[styles.detailText, { color: dark ? COLORS.grayTie : COLORS.gray }]} numberOfLines={1}>
            {item.user ? `${item.user.firstName ?? ''} ${item.user.lastName ?? ''}`.trim() : 'Utilisateur supprimé'}
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
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Gestion des paiements
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {/* Statistiques */}
        <View style={[styles.statsCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            Paiements en attente
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {totalPending}
              </Text>
              <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                En attente
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FF9800' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {pendingPayments.filter(p => p.provider === 'moneyfusion').length}
              </Text>
              <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                MoneyFusion
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#2196F3' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                {/* Somme des seuls paiements en XOF (ne pas additionner des devises différentes) */}
                {pendingPayments
                  .filter(p => !p.currency || p.currency === 'XOF')
                  .reduce((sum, p) => sum + (p.amount || 0), 0)
                  .toLocaleString('fr-FR')}
              </Text>
              <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Total XOF
              </Text>
            </View>
          </View>
        </View>

        {/* Information : la vérification est automatique */}
        <View style={[styles.actionsCard, styles.infoRow, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <MaterialIcons name="autorenew" size={20} color={colors.primary} />
          <Text style={[styles.helpText, styles.infoText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Les paiements en attente sont vérifiés automatiquement toutes les 30 minutes. Touchez un paiement pour le vérifier immédiatement.
          </Text>
        </View>

        {loadError && (
          <TouchableOpacity
            style={[styles.actionsCard, styles.infoRow, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
            onPress={() => loadPendingPayments()}
          >
            <MaterialIcons name="error-outline" size={20} color={COLORS.error} />
            <Text style={[styles.helpText, styles.infoText, { color: COLORS.error }]}>
              Impossible de charger les paiements. Touchez pour réessayer.
            </Text>
          </TouchableOpacity>
        )}

        {/* Liste des paiements */}
        {pendingPayments.length > 0 ? (
          <View style={styles.paymentsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {totalPending > pendingPayments.length
                ? `Paiements en attente (${pendingPayments.length} sur ${totalPending})`
                : `Paiements en attente (${pendingPayments.length})`}
            </Text>
            
            <FlatList
              data={pendingPayments}
              keyExtractor={(item) => item._id}
              renderItem={renderPaymentItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        ) : !loadError && (
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    marginTop: 0,
    textAlign: 'left',
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
    flex: 1,
    paddingHorizontal: 4,
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