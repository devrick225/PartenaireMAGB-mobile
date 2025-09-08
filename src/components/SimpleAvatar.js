import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SimpleAvatar = ({ 
  source, 
  name = '', 
  size = 50, 
  showBorder = true, 
  showStatus = false,
  isOnline = false,
  showBadge = false,
  badgeCount = 0,
  style = {},
  textStyle = {},
  borderColor = '#8B5CF6' // Couleur par défaut
}) => {
  
  // Extraire les initiales du nom
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const names = fullName.split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const avatarSize = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const borderWidth = showBorder ? Math.max(2, size * 0.04) : 0;
  const statusSize = size * 0.25;
  const badgeSize = size * 0.35;

  // Couleurs de dégradé pour les initiales
  const gradientColors = [
    borderColor,
    borderColor + '80'
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Avatar principal */}
      <View style={[
        styles.avatarWrapper,
        avatarSize,
        showBorder && {
          borderWidth,
          borderColor: borderColor,
        }
      ]}>
        {source ? (
          <Image
            source={typeof source === 'string' ? { uri: source } : source}
            style={[styles.avatarImage, avatarSize]}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={gradientColors}
            style={[styles.initialsContainer, avatarSize]}
          >
            <Text style={[
              styles.initialsText,
              {
                fontSize: size * 0.4,
                color: '#FFFFFF',
              },
              textStyle
            ]}>
              {getInitials(name)}
            </Text>
          </LinearGradient>
        )}
      </View>

      {/* Indicateur de statut en ligne */}
      {showStatus && (
        <View style={[
          styles.statusIndicator,
          {
            width: statusSize,
            height: statusSize,
            borderRadius: statusSize / 2,
            backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E',
            borderWidth: Math.max(1, statusSize * 0.15),
            borderColor: '#FFFFFF',
            bottom: size * 0.05,
            right: size * 0.05,
          }
        ]} />
      )}

      {/* Badge de notification */}
      {showBadge && badgeCount > 0 && (
        <View style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: '#F44336',
            borderWidth: Math.max(1, badgeSize * 0.1),
            borderColor: '#FFFFFF',
            top: -badgeSize * 0.2,
            right: -badgeSize * 0.2,
          }
        ]}>
          <Text style={[
            styles.badgeText,
            {
              fontSize: badgeSize * 0.5,
              color: '#FFFFFF',
            }
          ]}>
            {badgeCount > 99 ? '99+' : badgeCount.toString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrapper: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: '#FFFFFF',
  },
  avatarImage: {
    backgroundColor: '#E5E5E5',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  badge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  badgeText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SimpleAvatar; 