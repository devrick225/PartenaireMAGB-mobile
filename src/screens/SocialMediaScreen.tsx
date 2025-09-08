import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import {
  SOCIAL_MEDIA_PLATFORMS,
  SOCIAL_MEDIA_CATEGORIES,
  getPlatformsByCategory,
  getActivePlatforms,
  SocialMediaPlatform,
  SHARE_CONFIG,
  ERROR_MESSAGES,
} from '../constants/socialMedia';
import SocialMediaCard from '../components/SocialMediaCard';
import RefreshableHeader from '../components/RefreshableHeader';

interface SocialMediaScreenProps {
  navigation: any;
}

const SocialMediaScreen: React.FC<SocialMediaScreenProps> = ({ navigation }) => {
  const { dark, colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    shareButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    
    // Hero section styles
    heroSection: {
      borderColor: colors.primary,
      borderRadius: 16,
      padding: 20,
      marginVertical: 20,
      alignItems: 'center',
    },
    heroIcon: {
      marginBottom: 12,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.surface,
      textAlign: 'center',
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 16,
      color: colors.surface,
      textAlign: 'center',
      opacity: 0.9,
    },
    
    // Category filter styles
    categoriesContainer: {
      marginBottom: 20,
    },
    categoriesTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    categoriesRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryChipSelected: {
      borderColor: colors.primary,
    },
    categoryChipIcon: {
      marginRight: 6,
    },
    categoryChipText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    categoryChipTextSelected: {
      color: colors.surface,
    },
    
    // Platforms grid styles
    platformsContainer: {
      marginBottom: 20,
    },
    platformsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    platformsGrid: {
      gap: 8,
    },
    
    // Stats section
    statsSection: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    
    // Footer
    footer: {
      padding: 20,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  const handlePlatformPress = async (platform: SocialMediaPlatform) => {
    try {
      console.log(`🔗 Ouverture de ${platform.name}: ${platform.url}`);
      
      // Vérifier si l'URL peut être ouverte
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

  const handleSharePress = async () => {
    try {
      const platformsList = getActivePlatforms()
        .map(p => `${p.name}: ${p.url}`)
        .join('\n');
      
      const shareContent = {
        title: SHARE_CONFIG.title,
        message: `${SHARE_CONFIG.message}\n\n${platformsList}`,
      };

      await Share.share(shareContent, {
        dialogTitle: SHARE_CONFIG.dialogTitle,
      });
    } catch (error) {
      console.error('❌ Erreur partage:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simule le rechargement des données
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getFilteredPlatforms = (): SocialMediaPlatform[] => {
    if (selectedCategory === 'all') {
      return getActivePlatforms();
    }
    return getPlatformsByCategory(selectedCategory);
  };

  const getTotalFollowers = (): string => {
    // Calcul approximatif du nombre total de followers
    let total = 0;
    getActivePlatforms().forEach(platform => {
      if (platform.followers) {
        const count = platform.followers.replace(/[K+]/g, '');
        total += parseInt(count) * 1000;
      }
    });
    return `${Math.round(total / 1000)}K+`;
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoriesContainer}>
      <Text style={styles.categoriesTitle}>Catégories</Text>
      <View style={styles.categoriesRow}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && styles.categoryChipSelected,
          ]}
          onPress={() => setSelectedCategory('all')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="apps"
            size={16}
            color={selectedCategory === 'all' ? colors.surface : colors.text}
            style={styles.categoryChipIcon}
          />
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === 'all' && styles.categoryChipTextSelected,
            ]}
          >
            Tous
          </Text>
        </TouchableOpacity>
        
        {SOCIAL_MEDIA_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory(category.id)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={category.icon as any}
              size={16}
              color={selectedCategory === category.id ? colors.surface : colors.text}
              style={styles.categoryChipIcon}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextSelected,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPlatformCard = (platform: SocialMediaPlatform) => (
    <View key={platform.id} style={{ marginVertical: 4 }}>
      <SocialMediaCard
        platform={platform}
        variant="default"
        showDescription={true}
        showStats={true}
        onPress={handlePlatformPress}
      />
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsSection}>
      <Text style={styles.statsTitle}>Notre Présence en Ligne</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{getActivePlatforms().length}</Text>
          <Text style={styles.statLabel}>Plateformes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{getTotalFollowers()}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>24/7</Text>
          <Text style={styles.statLabel}>Disponibilité</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <RefreshableHeader
        title="Nos Réseaux Sociaux"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        showRefreshButton={false}
        onRefreshPress={onRefresh}
        isRefreshing={refreshing}
        showShareButton={false}
        onSharePress={handleSharePress}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <MaterialIcons
            name="public"
            size={48}
            color={colors.surface}
            style={styles.heroIcon}
          />
          <Text style={styles.heroTitle}>Restez Connectés</Text>
          <Text style={styles.heroSubtitle}>
            Suivez toutes nos activités et rejoignez notre communauté en ligne
          </Text>
        </View>

        {/* Stats 
        {renderStats()}
*/}
        {/* Category Filter */}
        {renderCategoryFilter()}

        {/* Platforms List */}
        <View style={styles.platformsContainer}>
          <Text style={styles.platformsTitle}>
            {selectedCategory === 'all' 
              ? 'Toutes nos plateformes' 
              : SOCIAL_MEDIA_CATEGORIES.find(c => c.id === selectedCategory)?.name}
          </Text>
          <View style={styles.platformsGrid}>
            {getFilteredPlatforms().map(renderPlatformCard)}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Rejoignez notre communauté en ligne et ne manquez aucune de nos activités !
            {'\n'}Partagez, commentez et restez inspirés avec MAGB.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SocialMediaScreen;