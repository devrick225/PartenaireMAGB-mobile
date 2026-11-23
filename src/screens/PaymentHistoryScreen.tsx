import logger from '../utils/logger';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import paymentService, { Payment } from '../store/services/paymentService';
import {
  useDS,
  AppText,
  HeroHeader,
  IconButton,
  Card,
  StatCard,
  StatusBadge,
  EmptyState,
  LoadingState,
  Button,
  formatAmount,
  formatDate,
} from '../design/components';
import { cardShadow, radius, spacing, MIN_TOUCH } from '../design/tokens';

interface PaymentHistoryScreenProps {
  navigation: any;
  route?: { params?: { asTab?: boolean } };
}

interface PaymentFilters {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  provider?: string;
}

const PaymentHistoryScreen: React.FC<PaymentHistoryScreenProps> = ({ navigation, route }) => {
  const { c } = useDS();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    limit: 10,
    totalDocs: 0,
  });

  const statusOptions = [
    { value: '', label: 'Tous' },
    { value: 'completed', label: 'Payés' },
    { value: 'pending', label: 'En attente' },
    { value: 'processing', label: 'En cours' },
    { value: 'failed', label: 'Échoués' },
    { value: 'cancelled', label: 'Annulés' },
  ];

  const providerOptions = [
    { value: '', label: 'Tous les moyens' },
    { value: 'moneyfusion', label: 'MoneyFusion' },
    { value: 'geniuspay', label: 'GeniusPay' },
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

  // Totaux de l'en-tête : comptés côté serveur (toutes pages) pour que « Paiements »,
  // « Réussis » et « En attente » aient la même source. Le filtre « moyen de paiement »
  // s'applique ; le filtre de statut non (sinon les compteurs n'auraient plus de sens).
  const [totals, setTotals] = useState<{ all: number; completed: number; pending: number } | null>(null);
  const loadTotals = useCallback(async () => {
    try {
      const base: any = { page: 1, limit: 1, ...(filters.provider ? { provider: filters.provider } : {}) };
      const count = async (extra: any) => {
        const res = await paymentService.getPayments({ ...base, ...extra });
        return res.data?.data?.pagination?.totalDocs ?? 0;
      };
      const [all, completed, pending] = await Promise.all([count({}), count({ status: 'completed' }), count({ status: 'pending' })]);
      setTotals({ all, completed, pending });
    } catch (error) {
      logger.error('Erreur chargement totaux paiements:', error);
      setTotals(null);
    }
  }, [filters.provider]);

  useEffect(() => {
    loadTotals();
  }, [loadTotals]);

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
      logger.error('Erreur chargement paiements:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique des paiements');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [filters, pagination.current, pagination.limit]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTotals();
    loadPayments(true);
  };

  const loadMore = () => {
    if (!loadingMore && pagination.current < pagination.total) {
      loadPayments(false);
    }
  };


  const activeFilters = Object.values(filters).filter(value => value && value !== '').length;
  const clearFilters = () => setFilters({});

  const FilterChips = ({ options, selected, onSelect, label }: { options: { value: string; label: string }[]; selected?: string; onSelect: (v?: string) => void; label: string }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow} accessibilityLabel={label}>
      {options.map(o => {
        const active = (selected ?? '') === o.value;
        return (
          <Pressable
            key={o.value || 'all'}
            onPress={() => onSelect(o.value === '' ? undefined : o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[
              styles.chip,
              { backgroundColor: active ? c.primary : c.card, borderColor: active ? c.primary : c.border },
            ]}
          >
            <AppText variant="smallStrong" color={active ? c.primaryForeground : c.foreground}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <Pressable
      onPress={() => {
        if (item.donation?._id) navigation.navigate('DonationDetail', { donationId: item.donation._id });
      }}
      disabled={!item.donation?._id}
      accessibilityRole="button"
      accessibilityLabel={`Paiement de ${formatAmount(item.amount, item.currency)} via ${paymentService.formatProvider(item.provider)}, ${paymentService.formatStatus(item.status)}`}
      style={({ pressed }) => [
        styles.card,
        cardShadow,
        { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.iconTile, { backgroundColor: c.primarySoft }]}>
          <MaterialIcons name={paymentService.getProviderIcon(item.provider) as any} size={20} color={c.primary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="subtitle" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {formatAmount(item.amount, item.currency)}
          </AppText>
          <AppText variant="small" color={c.mutedForeground} numberOfLines={1}>
            {paymentService.formatProvider(item.provider)} · {formatDate(item.createdAt, true)}
          </AppText>
        </View>
        <StatusBadge status={item.status} />
      </View>
      {(item.donation || item.transaction?.externalId) && (
        <View style={[styles.meta, { borderTopColor: c.border }]}>
          {item.donation ? (
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={14} color={c.mutedForeground} />
              <AppText variant="caption" color={c.mutedForeground}>
                {paymentService.formatCategory(item.donation.category)}
              </AppText>
            </View>
          ) : null}
          {item.transaction?.externalId ? (
            <View style={styles.metaItem}>
              <Ionicons name="barcode-outline" size={14} color={c.mutedForeground} />
              <AppText variant="caption" color={c.mutedForeground} numberOfLines={1} selectable style={styles.flex}>
                {item.transaction.externalId}
              </AppText>
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );

  const header = (
    <>
      <HeroHeader
        eyebrow="Mes paiements"
        eyebrowIcon="wallet-outline"
        title="Historique des paiements"
        onBack={route?.params?.asTab ? undefined : () => navigation.goBack()}
        right={<IconButton icon={refreshing ? 'hourglass-outline' : 'refresh'} tone="hero" accessibilityLabel="Actualiser" onPress={onRefresh} />}
      />
      <View style={styles.headerBody}>
        <View style={styles.stats}>
          <StatCard tinted tone="primary" icon="receipt-outline" label="Paiements" value={totals ? totals.all : '—'} />
          <StatCard tinted tone="success" icon="checkmark-circle-outline" label="Réussis" value={totals ? totals.completed : '—'} />
          <StatCard tinted tone="warning" icon="time-outline" label="En attente" value={totals ? totals.pending : '—'} />
        </View>
        <View style={{ gap: spacing.sm }}>
          <AppText variant="overline" color={c.mutedForeground}>Statut</AppText>
          <FilterChips label="Filtrer par statut" options={statusOptions} selected={filters.status} onSelect={(v) => setFilters(prev => ({ ...prev, status: v as any }))} />
          <AppText variant="overline" color={c.mutedForeground} style={{ marginTop: spacing.xs }}>Moyen de paiement</AppText>
          <FilterChips label="Filtrer par moyen de paiement" options={providerOptions} selected={filters.provider} onSelect={(v) => setFilters(prev => ({ ...prev, provider: v }))} />
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.flex, { backgroundColor: c.background }]}>
      <FlatList
        data={isLoading ? [] : payments}
        keyExtractor={(item) => item._id}
        renderItem={renderPaymentItem}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} tintColor={c.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: spacing.lg }} color={c.primary} /> : undefined}
        ListEmptyComponent={
          isLoading ? (
            <LoadingState message="Chargement des paiements…" />
          ) : (
            <View style={styles.pad}>
              <Card>
                <EmptyState
                  icon="wallet-outline"
                  title="Aucun paiement"
                  message={activeFilters > 0 ? 'Aucun paiement ne correspond à vos filtres.' : 'Vous n\'avez pas encore effectué de paiement.'}
                  action={activeFilters > 0 ? <Button title="Effacer les filtres" variant="outline" onPress={clearFilters} /> : undefined}
                />
              </Card>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { paddingBottom: spacing.xxl },
  headerBody: { paddingHorizontal: spacing.lg, marginTop: -spacing.lg, marginBottom: spacing.lg, gap: spacing.lg },
  pad: { paddingHorizontal: spacing.lg },
  stats: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm },
  chipsRow: { gap: spacing.sm, paddingRight: spacing.lg },
  chip: { minHeight: MIN_TOUCH - 6, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginHorizontal: spacing.lg, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconTile: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  meta: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});

export default PaymentHistoryScreen;
