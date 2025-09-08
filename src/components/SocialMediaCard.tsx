import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { SocialMediaPlatform, ERROR_MESSAGES } from '../constants/socialMedia';

interface SocialMediaCardProps {
  platform: SocialMediaPlatform;
  variant?: 'default' | 'compact' | 'minimal';
  showDescription?: boolean;
  showStats?: boolean;
  onPress?: (platform: SocialMediaPlatform) => void;
}

const SocialMediaCard: React.FC<SocialMediaCardProps> = ({
  platform,
  variant = 'default',
  showDescription = true,
  showStats = true,
  onPress,
}) => {
  const { colors } = useTheme();

  const handlePress = async () => {
    if (onPress) {
      onPress(platform);
      return;
    }

    try {
      console.log(`🔗 Ouverture de ${platform.name}: ${platform.url}`);
      
      const canOpen = await Linking.canOpenURL(platform.url);
      
      if (canOpen) {
        await Linking.openURL(platform.url);
      } else {
        Alert.alert(
          'Lien non disponible',
          ERROR_MESSAGES.linkNotAvailable,
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error(`❌ Erreur ouverture ${platform.name}:`, error);
      Alert.alert(
        'Erreur',
        ERROR_MESSAGES.networkError,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const getCardStyle = () => {
    switch (variant) {
      case 'compact':
        return styles.compactCard;
      case 'minimal':
        return styles.minimalCard;
      default:
        return styles.defaultCard;
    }
  };

  const getIconSize = () => {
    switch (variant) {
      case 'compact':
        return 20;
      case 'minimal':
        return 18;
      default:
        return 24;
    }
  };

  const styles = StyleSheet.create({
    defaultCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    compactCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    minimalCard: {
      backgroundColor: 'transparent',
      borderRadius: 8,
      padding: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: variant === 'minimal' ? 32 : variant === 'compact' ? 40 : 48,
      height: variant === 'minimal' ? 32 : variant === 'compact' ? 40 : 48,
      borderRadius: variant === 'minimal' ? 16 : variant === 'compact' ? 20 : 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: variant === 'minimal' ? 8 : variant === 'compact' ? 12 : 16,
    },
    contentContainer: {
      flex: 1,
    },
    platformName: {
      fontSize: variant === 'minimal' ? 14 : variant === 'compact' ? 15 : 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: variant === 'minimal' ? 0 : 4,
    },
    platformDescription: {
      fontSize: variant === 'minimal' ? 12 : 14,
      color: colors.textSecondary,
      marginBottom: variant === 'minimal' ? 0 : 6,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    platformFollowers: {
      fontSize: 12,
      color: colors.textSecondary,
      marginRight: 12,
    },
    platformCategory: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    actionIcon: {
      marginLeft: 8,
    },
  });

  return (
    <TouchableOpacity
      style={getCardStyle()}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: platform.color + '20' },
        ]}
      >
        <MaterialIcons
          name={platform.icon as any}
          size={getIconSize()}
          color={platform.color}
        />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.platformName}>{platform.name}</Text>
        
        {showDescription && variant !== 'minimal' && (
          <Text style={styles.platformDescription}>{platform.description}</Text>
        )}
        
        {showStats && platform.followers && variant === 'default' && (
          <View style={styles.statsContainer}>
            <Text style={styles.platformFollowers}>
              👥 {platform.followers}
            </Text>
            <Text style={styles.platformCategory}>{platform.category}</Text>
          </View>
        )}
      </View>
      
      {variant !== 'minimal' && (
        <MaterialIcons
          name="open-in-new"
          size={variant === 'compact' ? 18 : 20}
          color={colors.textSecondary}
          style={styles.actionIcon}
        />
      )}
    </TouchableOpacity>
  );
};

export default SocialMediaCard;