import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import Avatar from './Avatar';

const { width } = Dimensions.get('window');

const DashboardHeader = ({ 
  user, 
  onProfilePress, 
  onNotificationPress, 
  onMenuPress,
  notificationCount = 0,
  showMenu = true,
  showNotifications = true,
  style = {} 
}) => {
  const themeContext = useTheme();
  
  // Vérification de sécurité pour le thème avec valeurs par défaut
  const theme = themeContext?.theme || {
    colors: {
      primary: '#8B5CF6',
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
    }
  };
  
  const isDarkMode = themeContext?.isDarkMode || false;

  if (!user) {
    return null;
  }

  const {
    firstName = '',
    lastName = '',
    avatar = null,
    partnerLevel = 'classique',
    totalDonations = 0,
    donationCount = 0,
  } = user;

  const fullName = `${firstName} ${lastName}`.trim();
  const greeting = getGreeting();

  // Couleurs selon le niveau de partenaire
  const getPartnerLevelColors = (level) => {
    const levels = {
      'classique': ['#8B5CF6', '#A78BFA'],
      'bronze': ['#CD7F32', '#D4933A'],
      'argent': ['#C0C0C0', '#D3D3D3'],
      'or': ['#FFD700', '#FFF176'],
    };
    return levels[level] || levels['classique'];
  };

  const partnerColors = getPartnerLevelColors(partnerLevel);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  // Formatage des montants
  const formatAmount = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  };

  return (
    <View style={[styles.container, style]}>
      {/* Gradient de fond */}
      <LinearGradient
        colors={[
          theme.colors.primary,
          theme.colors.primary + 'E6',
          theme.colors.primary + 'CC',
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* En-tête principal */}
      <View style={styles.header}>
        {/* Menu hamburger */}
        {showMenu && (
          <TouchableOpacity
            onPress={onMenuPress}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="menu"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        )}

        {/* Informations utilisateur */}
        <TouchableOpacity
          style={styles.userSection}
          onPress={onProfilePress}
          activeOpacity={0.8}
        >
          <View style={styles.textSection}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>
              {firstName || 'Utilisateur'}
            </Text>
            <View style={styles.levelBadge}>
              <MaterialIcons
                name="star"
                size={12}
                color="#FFD700"
              />
              <Text style={styles.levelText}>
                {partnerLevel.charAt(0).toUpperCase() + partnerLevel.slice(1)}
              </Text>
            </View>
          </View>
          
          <Avatar
            source={avatar}
            name={fullName}
            size={60}
            borderColor="#FFFFFF"
            showBorder={true}
          />
        </TouchableOpacity>

        {/* Notifications */}
        {showNotifications && (
          <TouchableOpacity
            onPress={onNotificationPress}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="notifications"
              size={24}
              color="#FFFFFF"
            />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Statistiques rapides */}
      <View style={styles.statsContainer}>
        <View style={[
          styles.statCard,
          { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
        ]}>
          <MaterialIcons
            name="account-balance-wallet"
            size={20}
            color="#FFFFFF"
          />
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>
              {formatAmount(totalDonations)} FCFA
            </Text>
            <Text style={styles.statLabel}>Total donné</Text>
          </View>
        </View>

        <View style={[
          styles.statCard,
          { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
        ]}>
          <MaterialIcons
            name="favorite"
            size={20}
            color="#FFFFFF"
          />
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>
              {donationCount}
            </Text>
            <Text style={styles.statLabel}>Dons effectués</Text>
          </View>
        </View>
      </View>

      {/* Actions rapides */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={[
          styles.actionButton,
          { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
        ]}>
          <MaterialIcons
            name="add"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.actionText}>Nouveau don</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[
          styles.actionButton,
          { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
        ]}>
          <MaterialIcons
            name="history"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.actionText}>Historique</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[
          styles.actionButton,
          { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
        ]}>
          <MaterialIcons
            name="analytics"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.actionText}>Statistiques</Text>
        </TouchableOpacity>
      </View>

      {/* Décoration */}
      <View style={styles.decoration}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  textSection: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 4,
  },
  levelText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
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
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  decoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  circle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
  },
  circle1: {
    width: 120,
    height: 120,
    top: -20,
    right: -40,
  },
  circle2: {
    width: 80,
    height: 80,
    bottom: -20,
    left: -30,
  },
  circle3: {
    width: 60,
    height: 60,
    top: 60,
    right: 80,
  },
});

export default DashboardHeader; 