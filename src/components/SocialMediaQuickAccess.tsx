import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { getActivePlatforms, SocialMediaPlatform } from '../constants/socialMedia';
import SocialMediaCard from './SocialMediaCard';

interface SocialMediaQuickAccessProps {
  title?: string;
  maxItems?: number;
  variant?: 'default' | 'compact' | 'minimal';
  horizontal?: boolean;
  showViewAll?: boolean;
  onViewAllPress?: () => void;
  onPlatformPress?: (platform: SocialMediaPlatform) => void;
}

const SocialMediaQuickAccess: React.FC<SocialMediaQuickAccessProps> = ({
  title = 'Nos Réseaux Sociaux',
  maxItems = 4,
  variant = 'compact',
  horizontal = false,
  showViewAll = true,
  onViewAllPress,
  onPlatformPress,
}) => {
  const { colors } = useTheme();

  // Obtenir les plateformes les plus populaires (avec le plus de followers)
  const getTopPlatforms = (): SocialMediaPlatform[] => {
    const platforms = getActivePlatforms();
    
    // Trier par popularité (nombre de followers) puis prendre les premiers
    const sortedPlatforms = platforms.sort((a, b) => {
      const aFollowers = a.followers ? parseInt(a.followers.replace(/[K+]/g, '')) : 0;
      const bFollowers = b.followers ? parseInt(b.followers.replace(/[K+]/g, '')) : 0;
      return bFollowers - aFollowers;
    });
    
    return sortedPlatforms.slice(0, maxItems);
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingHorizontal: horizontal ? 0 : 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    viewAllText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
      marginRight: 4,
    },
    contentContainer: {
      paddingHorizontal: horizontal ? 0 : 20,
    },
    verticalList: {
      gap: 8,
    },
    horizontalList: {
      paddingHorizontal: 20,
    },
    platformItem: {
      marginRight: horizontal ? 12 : 0,
      width: horizontal ? 280 : undefined,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
  });

  const topPlatforms = getTopPlatforms();

  if (topPlatforms.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.emptyState}>
          <MaterialIcons name="public" size={32} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            Aucun réseau social configuré pour le moment
          </Text>
        </View>
      </View>
    );
  }

  const renderPlatformItem = (platform: SocialMediaPlatform, index: number) => (
    <View key={platform.id} style={styles.platformItem}>
      <SocialMediaCard
        platform={platform}
        variant={variant}
        showDescription={variant === 'default'}
        showStats={variant === 'default'}
        onPress={onPlatformPress}
      />
    </View>
  );

  const renderContent = () => {
    if (horizontal) {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {topPlatforms.map(renderPlatformItem)}
        </ScrollView>
      );
    }

    return (
      <View style={[styles.contentContainer, styles.verticalList]}>
        {topPlatforms.map(renderPlatformItem)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showViewAll && onViewAllPress && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={onViewAllPress}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>Voir tout</Text>
            <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      {renderContent()}
    </View>
  );
};

export default SocialMediaQuickAccess;