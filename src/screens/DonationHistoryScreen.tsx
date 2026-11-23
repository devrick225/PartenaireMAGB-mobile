import logger from '../utils/logger';
import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { showError, showSuccess } from '../store/slices/notificationSlice';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import {
  useDS,
  AppText,
  HeroHeader,
  HeroChip,
  IconButton,
  SegmentedTabs,
  Card,
  StatusBadge,
  Badge,
  Button,
  EmptyState,
  LoadingState,
  formatAmount,
  formatDate,
} from '../design/components';
import { cardShadow, radius, spacing } from '../design/tokens';
import donationService, { Donation, DonationFilters } from '../store/services/donationService';

interface DonationHistoryScreenProps {
  navigation: any;
  route?: {
    params?: {
      showOnlyDonations?: boolean;
    };
  };
}

const DonationHistoryScreen: React.FC<DonationHistoryScreenProps> = ({ navigation, route }) => {
  const { c } = useDS();
  const showOnlyDonations = route?.params?.showOnlyDonations || false;
  
  const dispatch = useDispatch();
  const PAGE_SIZE = 20;

  const [donations, setDonations] = useState<Donation[]>([]);
  const [recurringDonations, setRecurringDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'recurring'>('all');
  // Pagination par onglet (le backend renvoie les dons page par page : seuls les 10 premiers s'affichaient)
  const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, totalDocs: 0 });
  const requestIdRef = useRef(0);

  const loadDonations = useCallback(async (isRefresh = false, page = 1) => {
    const requestId = ++requestIdRef.current; // ignorer les réponses d'un onglet quitté entre-temps
    if (page > 1) setIsLoadingMore(true);
    else if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = selectedTab === 'all' || showOnlyDonations
        ? await donationService.getDonationHistory({
            page,
            limit: PAGE_SIZE,
            // « Mes donations » : filtrage côté serveur (sinon une page de 10 pouvait sembler vide)
            ...(showOnlyDonations ? { type: 'one_time' } : {}),
          } as any)
        : await donationService.getRecurringDonations({ page, limit: PAGE_SIZE });

      if (requestId !== requestIdRef.current) return;
      const list: Donation[] = response.data.data.donations || [];
      const pagination = response.data.data.pagination;
      const setList = selectedTab === 'all' || showOnlyDonations ? setDonations : setRecurringDonations;

      setList(prev => {
        if (page === 1) return list;
        const ids = new Set(prev.map(d => d._id));
        return [...prev, ...list.filter(d => !ids.has(d._id))];
      });
      setPageInfo({
        page,
        pages: pagination?.pages ?? 1,
        totalDocs: pagination?.totalDocs ?? list.length,
      });
    } catch (error) {
      logger.error('Erreur chargement dons:', (error as any)?.message);
      if (requestId === requestIdRef.current) {
        dispatch(showError({ title: 'Erreur', message: 'Impossible de charger l\'historique des dons' }) as any);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
        setHasLoaded(true);
      }
    }
  }, [selectedTab, showOnlyDonations, dispatch]);

  const handleLoadMore = () => {
    if (isLoading || isLoadingMore || isRefreshing) return;
    if (pageInfo.page < pageInfo.pages) loadDonations(false, pageInfo.page + 1);
  };

  const handleCancelRecurring = async (donationId: string) => {
    Alert.alert(
      'Annuler le don récurrent',
      'Êtes-vous sûr de vouloir annuler ce don récurrent ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await donationService.cancelRecurringDonation(donationId, 'Annulé par l\'utilisateur');
              dispatch(showSuccess({ title: 'Don récurrent annulé', message: 'Aucune nouvelle échéance ne sera générée.' }) as any);
              loadDonations(true);
            } catch (error: any) {
              logger.error('Erreur annulation don récurrent:', error?.message);
              dispatch(showError({ title: 'Erreur', message: error?.response?.data?.error || 'Impossible d\'annuler le don récurrent' }) as any);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Recharge à l'ouverture, au changement d'onglet et à chaque retour sur l'écran
  useFocusEffect(
    useCallback(() => {
      loadDonations(false, 1);
    }, [loadDonations])
  );


  const renderDonationItem = ({ item }: { item: Donation }) => {
    const isOccurrence = !!item.recurringParent;
    const isRecurring = item.type === 'recurring';
    return (
      <Pressable
        onPress={() => navigation.navigate('DonationDetail', { donationId: item._id })}
        accessibilityRole="button"
        accessibilityLabel={`Don de ${formatAmount(item.amount, item.currency)}, ${donationService.formatCategory(item.category)}, ${formatDate(item.createdAt)}`}
        style={({ pressed }) => [
          styles.card,
          cardShadow,
          { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View style={styles.cardTop}>
          <View style={[styles.iconTile, { backgroundColor: c.primarySoft }]}>
            <MaterialIcons name={donationService.getCategoryIcon(item.category) as any} size={22} color={c.primary} />
          </View>
          <View style={styles.flex}>
            <AppText variant="subtitle" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {formatAmount(item.amount, item.currency)}
            </AppText>
            <AppText variant="small" color={c.mutedForeground} numberOfLines={1}>
              {donationService.formatCategory(item.category)} · {formatDate(item.createdAt)}
            </AppText>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {(isOccurrence || isRecurring) && (
          <View style={styles.badges}>
            {isOccurrence && (
              <Badge
                tone="primary"
                icon="calendar-outline"
                label={item.occurrenceNumber ? `Échéance n°${item.occurrenceNumber}` : 'Échéance'}
              />
            )}
            {isRecurring && <Badge tone="primary" icon="repeat" label="Récurrent" />}
          </View>
        )}

        <View style={[styles.meta, { borderTopColor: c.border }]}>
          <View style={styles.metaItem}>
            <Ionicons name="receipt-outline" size={14} color={c.mutedForeground} />
            <AppText variant="caption" color={c.mutedForeground} numberOfLines={1}>
              {item.receipt?.number ? `Reçu n°${item.receipt.number}` : 'Reçu disponible après paiement'}
            </AppText>
          </View>
          {item.recurring?.nextPaymentDate ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={c.mutedForeground} />
              <AppText variant="caption" color={c.mutedForeground}>
                Prochaine échéance : {formatDate(item.recurring.nextPaymentDate)}
              </AppText>
            </View>
          ) : null}
        </View>

        {item.message ? (
          <AppText variant="small" color={c.mutedForeground} numberOfLines={2} style={styles.message}>
            « {item.message} »
          </AppText>
        ) : null}

        {isRecurring && item.recurring?.isActive && (
          <Button
            title="Arrêter ce don récurrent"
            variant="outline"
            icon="stop-circle-outline"
            onPress={() => handleCancelRecurring(item._id)}
            style={{ marginTop: spacing.md, minHeight: 44 }}
          />
        )}
      </Pressable>
    );
  };

  const currentDonations = showOnlyDonations ? donations : (selectedTab === 'all' ? donations : recurringDonations);
  const title = showOnlyDonations ? 'Mes dons ponctuels' : 'Historique des dons';

  const header = (
    <>
      <HeroHeader
        eyebrow="Mes dons"
        eyebrowIcon="heart-outline"
        title={title}
        onBack={() => navigation.goBack()}
        right={
          <IconButton
            icon={isRefreshing ? 'hourglass-outline' : 'refresh'}
            tone="hero"
            accessibilityLabel="Actualiser"
            onPress={() => loadDonations(true)}
          />
        }
      >
        {hasLoaded ? (
          <View style={styles.chips}>
            <HeroChip icon="heart" label={`${pageInfo.totalDocs} don${pageInfo.totalDocs > 1 ? 's' : ''}`} />
          </View>
        ) : null}
      </HeroHeader>
      <View style={styles.headerBody}>
        {!showOnlyDonations && (
          <SegmentedTabs
            value={selectedTab}
            onChange={(key) => {
              if (key !== selectedTab) {
                setHasLoaded(false);
                setSelectedTab(key);
              }
            }}
            options={[
              { key: 'all', label: 'Tous les dons', icon: 'list-outline' },
              { key: 'recurring', label: 'Récurrents', icon: 'repeat' },
            ]}
          />
        )}
        <Button
          title="Faire un don"
          variant="gold"
          icon="add-circle-outline"
          onPress={() => navigation.navigate('CreateDonation', selectedTab === 'recurring' && !showOnlyDonations ? { initialType: 'recurring' } : undefined)}
        />
      </View>
    </>
  );

  return (
    <View style={[styles.flex, { backgroundColor: c.background }]}>
      <FlatList
        data={currentDonations}
        renderItem={renderDonationItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isLoadingMore ? <ActivityIndicator style={{ marginVertical: spacing.lg }} color={c.primary} /> : undefined
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadDonations(true)} colors={[c.primary]} tintColor={c.primary} />
        }
        ListEmptyComponent={
          hasLoaded && !isLoading ? (
            <View style={styles.pad}>
              <Card>
                <EmptyState
                  icon={selectedTab === 'recurring' && !showOnlyDonations ? 'repeat' : 'heart-outline'}
                  title="Aucun don pour le moment"
                  message={
                    showOnlyDonations
                      ? 'Vous n\'avez pas encore fait de don ponctuel.'
                      : selectedTab === 'all'
                        ? 'Vos dons apparaîtront ici dès votre première contribution.'
                        : 'Vous n\'avez pas de don récurrent.'
                  }
                />
              </Card>
            </View>
          ) : (
            <LoadingState message="Chargement de vos dons…" />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { paddingBottom: spacing.xxl },
  headerBody: { paddingHorizontal: spacing.lg, marginTop: -spacing.lg, marginBottom: spacing.lg, gap: spacing.md },
  pad: { paddingHorizontal: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconTile: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  meta: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  message: { marginTop: spacing.sm, fontStyle: 'italic' },
});

export default DonationHistoryScreen;
