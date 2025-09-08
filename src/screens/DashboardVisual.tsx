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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS, SIZES } from '../constants';
import userService from '../store/services/userService';
import { RootState } from '../store';
import { logoutUser } from '../store/slices/authSlice';

const { width, height } = Dimensions.get('window');

interface DashboardVisualProps {
  navigation: any;
}

interface VisualMenuCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconType: 'MaterialIcons' | 'Ionicons' | 'FontAwesome5' | 'AntDesign' | 'Feather';
  gradient: string[];
  route: string;
  emoji: string;
  description: string;
  isFeature?: boolean;
  size: 'small' | 'medium' | 'large';
}

const DashboardVisual: React.FC<DashboardVisualProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  
  const [userStats, setUserStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Configuration des cartes avec design visuel
  const visualMenuCards: VisualMenuCard[] = [
    {
      id: 'donation',
      title: 'Nouveau Don',
      subtitle: 'Faire une différence',
      description: 'Contribuez à nos missions',
      emoji: '💝',
      icon: 'favorite',
      iconType: 'MaterialIcons',
      gradient: ['#FF6B6B', '#FF8E8E', '#FFB3B3'],
      route: 'CreateDonation',
      size: 'large',
      isFeature: true,
    },
    {
      id: 'history',
      title: 'Historique',
      subtitle: 'Mes contributions',
      description: 'Voir mes donations',
      emoji: '📊',
      icon: 'history',
      iconType: 'MaterialIcons',
      gradient: ['#4ECDC4', '#44A08D'],
      route: 'DonationHistory',
      size: 'medium',
    },
    {
      id: 'payments',
      title: 'Paiements',
      subtitle: 'Mes transactions',
      description: 'Gérer mes paiements',
      emoji: '💳',
      icon: 'payment',
      iconType: 'MaterialIcons',
      gradient: ['#667eea', '#764ba2'],
      route: 'PaymentHistory',
      size: 'medium',
    },
    {
      id: 'profile',
      title: 'Profil',
      subtitle: 'Mes informations',
      description: 'Gérer mon compte',
      emoji: '👤',
      icon: 'person',
      iconType: 'MaterialIcons',
      gradient: ['#4FACFE', '#00F2FE'],
      route: 'Profile',
      size: 'small',
    },
    {
      id: 'missions',
      title: 'Missions',
      subtitle: 'Nos projets',
      description: 'Découvrir nos actions',
      emoji: '⛪',
      icon: 'church',
      iconType: 'MaterialIcons',
      gradient: ['#A8EDEA', '#FED6E3'],
      route: 'Missions',
      size: 'small',
    },
    {
      id: 'recurring',
      title: 'Récurrents',
      subtitle: 'Dons automatiques',
      description: 'Gérer mes dons récurrents',
      emoji: '🔄',
      icon: 'repeat',
      iconType: 'MaterialIcons',
      gradient: ['#F093FB', '#F5576C'],
      route: 'RecurringDonations',
      size: 'medium',
    },
    {
      id: 'support',
      title: 'Support',
      subtitle: 'Aide & contact',
      description: 'Obtenir de l\'aide',
      emoji: '🎧',
      icon: 'support-agent',
      iconType: 'MaterialIcons',
      gradient: ['#FFD89B', '#19547B'],
      route: 'ContactSupport',
      size: 'small',
    },
    {
      id: 'social',
      title: 'Réseaux',
      subtitle: 'Suivez-nous',
      description: 'Nos réseaux sociaux',
      emoji: '📱',
      icon: 'share',
      iconType: 'MaterialIcons',
      gradient: ['#667eea', '#764ba2'],
      route: 'SocialMedia',
      size: 'small',
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
      case 'AntDesign':
        return <AntDesign name={iconName as any} size={size} color={color} />;
      case 'Feather':
        return <Feather name={iconName as any} size={size} color={color} />;
      default:
        return <MaterialIcons name="help-outline" size={size} color={color} />;
    }
  };

  const getCardDimensions = (size: string) => {
    switch (size) {
      case 'large':
        return { width: width - 40, height: 180 };
      case 'medium':
        return { width: (width - 60) / 2, height: 140 };
      case 'small':
        return { width: (width - 80) / 3, height: 120 };
      default:
        return { width: (width - 60) / 2, height: 140 };
    }
  };

  const renderVisualCard = (card: VisualMenuCard, index: number) => {
    const dimensions = getCardDimensions(card.size);
    
    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.visualCard,
          {
            width: dimensions.width,
            height: dimensions.height,
            marginBottom: card.size === 'large' ? 20 : 16,
          }
        ]}
        onPress={() => navigation.navigate(card.route)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={card.gradient}
          style={styles.visualCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Motifs décoratifs */}
          <View style={styles.cardPattern}>
            <View style={[styles.patternCircle, styles.patternCircle1]} />
            <View style={[styles.patternCircle, styles.patternCircle2]} />
            <View style={[styles.patternCircle, styles.patternCircle3]} />
          </View>

          {/* Badge feature */}
          {card.isFeature && (
            <View style={styles.featureBadge}>
              <Text style={styles.featureBadgeText}>⭐ POPULAIRE</Text>
            </View>
          )}

          {/* Emoji principal */}
          <View style={styles.cardEmojiContainer}>
            <Text style={[
              styles.cardEmoji,
              { fontSize: card.size === 'large' ? 40 : card.size === 'medium' ? 32 : 24 }
            ]}>
              {card.emoji}
            </Text>
          </View>

          {/* Contenu */}
          <View style={styles.visualCardContent}>
            <Text style={[
              styles.visualCardTitle,
              { fontSize: card.size === 'large' ? 20 : card.size === 'medium' ? 16 : 14 }
            ]}>
              {card.title}
            </Text>
            <Text style={[
              styles.visualCardSubtitle,
              { fontSize: card.size === 'large' ? 14 : 12 }
            ]}>
              {card.subtitle}
            </Text>
            {card.size === 'large' && (
              <Text style={styles.visualCardDescription}>
                {card.description}
              </Text>
            )}
          </View>

          {/* Icône secondaire */}
          <View style={styles.cardSecondaryIcon}>
            {renderIcon(card.icon, card.iconType, 20, 'rgba(255,255,255,0.7)')}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderMasonryLayout = () => {
    const largeCards = visualMenuCards.filter(card => card.size === 'large');
    const mediumCards = visualMenuCards.filter(card => card.size === 'medium');
    const smallCards = visualMenuCards.filter(card => card.size === 'small');

    return (
      <View style={styles.masonryContainer}>
        {/* Cartes larges */}
        {largeCards.map((card, index) => renderVisualCard(card, index))}
        
        {/* Cartes moyennes en ligne */}
        <View style={styles.mediumCardsRow}>
          {mediumCards.map((card, index) => renderVisualCard(card, index))}
        </View>
        
        {/* Cartes petites en ligne */}
        <View style={styles.smallCardsRow}>
          {smallCards.map((card, index) => renderVisualCard(card, index))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header avec design visuel */}
        <View style={styles.visualHeader}>
          <LinearGradient
            colors={dark ? ['#1a1a2e', '#16213e'] : ['#667eea', '#764ba2']}
            style={styles.headerGradient}
          >
            {/* Motifs de fond */}
            <View style={styles.headerPattern}>
              {[...Array(6)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.headerPatternItem,
                    {
                      left: Math.random() * width,
                      top: Math.random() * 200,
                      opacity: 0.1,
                    }
                  ]}
                />
              ))}
            </View>

            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerGreeting}>
                  Bonjour ! 🌟
                </Text>
                <Text style={styles.headerName}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text style={styles.headerSubtext}>
                  Ensemble, construisons l'avenir
                </Text>
              </View>

              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.headerAvatar}
                  onPress={() => navigation.navigate('ProfileImage')}
                >
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.headerAvatarImage} />
                  ) : (
                    <LinearGradient
                      colors={['#FF6B6B', '#4ECDC4']}
                      style={styles.headerAvatarPlaceholder}
                    >
                      <Text style={styles.headerAvatarText}>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </Text>
                    </LinearGradient>
                  )}
                  <View style={styles.headerAvatarBadge}>
                    <Text style={styles.headerAvatarBadgeText}>✨</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Statistiques visuelles */}
            {userStats && (
              <View style={styles.visualStats}>
                <View style={styles.visualStatItem}>
                  <Text style={styles.visualStatEmoji}>💰</Text>
                  <Text style={styles.visualStatValue}>
                    {formatAmount(userStats.totalDonations || 0)}
                  </Text>
                  <Text style={styles.visualStatLabel}>Total des dons</Text>
                </View>
                
                <View style={styles.visualStatDivider} />
                
                <View style={styles.visualStatItem}>
                  <Text style={styles.visualStatEmoji}>❤️</Text>
                  <Text style={styles.visualStatValue}>
                    {userStats.donationCount || 0}
                  </Text>
                  <Text style={styles.visualStatLabel}>Dons effectués</Text>
                </View>
                
                <View style={styles.visualStatDivider} />
                
                <View style={styles.visualStatItem}>
                  <Text style={styles.visualStatEmoji}>🏆</Text>
                  <Text style={styles.visualStatValue}>
                    {userStats.partnerLevel?.toUpperCase() || 'CLASSIQUE'}
                  </Text>
                  <Text style={styles.visualStatLabel}>Niveau</Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Menu principal avec layout masonry */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🎯 Votre Espace Partenaire
          </Text>
          {renderMasonryLayout()}
        </View>

        {/* Actions rapides avec design visuel */}
        <View style={styles.quickActionsVisual}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            ⚡ Actions Express
          </Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionVisual, { backgroundColor: '#FF6B6B' }]}
              onPress={() => navigation.navigate('CreateDonation')}
            >
              <Text style={styles.quickActionEmoji}>🚀</Text>
              <Text style={styles.quickActionTitle}>Don Express</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionVisual, { backgroundColor: '#4CAF50' }]}
              onPress={() => navigation.navigate('PaymentHistory')}
            >
              <Text style={styles.quickActionEmoji}>💼</Text>
              <Text style={styles.quickActionTitle}>Portefeuille</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionVisual, { backgroundColor: '#2196F3' }]}
              onPress={() => navigation.navigate('ContactSupport')}
            >
              <Text style={styles.quickActionEmoji}>🆘</Text>
              <Text style={styles.quickActionTitle}>Aide</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bouton de déconnexion avec style visuel */}
        <View style={styles.logoutVisualSection}>
          <TouchableOpacity
            style={styles.logoutVisualButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              style={styles.logoutVisualGradient}
            >
              <Text style={styles.logoutEmoji}>👋</Text>
              <Text style={styles.logoutVisualText}>Se déconnecter</Text>
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
  visualHeader: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerPatternItem: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    zIndex: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  headerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },
  headerRight: {
    alignItems: 'center',
  },
  headerAvatar: {
    position: 'relative',
  },
  headerAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  headerAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerAvatarBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarBadgeText: {
    fontSize: 16,
  },
  visualStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  visualStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  visualStatEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  visualStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  visualStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  visualStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 10,
  },
  menuSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  masonryContainer: {
    marginBottom: 20,
  },
  mediumCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  smallCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  visualCard: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  visualCardGradient: {
    flex: 1,
    padding: 20,
    position: 'relative',
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  patternCircle1: {
    width: 60,
    height: 60,
    top: -20,
    right: -20,
  },
  patternCircle2: {
    width: 40,
    height: 40,
    bottom: -10,
    left: -10,
  },
  patternCircle3: {
    width: 30,
    height: 30,
    top: '50%',
    right: 10,
  },
  featureBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 2,
  },
  featureBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  cardEmojiContainer: {
    marginBottom: 16,
  },
  cardEmoji: {
    textAlign: 'left',
  },
  visualCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  visualCardTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  visualCardSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  visualCardDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
  },
  cardSecondaryIcon: {
    position: 'absolute',
    bottom: 15,
    right: 15,
  },
  quickActionsVisual: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionVisual: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 20,
    gap: 8,
  },
  quickActionEmoji: {
    fontSize: 28,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutVisualSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoutVisualButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  logoutVisualGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  logoutEmoji: {
    fontSize: 20,
  },
  logoutVisualText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 50,
  },
});

export default DashboardVisual;