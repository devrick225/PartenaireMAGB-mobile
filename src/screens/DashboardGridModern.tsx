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
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS, SIZES } from '../constants';
import userService from '../store/services/userService';
import { RootState } from '../store';
import { logoutUser } from '../store/slices/authSlice';

const { width, height } = Dimensions.get('window');
const cardWidth = Math.floor((width - 96) / 2); // 2 colonnes avec marges, arrondi vers le bas

interface DashboardGridModernProps {
  navigation: any;
}

interface MenuCard {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  iconType: 'MaterialIcons' | 'Ionicons' | 'FontAwesome5' | 'AntDesign';
  gradient: string[];
  route: string;
  badge?: number;
  isNew?: boolean;
  isPopular?: boolean;
  image?: string;
  iconColor?: string;
}

const DashboardGridModern: React.FC<DashboardGridModernProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  const [userStats, setUserStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  // Configuration des cartes du menu avec palette officielle
  const menuCards: MenuCard[] = [
    {
      id: 'donation',
      title: 'Nouveau Don',
      subtitle: '💝 Faire un don',
      icon: 'favorite',
      iconType: 'MaterialIcons',
      gradient: ['#FFFFFF', '#FFFFFF'],
      route: 'CreateDonation',
      isNew: true,
      isPopular: true,
      iconColor: '#D32235', // Rouge principal
    },
    {
      id: 'history',
      title: 'Historique',
      subtitle: '📊 Mes donations',
      icon: 'history',
      iconType: 'MaterialIcons',
      gradient: ['#FFFFFF', '#FFFFFF'],
      route: 'DonationHistory',
      iconColor: '#26335F', // Bleu principal
    },
    {
      id: 'payments',
      title: 'Paiements',
      subtitle: '💳 Transactions',
      icon: 'payment',
      iconType: 'MaterialIcons',
      gradient: ['#FFFFFF', '#FFFFFF'],
      route: 'PaymentHistory',
      iconColor: '#FFD61D', // Jaune secondaire
    },
    {
      id: 'recurring',
      title: 'Récurrents',
      subtitle: '🔄 Automatiques',
      icon: 'repeat',
      iconType: 'MaterialIcons',
      gradient: ['#FFFFFF', '#FFFFFF'],
      route: 'RecurringDonations',
      iconColor: '#D32235', // Rouge principal
    },
    {
      id: 'profile',
      title: 'Mon Profil',
      subtitle: '👤 Informations',
      icon: 'person',
      iconType: 'MaterialIcons',
      gradient: ['#FFFFFF', '#FFFFFF'],
      route: 'Profile',
      iconColor: '#26335F', // Bleu principal
    },
    {
      id: 'missions',
      title: 'Missions',
      subtitle: '⛪ Nos projets',
      icon: 'church',
      iconType: 'MaterialIcons',
      gradient: ['#FFFFFF', '#FFFFFF'],
      route: 'Missions',
      isPopular: true,
      iconColor: '#FFD61D', // Jaune secondaire
    },
    {
      id: 'ministere',
      title: 'Ministère',
      subtitle: '🏛️ Contact officiel',
      icon: 'account-balance',
      iconType: 'MaterialIcons',
      gradient: ['#FFFFFF', '#FFFFFF'],
      route: 'ContactMinistere',
      isNew: true,
      iconColor: '#D32235', // Rouge principal
    },
    {
      id: 'support',
      title: 'Support',
      subtitle: '🎧 Aide & contact',
      icon: 'support-agent',
      iconType: 'MaterialIcons',
      gradient: ['#FFFFFF', '#FFFFFF'],
      route: 'ContactSupport',
      iconColor: '#26335F', // Bleu principal
    },
    {
      id: 'social',
      title: 'Nos Réseaux',
      subtitle: '📱 Suivez-nous',
      icon: 'share',
      iconType: 'MaterialIcons',
      gradient: ['#FFFFFF', '#FFFFFF'],
      route: 'SocialMedia',
      iconColor: '#D32235', // Rouge principal
    },
    {
      id: 'help',
      title: 'FAQ',
      subtitle: '❓ Questions',
      icon: 'help-outline',
      iconType: 'MaterialIcons',
      gradient: ['#FFFFFF', '#FFFFFF'],
      route: 'HelpCenter',
      iconColor: '#FFD61D', // Jaune secondaire
    },
    {
      id: 'settings',
      title: 'Paramètres',
      subtitle: '⚙️ Configuration',
      icon: 'settings',
      iconType: 'MaterialIcons',
      gradient: ['#FFFFFF', '#FFFFFF'],
      route: 'Settings',
      iconColor: '#26335F', // Bleu principal
    },
  ];

  // Actions rapides avec palette officielle
  const quickActions = [
    {
      id: 'quick-donation',
      title: 'Don Express',
      icon: 'flash',
      iconType: 'Ionicons',
      color: '#D32235', // Rouge principal
      route: 'CreateDonation',
    },
    {
      id: 'wallet',
      title: 'Portefeuille',
      icon: 'wallet',
      iconType: 'AntDesign',
      color: '#FFD61D', // Jaune secondaire
      route: 'PaymentHistory',
    },
    {
      id: 'qr-code',
      title: 'QR Code',
      icon: 'qrcode',
      iconType: 'AntDesign',
      color: '#26335F', // Bleu principal
      route: 'QRCode',
    },
    {
      id: 'help',
      title: 'Aide',
      icon: 'customerservice',
      iconType: 'AntDesign',
      color: '#D32235', // Rouge principal
      route: 'ContactSupport',
    },
  ];

  useEffect(() => {
    loadDashboardData();
    startAnimation();
  }, []);

  const startAnimation = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const userStatsResponse = await userService.getMyStats();
      setUserStats(userStatsResponse.data.data.stats);
    } catch (error: any) {
      console.error('Erreur lors du chargement du dashboard:', error);
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        try { dispatch(logoutUser()); } catch (_) { }
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
      case 'AntDesign':
        return <AntDesign name={iconName as any} size={size} color={color} />;
      default:
        return <MaterialIcons name="help-outline" size={size} color={color} />;
    }
  };

  const renderMenuCard = (card: MenuCard, index: number) => {
    const animatedStyle = {
      opacity: animatedValue,
      transform: [
        {
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        },
        {
          scale: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
      ],
    };

    return (
      <Animated.View
        key={card.id}
        style={[animatedStyle, {
          width: cardWidth,
          marginBottom: 16,
          marginRight: index % 2 === 0 ? 8 : 0,
          marginLeft: index % 2 === 1 ? 8 : 0,
        }]}
      >
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => navigation.navigate(card.route)}
          activeOpacity={0.8}
        >
          <View style={[
            styles.cardGradient,
            {
              backgroundColor: dark ? COLORS.dark2 : '#FFFFFF',
              borderColor: (card.iconColor || colors.primary) + '30',
            }
          ]}>
            {/* Badges */}
            <View style={styles.cardBadges}>
              {card.isNew && (
                <View style={[styles.badge, styles.newBadge]}>
                  <Text style={styles.badgeText}>NOUVEAU</Text>
                </View>
              )}
              {card.isPopular && (
                <View style={[styles.badge, styles.popularBadge]}>
                  <MaterialIcons name="star" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>

            {/* Icône principale */}
            <View style={styles.cardIconContainer}>
              <View style={[styles.cardIconBackground, { backgroundColor: (card.iconColor || colors.primary) + '20' }]}>
                {renderIcon(card.icon, card.iconType, 28, card.iconColor || colors.primary)}
              </View>
            </View>

            {/* Contenu */}
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{card.title}</Text>
              {card.subtitle && (
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{card.subtitle}</Text>
              )}
            </View>

            {/* Effet de brillance subtil */}
            <View style={[styles.cardShine, { backgroundColor: (card.iconColor || colors.primary) + '10' }]} />

            {/* Bordure colorée en bas */}
            <View style={[styles.cardBottomBorder, { backgroundColor: card.iconColor || colors.primary }]} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderQuickAction = (action: any, index: number) => (
    <TouchableOpacity
      key={action.id}
      style={[
        styles.quickActionItem,
        {
          backgroundColor: dark ? COLORS.dark2 : '#FFFFFF',
          borderColor: action.color + '30',
        }
      ]}
      onPress={() => navigation.navigate(action.route)}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
        {renderIcon(action.icon, action.iconType, 20, action.color)}
      </View>
      <Text style={[styles.quickActionText, { color: colors.text }]}>
        {action.title}
      </Text>
      {/* Bordure colorée en bas */}
      <View style={[styles.quickActionBorder, { backgroundColor: action.color }]} />
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
        {/* Header moderne avec gradient */}
        <LinearGradient
          colors={dark ? ['#26335F', '#1a2347'] : ['#26335F', '#1a2347']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Motifs décoratifs */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <View style={styles.decorativeCircle3} />

          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>
                Salut {user?.firstName} ! 👋
              </Text>
              <Text style={styles.welcomeSubtext}>
                Prêt à faire une différence aujourd'hui ?
              </Text>
            </View>

            <View style={styles.headerRightColumn}>
              {/* Bouton rafraîchissement visible */}
              <TouchableOpacity
                style={styles.refreshHeaderButton}
                onPress={onRefresh}
                disabled={refreshing}
                activeOpacity={0.75}
              >
                {refreshing ? (
                  <Animated.View>
                    <MaterialIcons name="refresh" size={20} color="#FFD61D" />
                  </Animated.View>
                ) : (
                  <MaterialIcons name="refresh" size={20} color="rgba(255,255,255,0.9)" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={() => navigation.navigate('ProfileImage')}
              >
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <LinearGradient
                    colors={['#D32235', '#FFD61D']}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarText}>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </Text>
                  </LinearGradient>
                )}
                <View style={styles.avatarBadge}>
                  <MaterialIcons name="verified" size={16} color="#4CAF50" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Statistiques avec design moderne */}
          {userStats && (
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <MaterialIcons name="monetization-on" size={20} color="#FFD61D" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>
                    {formatAmount(userStats.totalDonations || 0)}
                  </Text>
                  <Text style={styles.statLabel}>Total des dons</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <MaterialIcons name="favorite" size={20} color="#D32235" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>
                    {userStats.donationCount || 0}
                  </Text>
                  <Text style={styles.statLabel}>Dons effectués</Text>
                </View>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Actions rapides */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            ⚡ Actions Rapides
          </Text>
          <View style={[styles.quickActionsWrapper, { backgroundColor: dark ? COLORS.dark1 : '#F8F9FA' }]}>
            <View style={styles.quickActionsContainer}>
              {quickActions.map((action, index) => renderQuickAction(action, index))}
            </View>
          </View>
        </View>

        {/* Menu principal en grid */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🎯 Menu Principal
          </Text>

          <View style={[styles.menuGridContainer, { backgroundColor: dark ? COLORS.dark1 : '#F8F9FA' }]}>
            <View style={styles.menuGrid}>
              {menuCards.map((card, index) => renderMenuCard(card, index))}
            </View>
          </View>
        </View>


        {/* Bouton de déconnexion stylé */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#D32235', '#B02A3A']}
              style={styles.logoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="logout" size={20} color="#FFFFFF" />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </LinearGradient>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 100,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: -20,
    right: 50,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    zIndex: 1,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  welcomeSubtext: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  headerRightColumn: {
    alignItems: 'center',
    gap: 8,
  },
  refreshHeaderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    zIndex: 1,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    backdropFilter: 'blur(10px)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  quickActionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsWrapper: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuGridContainer: {
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    position: 'relative',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cardBadges: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
    zIndex: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadge: {
    backgroundColor: '#D32235', // Rouge principal
  },
  popularBadge: {
    backgroundColor: '#FFD61D', // Jaune secondaire
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardIconContainer: {
    marginBottom: 16,
  },
  cardIconBackground: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  cardBottomBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  logoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
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

export default DashboardGridModern;