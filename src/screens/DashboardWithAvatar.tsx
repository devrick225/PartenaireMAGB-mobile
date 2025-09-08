import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeProvider';
import Avatar from '../components/Avatar';
import UserCard from '../components/UserCard';
import DashboardHeader from '../components/DashboardHeader';

const { width } = Dimensions.get('window');

interface DashboardWithAvatarProps {
  navigation: any;
}

const DashboardWithAvatar: React.FC<DashboardWithAvatarProps> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  
  // Récupération des données utilisateur depuis Redux
  const user = useSelector((state: any) => state.auth.user);

  // Données d'exemple pour le dashboard
  const userStats = {
    totalDonations: 850000,
    donationCount: 18,
    level: 4,
    points: 2150,
    partnerLevel: 'or',
    partnerLevelDetails: {
      color: '#FFD700',
      name: 'Partenaire Or',
      range: '10M+ FCFA',
    },
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simuler le chargement des données
    setTimeout(() => setRefreshing(false), 1500);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header moderne avec gradient */}
        <DashboardHeader
          user={{
            firstName: user?.firstName || 'John',
            lastName: user?.lastName || 'Doe',
            avatar: user?.avatar || null,
            partnerLevel: userStats.partnerLevel,
            totalDonations: userStats.totalDonations,
            donationCount: userStats.donationCount,
          }}
          onProfilePress={() => navigation.navigate('ProfileSettings')}
          onNotificationPress={() => navigation.navigate('Notifications')}
          onMenuPress={() => navigation.openDrawer()}
          notificationCount={5}
        />

        {/* Contenu principal */}
        <View style={styles.content}>
          {/* Carte utilisateur moderne */}
          <UserCard
            user={{
              firstName: user?.firstName || 'John',
              lastName: user?.lastName || 'Doe',
              email: user?.email || 'john.doe@example.com',
              avatar: user?.avatar || null,
              role: user?.role || 'user',
              partnerLevel: userStats.partnerLevel,
              totalDonations: userStats.totalDonations,
              donationCount: userStats.donationCount,
              level: userStats.level,
              points: userStats.points,
              isEmailVerified: true,
              isPhoneVerified: true,
            }}
            onPress={() => navigation.navigate('ProfileDetails')}
            onEditPress={() => navigation.navigate('ProfileSettings')}
            showStats={true}
            showEditButton={true}
            style={styles.userCard}
          />

          {/* Section avatar personnalisé */}
          <View style={[styles.avatarSection, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              👤 Votre Profil
            </Text>
            <View style={styles.avatarContainer}>
              <Avatar
                source={user?.avatar || null}
                name={`${user?.firstName || 'John'} ${user?.lastName || 'Doe'}`}
                size={100}
                borderColor={userStats.partnerLevelDetails.color}
                showStatus={true}
                isOnline={true}
                showBorder={true}
              />
              <View style={styles.avatarInfo}>
                <Text style={[styles.avatarName, { color: theme.colors.text }]}>
                  {user?.firstName || 'John'} {user?.lastName || 'Doe'}
                </Text>
                <Text style={[styles.avatarEmail, { color: theme.colors.textSecondary }]}>
                  {user?.email || 'john.doe@example.com'}
                </Text>
                <View style={styles.avatarBadges}>
                  <View style={[styles.levelBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <MaterialIcons name="star" size={16} color={theme.colors.primary} />
                    <Text style={[styles.levelText, { color: theme.colors.primary }]}>
                      Niveau {userStats.level}
                    </Text>
                  </View>
                  <View style={[styles.partnerBadge, { backgroundColor: userStats.partnerLevelDetails.color + '20' }]}>
                    <MaterialIcons name="workspace-premium" size={16} color={userStats.partnerLevelDetails.color} />
                    <Text style={[styles.partnerText, { color: userStats.partnerLevelDetails.color }]}>
                      {userStats.partnerLevelDetails.name}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Statistiques avec avatars */}
          <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              📊 Vos Statistiques
            </Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <LinearGradient
                  colors={['#4CAF50', '#45A049']}
                  style={styles.statGradient}
                >
                  <MaterialIcons name="monetization-on" size={24} color="#FFFFFF" />
                  <Text style={styles.statValue}>
                    {formatAmount(userStats.totalDonations)} FCFA
                  </Text>
                  <Text style={styles.statLabel}>Total des dons</Text>
                </LinearGradient>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  style={styles.statGradient}
                >
                  <MaterialIcons name="favorite" size={24} color="#FFFFFF" />
                  <Text style={styles.statValue}>
                    {userStats.donationCount}
                  </Text>
                  <Text style={styles.statLabel}>Dons effectués</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Exemples d'avatars */}
          <View style={styles.avatarExamples}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🎯 Exemples d'Avatars
            </Text>
            <View style={styles.avatarRow}>
              <View style={styles.avatarExample}>
                <Avatar
                  name="Marie Dupont"
                  size={60}
                  borderColor="#FF6B6B"
                />
                <Text style={[styles.exampleLabel, { color: theme.colors.textSecondary }]}>
                  Initiales
                </Text>
              </View>
              
              <View style={styles.avatarExample}>
                <Avatar
                  name="Ahmed Ali"
                  size={60}
                  borderColor="#4ECDC4"
                  showStatus={true}
                  isOnline={true}
                />
                <Text style={[styles.exampleLabel, { color: theme.colors.textSecondary }]}>
                  Avec statut
                </Text>
              </View>
              
              <View style={styles.avatarExample}>
                <Avatar
                  name="Sophie Martin"
                  size={60}
                  borderColor="#45B7D1"
                  showBadge={true}
                  badgeCount={3}
                />
                <Text style={[styles.exampleLabel, { color: theme.colors.textSecondary }]}>
                  Avec badge
                </Text>
              </View>
            </View>
          </View>

          {/* Actions rapides */}
          <View style={styles.actionsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              ⚡ Actions Rapides
            </Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
                onPress={() => navigation.navigate('ProfileSettings')}
              >
                <MaterialIcons name="settings" size={32} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Modifier Profil
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
                onPress={() => navigation.navigate('CreateDonation')}
              >
                <MaterialIcons name="add-circle" size={32} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Nouveau Don
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
                onPress={() => navigation.navigate('Statistics')}
              >
                <MaterialIcons name="analytics" size={32} color={theme.colors.primary} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  Statistiques
                </Text>
              </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  avatarSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarInfo: {
    flex: 1,
    marginLeft: 16,
  },
  avatarName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  avatarEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  avatarBadges: {
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
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  avatarExamples: {
    marginBottom: 24,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  avatarExample: {
    alignItems: 'center',
    gap: 8,
  },
  exampleLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
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
    borderRadius: 12,
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
  bottomSpace: {
    height: 50,
  },
});

export default DashboardWithAvatar; 