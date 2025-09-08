import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import paymentService, { Payment } from '../store/services/paymentService';
import { RootState } from '../store';
import UserAvatar from '../components/UserAvatar';
import RefreshableHeader from '../components/RefreshableHeader';

interface PaymentHistoryScreenProps {
  navigation: any;
}

interface PaymentFilters {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  provider?: string;
}

const PaymentHistoryScreen: React.FC<PaymentHistoryScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    limit: 10,
    totalDocs: 0,
  });
  const [fabScale] = useState(new Animated.Value(1));

  const statusOptions = [
    { value: '', label: 'Tous les statuts', color: COLORS.gray },
    { value: 'pending', label: 'En attente', color: '#FF9800' },
    { value: 'processing', label: 'En cours', color: '#2196F3' },
    { value: 'completed', label: 'Terminé', color: '#4CAF50' },
    { value: 'failed', label: 'Échoué', color: '#F44336' },
    { value: 'cancelled', label: 'Annulé', color: '#9E9E9E' },
  ];

  const providerOptions = [
    { value: '', label: 'Tous les fournisseurs' },
    { value: 'moneyfusion', label: 'MoneyFusion' },
    /*{ value: 'cinetpay', label: 'CinetPay' },
    { value: 'stripe', label: 'Stripe' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'mtn_mobile_money', label: 'MTN Mobile Money' },
    { value: 'moov_money', label: 'Moov Money' },*/
  ];

  useEffect(() => {
    loadPayments(true);
  }, [filters]);

  const loadPayments = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setPayments([]);
      } else {
        setLoadingMore(true);
      }

      const page = reset ? 1 : pagination.current + 1;

      // Filtrer les valeurs vides avant d'envoyer à l'API
      const apiFilters: any = {
        page,
        limit: pagination.limit,
      };

      if (filters.status) {
        apiFilters.status = filters.status;
      }

      if (filters.provider) {
        apiFilters.provider = filters.provider;
      }

      const response = await paymentService.getPayments(apiFilters);

      const newPayments = response.data.data.payments;

      if (reset) {
        setPayments(newPayments);
      } else {
        setPayments(prev => [...prev, ...newPayments]);
      }

      setPagination(response.data.data.pagination);
    } catch (error: any) {
      console.error('Erreur chargement paiements:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique des paiements');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [filters, pagination.current, pagination.limit]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments(true);
  };

  const loadMore = () => {
    if (!loadingMore && pagination.current < pagination.total) {
      loadPayments(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value !== '').length;
  };

  const clearFilters = () => {
    setFilters({});
    setShowFilterModal(false);
  };

  const applyFilters = (newFilters: PaymentFilters) => {
    setFilters(newFilters);
    setShowFilterModal(false);
  };

  const handleFabPress = () => {
    // Animation de pression
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setShowFilterModal(true);
  };

  const renderPaymentItem = ({ item, index }: { item: Payment; index: number }) => (
    <TouchableOpacity
      style={[
        styles.paymentItem,
        {
          backgroundColor: dark ? COLORS.dark2 : COLORS.white,
          marginBottom: index === payments.length - 1 ? 0 : 12,
        }
      ]}
      onPress={() => {
        if (item.donation?._id) {
          navigation.navigate('DonationDetail', { donationId: item.donation._id });
        }
      }}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <View style={[styles.providerIcon, { backgroundColor: colors.primary + '20' }]}>
            <MaterialIcons
              name={paymentService.getProviderIcon(item.provider) as any}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.paymentDetails}>
            <Text style={[styles.paymentAmount, { color: colors.text }]}>
              {paymentService.formatAmount(item.amount, item.currency)}
            </Text>
            <Text style={[styles.paymentProvider, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              {paymentService.formatProvider(item.provider)}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: paymentService.getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: paymentService.getStatusColor(item.status) }]}>
            {paymentService.formatStatus(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.paymentMeta}>
        <View style={styles.paymentMetaRow}>
          <MaterialIcons name="schedule" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
          <Text style={[styles.paymentDate, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        {item.donation && (
          <View style={styles.paymentMetaRow}>
            <MaterialIcons name="category" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
            <Text style={[styles.donationCategory, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              {paymentService.formatCategory(item.donation.category)}
            </Text>
          </View>
        )}

        {item.transaction?.externalId && (
          <View style={styles.paymentMetaRow}>
            <MaterialIcons name="confirmation-number" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
            <Text style={[styles.transactionId, { color: dark ? COLORS.grayTie : COLORS.gray }]} numberOfLines={1}>
              {item.transaction.externalId}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filtres</Text>
            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              style={[styles.modalCloseButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale300 }]}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Statut</Text>
              <View style={styles.filterOptions}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: (filters.status === option.value) || (option.value === '' && !filters.status)
                          ? colors.primary + '20'
                          : 'transparent',
                        borderColor: (filters.status === option.value) || (option.value === '' && !filters.status)
                          ? colors.primary
                          : (dark ? COLORS.dark3 : COLORS.greyscale300),
                      },
                    ]}
                    onPress={() => setFilters(prev => ({
                      ...prev,
                      status: option.value === '' ? undefined : option.value as any
                    }))}
                  >
                    <Text style={[styles.filterOptionText, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    {((filters.status === option.value) || (option.value === '' && !filters.status)) && (
                      <MaterialIcons name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Fournisseur</Text>
              <View style={styles.filterOptions}>
                {providerOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: (filters.provider === option.value) || (option.value === '' && !filters.provider)
                          ? colors.primary + '20'
                          : 'transparent',
                        borderColor: (filters.provider === option.value) || (option.value === '' && !filters.provider)
                          ? colors.primary
                          : (dark ? COLORS.dark3 : COLORS.greyscale300),
                      },
                    ]}
                    onPress={() => setFilters(prev => ({
                      ...prev,
                      provider: option.value === '' ? undefined : option.value
                    }))}
                  >
                    <Text style={[styles.filterOptionText, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    {((filters.provider === option.value) || (option.value === '' && !filters.provider)) && (
                      <MaterialIcons name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.clearButton, { borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={clearFilters}
            >
              <Text style={[styles.clearButtonText, { color: colors.text }]}>Effacer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => applyFilters(filters)}
            >
              <Text style={styles.applyButtonText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <RefreshableHeader
          title="Historique des paiements"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          showRefreshButton={true}
          onRefreshPress={onRefresh}
          isRefreshing={true}
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement des paiements...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <RefreshableHeader
        title="Historique des paiements"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        showRefreshButton={true}
        onRefreshPress={onRefresh}
        isRefreshing={refreshing}
      />

      {/* Statistiques rapides */}
      <View style={[styles.statsCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{pagination.totalDocs}</Text>
          <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>Paiements</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {payments.filter(p => p.status === 'completed').length}
          </Text>
          <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>Réussis</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FF9800' }]}>
            {payments.filter(p => p.status === 'pending').length}
          </Text>
          <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>En attente</Text>
        </View>
      </View>

      {/* Liste des paiements */}
      {payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="payment" size={64} color={dark ? COLORS.grayTie : COLORS.gray} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun paiement</Text>
          <Text style={[styles.emptyText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {getActiveFiltersCount() > 0
              ? 'Aucun paiement ne correspond à vos filtres.'
              : 'Vous n\'avez pas encore effectué de paiement.'}
          </Text>
          {getActiveFiltersCount() > 0 && (
            <TouchableOpacity
              style={[styles.clearFiltersButton, { backgroundColor: colors.primary }]}
              onPress={clearFilters}
            >
              <Text style={styles.clearFiltersButtonText}>Effacer les filtres</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}

      {renderFilterModal()}

      {/* Floating Action Button pour les filtres */}
      <TouchableOpacity
        style={[
          styles.floatingButton,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          }
        ]}
        onPress={() => setShowFilterModal(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="filter-list" size={24} color="#FFFFFF" />
        {getActiveFiltersCount() > 0 && (
          <View style={styles.floatingButtonBadge}>
            <Text style={styles.floatingButtonBadgeText}>
              {getActiveFiltersCount()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyscale300 + '30',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.greyscale300,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 20,
  },
  paymentItem: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentProvider: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentMeta: {
    gap: 8,
  },
  paymentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentDate: {
    fontSize: 12,
  },
  donationCategory: {
    fontSize: 12,
  },
  transactionId: {
    fontSize: 12,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  clearFiltersButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    maxHeight: 400,
    marginBottom: 20,
  },
  modalScrollContent: {
    paddingVertical: 10,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  clearButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  floatingButtonBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  floatingButtonBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PaymentHistoryScreen; 