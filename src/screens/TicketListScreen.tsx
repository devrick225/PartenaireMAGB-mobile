import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import MenuRefreshIcon from '../components/MenuRefreshIcon';
import ticketService, { Ticket, TicketListParams } from '../store/services/ticketService';
import useUserPermissions, { getUserRoleLabel, getUserRoleColor } from '../hooks/useUserPermissions';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import RefreshableHeader from '../components/RefreshableHeader';

interface TicketListScreenProps {
  navigation: any;
}

const TicketListScreen: React.FC<TicketListScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const permissions = useUserPermissions();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
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
  const [searchQuery, setSearchQuery] = useState('');

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'open', label: 'Ouvert' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'waiting_user', label: 'En attente utilisateur' },
    { value: 'waiting_admin', label: 'En attente admin' },
    { value: 'resolved', label: 'Résolu' },
    { value: 'closed', label: 'Fermé' },
  ];

  const categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'technical', label: 'Problème technique' },
    { value: 'payment', label: 'Problème de paiement' },
    { value: 'account', label: 'Problème de compte' },
    { value: 'donation', label: 'Question sur les dons' },
    { value: 'feature_request', label: 'Demande de fonctionnalité' },
    { value: 'general', label: 'Question générale' },
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
      
      if (params.page === 1 || isRefresh) {
        setTickets(response.data.tickets);
      } else {
        setTickets(prev => [...prev, ...response.data.tickets]);
      }
      
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Erreur chargement tickets:', error);
      Alert.alert('Erreur', error.message || 'Impossible de charger les tickets');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    if (!permissions.canViewTicketStats) return;
    
    try {
      const response = await ticketService.getTicketStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('Erreur chargement statistiques:', error);
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
    if (pagination.current < pagination.pages && !isLoading) {
      const nextParams = { ...filters, page: pagination.current + 1 };
      loadTickets(nextParams);
    }
  };

  const applyFilters = () => {
    const newFilters = { ...filters, page: 1 };
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
    loadTickets(resetFilters);
    setShowFilters(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.category) count++;
    if (filters.priority) count++;
    return count;
  };

  const renderStatsHeader = () => {
    if (!permissions.canViewTicketStats || !stats) return null;

    const formatTime = (minutes?: number) => {
      if (!minutes) return '0h';
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
    };

    return (
      <View style={[styles.statsHeader, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {stats.totalTickets || 0}
            </Text>
            <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Total
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: COLORS.warning }]}>
              {stats.openTickets + stats.inProgressTickets || 0}
            </Text>
            <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Ouverts
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>
              {stats.resolvedTickets || 0}
            </Text>
            <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Résolus
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {formatTime(stats.averageFirstResponseTime)}
            </Text>
            <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Réponse moy.
            </Text>
          </View>
        </View>
        
        {/* Statistiques détaillées pour les admins */}
        {permissions.canViewAllTickets && (
          <View style={styles.detailedStats}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: COLORS.info }]}>
                  {stats.waitingUserTickets || 0}
                </Text>
                <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Att. utilisateur
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: COLORS.warning }]}>
                  {stats.waitingAdminTickets || 0}
                </Text>
                <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Att. admin
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: COLORS.gray }]}>
                  {stats.closedTickets || 0}
                </Text>
                <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Fermés
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {formatTime(stats.averageResolutionTime)}
                </Text>
                <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Résolution moy.
                </Text>
              </View>
            </View>
          </View>
        )}
        
        <Text style={[styles.statsNote, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
          {permissions.canViewAllTickets ? 'Statistiques globales' : 'Vos statistiques'}
        </Text>
      </View>
    );
  };

  const renderTicketItem = ({ item }: { item: Ticket }) => (
    <TouchableOpacity
      style={[styles.ticketCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item._id })}
      activeOpacity={0.7}
    >
      {/* Header avec numéro et statut */}
      <View style={styles.ticketHeader}>
        <View style={styles.ticketNumberContainer}>
          <MaterialIcons name="confirmation-number" size={16} color={colors.primary} />
          <Text style={[styles.ticketNumber, { color: colors.primary }]}>
            {item.ticketNumber}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: ticketService.getStatusColor(item.status) + '20' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: ticketService.getStatusColor(item.status) }
          ]}>
            {ticketService.formatTicketStatus(item.status)}
          </Text>
        </View>
      </View>

      {/* Sujet */}
      <Text style={[styles.ticketSubject, { color: colors.text }]} numberOfLines={2}>
        {item.subject}
      </Text>

      {/* Description courte */}
      <Text style={[styles.ticketDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]} numberOfLines={2}>
        {item.description}
      </Text>

      {/* Informations utilisateur pour les agents de support */}
      {permissions.canViewAllTickets && item.user && (
        <View style={styles.userInfo}>
          <MaterialIcons name="person" size={14} color={dark ? COLORS.grayTie : COLORS.gray} />
          <Text style={[styles.userInfoText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {item.user.firstName} {item.user.lastName}
          </Text>
        </View>
      )}

      {/* Footer avec catégorie, priorité et date */}
      <View style={styles.ticketFooter}>
        <View style={styles.ticketMeta}>
          <View style={styles.metaItem}>
            <MaterialIcons 
              name={getCategoryIcon(item.category)} 
              size={14} 
              color={dark ? COLORS.grayTie : COLORS.gray} 
            />
            <Text style={[styles.metaText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              {ticketService.formatTicketCategory(item.category)}
            </Text>
          </View>
          <View style={[
            styles.priorityBadge,
            { backgroundColor: ticketService.getPriorityColor(item.priority) + '20' }
          ]}>
            <Text style={[
              styles.priorityText,
              { color: ticketService.getPriorityColor(item.priority) }
            ]}>
              {ticketService.formatTicketPriority(item.priority)}
            </Text>
          </View>
        </View>
        <Text style={[styles.ticketDate, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>

      {/* Indicateur d'assignation */}
      {item.assignedTo && (
        <View style={styles.assignedIndicator}>
          <MaterialIcons name="person" size={12} color={colors.primary} />
          <Text style={[styles.assignedText, { color: colors.primary }]}>
            Assigné à {item.assignedTo.firstName}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const getCategoryIcon = (category: string): any => {
    const icons: Record<string, string> = {
      'technical': 'build',
      'payment': 'payment',
      'account': 'account-circle',
      'donation': 'favorite',
      'feature_request': 'lightbulb',
      'general': 'help',
      'bug_report': 'bug-report',
      'complaint': 'report',
      'suggestion': 'emoji-objects'
    };
    return icons[category] || 'help';
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.filterModal, { backgroundColor: colors.background }]}>
          <View style={styles.filterHeader}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>
              Filtres
            </Text>
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              style={[styles.closeButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale300 }]}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Statut */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Statut</Text>
            <View style={styles.filterOptions}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor: filters.status === option.value
                        ? colors.primary + '20'
                        : (dark ? COLORS.dark3 : COLORS.greyscale300),
                    },
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, status: option.value }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    {
                      color: filters.status === option.value
                        ? colors.primary
                        : colors.text,
                    },
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Catégorie */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Catégorie</Text>
            <View style={styles.filterOptions}>
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor: filters.category === option.value
                        ? colors.primary + '20'
                        : (dark ? COLORS.dark3 : COLORS.greyscale300),
                    },
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, category: option.value }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    {
                      color: filters.category === option.value
                        ? colors.primary
                        : colors.text,
                    },
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priorité */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Priorité</Text>
            <View style={styles.filterOptions}>
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor: filters.priority === option.value
                        ? colors.primary + '20'
                        : (dark ? COLORS.dark3 : COLORS.greyscale300),
                    },
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, priority: option.value }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    {
                      color: filters.priority === option.value
                        ? colors.primary
                        : colors.text,
                    },
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: dark ? COLORS.dark3 : COLORS.greyscale300 }]}
              onPress={resetFilters}
            >
              <Text style={[styles.resetButtonText, { color: colors.text }]}>
                Réinitialiser
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>
                Appliquer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="support-agent" size={80} color={dark ? COLORS.grayTie : COLORS.gray} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        Aucun ticket trouvé
      </Text>
      <Text style={[styles.emptyStateText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
        {getActiveFiltersCount() > 0
          ? 'Aucun ticket ne correspond à vos filtres.'
          : permissions.canViewAllTickets 
            ? 'Aucun ticket dans le système pour le moment.'
            : 'Vous n\'avez pas encore créé de ticket de support.'}
      </Text>
      {getActiveFiltersCount() === 0 && permissions.canCreateTickets && (
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ContactSupport')}
        >
          <MaterialIcons name="add" size={20} color={COLORS.white} />
          <Text style={styles.createButtonText}>Créer un ticket</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>      
      <RefreshableHeader
        title={permissions.canViewAllTickets ? 'Tous les tickets' : 'Mes Tickets'}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        showRefreshButton={true}
        onRefreshPress={handleRefresh}
        isRefreshing={isRefreshing}
        customRightComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MenuRefreshIcon
              onPress={handleRefresh}
              isRefreshing={isRefreshing}
              size={22}
              color={colors.primary}
              style={{ backgroundColor: colors.primary + '15', borderRadius: 20, marginRight: 8 }}
            />
          </View>
        }
      />
 
      {/* Statistiques pour les rôles élevés - Temporairement désactivé */}
      {/* {renderStatsHeader()} */}

      {/* Barre de recherche et filtres */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <MaterialIcons name="search" size={20} color={dark ? COLORS.grayTie : COLORS.gray} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher un ticket..."
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: getActiveFiltersCount() > 0 ? colors.primary : (dark ? COLORS.dark2 : COLORS.white),
            },
          ]}
          onPress={() => setShowFilters(true)}
        >
          <MaterialIcons 
            name="filter-list" 
            size={20} 
            color={getActiveFiltersCount() > 0 ? COLORS.white : colors.text} 
          />
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats rapides */}
      <View style={[styles.statsContainer, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <Text style={[styles.statsText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
          {pagination.totalDocs} ticket{pagination.totalDocs > 1 ? 's' : ''} au total
        </Text>
      </View>

      {/* Liste des tickets */}
      <FlatList
        data={tickets}
        renderItem={renderTicketItem}
        keyExtractor={(item) => item._id}
        style={styles.list}
        contentContainerStyle={tickets.length === 0 ? styles.listEmpty : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal des filtres */}
      {renderFilterModal()}
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
    borderBottomColor: COLORS.greyscale300,
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  addButton: {
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
  statsHeader: {
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statsNote: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  detailedStats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyscale300,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF5722',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyscale300,
  },
  statsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  ticketCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  ticketDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyscale300,
  },
  userInfoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  ticketMeta: {
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  ticketDate: {
    fontSize: 12,
    textAlign: 'right',
  },
  assignedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyscale300,
  },
  assignedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Styles du modal de filtres
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '100%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyscale300,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSection: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TicketListScreen; 