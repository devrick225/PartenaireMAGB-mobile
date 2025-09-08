import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../theme/ThemeProvider';
import DashboardHeader from '../components/DashboardHeader';
import UserCard from '../components/UserCard';
import Avatar from '../components/Avatar';
import { Colors } from 'react-native/Libraries/NewAppScreen';

const DashboardScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const dispatch = useDispatch();
  
  // Récupération des données utilisateur depuis Redux
  const user = useSelector((state) => state.auth.user);
  const isLoading = useSelector((state) => state.auth.loading);
  
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount] = useState(5); // Exemple de notifications

  // Données d'exemple - à remplacer par vos vraies données
  const [dashboardData, setDashboardData] = useState({
    recentDonations: [
      {
        id: 1,
        amount: 50000,
        date: '2024-01-15',
        cause: 'Éducation des enfants',
        status: 'completed'
      },
      {
        id: 2,
        amount: 25000,
        date: '2024-01-10',
        cause: 'Aide alimentaire',
        status: 'completed'
      },
      {
        id: 3,
        amount: 75000,
        date: '2024-01-05',
        cause: 'Soins médicaux',
        status: 'pending'
      },
    ],
    quickStats: {
      monthlyDonations: 150000,
      yearlyDonations: 850000,
      rank: 'Partenaire Or',
      nextLevelProgress: 75,
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Ici, vous chargeriez vos vraies données depuis l'API
      // await dispatch(fetchUserDashboard());
      // await dispatch(fetchRecentDonations());
      console.log('Dashboard data loaded');
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du dashboard');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleProfilePress = () => {
    navigation.navigate('ProfileSettings');
  };

  const handleNotificationPress = () => {
    navigation.navigate('Notifications');
  };

  const handleMenuPress = () => {
    navigation.openDrawer();
  };

  const handleUserCardPress = () => {
    navigation.navigate('ProfileDetails');
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleNewDonation = () => {
    navigation.navigate('CreateDonation');
  };

  const handleViewHistory = () => {
    navigation.navigate('DonationHistory');
  };

  const handleViewStats = () => {
    navigation.navigate('Statistics');
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: '#4CAF50',
      pending: '#FF9800',
      cancelled: '#F44336',
    };
    return colors[status] || '#9E9E9E';
  };

  const getStatusText = (status) => {
    const texts = {
      completed: 'Terminé',
      pending: 'En attente',
      cancelled: 'Annulé',
    };
    return texts[status] || 'Inconnu';
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Avatar
            name="Utilisateur"
            size={80}
          />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Chargement du profil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.primary}
      />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec avatar et infos utilisateur */}
        <DashboardHeader
          user={user}
          onProfilePress={handleProfilePress}
          onNotificationPress={handleNotificationPress}
          onMenuPress={handleMenuPress}
          notificationCount={notificationCount}
        />

        {/* Contenu principal */}
        <View style={styles.content}>
          {/* Carte utilisateur complète */}
          <UserCard
            user={user}
            onPress={handleUserCardPress}
            onEditPress={handleEditProfile}
            showStats={true}
            style={styles.userCard}
          />

          {/* Actions rapides */}
          <View style={styles.quickActionsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Actions rapides
            </Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={[styles.quickActionCard, { backgroundColor: theme.colors.card }]}
                onPress={handleNewDonation}
              >
                <MaterialIcons
                  name="add-circle"
                  size={32}
                  color={theme.colors.primary}
                />
                <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                  Nouveau don
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionCard, { backgroundColor: theme.colors.card }]}
                onPress={handleViewHistory}
              >
                <MaterialIcons
                  name="history"
                  size={32}
                  color={theme.colors.primary}
                />
                <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                  Historique
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionCard, { backgroundColor: theme.colors.card }]}
                onPress={handleViewStats}
              >
                <MaterialIcons
                  name="analytics"
                  size={32}
                  color={theme.colors.primary}
                />
                <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                  Statistiques
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionCard, { backgroundColor: theme.colors.card }]}
                onPress={() => navigation.navigate('Support')}
              >
                <MaterialIcons
                  name="support-agent"
                  size={32}
                  color={theme.colors.primary}
                />
                <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                  Support
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Statistiques mensuelles */}
          <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Statistiques du mois
            </Text>
            <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {formatAmount(dashboardData.quickStats.monthlyDonations)} FCFA
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Dons ce mois
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {formatAmount(dashboardData.quickStats.yearlyDonations)} FCFA
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Dons cette année
                </Text>
              </View>
            </View>
          </View>

          {/* Dons récents */}
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Dons récents
              </Text>
              <TouchableOpacity onPress={handleViewHistory}>
                <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                  Voir tout
                </Text>
              </TouchableOpacity>
            </View>

            {dashboardData.recentDonations.map((donation) => (
              <View
                key={donation.id}
                style={[styles.donationCard, { backgroundColor: theme.colors.card }]}
              >
                <View style={styles.donationHeader}>
                  <Text style={[styles.donationCause, { color: theme.colors.text }]}>
                    {donation.cause}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(donation.status) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(donation.status) }
                    ]}>
                      {getStatusText(donation.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.donationDetails}>
                  <Text style={[styles.donationAmount, { color: theme.colors.primary }]}>
                    {formatAmount(donation.amount)} FCFA
                  </Text>
                  <Text style={[styles.donationDate, { color: theme.colors.textSecondary }]}>
                    {new Date(donation.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Espace en bas pour la navigation */}
          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  userCard: {
    marginBottom: 24,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 24,
  },
  statsCard: {
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statItem: {
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  donationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  donationCause: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
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
  donationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donationAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  donationDate: {
    fontSize: 14,
  },
  bottomSpace: {
    height: 100,
  },
});

export default DashboardScreen; 