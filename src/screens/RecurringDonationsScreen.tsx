import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import donationService from '../store/services/donationService';
import paymentService from '../store/services/paymentService';
import RefreshableHeader from '../components/RefreshableHeader';

interface RecurringDonationsScreenProps {
  navigation: any;
}

interface RecurringDonation {
  _id: string;
  amount: number;
  currency: string;
  category: string;
  status: string;
  recurring: {
    frequency: string;
    interval: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
    startDate: string;
    endDate?: string;
    maxOccurrences?: number;
    isActive: boolean;
    nextPaymentDate: string;
    totalExecutions: number;
  };
  createdAt: string;
  formattedAmount: string;
}

interface OccurrenceItem {
  id: string;
  donationId: string;
  dueDate: string;
  amount: number;
  currency: string;
  category: string;
  status: 'upcoming' | 'due' | 'paid' | 'overdue' | 'failed';
  paymentId?: string;
  occurrence: number;
}

interface RecurringFilters {
  status?: 'active' | 'inactive' | 'all';
  category?: string;
  frequency?: string;
  amountRange?: 'low' | 'medium' | 'high' | 'all';
}

const RecurringDonationsScreen: React.FC<RecurringDonationsScreenProps> = ({ navigation }) => {
  const { dark, colors } = useTheme();

  // Options de filtres
  const statusFilterOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' },
  ];

  const categoryFilterOptions = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'tithe', label: 'Dîme' },
    { value: 'offering', label: 'Offrande' },
    { value: 'building', label: 'Construction' },
    { value: 'missions', label: 'Missions' },
    { value: 'charity', label: 'Charité' },
    { value: 'education', label: 'Éducation' },
    { value: 'youth', label: 'Jeunesse' },
    { value: 'women', label: 'Femmes' },
    { value: 'men', label: 'Hommes' },
    { value: 'special', label: 'Spécial' },
    { value: 'emergency', label: 'Urgence' },
  ];

  const frequencyFilterOptions = [
    { value: '', label: 'Toutes les fréquences' },
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuel' },
    { value: 'quarterly', label: 'Trimestriel' },
    { value: 'yearly', label: 'Annuel' },
  ];

  const amountRangeOptions = [
    { value: 'all', label: 'Tous les montants' },
    { value: 'low', label: 'Moins de 10 000 XOF' },
    { value: 'medium', label: '10 000 - 50 000 XOF' },
    { value: 'high', label: 'Plus de 50 000 XOF' },
  ];

  const [recurringDonations, setRecurringDonations] = useState<RecurringDonation[]>([]);
  const [upcomingOccurrences, setUpcomingOccurrences] = useState<OccurrenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'occurrences'>('active');
  const [selectedDonation, setSelectedDonation] = useState<RecurringDonation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState<RecurringFilters>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [fabScale] = useState(new Animated.Value(1));

  useEffect(() => {
    loadRecurringDonations();
  }, []);

  const loadRecurringDonations = async () => {
    try {
      const response = await donationService.getRecurringDonations();
      console.log('Response dons récurrents:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        const donations = response.data.data.donations || [];

        // Formater les montants si pas déjà fait
        const formattedDonations = donations.map((donation: any) => ({
          ...donation,
          formattedAmount: donation.formattedAmount || formatAmount(donation.amount, donation.currency)
        }));

        setRecurringDonations(formattedDonations);
        generateUpcomingOccurrences(formattedDonations);
      } else {
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les dons récurrents');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const generateUpcomingOccurrences = (donations: RecurringDonation[]) => {
    const occurrences: OccurrenceItem[] = [];
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);

    donations.forEach(donation => {
      if (!donation.recurring.isActive) return;

      const { frequency, interval, dayOfWeek, dayOfMonth, startDate, endDate, maxOccurrences, totalExecutions } = donation.recurring;
      let currentDate = new Date(donation.recurring.nextPaymentDate);
      let occurrence = totalExecutions + 1;

      // Générer les 10 prochaines occurrences ou jusqu'à 3 mois
      for (let i = 0; i < 10 && currentDate <= threeMonthsFromNow; i++) {
        // Vérifier les limites
        if (endDate && currentDate > new Date(endDate)) break;
        if (maxOccurrences && occurrence > maxOccurrences) break;

        let status: OccurrenceItem['status'] = 'upcoming';
        const daysDiff = Math.floor((currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
          status = 'overdue';
        } else if (daysDiff <= 0) {
          status = 'due';
        } else if (daysDiff <= 7) {
          status = 'upcoming';
        }

        occurrences.push({
          id: `${donation._id}-${occurrence}`,
          donationId: donation._id,
          dueDate: currentDate.toISOString(),
          amount: donation.amount,
          currency: donation.currency,
          category: donation.category,
          status,
          occurrence
        });

        // Calculer la prochaine date
        currentDate = calculateNextDate(currentDate, frequency, interval, dayOfWeek, dayOfMonth);
        occurrence++;
      }
    });

    // Trier par date
    occurrences.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    setUpcomingOccurrences(occurrences);
  };

  const calculateNextDate = (current: Date, frequency: string, interval: number, dayOfWeek?: number, dayOfMonth?: number): Date => {
    const next = new Date(current);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + interval);
        break;
      case 'weekly':
        next.setDate(next.getDate() + (interval * 7));
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + interval);
        if (dayOfMonth) {
          next.setDate(dayOfMonth);
        }
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + (interval * 3));
        if (dayOfMonth) {
          next.setDate(dayOfMonth);
        }
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + interval);
        if (dayOfMonth) {
          next.setDate(dayOfMonth);
        }
        break;
    }

    return next;
  };

  const handlePayOccurrence = async (occurrence: OccurrenceItem) => {
    Alert.alert(
      'Payer cette occurrence',
      `Voulez-vous payer le don de ${formatAmount(occurrence.amount, occurrence.currency)} pour ${formatCategory(occurrence.category)} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Payer',
          onPress: () => {
            // Naviguer vers l'écran de création de don en mode paiement d'occurrence
            navigation.navigate('CreateDonation', {
              mode: 'pay_occurrence',
              donationId: occurrence.donationId,
              occurrence: occurrence.occurrence,
              amount: occurrence.amount,
              currency: occurrence.currency,
              category: occurrence.category,
            });
          }
        }
      ]
    );
  };

  const handleStopRecurring = async (donation: RecurringDonation) => {
    Alert.alert(
      'Arrêter le don récurrent',
      `Êtes-vous sûr de vouloir arrêter ce don récurrent ? Les paiements futurs seront annulés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Arrêter',
          style: 'destructive',
          onPress: async () => {
            try {
              await donationService.cancelRecurringDonation(donation._id, 'Arrêté par l\'utilisateur');
              Alert.alert('Succès', 'Le don récurrent a été arrêté');
              loadRecurringDonations();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'arrêter le don récurrent');
            }
          }
        }
      ]
    );
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
    }).format(amount) + ' ' + currency;
  };

  const formatCategory = (category: string) => {
    const categories: { [key: string]: string } = {
      'tithe': 'Dîme',
      'offering': 'Offrande',
      'building': 'Construction',
      'missions': 'Missions',
      'charity': 'Charité',
      'education': 'Éducation',
      'youth': 'Jeunesse',
      'women': 'Femmes',
      'men': 'Hommes',
      'special': 'Spécial',
      'emergency': 'Urgence',
    };
    return categories[category] || category;
  };

  const formatFrequency = (frequency: string, interval: number) => {
    const frequencies: { [key: string]: string } = {
      'daily': 'jour',
      'weekly': 'semaine',
      'monthly': 'mois',
      'quarterly': 'trimestre',
      'yearly': 'année'
    };

    const unit = frequencies[frequency] || frequency;
    return interval === 1 ? `Tous les ${unit}s` : `Tous les ${interval} ${unit}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return colors.primary;
      case 'due': return '#FF9800';
      case 'overdue': return '#F44336';
      case 'paid': return '#4CAF50';
      case 'failed': return '#F44336';
      default: return colors.text;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'À venir';
      case 'due': return 'À payer';
      case 'overdue': return 'En retard';
      case 'paid': return 'Payé';
      case 'failed': return 'Échoué';
      default: return status;
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value !== '' && value !== 'all').length;
  };

  const clearFilters = () => {
    setFilters({});
    setShowFilterModal(false);
  };

  const applyFilters = (newFilters: RecurringFilters) => {
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

  const filterRecurringDonations = (donations: RecurringDonation[]) => {
    return donations.filter(donation => {
      // Filtre par statut
      if (filters.status && filters.status !== 'all') {
        const isActive = donation.recurring.isActive;
        if (filters.status === 'active' && !isActive) return false;
        if (filters.status === 'inactive' && isActive) return false;
      }

      // Filtre par catégorie
      if (filters.category && filters.category !== '') {
        if (donation.category !== filters.category) return false;
      }

      // Filtre par fréquence
      if (filters.frequency && filters.frequency !== '') {
        if (donation.recurring.frequency !== filters.frequency) return false;
      }

      // Filtre par montant
      if (filters.amountRange && filters.amountRange !== 'all') {
        const amount = donation.amount;
        switch (filters.amountRange) {
          case 'low':
            if (amount >= 10000) return false;
            break;
          case 'medium':
            if (amount < 10000 || amount > 50000) return false;
            break;
          case 'high':
            if (amount <= 50000) return false;
            break;
        }
      }

      return true;
    });
  };

  const filterOccurrences = (occurrences: OccurrenceItem[]) => {
    return occurrences.filter(occurrence => {
      // Filtre par catégorie
      if (filters.category && filters.category !== '') {
        if (occurrence.category !== filters.category) return false;
      }

      // Filtre par montant
      if (filters.amountRange && filters.amountRange !== 'all') {
        const amount = occurrence.amount;
        switch (filters.amountRange) {
          case 'low':
            if (amount >= 10000) return false;
            break;
          case 'medium':
            if (amount < 10000 || amount > 50000) return false;
            break;
          case 'high':
            if (amount <= 50000) return false;
            break;
        }
      }

      return true;
    });
  };

  const renderRecurringDonationCard = ({ item }: { item: RecurringDonation }) => (
    <TouchableOpacity
      style={[styles.donationCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
      onPress={() => {
        setSelectedDonation(item);
        setShowDetailModal(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryContainer}>
          <MaterialIcons
            name="repeat"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {formatCategory(item.category)}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.recurring.isActive ? '#4CAF50' : '#F44336' }
        ]}>
          <Text style={styles.statusText}>
            {item.recurring.isActive ? 'Actif' : 'Inactif'}
          </Text>
        </View>
      </View>

      <Text style={[styles.amountText, { color: colors.text }]}>
        {item.formattedAmount}
      </Text>

      <Text style={[styles.frequencyText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
        {formatFrequency(item.recurring.frequency, item.recurring.interval)}
      </Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Exécutions
          </Text>
          <Text style={[styles.progressValue, { color: colors.text }]}>
            {item.recurring.totalExecutions}
            {item.recurring.maxOccurrences ? `/${item.recurring.maxOccurrences}` : ''}
          </Text>
        </View>

        <View style={styles.progressInfo}>
          <Text style={[styles.progressLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Prochain paiement
          </Text>
          <Text style={[styles.progressValue, { color: colors.primary }]}>
            {new Date(item.recurring.nextPaymentDate).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderOccurrenceCard = ({ item }: { item: OccurrenceItem }) => (
    <View style={[styles.occurrenceCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
      <View style={styles.occurrenceHeader}>
        <View style={styles.occurrenceInfo}>
          <Text style={[styles.occurrenceCategory, { color: colors.text }]}>
            {formatCategory(item.category)} #{item.occurrence}
          </Text>
          <Text style={[styles.occurrenceAmount, { color: colors.primary }]}>
            {formatAmount(item.amount, item.currency)}
          </Text>
        </View>

        <View style={[styles.occurrenceStatus, { borderColor: getStatusColor(item.status) }]}>
          <Text style={[styles.occurrenceStatusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.occurrenceDetails}>
        <View style={styles.occurrenceDate}>
          <MaterialIcons name="schedule" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
          <Text style={[styles.occurrenceDateText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {new Date(item.dueDate).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {(item.status === 'due' || item.status === 'overdue') && (
          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: colors.primary }]}
            onPress={() => handlePayOccurrence(item)}
          >
            <MaterialIcons name="payment" size={16} color="#FFFFFF" />
            <Text style={styles.payButtonText}>Payer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderDetailModal = () => {

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Détails du don récurrent
              </Text>

              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedDonation ? (
                <View style={[styles.detailCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
                  <Text style={[styles.detailTitle, { color: colors.text }]}>
                    Informations générales
                  </Text>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                      Catégorie
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {formatCategory(selectedDonation.category || '')}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                      Montant
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.primary }]}>
                      {selectedDonation.formattedAmount || formatAmount(selectedDonation.amount || 0, selectedDonation.currency || 'XOF')}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                      Fréquence
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedDonation.recurring ? formatFrequency(selectedDonation.recurring.frequency || 'monthly', selectedDonation.recurring.interval || 1) : 'Non spécifiée'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                      Date de début
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedDonation.recurring?.startDate ? new Date(selectedDonation.recurring.startDate).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                    </Text>
                  </View>

                  {selectedDonation.recurring?.endDate && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                        Date de fin
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {new Date(selectedDonation.recurring.endDate).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                      Exécutions
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedDonation.recurring?.totalExecutions || 0}
                      {selectedDonation.recurring?.maxOccurrences ? `/${selectedDonation.recurring.maxOccurrences}` : ' (illimité)'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                      Prochain paiement
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.primary }]}>
                      {selectedDonation.recurring?.nextPaymentDate ? new Date(selectedDonation.recurring.nextPaymentDate).toLocaleDateString('fr-FR') : 'Non programmé'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                      Statut
                    </Text>
                    <Text style={[styles.detailValue, { color: selectedDonation.recurring?.isActive ? '#4CAF50' : '#F44336' }]}>
                      {selectedDonation.recurring?.isActive ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton, { borderColor: colors.primary }]}
                      onPress={() => {
                        setShowDetailModal(false);
                        navigation.navigate('DonationDetail', { donationId: selectedDonation._id });
                      }}
                    >
                      <MaterialIcons name="edit" size={20} color={colors.primary} />
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                        Modifier
                      </Text>
                    </TouchableOpacity>

                    {selectedDonation.recurring?.isActive && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.stopButton]}
                        onPress={() => {
                          setShowDetailModal(false);
                          handleStopRecurring(selectedDonation);
                        }}
                      >
                        <MaterialIcons name="stop" size={20} color="#F44336" />
                        <Text style={[styles.actionButtonText, { color: '#F44336' }]}>
                          Arrêter
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <MaterialIcons name="error" size={48} color={dark ? COLORS.grayTie : COLORS.gray} />
                  <Text style={[styles.detailTitle, { color: colors.text, textAlign: 'center', marginTop: 16 }]}>
                    Aucune donnée disponible
                  </Text>
                  <Text style={[styles.detailLabel, { color: dark ? COLORS.grayTie : COLORS.gray, textAlign: 'center', marginTop: 8 }]}>
                    Impossible de charger les détails de ce don récurrent.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.filterModalContent, { backgroundColor: colors.background }]}>
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
            style={styles.filterScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {/* Filtre par statut */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Statut</Text>
              <View style={styles.filterOptions}>
                {statusFilterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: (filters.status === option.value) || (option.value === 'all' && !filters.status)
                          ? colors.primary + '20'
                          : 'transparent',
                        borderColor: (filters.status === option.value) || (option.value === 'all' && !filters.status)
                          ? colors.primary
                          : (dark ? COLORS.dark3 : COLORS.greyscale300),
                      },
                    ]}
                    onPress={() => setFilters(prev => ({
                      ...prev,
                      status: option.value === 'all' ? undefined : option.value as any
                    }))}
                  >
                    <Text style={[styles.filterOptionText, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    {((filters.status === option.value) || (option.value === 'all' && !filters.status)) && (
                      <MaterialIcons name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filtre par catégorie */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Catégorie</Text>
              <View style={styles.filterOptions}>
                {categoryFilterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: (filters.category === option.value) || (option.value === '' && !filters.category)
                          ? colors.primary + '20'
                          : 'transparent',
                        borderColor: (filters.category === option.value) || (option.value === '' && !filters.category)
                          ? colors.primary
                          : (dark ? COLORS.dark3 : COLORS.greyscale300),
                      },
                    ]}
                    onPress={() => setFilters(prev => ({
                      ...prev,
                      category: option.value === '' ? undefined : option.value
                    }))}
                  >
                    <Text style={[styles.filterOptionText, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    {((filters.category === option.value) || (option.value === '' && !filters.category)) && (
                      <MaterialIcons name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filtre par fréquence */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Fréquence</Text>
              <View style={styles.filterOptions}>
                {frequencyFilterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: (filters.frequency === option.value) || (option.value === '' && !filters.frequency)
                          ? colors.primary + '20'
                          : 'transparent',
                        borderColor: (filters.frequency === option.value) || (option.value === '' && !filters.frequency)
                          ? colors.primary
                          : (dark ? COLORS.dark3 : COLORS.greyscale300),
                      },
                    ]}
                    onPress={() => setFilters(prev => ({
                      ...prev,
                      frequency: option.value === '' ? undefined : option.value
                    }))}
                  >
                    <Text style={[styles.filterOptionText, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    {((filters.frequency === option.value) || (option.value === '' && !filters.frequency)) && (
                      <MaterialIcons name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filtre par montant */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Montant</Text>
              <View style={styles.filterOptions}>
                {amountRangeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: (filters.amountRange === option.value) || (option.value === 'all' && !filters.amountRange)
                          ? colors.primary + '20'
                          : 'transparent',
                        borderColor: (filters.amountRange === option.value) || (option.value === 'all' && !filters.amountRange)
                          ? colors.primary
                          : (dark ? COLORS.dark3 : COLORS.greyscale300),
                      },
                    ]}
                    onPress={() => setFilters(prev => ({
                      ...prev,
                      amountRange: option.value === 'all' ? undefined : option.value as any
                    }))}
                  >
                    <Text style={[styles.filterOptionText, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    {((filters.amountRange === option.value) || (option.value === 'all' && !filters.amountRange)) && (
                      <MaterialIcons name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterModalButtons}>
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement des dons récurrents...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <RefreshableHeader
        title="Dons récurrents"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        showRefreshButton={true}
        onRefreshPress={() => {
          setIsRefreshing(true);
          loadRecurringDonations();
        }}
        isRefreshing={isRefreshing}
      />

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'active' && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[
            styles.tabText,
            { color: selectedTab === 'active' ? colors.primary : colors.text }
          ]}>
            Dons actifs ({recurringDonations.filter(d => d.recurring.isActive).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'occurrences' && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => setSelectedTab('occurrences')}
        >
          <Text style={[
            styles.tabText,
            { color: selectedTab === 'occurrences' ? colors.primary : colors.text }
          ]}>
            Occurrences ({upcomingOccurrences.filter(o => o.status !== 'paid').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {selectedTab === 'active' ? (
        <FlatList
          data={filterRecurringDonations(recurringDonations.filter(d => d.recurring.isActive))}
          keyExtractor={(item) => item._id}
          renderItem={renderRecurringDonationCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadRecurringDonations();
              }}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="repeat"
                size={64}
                color={dark ? COLORS.grayTie : COLORS.gray}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {getActiveFiltersCount() > 0 ? 'Aucun résultat' : 'Aucun don récurrent actif'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                {getActiveFiltersCount() > 0
                  ? 'Aucun don ne correspond à vos filtres.'
                  : 'Créez votre premier don récurrent pour automatiser vos contributions'
                }
              </Text>
              {getActiveFiltersCount() > 0 ? (
                <TouchableOpacity
                  style={[styles.clearFiltersButton, { backgroundColor: colors.primary }]}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersButtonText}>Effacer les filtres</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('CreateDonation', {
                    initialType: 'recurring'
                  })}
                >
                  <MaterialIcons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Créer un don récurrent</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      ) : (
        <FlatList
          data={filterOccurrences(upcomingOccurrences)}
          keyExtractor={(item) => item.id}
          renderItem={renderOccurrenceCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadRecurringDonations();
              }}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="repeat"
                size={64}
                color={dark ? COLORS.grayTie : COLORS.gray}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {getActiveFiltersCount() > 0 ? 'Aucun résultat' : 'Aucune occurrence à venir'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                {getActiveFiltersCount() > 0
                  ? 'Aucune occurrence ne correspond à vos filtres.'
                  : 'Vos prochains paiements apparaîtront ici'
                }
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
          }
        />
      )}

      {renderDetailModal()}
      {renderFilterModal()}

      {/* Floating Action Button pour les filtres */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            transform: [{ scale: fabScale }],
          }
        ]}
      >
        <TouchableOpacity
          onPress={handleFabPress}
          activeOpacity={0.8}
          style={styles.floatingButtonTouchable}
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
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    padding: 20,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  frequencyText: {
    fontSize: 14,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  occurrenceCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  occurrenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  occurrenceInfo: {
    flex: 1,
  },
  occurrenceCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  occurrenceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  occurrenceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  occurrenceStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  occurrenceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  occurrenceDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  occurrenceDateText: {
    fontSize: 14,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
  },
  detailCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    borderWidth: 1,
  },
  stopButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  floatingButtonTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
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
  filterModalContent: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  filterScrollView: {
    maxHeight: 500,
    marginBottom: 20,
  },
  filterScrollContent: {
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
  filterModalButtons: {
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearFiltersButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RecurringDonationsScreen; 