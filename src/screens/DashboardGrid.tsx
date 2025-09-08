import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS, SIZES } from '../constants';
import userService from '../store/services/userService';
import donationService from '../store/services/donationService';
import { RootState } from '../store';
import { logoutUser, checkAuthStatus } from '../store/slices/authSlice';

const { width, height } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 colonnes avec marges

interface DashboardGridProps {
  navigation: any;
}

interface MenuCard {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  iconType: 'MaterialIcons' | 'Ionicons' | 'FontAwesome5';
  gradient: string[];
  route: string;
  image?: any;
  badge?: number;
  isNew?: boolean;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  
  const [userStats, setUserStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Configuration des cartes du menu principal
  const menuCards: MenuCard[] = [
    {
      id: 'donation',
      title: 'Nouveau Don',
      subtitle: 'Faire un don',
      icon: 'favorite',
      iconType: 'MaterialIcons',
      gradient: ['#FF6B6B', '#FF8E8E'],
      route: 'CreateDonation',
      isNew: true,
    },
    {
      id: 'history',
      title: 'Historique',
      subtitle: 'Mes donations',
      icon: 'history',
      iconType: 'MaterialIcons',
      gradient: ['#4ECDC4', '#44A08D'],
      route: 'DonationHistory',
    },
    {
      id: 'payments',
      title: 'Paiements',
      subtitle: 'Mes transactions',
      icon: 'payment',
      iconType: 'MaterialIcons',
      gradient: ['#45B7D1', '#96C93D'],
      route: 'PaymentHistory',
    },
    {
      id: 'recurring',
      title: 'Récurrents',
      subtitle: 'Dons automatiques',
      icon: 'repeat',
      iconType: 'MaterialIcons',
      gradient: ['#F093FB', '#F5576C'],
      route: 'RecurringDonations',
    },
    {
      id: 'profile',
      title: 'Mon Profil',
      subtitle: 'Informations',
      icon: 'person',
      iconType: 'MaterialIcons',
      gradient: ['#4FACFE', '#00F2FE'],
      route: 'Profile',
    },
    {
      id: 'missions',
      title: 'Missions',
      subtitle: 'Nos projets',
      icon: 'church',
      iconType: 'MaterialIcons',
      gradient: ['#A8EDEA', '#FED6E3'],
      route: 'Missions',
    },
    {
      id: 'support',
      title: 'Support',
      subtitle: 'Aide & contact',
      icon: 'support-agent',
      iconType: 'MaterialIcons',
      gradient: ['#FFD89B', '#19547B'],
      route: 'ContactSupport',
    },
    {
      id: 'social',
      title: 'Nos Réseaux',
      subtitle: 'Suivez-nous',
      icon: 'share',
      iconType: 'MaterialIcons',
      gradient: ['#667eea', '#764ba2'],
      route: 'SocialMedia',
    },
    {
      id: 'help',
      title: 'FAQ',
      subtitle: 'Questions fréquentes',
      icon: 'help-outline',
      iconType: 'MaterialIcons',
      gradient: ['#f093fb', '#f5576c'],
      route: 'HelpCenter',
    },
    {
      id: 'settings',
      title: 'Paramètres',
      subtitle: 'Configuration',
      icon: 'settings',
      iconType: 'MaterialIcons',
      gradient: ['#4facfe', '#00f2fe'],
      route: 'Settings',
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const userStatsResponse = await userService.getMyStats();
      setUserStats(userStatsResponse.data.data.stats);
    } catch (error: any) {
      console.error('Erreur lors du chargement du dashboard:', error);
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        try { dispatch(logoutUser()); } catch (_) {}
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
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

  const renderIcon = (iconName: string, iconType: string, size: number = 32, color: string = '#FFFFFF') => {
    switch (iconType) {
      case 'MaterialIcons':
        return <MaterialIcons name={iconName as any} size={size} color={color} />;
      case 'Ionicons':
        return <Ionicons name={iconName as any} size={size} color={color} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName as any} size={size} color={color} />;
      default:
        return <MaterialIcons name="help-outline" size={size} color={color} />;
    }
  };

  const renderMenuCard = (card: MenuCard, index: number) => (
    <TouchableOpacity
      key={card.id}
      style={[styles.menuCard, { width: cardWidth }]}
      onPress={() => navigation.navigate(card.route)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={card.gradient}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {card.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NOUVEAU</Text>
          </View>
        )}
        
        <View style={styles.cardIcon}>
          {renderIcon(card.icon, card.iconType, 36, '#FFFFFF')}
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{card.title}</Text>
          {card.subtitle && (
            <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
          )}
        </View>

        {card.badge && (
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{card.badge}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header avec image de fond */}
        <ImageBackground
          source={require('../../assets/images/services/service1.jpeg')} // Vous devrez ajouter cette image
          style={styles.headerBackground}
          imageStyle={styles.headerBackgroundImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
            style={styles.headerOverlay}
          >
            <View style={styles.headerContent}>
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeText}>
                  Bonjour, {user?.firstName} 👋
                </Text>
                <Text style={styles.welcomeSubtext}>
                  Bienvenue sur votre espace partenaire
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={() => navigation.navigate('ProfileImage')}
              >
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Statistiques rapides */}
            {userStats && (
              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatAmount(userStats.totalDonations || 0)}
                  </Text>
                  <Text style={styles.statLabel}>Total des dons</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {userStats.donationCount || 0}
                  </Text>
                  <Text style={styles.statLabel}>Dons effectués</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {userStats.partnerLevel?.toUpperCase() || 'CLASSIQUE'}
                  </Text>
                  <Text style={styles.statLabel}>Niveau</Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </ImageBackground>

        {/* Menu principal en grid */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🎯 Menu Principal
          </Text>
          
          <View style={styles.menuGrid}>
            {menuCards.map((card, index) => renderMenuCard(card, index))}
          </View>
        </View>

        {/* Section actions rapides */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            ⚡ Actions Rapides
          </Text>
          
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('CreateDonation')}
            >
              <MaterialIcons name="add-circle" size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Don Rapide</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: '#4CAF50' }]}
              onPress={() => navigation.navigate('PaymentHistory')}
            >
              <MaterialIcons name="account-balance-wallet" size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Portefeuille</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: '#FF9800' }]}
              onPress={() => navigation.navigate('ContactSupport')}
            >
              <MaterialIcons name="headset-mic" size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Aide</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bouton de déconnexion */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color="#FFFFFF" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
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
  headerBackground: {
    height: 280,
    width: '100%',
  },
  headerBackgroundImage: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerOverlay: {
    flex: 1,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  menuSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  menuCard: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  cardIcon: {
    alignSelf: 'flex-start',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 50,
  },
});

export default DashboardGrid;