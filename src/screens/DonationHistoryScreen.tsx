import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import MenuRefreshIcon from '../components/MenuRefreshIcon';
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
  const { colors, dark } = useTheme();
  const showOnlyDonations = route?.params?.showOnlyDonations || false;
  
  const [donations, setDonations] = useState<Donation[]>([]);
  const [recurringDonations, setRecurringDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'recurring'>('all');

  const loadDonations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (selectedTab === 'all') {
        const response = await donationService.getDonationHistory();
        const allDonations = response.data.data.donations || [];
        
        // Si showOnlyDonations est true, filtrer pour exclure les dons récurrents
        if (showOnlyDonations) {
          const filteredDonations = allDonations.filter((donation: Donation) => donation.type !== 'recurring');
          setDonations(filteredDonations);
        } else {
          setDonations(allDonations);
        }
      } else {
        const response = await donationService.getRecurringDonations();
        setRecurringDonations(response.data.data.donations || []);
      }
    } catch (error) {
      console.error('Erreur chargement dons:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique des dons');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTab, showOnlyDonations]);

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
              Alert.alert('Succès', 'Le don récurrent a été annulé');
              loadDonations(true);
            } catch (error) {
              console.error('Erreur annulation don récurrent:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler le don récurrent');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadDonations(true);
  }, [selectedTab, showOnlyDonations, loadDonations]);

  const renderDonationItem = ({ item }: { item: Donation }) => (
    <TouchableOpacity
      style={[styles.donationCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
      onPress={() => navigation.navigate('DonationDetail', { donationId: item._id })}
    >
      <View style={styles.donationHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '20' }]}>
          <MaterialIcons
            name={donationService.getCategoryIcon(item.category) as any}
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={styles.donationInfo}>
          <Text style={[styles.donationAmount, { color: colors.text }]}>
            {donationService.formatAmount(item.amount, item.currency)}
          </Text>
          <Text style={[styles.donationCategory, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {donationService.formatCategory(item.category)}
          </Text>
        </View>
        <View style={styles.donationMeta}>
          <View style={[styles.statusBadge, { backgroundColor: donationService.getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: donationService.getStatusColor(item.status) }]}>
              {donationService.formatStatus(item.status)}
            </Text>
          </View>
          {item.type === 'recurring' && (
            <View style={[styles.recurringBadge, { backgroundColor: colors.primary + '20' }]}>
              <MaterialIcons name="repeat" size={12} color={colors.primary} />
              <Text style={[styles.recurringText, { color: colors.primary }]}>
                Récurrent
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.donationDetails}>
        <View style={styles.donationDetailRow}>
          <MaterialIcons name="receipt" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
          <Text style={[styles.donationDetailText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Reçu #{item.receipt.number}
          </Text>
        </View>
        <View style={styles.donationDetailRow}>
          <MaterialIcons name="event" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
          <Text style={[styles.donationDetailText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {new Date(item.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        {item.recurring && (
          <View style={styles.donationDetailRow}>
            <MaterialIcons name="schedule" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
            <Text style={[styles.donationDetailText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Prochaine: {item.recurring.nextPaymentDate ? 
                new Date(item.recurring.nextPaymentDate).toLocaleDateString('fr-FR') : 
                'Non définie'
              }
            </Text>
          </View>
        )}
      </View>

      {item.message && (
        <View style={styles.donationMessage}>
          <Text style={[styles.messageText, { color: dark ? COLORS.grayTie : COLORS.gray }]} numberOfLines={2}>
            "{item.message}"
          </Text>
        </View>
      )}

      {item.type === 'recurring' && item.recurring?.isActive && (
        <View style={styles.donationActions}>
          <TouchableOpacity
            onPress={() => handleCancelRecurring(item._id)}
            style={[styles.actionButton, { borderColor: '#FF5722' }]}
          >
            <MaterialIcons name="stop" size={16} color="#FF5722" />
            <Text style={[styles.actionButtonText, { color: '#FF5722' }]}>
              Annuler
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const currentDonations = showOnlyDonations ? donations : (selectedTab === 'all' ? donations : recurringDonations);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {showOnlyDonations ? 'Mes Donations' : 'Historique des dons'}
        </Text>
        <MenuRefreshIcon
          onPress={() => loadDonations(true)}
          isRefreshing={isRefreshing}
          size={24}
          color={colors.primary}
          style={{ backgroundColor: colors.primary + '15', borderRadius: 20 }}
        />
      </View>

      {/* Tabs */}
      {!showOnlyDonations && (
        <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: selectedTab === 'all' 
                  ? colors.primary 
                  : (dark ? COLORS.dark2 : COLORS.white),
              },
            ]}
            onPress={() => setSelectedTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTab === 'all' 
                    ? '#FFFFFF' 
                    : colors.text,
                },
              ]}
            >
              Tous les dons
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: selectedTab === 'recurring' 
                  ? colors.primary 
                  : (dark ? COLORS.dark2 : COLORS.white),
              },
            ]}
            onPress={() => setSelectedTab('recurring')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTab === 'recurring' 
                    ? '#FFFFFF' 
                    : colors.text,
                },
              ]}
            >
              Dons récurrents
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Donations List */}
      <FlatList
        data={currentDonations}
        renderItem={renderDonationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadDonations(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={64} color={dark ? COLORS.grayTie : COLORS.gray} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Aucun don trouvé
              </Text>
              <Text style={[styles.emptyText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                {showOnlyDonations 
                  ? 'Vous n\'avez pas encore fait de donation'
                  : selectedTab === 'all' 
                    ? 'Vous n\'avez pas encore fait de don'
                    : 'Vous n\'avez pas de don récurrent'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )
        }
      />
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  donationCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  donationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  donationInfo: {
    flex: 1,
  },
  donationAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  donationCategory: {
    fontSize: 14,
  },
  donationMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  recurringText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  donationDetails: {
    gap: 6,
    marginBottom: 12,
  },
  donationDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  donationDetailText: {
    fontSize: 12,
  },
  donationMessage: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  donationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});

export default DonationHistoryScreen;
