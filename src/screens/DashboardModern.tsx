import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import PartnerIdDisplay from '../components/PartnerIdDisplay';
import RefreshButton from '../components/RefreshButton';
import { COLORS, SIZES } from '../constants';
import userService from '../store/services/userService';
import donationService from '../store/services/donationService';
import { RootState } from '../store';
import { logoutUser, checkAuthStatus, updateUser } from '../store/slices/authSlice';
import EventModal from '../components/EventModal';
import { useEventModal } from '../hooks/useEventModal';
import UserAvatar from '../components/UserAvatar';

const { width } = Dimensions.get('window');

interface UserStats {
  totalDonations: number;
  donationCount: number;
  averageDonation: number;
  level: number;
  points: number;
  badges: Array<{
    name: string;
    icon: string;
    earnedAt: string;
  }>;
  activeRecurringDonations: number;
  partnerLevel: 'classique' | 'bronze' | 'argent' | 'or';
  partnerLevelDetails: {
    name: string;
    range: string;
    minAmount: number;
    maxAmount: number;
    color: string;
    icon: string;
  };
  lastDonation: {
    amount: number;
    currency: string;
    category: string;
    date: string;
  } | null;
  memberSince: string;
  profileCompletion: number;
}

interface DonationStats {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  activeRecurringDonations: number;
  categoriesBreakdown: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  monthlyEvolution: Array<{
    _id: {
      year: number;
      month: number;
    };
    count: number;
    totalAmount: number;
  }>;
}

interface DashboardModernProps {
  navigation: any;
}

