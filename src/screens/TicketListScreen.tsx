import logger from '../utils/logger';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import {
  useDS,
  AppText,
  HeroHeader,
  HeroChip,
  IconButton,
  Card,
  Badge,
  Button,
  EmptyState,
  LoadingState,
  Sheet,
  formatDate,
} from '../design/components';
import { cardShadow, radius, spacing, typography, MIN_TOUCH } from '../design/tokens';
import ticketService, { Ticket, TicketListParams } from '../store/services/ticketService';
import useUserPermissions, { getUserRoleLabel, getUserRoleColor } from '../hooks/useUserPermissions';
import { useSelector, useDispatch } from 'react-redux';
import { showError } from '../store/slices/notificationSlice';
import { RootState } from '../store';

interface TicketListScreenProps {
  navigation: any;
  route?: { params?: { asTab?: boolean } };
}

const TicketListScreen: React.FC<TicketListScreenProps> = ({ navigation, route }) => {
  const { c } = useDS();
  const permissions = useUserPermissions();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    pages: 0,
    limit: 10,
    totalDocs: 0
  });
  
  const [filters, setFilters] = useState<TicketListParams>({
    page: 1,
    limit: 10,
    status: '',
    category: '',
    priority: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  // Filtres en cours d'édition dans la modale : appliqués seulement sur « Appliquer »
  const [draftFilters, setDraftFilters] = useState<TicketListParams>(filters);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'open', label: 'Ouvert' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'waiting_user', label: 'En attente utilisateur' },
    { value: 'waiting_admin', label: 'En attente admin' },
    { value: 'resolved', label: 'Résolu' },
    { value: 'closed', label: 'Fermé' },
    { value: 'cancelled', label: 'Annulé' },
  ];

  const categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'technical', label: 'Problème technique' },
    { value: 'payment', label: 'Problème de paiement' },
    { value: 'account', label: 'Problème de compte' },
    { value: 'donation', label: 'Question sur les dons' },
    { value: 'bug_report', label: 'Rapport de bug' },
    { value: 'feature_request', label: 'Demande de fonctionnalité' },
    { value: 'general', label: 'Question générale' },
    { value: 'complaint', label: 'Réclamation' },
    { value: 'suggestion', label: 'Suggestion' },
  ];

  const priorityOptions = [
    { value: '', label: 'Toutes les priorités' },
    { value: 'low', label: 'Faible' },
    { value: 'medium', label: 'Moyen' },
    { value: 'high', label: 'Élevé' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const loadTickets = useCallback(async (params: TicketListParams = filters, isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await ticketService.getTickets(params);
      const newTickets = response.data?.tickets || [];

      if (params.page === 1 || isRefresh) {
        setTickets(newTickets);
      } else {
        // Éviter les doublons si onEndReached se déclenche deux fois
        setTickets(prev => {
          const ids = new Set(prev.map(t => t._id));
          return [...prev, ...newTickets.filter(t => !ids.has(t._id))];
        });
      }

      if (response.data?.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      logger.error('Erreur chargement tickets:', error?.message);
      dispatch(showError({ title: 'Erreur', message: error.message || 'Impossible de charger les tickets' }) as any);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setHasLoaded(true);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    if (!permissions.canViewTicketStats) return;
    
    try {
      const response = await ticketService.getTicketStats();
      setStats(response.data);
    } catch (error: any) {
      logger.error('Erreur chargement statistiques:', error);
    }
  }, [permissions.canViewTicketStats]);

  useEffect(() => {
    loadTickets();
    // Temporairement désactivé - les statistiques seront activées plus tard
    // if (permissions.canViewTicketStats) {
    //   loadStats();
    // }
  }, []);

  const handleRefresh = () => {
    const refreshParams = { ...filters, page: 1 };
    loadTickets(refreshParams, true);
    // Temporairement désactivé - les statistiques seront activées plus tard
    // if (permissions.canViewTicketStats) {
    //   loadStats();
    // }
  };

  const handleLoadMore = () => {
    if (pagination.current < pagination.pages && !isLoading && !isRefreshing) {
      const nextParams = { ...filters, page: pagination.current + 1 };
      loadTickets(nextParams);
    }
  };

  const openFilters = () => {
    setDraftFilters(filters); // repartir des filtres actuellement appliqués
    setShowFilters(true);
  };

  const applyFilters = () => {
    const newFilters = { ...draftFilters, page: 1 };
    setFilters(newFilters);
    loadTickets(newFilters);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const resetFilters = {
      page: 1,
      limit: 10,
      status: '',
      category: '',
      priority: ''
    };
    setFilters(resetFilters);
    setDraftFilters(resetFilters);
    loadTickets(resetFilters);
    setShowFilters(false);
  };


  // Recherche locale (numéro, sujet, description, nom) sur les tickets déjà chargés
  const displayedTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(t =>
      [t.ticketNumber, t.subject, t.description, t.user?.firstName, t.user?.lastName]
        .some(v => v?.toLowerCase().includes(q))
    );
  }, [tickets, searchQuery]);

  const activeFilters = [filters.status, filters.category, filters.priority].filter(Boolean).length;

  // Ton des statuts et priorités de ticket
  const STATUS_TONE: Record<string, 'primary' | 'info' | 'warning' | 'success' | 'neutral' | 'danger'> = {
    open: 'info',
    in_progress: 'primary',
    waiting_user: 'warning',
    waiting_admin: 'warning',
    resolved: 'success',
    closed: 'neutral',
    cancelled: 'neutral',
  };
  const PRIORITY_TONE: Record<string, 'neutral' | 'info' | 'warning' | 'danger'> = {
    low: 'neutral',
    medium: 'info',
    high: 'warning',
    urgent: 'danger',
  };
  const CATEGORY_ICONS: Record<string, string> = {
    technical: 'build',
    payment: 'payment',
    account: 'account-circle',
    donation: 'favorite',
    feature_request: 'lightbulb',
    general: 'help',
    bug_report: 'bug-report',
    complaint: 'report',
    suggestion: 'emoji-objects',
  };

  const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      style={[styles.chip, { backgroundColor: active ? c.primary : c.card, borderColor: active ? c.primary : c.border }]}
    >
      <AppText variant="smallStrong" color={active ? c.primaryForeground : c.foreground}>{label}</AppText>
    </Pressable>
  );

  const renderTicketItem = ({ item }: { item: Ticket }) => (
    <Pressable
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item._id })}
      accessibilityRole="button"
      accessibilityLabel={`Ticket ${item.ticketNumber} : ${item.subject}, ${ticketService.formatTicketStatus(item.status)}`}
      style={({ pressed }) => [styles.card, cardShadow, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.iconTile, { backgroundColor: c.primarySoft }]}>
          <MaterialIcons name={(CATEGORY_ICONS[item.category] || 'help') as any} size={18} color={c.primary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="caption" color={c.mutedForeground} numberOfLines={1}>
            {item.ticketNumber} · {formatDate(item.createdAt, true)}
          </AppText>
          <AppText variant="bodyStrong" numberOfLines={2}>{item.subject}</AppText>
        </View>
      </View>
      <AppText variant="small" color={c.mutedForeground} numberOfLines={2} style={{ marginTop: spacing.sm }}>
        {item.description}
      </AppText>
      <View style={styles.badges}>
        <Badge label={ticketService.formatTicketStatus(item.status)} tone={STATUS_TONE[item.status] ?? 'neutral'} />
        <Badge label={ticketService.formatTicketPriority(item.priority)} tone={PRIORITY_TONE[item.priority] ?? 'neutral'} icon="flag-outline" />
        <Badge label={ticketService.formatTicketCategory(item.category)} tone="neutral" />
      </View>
      {(permissions.canViewAllTickets && item.user) || item.assignedTo ? (
        <View style={[styles.meta, { borderTopColor: c.border }]}>
          {permissions.canViewAllTickets && item.user ? (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={13} color={c.mutedForeground} />
              <AppText variant="caption" color={c.mutedForeground} numberOfLines={1}>
                {item.user.firstName} {item.user.lastName}
              </AppText>
            </View>
          ) : null}
          {item.assignedTo ? (
            <View style={styles.metaItem}>
              <Ionicons name="headset-outline" size={13} color={c.primary} />
              <AppText variant="caption" color={c.primary}>Assigné à {item.assignedTo.firstName}</AppText>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );

  const header = (
    <>
      <HeroHeader
        eyebrow="Support"
        eyebrowIcon="chatbubbles-outline"
        title={permissions.canViewAllTickets ? 'Tous les tickets' : 'Mes demandes'}
        subtitle={permissions.canViewAllTickets ? undefined : 'Suivez vos échanges avec l\'équipe support.'}
        onBack={route?.params?.asTab ? undefined : () => navigation.goBack()}
        right={<IconButton icon={isRefreshing ? 'hourglass-outline' : 'refresh'} tone="hero" accessibilityLabel="Actualiser" onPress={handleRefresh} />}
      >
        {hasLoaded ? (
          <View style={styles.chips}>
            <HeroChip icon="chatbubbles" label={`${pagination.totalDocs} ticket${pagination.totalDocs > 1 ? 's' : ''}`} />
          </View>
        ) : null}
      </HeroHeader>
      <View style={styles.headerBody}>
        <View style={styles.searchRow}>
          <View style={[styles.search, cardShadow, { backgroundColor: c.card, borderColor: c.border }]}>
            <Ionicons name="search" size={18} color={c.mutedForeground} />
            <TextInput
              style={[styles.searchInput, typography.body, { color: c.foreground }]}
              placeholder="Rechercher un ticket…"
              placeholderTextColor={c.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
              maxFontSizeMultiplier={1.4}
              accessibilityLabel="Rechercher un ticket"
            />
          </View>
          <Pressable
            onPress={openFilters}
            accessibilityRole="button"
            accessibilityLabel={activeFilters > 0 ? `Filtres, ${activeFilters} actifs` : 'Filtrer les tickets'}
            style={[styles.filterBtn, cardShadow, { backgroundColor: activeFilters > 0 ? c.primary : c.card, borderColor: activeFilters > 0 ? c.primary : c.border }]}
          >
            <Ionicons name="options-outline" size={20} color={activeFilters > 0 ? c.primaryForeground : c.foreground} />
            {activeFilters > 0 ? (
              <View style={[styles.filterCount, { backgroundColor: c.gold }]}>
                <AppText variant="caption" color={c.onGold} style={{ fontSize: 10, lineHeight: 12 }}>{activeFilters}</AppText>
              </View>
            ) : null}
          </Pressable>
        </View>
        {permissions.canCreateTickets ? (
          <Button title="Nouvelle demande" variant="gold" icon="add-circle-outline" onPress={() => navigation.navigate('ContactSupport')} />
        ) : null}
        {searchQuery.trim() ? (
          <AppText variant="small" color={c.mutedForeground}>
            {displayedTickets.length} résultat{displayedTickets.length > 1 ? 's' : ''} sur {tickets.length} chargé{tickets.length > 1 ? 's' : ''}
          </AppText>
        ) : null}
      </View>
    </>
  );

  const empty = () => {
    if (!hasLoaded || (isLoading && tickets.length === 0)) return <LoadingState message="Chargement des tickets…" />;
    return (
      <View style={styles.pad}>
        <Card>
          {searchQuery.trim() && tickets.length > 0 ? (
            <EmptyState icon="search-outline" title="Aucun résultat" message={`Aucun ticket ne correspond à « ${searchQuery.trim()} ».`} />
          ) : (
            <EmptyState
              icon="chatbubbles-outline"
              title="Aucun ticket"
              message={
                activeFilters > 0
                  ? 'Aucun ticket ne correspond à vos filtres.'
                  : permissions.canViewAllTickets
                    ? 'Aucun ticket pour le moment.'
                    : 'Une question ou un souci ? Écrivez à l\'équipe support.'
              }
              action={activeFilters > 0 ? <Button title="Effacer les filtres" variant="outline" onPress={resetFilters} /> : undefined}
            />
          )}
        </Card>
      </View>
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: c.background }]}>
      <FlatList
        data={displayedTickets}
        renderItem={renderTicketItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListFooterComponent={isLoading && tickets.length > 0 ? <ActivityIndicator style={{ marginVertical: spacing.lg }} color={c.primary} /> : undefined}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[c.primary]} tintColor={c.primary} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={empty}
        showsVerticalScrollIndicator={false}
      />

      <Sheet visible={showFilters} title="Filtrer les tickets" onClose={() => setShowFilters(false)}>
        <AppText variant="overline" color={c.mutedForeground}>Statut</AppText>
        <View style={styles.chipsWrap}>
          {statusOptions.map(o => (
            <Chip key={o.value || 'all'} label={o.value ? o.label : 'Tous'} active={(draftFilters.status || '') === o.value} onPress={() => setDraftFilters(prev => ({ ...prev, status: o.value as any }))} />
          ))}
        </View>
        <AppText variant="overline" color={c.mutedForeground}>Catégorie</AppText>
        <View style={styles.chipsWrap}>
          {categoryOptions.map(o => (
            <Chip key={o.value || 'all'} label={o.value ? o.label : 'Toutes'} active={(draftFilters.category || '') === o.value} onPress={() => setDraftFilters(prev => ({ ...prev, category: o.value as any }))} />
          ))}
        </View>
        <AppText variant="overline" color={c.mutedForeground}>Priorité</AppText>
        <View style={styles.chipsWrap}>
          {priorityOptions.map(o => (
            <Chip key={o.value || 'all'} label={o.value ? o.label : 'Toutes'} active={(draftFilters.priority || '') === o.value} onPress={() => setDraftFilters(prev => ({ ...prev, priority: o.value as any }))} />
          ))}
        </View>
        <View style={styles.sheetActions}>
          <Button title="Réinitialiser" variant="outline" onPress={resetFilters} fullWidth={false} style={styles.flex} />
          <Button title="Appliquer" onPress={applyFilters} fullWidth={false} style={styles.flex} />
        </View>
      </Sheet>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { paddingBottom: spacing.xxl },
  headerBody: { paddingHorizontal: spacing.lg, marginTop: -spacing.lg, marginBottom: spacing.lg, gap: spacing.md },
  pad: { paddingHorizontal: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  searchRow: { flexDirection: 'row', gap: spacing.sm },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md, minHeight: 48 },
  searchInput: { flex: 1, paddingVertical: 10 },
  filterBtn: { width: 48, height: 48, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  filterCount: { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  card: { marginHorizontal: spacing.lg, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconTile: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  meta: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: { minHeight: MIN_TOUCH - 6, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sheetActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});

export default TicketListScreen;
