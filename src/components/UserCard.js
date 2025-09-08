import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import Avatar from './Avatar';

const UserCard = ({ 
  user, 
  onPress, 
  onEditPress, 
  showEditButton = true,
  showStats = true,
  compact = false,
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
      card: '#FFFFFF',
      border: '#E0E0E0',
    }
  };
  
  const isDarkMode = themeContext?.isDarkMode || false;

  if (!user) {
    return null;
  }

  const {
    firstName = '',
    lastName = '',
    email = '',
    avatar = null,
    role = 'user',
    totalDonations = 0,
    donationCount = 0,
    level = 1,
    points = 0,
    partnerLevel = 'classique',
    isEmailVerified = false,
    isPhoneVerified = false,
  } = user;

  const fullName = `${firstName} ${lastName}`.trim();
  
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

  // Icône selon le rôle
  const getRoleIcon = (role) => {
    const icons = {
      'admin': 'admin-panel-settings',
      'moderator': 'verified-user',
      'treasurer': 'account-balance',
      'support_agent': 'support-agent',
      'user': 'person',
    };
    return icons[role] || 'person';
  };

  // Formatage des montants
  const formatAmount = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
          style
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Avatar
          source={avatar}
          name={fullName}
          size={50}
          borderColor={partnerColors[0]}
        />
        <View style={styles.compactInfo}>
          <Text style={[styles.compactName, { color: theme.colors.text }]}>
            {fullName || 'Utilisateur'}
          </Text>
          <Text style={[styles.compactRole, { color: theme.colors.textSecondary }]}>
            {partnerLevel.charAt(0).toUpperCase() + partnerLevel.slice(1)}
          </Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          shadowColor: isDarkMode ? '#000' : '#000',
        },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Gradient de fond selon le niveau */}
      <LinearGradient
        colors={[partnerColors[0] + '15', partnerColors[1] + '05']}
        style={styles.cardGradient}
      />

      {/* Header avec avatar et info principale */}
      <View style={styles.header}>
        <Avatar
          source={avatar}
          name={fullName}
          size={80}
          borderColor={partnerColors[0]}
          showStatus={true}
          isOnline={true}
        />
        
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.colors.text }]}>
              {fullName || 'Utilisateur'}
            </Text>
            {showEditButton && (
              <TouchableOpacity
                onPress={onEditPress}
                style={[
                  styles.editButton,
                  { backgroundColor: theme.colors.primary + '20' }
                ]}
              >
                <MaterialIcons
                  name="edit"
                  size={16}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={[styles.email, { color: theme.colors.textSecondary }]}>
            {email}
          </Text>
          
          {/* Badges de vérification */}
          <View style={styles.verificationBadges}>
            <View style={[
              styles.badge,
              {
                backgroundColor: isEmailVerified ? '#4CAF50' : theme.colors.border,
              }
            ]}>
              <MaterialIcons
                name="email"
                size={12}
                color={isEmailVerified ? '#FFFFFF' : theme.colors.textSecondary}
              />
              <Text style={[
                styles.badgeText,
                {
                  color: isEmailVerified ? '#FFFFFF' : theme.colors.textSecondary,
                }
              ]}>
                Email
              </Text>
            </View>
            
            <View style={[
              styles.badge,
              {
                backgroundColor: isPhoneVerified ? '#4CAF50' : theme.colors.border,
              }
            ]}>
              <MaterialIcons
                name="phone"
                size={12}
                color={isPhoneVerified ? '#FFFFFF' : theme.colors.textSecondary}
              />
              <Text style={[
                styles.badgeText,
                {
                  color: isPhoneVerified ? '#FFFFFF' : theme.colors.textSecondary,
                }
              ]}>
                Tél
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Niveau de partenaire */}
      <View style={styles.partnerLevel}>
        <LinearGradient
          colors={partnerColors}
          style={styles.partnerLevelGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <MaterialIcons
            name="star"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.partnerLevelText}>
            Partenaire {partnerLevel.charAt(0).toUpperCase() + partnerLevel.slice(1)}
          </Text>
        </LinearGradient>
      </View>

      {/* Statistiques */}
      {showStats && (
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatAmount(totalDonations)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total FCFA
            </Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {donationCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Dons
            </Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {level}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Niveau
            </Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatAmount(points)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Points
            </Text>
          </View>
        </View>
      )}

      {/* Rôle */}
      <View style={styles.roleContainer}>
        <MaterialIcons
          name={getRoleIcon(role)}
          size={16}
          color={theme.colors.primary}
        />
        <Text style={[styles.roleText, { color: theme.colors.primary }]}>
          {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    margin: 8,
    elevation: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    position: 'relative',
    overflow: 'hidden',
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
  },
  email: {
    fontSize: 14,
    marginBottom: 8,
  },
  verificationBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  partnerLevel: {
    marginBottom: 16,
  },
  partnerLevelGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  partnerLevelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactRole: {
    fontSize: 12,
  },
});

export default UserCard; 