const DashboardModern: React.FC<DashboardModernProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  console.log('user', user)

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [donationStats, setDonationStats] = useState<DonationStats | null>(null);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDonationTypeModal, setShowDonationTypeModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Event Modal Hook
  const { showEventModal, dismissEventModal, markAsParticipated } = useEventModal();

  // Besoin de vérification ?
  const needsEmailVerification = user ? !user.isEmailVerified : false;
  const needsPhoneVerification = user ? (!!user.phone && !user.isPhoneVerified) : false;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [userStatsResponse, donationStatsResponse, recentDonationsResponse, profileResponse] = await Promise.all([
        userService.getMyStats(),
        donationService.getStats(),
        donationService.getRecentDonations(3),
        userService.getProfile(),
      ]);

      setUserStats(userStatsResponse.data.data.stats);
      setDonationStats(donationStatsResponse.data.data.stats);
      setRecentDonations(recentDonationsResponse.data.data.donations || []);

      // Mettre à jour les données utilisateur dans le store Redux si nécessaire
      if (profileResponse.data?.data?.profile?.user) {
        const profileUser = profileResponse.data.data.profile.user;
        if (profileUser.avatar && profileUser.avatar !== user?.avatar) {
          dispatch(updateUser({ avatar: profileUser.avatar }));
        }
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement du dashboard:', error);
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        try { dispatch(logoutUser()); } catch (_) { }
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      Alert.alert(
        'Erreur',
        "Impossible de charger le tableau de bord. Vérifiez votre connexion et réessayez.",
        [{ text: 'Réessayer', onPress: () => loadDashboardData() }, { text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleStartDonation = () => {
    if (needsEmailVerification || needsPhoneVerification) {
      setShowVerificationModal(true);
      return;
    }
    setShowDonationTypeModal(true);
  };

  const handleRefreshVerification = async () => {
    try {
      await dispatch(checkAuthStatus() as any);
    } catch (_) { }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => {
            dispatch(logoutUser());
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
  };

  const formatAmount = (amount: number, currency: string = 'FCFA') => {
    return `${amount?.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Complété';
      case 'pending': return 'En attente';
      case 'failed': return 'Échoué';
      default: return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'soutien': 'favorite',
      'tithe': 'church',
      'offering': 'gift',
      'building': 'business',
      'missions': 'globe',
      'charity': 'heart',
      'education': 'school',
      'youth': 'child-care',
      'women': 'woman',
      'men': 'man',
      'special': 'star',
      'emergency': 'warning',
      'don_mensuel': 'calendar-month',           // Don mensuel
      'don_ponctuel': 'calendar-today',         // Don ponctuel
      'don_libre': 'calendar-today',            // Don libre
      'don_concert_femmes': 'heart',   // Don Concert des Femmes
      'don_ria_2025': 'church'          // Don RIA 2025
    };
    return iconMap[category] || 'help-circle';
  };

  const getPartnerLevelRange = (level: string) => {
    const ranges = {
      classique: "Jusqu'à 300 000 FCFA",
      bronze: "300 001 - 1M FCFA",
      argent: "1M - 10M FCFA",
      or: "10M+ FCFA",
    };
    return ranges[level as keyof typeof ranges] || "Niveau inconnu";
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Chargement de votre tableau de bord...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header avec salutation */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={[styles.welcomeText, { color: colors.text }]}>
              Bonjour, {user?.firstName} 👋
            </Text>
            <Text style={[styles.welcomeSubtext, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Voici un aperçu de vos contributions
            </Text>
          </View>

          {/* Avatar et niveau */}
          <View style={styles.avatarSection}>
            <UserAvatar
              user={{
                firstName: user?.firstName,
                lastName: user?.lastName,
                avatar: user?.avatar
              }}
              size={80}
              onPress={() => navigation.navigate('ProfileImage')}
              showFullScreenOnPress={true}
            />
            <View style={[styles.partnerLevelBadge, { backgroundColor: userStats?.partnerLevelDetails?.color || colors.primary, borderRadius: 12, marginTop: 12 }]}>
              <Text style={styles.partnerLevelBadgeText}>
                {userStats?.partnerLevel.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>


        {/* Partner ID Display */}
        {false && user?.partnerId && (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <PartnerIdDisplay
              partnerId={user.partnerId}
              partnerLevel={user.partnerLevel}
              partnerLevelDetails={user.partnerLevelDetails}
              variant="compact"
              showCopyButton={true}
              showLevel={false}
            />
          </View>
        )}


        {/* Niveau de partenaire 
        {userStats?.partnerLevel && (
          <View style={[styles.partnerLevelCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
            <View style={styles.partnerLevelHeader}>
              <View style={[styles.partnerLevelIconContainer, { backgroundColor: (userStats.partnerLevelDetails?.color || colors.primary) + '20' }]}>
                <MaterialIcons name="star" size={24} color={userStats.partnerLevelDetails?.color || colors.primary} />
              </View>
              <View style={styles.partnerLevelInfo}>
                <Text style={[styles.partnerLevelTitle, { color: colors.text }]}>
                  {userStats.partnerLevelDetails?.name || `Partenaire ${userStats.partnerLevel}`}
                </Text>
                <Text style={[styles.partnerLevelRange, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  {userStats.partnerLevelDetails?.range || getPartnerLevelRange(userStats.partnerLevel)}
                </Text>
              </View>
              <View style={[styles.partnerLevelBadge, { backgroundColor: userStats.partnerLevelDetails?.color || colors.primary }]}>
                <Text style={styles.partnerLevelBadgeText}>
                  {userStats.partnerLevel.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        )}

        */}

        {/* Statistiques principales */}
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Statistiques globales
          </Text>

          <View style={styles.statsGrid}>
            {/* Total des dons */}
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              style={[styles.statCard, styles.largeCard]}
            >
              <MaterialIcons name="monetization-on" size={32} color="#FFFFFF" />
              <Text style={styles.statValue}>
                {formatAmount(userStats?.totalDonations || 0)}
              </Text>
              <Text style={styles.statLabel}>Total des dons</Text>
            </LinearGradient>

            {/* Nombre de dons */}
            <View style={[styles.statCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, width: (width - 64) / 2 }]}>
              <MaterialIcons
                name="favorite"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.statValueSmall, { color: colors.text }]}>
                {userStats?.donationCount || 0}
              </Text>
              <Text style={[styles.statLabelSmall, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Dons effectués
              </Text>
            </View>

            {/* Don moyen */}
            <View style={[styles.statCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, width: (width - 64) / 2 }]}>
              <MaterialIcons
                name="trending-up"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.statValueSmall, { color: colors.text }]}>
                {formatAmount(userStats?.averageDonation || 0)}
              </Text>
              <Text style={[styles.statLabelSmall, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Don moyen
              </Text>
            </View>

            {/* Dons récurrents */}
            <View style={[styles.statCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, width: (width - 64) / 2 }]}>
              <MaterialIcons
                name="repeat"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.statValueSmall, { color: colors.text }]}>
                {userStats?.activeRecurringDonations || 0}
              </Text>
              <Text style={[styles.statLabelSmall, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Dons récurrents
              </Text>
            </View>

            {/* Complétude du profil */}
            <View style={[styles.statCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, width: (width - 64) / 2 }]}>
              <MaterialIcons
                name="person"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.statValueSmall, { color: colors.text }]}>
                {userStats?.profileCompletion || 0}%
              </Text>
              <Text style={[styles.statLabelSmall, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Profil complété
              </Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        {userStats?.badges && userStats.badges.length > 0 && (
          <View style={styles.badgesContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Vos badges 🏆
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.badgesRow}>
                {userStats.badges.map((badge, index) => (
                  <View key={index} style={[styles.badgeCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
                    <Text style={styles.badgeIcon}>{badge.icon || '🏆'}</Text>
                    <Text style={[styles.badgeName, { color: colors.text }]}>
                      {badge.name}
                    </Text>
                    <Text style={[styles.badgeDate, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                      {formatDate(badge.earnedAt)}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Action rapide - Historique récent 
        <View style={styles.quickActionCard}>
          <View style={styles.quickActionHeader}>
            <Text style={[styles.quickActionTitle, { color: dark ? COLORS.white : COLORS.black }]}>
              Donations récentes
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('DonationHistory')}>
              <Text style={[styles.seeAllText, { color: COLORS.primary }]}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {recentDonations.length > 0 ? (
            <View style={styles.recentDonationsContainer}>
              {recentDonations.slice(0, ).map((donation, index) => (
                <TouchableOpacity
                  key={donation._id}
                  style={styles.recentDonationItem}
                  onPress={() => navigation.navigate('DonationDetail', { donationId: donation._id })}
                >
                  <View style={styles.donationItemLeft}>
                    <View style={[styles.donationIcon, { backgroundColor: COLORS.primary + '20' }]}>
                      <MaterialIcons name="favorite" size={16} color={COLORS.primary} />
                    </View>
                    <View style={styles.donationDetails}>
                      <Text style={[styles.donationAmount, { color: dark ? COLORS.white : COLORS.black }]}>
                        {formatAmount(donation.amount, donation.currency)}
                      </Text>
                      <Text style={[styles.donationDate, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                        {formatDate(donation.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.donationStatus, { 
                    backgroundColor: getStatusColor(donation.status) + '20' 
                  }]}>
                    <Text style={[styles.donationStatusText, { 
                      color: getStatusColor(donation.status) 
                    }]}>
                      {getStatusLabel(donation.status)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons 
                name="history" 
                size={40} 
                color={dark ? COLORS.grayTie : COLORS.gray} 
              />
              <Text style={[styles.emptyStateText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Aucun don récent
              </Text>
              <TouchableOpacity
                style={[styles.emptyActionButton, { backgroundColor: COLORS.primary }]}
                onPress={() => navigation.navigate('CreateDonation')}
              >
                <Text style={styles.emptyActionText}>Faire un don</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        */}

        {/* Dernière donation */}
        {userStats?.lastDonation && (
          <View style={[styles.lastDonationCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
            <View style={styles.lastDonationHeader}>
              <MaterialIcons name="history" size={24} color={colors.primary} />
              <Text style={[styles.lastDonationTitle, { color: colors.text }]}>
                Dernière donation
              </Text>
            </View>
            <View style={styles.lastDonationContent}>
              <Text style={[styles.lastDonationAmount, { color: colors.primary }]}>
                {formatAmount(userStats.lastDonation.amount, userStats.lastDonation.currency)}
              </Text>
              <View style={styles.lastDonationDetails}>
                <Text style={[styles.lastDonationCategory, { color: colors.text }]}>
                  {donationService.formatCategory(userStats.lastDonation.category)}
                </Text>
                <Text style={[styles.lastDonationDate, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  {formatDate(userStats.lastDonation.date)}
                </Text>
              </View>
            </View>

          </View>
        )}

        {/* Répartition par catégorie 
        {donationStats?.categoriesBreakdown && donationStats.categoriesBreakdown.length > 0 && (
          <View style={styles.categoriesContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Répartition par catégorie
            </Text>
            <View style={[styles.categoriesCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
              {donationStats.categoriesBreakdown.slice(0, 5).map((category, index) => (
                <View key={index} style={[styles.categoryRow, index === donationStats.categoriesBreakdown.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.categoryInfo}>
                    <MaterialIcons
                      name={getCategoryIcon(category._id) as any}
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {donationService.formatCategory(category._id)}
                    </Text>
                  </View>
                  <View style={styles.categoryStats}>
                    <Text style={[styles.categoryAmount, { color: colors.text }]}>
                      {formatAmount(category.totalAmount)}
                    </Text>
                    <Text style={[styles.categoryCount, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                      {category.count} don{category.count > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
          */}

        {/* Actions rapides */}
        <View style={styles.actionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Actions rapides
          </Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleStartDonation}
            >
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Nouveau don</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={() => navigation.navigate('DonationHistory', { showOnlyDonations: true })}
            >
              <MaterialIcons name="history" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Donations</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={() => navigation.navigate('PaymentHistory')}
            >
              <MaterialIcons name="payment" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Paiements</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={() => navigation.navigate('RecurringDonations')}
            >
              <MaterialIcons name="repeat" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Récurrents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={() => navigation.navigate('Profile')}
            >
              <MaterialIcons name="person" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Profil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={() => user?.role === 'admin' ? navigation.navigate('TicketList') : navigation.navigate('ContactSupport')}
            >
              <MaterialIcons name="support-agent" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={() => navigation.navigate('HelpCenter')}
            >
              <MaterialIcons name="help-outline" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>FAQ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={() => navigation.navigate('Missions')}
            >
              <MaterialIcons name="church" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Missions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={() => navigation.navigate('SocialMedia')}
            >
              <MaterialIcons name="share" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Nos Réseaux</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <MaterialIcons name="settings" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Paramètres</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={() => navigation.navigate('ContactMinistere')}
            >
              <MaterialIcons name="phone" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Nos contacts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#f44336', borderColor: '#f44336' }]}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Membre depuis */}
        {userStats?.memberSince && (
          <View style={[styles.memberSinceCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
            <MaterialIcons name="cake" size={20} color={colors.primary} />
            <Text style={[styles.memberSinceText, { color: colors.text }]}>
              Membre depuis {formatDate(userStats.memberSince)}
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bouton de rafraîchissement flottant */}
      <RefreshButton
        onPress={onRefresh}
        isRefreshing={refreshing}
        variant="floating"
        position="bottom-right"
        size="medium"
      />

      {/* Modal de vérification (garde-fou) */}
      <Modal
        visible={showVerificationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Vérification requise</Text>
              <TouchableOpacity onPress={() => setShowVerificationModal(false)} style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20 }}>
              <Text style={{ color: dark ? COLORS.grayTie : COLORS.gray, marginBottom: 12 }}>
                Pour effectuer un don, veuillez vérifier vos informations de contact.
              </Text>

              {needsEmailVerification && (
                <View style={styles.verifyRow}>
                  <MaterialIcons name="email" size={20} color={colors.primary} />
                  <Text style={[styles.verifyRowText, { color: colors.text }]}>Email non vérifié</Text>
                  <TouchableOpacity
                    style={[styles.ctaBadge, { borderColor: colors.primary, backgroundColor: colors.primary + '12' }]}
                    onPress={() => { setShowVerificationModal(false); navigation.navigate('EmailVerification'); }}
                  >
                    <Text style={[styles.ctaBadgeText, { color: colors.primary }]}>Vérifier</Text>
                  </TouchableOpacity>
                </View>
              )}

              {needsPhoneVerification && (
                <View style={styles.verifyRow}>
                  <MaterialIcons name="phone-iphone" size={20} color={colors.primary} />
                  <Text style={[styles.verifyRowText, { color: colors.text }]}>Téléphone non vérifié</Text>
                  <TouchableOpacity
                    style={[styles.ctaBadge, { borderColor: colors.primary, backgroundColor: colors.primary + '12' }]}
                    onPress={() => { setShowVerificationModal(false); navigation.navigate('PhoneVerification'); }}
                  >
                    <Text style={[styles.ctaBadgeText, { color: colors.primary }]}>Vérifier</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ marginTop: 16, gap: 10 }}>
                <TouchableOpacity
                  style={[styles.verifyPrimaryButton, { backgroundColor: colors.primary }]}
                  onPress={handleRefreshVerification}
                >
                  <Text style={styles.verifyPrimaryText}>J'ai vérifié, actualiser</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.verifySecondaryButton, { borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
                  onPress={() => { setShowVerificationModal(false); navigation.navigate('Settings'); }}
                >
                  <Text style={[styles.verifySecondaryText, { color: colors.text }]}>Aller aux paramètres</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de sélection du type de don */}
      <Modal
        visible={showDonationTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDonationTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Type de don
              </Text>
              <TouchableOpacity
                onPress={() => setShowDonationTypeModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.donationTypeOptions}>
              <TouchableOpacity
                style={[styles.donationTypeOption, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
                onPress={() => {
                  setShowDonationTypeModal(false);
                  navigation.navigate('CreateDonation', { initialType: 'one_time' });
                }}
              >
                <View style={[styles.donationTypeIcon, { backgroundColor: colors.primary + '20' }]}>
                  <MaterialIcons name="favorite" size={32} color={colors.primary} />
                </View>
                <View style={styles.donationTypeInfo}>
                  <Text style={[styles.donationTypeTitle, { color: colors.text }]}>
                    Don unique
                  </Text>
                  <Text style={[styles.donationTypeDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    Effectuer un don ponctuel pour une cause spécifique
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.donationTypeOption, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
                onPress={() => {
                  setShowDonationTypeModal(false);
                  navigation.navigate('CreateDonation', { initialType: 'recurring' });
                }}
              >
                <View style={[styles.donationTypeIcon, { backgroundColor: '#4CAF50' + '20' }]}>
                  <MaterialIcons name="repeat" size={32} color="#4CAF50" />
                </View>
                <View style={styles.donationTypeInfo}>
                  <Text style={[styles.donationTypeTitle, { color: colors.text }]}>
                    Don récurrent
                  </Text>
                  <Text style={[styles.donationTypeDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    Automatiser vos contributions avec des paiements réguliers
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#4CAF50" />
              </TouchableOpacity>

              <View style={styles.donationTypeNote}>
                <MaterialIcons name="info" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
                <Text style={[styles.donationTypeNoteText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Vous pourrez modifier les paramètres après avoir sélectionné le type
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Event Modal */}
      <EventModal
        visible={showEventModal}
        onClose={dismissEventModal} // Ferme temporairement (bouton "Plus tard")
        onJoinEvent={async () => {
          // Marquer comme participé pour ne plus afficher la modal
          markAsParticipated();
          const formUrl = 'https://docs.google.com/forms/d/1YR5sNDXNFw8TE_ynuwPmfp65P9PXvjQOvMf9mpYERI0/viewform?fbclid=IwY2xjawMdO79leHRuA2FlbQIxMABicmlkETFrckdueU9oWWh5ZFdsdmVGAR5fXjV5jnOnHE-ESBKNusI3YksXppILN4OpGBKhmJu24mkXDx1iMLurotQGbQ_aem_HzDP35BBhjmqYDMhSl8HGA&edit_requested=true';

          try {
            const supported = await Linking.canOpenURL(formUrl);
            if (supported) {
              await Linking.openURL(formUrl);
            } else {
              Alert.alert(
                'Erreur',
                'Impossible d\'ouvrir le lien. Veuillez vérifier que vous avez un navigateur installé.',
                [{ text: 'OK' }]
              );
            }
          } catch (error) {
            console.error('Erreur lors de l\'ouverture du lien:', error);
            Alert.alert(
              'Erreur',
              'Une erreur s\'est produite lors de l\'ouverture du formulaire.',
              [{ text: 'OK' }]
            );
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  levelBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 10,
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  largeCard: {
    width: '100%',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statValueSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabelSmall: {
    fontSize: 12,
    textAlign: 'center',
  },
  badgesContainer: {
    padding: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  badgeCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDate: {
    fontSize: 10,
    textAlign: 'center',
  },
  lastDonationCard: {
    margin: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lastDonationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lastDonationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  lastDonationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastDonationAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  lastDonationDetails: {
    alignItems: 'flex-end',
  },
  lastDonationCategory: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  lastDonationDate: {
    fontSize: 12,
  },
  categoriesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  categoriesCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    textTransform: 'capitalize',
  },
  categoryStats: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryCount: {
    fontSize: 12,
  },
  actionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  memberSinceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
  },
  memberSinceText: {
    fontSize: 14,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 20,
  },
  recentDonationsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  recentDonationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  recentDonationsCard: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentDonationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  recentDonationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentDonationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentDonationDetails: {
    flex: 1,
  },
  recentDonationAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  recentDonationCategory: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  recentDonationMeta: {
    alignItems: 'flex-end',
  },
  recentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  recentStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recentDonationDate: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  donationTypeOptions: {
    padding: 20,
  },
  donationTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  donationTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  donationTypeInfo: {
    flex: 1,
  },
  donationTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  donationTypeDescription: {
    fontSize: 14,
  },
  donationTypeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  donationTypeNoteText: {
    fontSize: 12,
    flex: 1,
  },
  quickActionCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  donationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  donationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  donationDetails: {
    flex: 1,
  },
  donationAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  donationDate: {
    fontSize: 12,
  },
  donationStatus: {
    padding: 4,
    borderRadius: 10,
  },
  donationStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyActionButton: {
    padding: 12,
    borderRadius: 8,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileCompletionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileCompletionText: {
    fontSize: 12,
    marginBottom: 16,
  },
  completeProfileButton: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeProfileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  partnerLevelCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  partnerLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnerLevelIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  partnerLevelInfo: {
    flex: 1,
  },
  partnerLevelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  partnerLevelRange: {
    fontSize: 12,
  },
  partnerLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(51, 94, 247, 0.1)',
  },
  partnerLevelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  partnerProgressContainer: {
    marginTop: 12,
  },
  partnerProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partnerProgressText: {
    fontSize: 12,
  },
  partnerProgressAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  partnerProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  partnerProgressFill: {
    height: 8,
    borderRadius: 4,
  },
  partnerProgressTarget: {
    fontSize: 12,
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  verifyRowText: {
    flex: 1,
    fontSize: 14,
  },
  ctaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ctaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  verifyPrimaryButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  verifyPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  verifySecondaryButton: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  verifySecondaryText: {
    fontWeight: '600',
  },
});

export default DashboardModern; 