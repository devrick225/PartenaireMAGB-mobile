import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeProvider';
import DashboardHeader from './DashboardHeader';
import UserCard from './UserCard';
import Avatar from './Avatar';

/**
 * 🎨 EXEMPLE CONCRET D'UTILISATION
 * 
 * Cet écran montre comment intégrer tous les composants avatar
 * dans un dashboard moderne et fonctionnel.
 */
const ModernDashboardExample = ({ navigation }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  
  // Récupération des données utilisateur (Redux ou mock)
  const user = useSelector((state) => state.auth.user) || {
    firstName: 'Marie',
    lastName: 'Dupont',
    email: 'marie.dupont@example.com',
    avatar: null, // Sera remplacé par l'URL Cloudinary après upload
    role: 'user',
    partnerLevel: 'or',
    totalDonations: 1250000,
    donationCount: 28,
    level: 5,
    points: 3750,
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  // Données d'exemple pour le dashboard
  const [dashboardData] = useState({
    notifications: 7,
    recentDonations: [
      { id: 1, amount: 50000, cause: 'Éducation', date: '2024-01-15' },
      { id: 2, amount: 25000, cause: 'Santé', date: '2024-01-12' },
      { id: 3, amount: 75000, cause: 'Environnement', date: '2024-01-10' },
    ],
    topDonors: [
      { id: 1, name: 'Ahmed Ben Ali', amount: 500000, level: 'or' },
      { id: 2, name: 'Sophie Martin', amount: 350000, level: 'argent' },
      { id: 3, name: 'Pierre Durand', amount: 200000, level: 'bronze' },
      { id: 4, name: 'Lisa Johnson', amount: 150000, level: 'classique' },
    ],
    quickStats: {
      monthlyGoal: 200000,
      currentMonth: 125000,
      rank: 12,
      totalUsers: 1250,
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Simuler le chargement des données
    setTimeout(() => setRefreshing(false), 1500);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getProgressPercentage = () => {
    return (dashboardData.quickStats.currentMonth / dashboardData.quickStats.monthlyGoal) * 100;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* 1. HEADER MODERNE AVEC AVATAR */}
        <DashboardHeader
          user={user}
          onProfilePress={() => navigation.navigate('ProfileSettings')}
          onNotificationPress={() => navigation.navigate('Notifications')}
          onMenuPress={() => navigation.openDrawer()}
          notificationCount={dashboardData.notifications}
        />

        <View style={styles.content}>
          {/* 2. CARTE UTILISATEUR PRINCIPALE */}
          <UserCard
            user={user}
            onPress={() => navigation.navigate('ProfileDetails')}
            onEditPress={() => navigation.navigate('EditProfile')}
            showStats={true}
            style={styles.userCard}
          />

          {/* 3. STATISTIQUES RAPIDES */}
          <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              📊 Objectif mensuel
            </Text>
            <View style={[styles.goalCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.goalHeader}>
                <Text style={[styles.goalTitle, { color: theme.colors.text }]}>
                  Progression actuelle
                </Text>
                <Text style={[styles.goalPercentage, { color: theme.colors.primary }]}>
                  {getProgressPercentage().toFixed(0)}%
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${getProgressPercentage()}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.goalNumbers}>
                <Text style={[styles.goalCurrent, { color: theme.colors.text }]}>
                  {formatAmount(dashboardData.quickStats.currentMonth)} FCFA
                </Text>
                <Text style={[styles.goalTarget, { color: theme.colors.textSecondary }]}>
                  / {formatAmount(dashboardData.quickStats.monthlyGoal)} FCFA
                </Text>
              </View>
            </View>
          </View>

          {/* 4. TOP DONATEURS AVEC AVATARS */}
          <View style={styles.topDonorsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🏆 Top Donateurs du mois
            </Text>
            {dashboardData.topDonors.map((donor, index) => (
              <UserCard
                key={donor.id}
                user={{
                  firstName: donor.name.split(' ')[0],
                  lastName: donor.name.split(' ').slice(1).join(' '),
                  email: `${donor.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                  partnerLevel: donor.level,
                  totalDonations: donor.amount,
                  donationCount: Math.floor(donor.amount / 10000),
                  avatar: null, // Initiales automatiques
                }}
                compact={true}
                showEditButton={false}
                onPress={() => console.log(`Voir profil de ${donor.name}`)}
                style={styles.donorCard}
              />
            ))}
          </View>

          {/* 5. DONS RÉCENTS */}
          <View style={styles.recentSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              💝 Vos derniers dons
            </Text>
            {dashboardData.recentDonations.map((donation) => (
              <View
                key={donation.id}
                style={[styles.donationItem, { backgroundColor: theme.colors.card }]}
              >
                <View style={styles.donationIcon}>
                  <MaterialIcons
                    name="favorite"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.donationInfo}>
                  <Text style={[styles.donationCause, { color: theme.colors.text }]}>
                    {donation.cause}
                  </Text>
                  <Text style={[styles.donationDate, { color: theme.colors.textSecondary }]}>
                    {new Date(donation.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <Text style={[styles.donationAmount, { color: theme.colors.primary }]}>
                  {formatAmount(donation.amount)} FCFA
                </Text>
              </View>
            ))}
          </View>

          {/* 6. ACTIONS RAPIDES */}
          <View style={styles.actionsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              ⚡ Actions rapides
            </Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
                onPress={() => navigation.navigate('CreateDonation')}
              >
                <MaterialIcons name="add-circle" size={32} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Nouveau don
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
                onPress={() => navigation.navigate('DonationHistory')}
              >
                <MaterialIcons name="history" size={32} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Historique
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
                onPress={() => navigation.navigate('Leaderboard')}
              >
                <MaterialIcons name="leaderboard" size={32} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Classement
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
                onPress={() => navigation.navigate('Settings')}
              >
                <MaterialIcons name="settings" size={32} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Paramètres
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 7. AVATAR DE PROFIL SIMPLE */}
          <View style={styles.profileSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              👤 Mon profil
            </Text>
            <View style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
              <Avatar
                source={user.avatar}
                name={`${user.firstName} ${user.lastName}`}
                size={80}
                borderColor={theme.colors.primary}
                showStatus={true}
                isOnline={true}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.colors.text }]}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]}>
                  {user.email}
                </Text>
                <View style={styles.profileBadges}>
                  <View style={[styles.levelBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <MaterialIcons name="star" size={16} color={theme.colors.primary} />
                    <Text style={[styles.levelText, { color: theme.colors.primary }]}>
                      Niveau {user.level}
                    </Text>
                  </View>
                  <View style={[styles.partnerBadge, { backgroundColor: '#FFD700' + '20' }]}>
                    <MaterialIcons name="workspace-premium" size={16} color="#FFD700" />
                    <Text style={[styles.partnerText, { color: '#FFD700' }]}>
                      {user.partnerLevel.charAt(0).toUpperCase() + user.partnerLevel.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

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
  content: {
    padding: 16,
  },
  userCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  
  // Statistiques
  statsSection: {
    marginBottom: 24,
  },
  goalCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalCurrent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalTarget: {
    fontSize: 14,
    marginLeft: 4,
  },

  // Top donateurs
  topDonorsSection: {
    marginBottom: 24,
  },
  donorCard: {
    marginBottom: 8,
  },

  // Dons récents
  recentSection: {
    marginBottom: 24,
  },
  donationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  donationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  donationInfo: {
    flex: 1,
  },
  donationCause: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  donationDate: {
    fontSize: 14,
  },
  donationAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Actions
  actionsSection: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Profil
  profileSection: {
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  partnerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 50,
  },
});

export default ModernDashboardExample; 