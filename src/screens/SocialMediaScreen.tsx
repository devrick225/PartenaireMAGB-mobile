import logger from '../utils/logger';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import {
  SOCIAL_MEDIA_PLATFORMS,
  SOCIAL_MEDIA_CATEGORIES,
  getPlatformsByCategory,
  getActivePlatforms,
  SocialMediaPlatform,
  SHARE_CONFIG,
  ERROR_MESSAGES,
} from '../constants/socialMedia';
import openLink from '../utils/openLink';

import { useDS, AppText, Screen, HeroHeader, IconButton, Section } from '../design/components';
import { radius, spacing, MIN_TOUCH } from '../design/tokens';
interface SocialMediaScreenProps {
  navigation: any;
}

const SocialMediaScreen: React.FC<SocialMediaScreenProps> = ({ navigation }) => {
  const { c } = useDS();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handlePlatformPress = async (platform: SocialMediaPlatform) => {
    await openLink(platform.url, ERROR_MESSAGES.linkNotAvailable);
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
      logger.error('❌ Erreur partage:', error);
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


  const platforms = getFilteredPlatforms();
  const Chip = ({ id, label, icon }: { id: string; label: string; icon: string }) => {
    const active = selectedCategory === id;
    return (
      <Pressable
        onPress={() => setSelectedCategory(id)}
        accessibilityRole="radio"
        accessibilityState={{ checked: active }}
        style={[styles.chip, { backgroundColor: active ? c.primary : c.card, borderColor: active ? c.primary : c.border }]}
      >
        <MaterialIcons name={icon as any} size={16} color={active ? c.primaryForeground : c.mutedForeground} />
        <AppText variant="smallStrong" color={active ? c.primaryForeground : c.foreground}>{label}</AppText>
      </Pressable>
    );
  };

  return (
    <Screen
      hero={
        <HeroHeader
          eyebrow="Le ministère"
          eyebrowIcon="globe-outline"
          title="Restez connectés"
          subtitle="Suivez nos activités et rejoignez la communauté en ligne."
          onBack={() => navigation.goBack()}
          right={<IconButton icon="share-social-outline" tone="hero" accessibilityLabel="Partager nos réseaux" onPress={handleSharePress} />}
        />
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Catégories">
        <Chip id="all" label="Tous" icon="apps" />
        {SOCIAL_MEDIA_CATEGORIES.map(cat => <Chip key={cat.id} id={cat.id} label={cat.name} icon={cat.icon} />)}
      </ScrollView>

      <Section title={selectedCategory === 'all' ? 'Toutes nos plateformes' : SOCIAL_MEDIA_CATEGORIES.find(cat => cat.id === selectedCategory)?.name}>
        {platforms.map((p, i) => (
          <Pressable
            key={p.id}
            onPress={() => handlePlatformPress(p)}
            accessibilityRole="link"
            accessibilityLabel={`Ouvrir ${p.name}`}
            style={({ pressed }) => [styles.row, i < platforms.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }, pressed && { backgroundColor: c.muted }]}
          >
            <View style={[styles.logo, { backgroundColor: p.color }]}>
              <MaterialIcons name={p.icon as any} size={22} color="#FFFFFF" />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{p.name}</AppText>
              <AppText variant="small" color={c.mutedForeground} numberOfLines={2}>{p.description}</AppText>
              {p.followers ? <AppText variant="caption" color={c.primary}>{p.followers} abonnés</AppText> : null}
            </View>
            <Ionicons name="open-outline" size={18} color={c.mutedForeground} />
          </Pressable>
        ))}
      </Section>

      <AppText variant="small" color={c.mutedForeground} center>
        Partagez, commentez et restez inspirés avec MAGB.
      </AppText>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { gap: spacing.sm, paddingRight: spacing.lg },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: MIN_TOUCH - 4, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 64 },
  logo: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
});

export default SocialMediaScreen;
