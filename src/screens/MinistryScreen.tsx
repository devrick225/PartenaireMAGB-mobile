import logger from '../utils/logger';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchAllMinistries,
  fetchMinistriesByCategory,
  fetchMinistryStats,
  setSelectedCategory,
  selectAllMinistries,
  selectMinistryStats,
  selectMinistryCategories,
  selectSelectedCategory,
  selectMinistryLoading,
  selectMinistryError,
  clearError
} from '../store/slices/ministrySlice';
import { Ministry } from '../types/navigation';
import openLink from '../utils/openLink';

import { useDS, AppText, Screen, HeroHeader, HeroChip, Card, Button, EmptyState, LoadingState } from '../design/components';
import { cardShadow, radius, spacing, MIN_TOUCH } from '../design/tokens';

const MinistryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { c } = useDS();
  const dispatch = useAppDispatch();
  
  // Sélecteurs Redux
  const ministries = useAppSelector(selectAllMinistries);
  const stats = useAppSelector(selectMinistryStats);
  const categories = useAppSelector(selectMinistryCategories);
  const selectedCategory = useAppSelector(selectSelectedCategory);
  const loading = useAppSelector(selectMinistryLoading);
  const error = useAppSelector(selectMinistryError);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchMinistryStats()).unwrap(),
        selectedCategory === 'all' 
          ? dispatch(fetchAllMinistries({})).unwrap()
          : dispatch(fetchMinistriesByCategory(selectedCategory)).unwrap()
      ]);
    } catch (error) {
      logger.error('Erreur lors du chargement des données:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: string) => {
    dispatch(setSelectedCategory(category));
  };

  const handleMinistryPress = (ministry: Ministry) => {
    (navigation as any).navigate('MinistryDetail', { ministry });
  };

  const handleExternalLink = async (url: string) => {
    await openLink(url);
  };

  const handleContactPress = (ministry: Ministry) => {
    if (!ministry.contactInfo) return;

    const { name, phone, email } = ministry.contactInfo;
    const contactOptions = [];

    if (phone) {
      contactOptions.push({
        text: `Appeler ${name || 'le contact'}`,
        onPress: () => { openLink(`tel:${phone}`); }
      });
    }

    if (email) {
      contactOptions.push({
        text: `Envoyer un email`,
        onPress: () => { openLink(`mailto:${email}`); }
      });
    }

    if (contactOptions.length > 0) {
      Alert.alert(
        `Contact - ${ministry.title}`,
        'Choisissez une option de contact',
        contactOptions
      );
    }
  };


  const hero = (
    <HeroHeader
      eyebrow="Le ministère"
      eyebrowIcon="people-outline"
      title="Ministères"
      subtitle="Découvrez les ministères et leurs activités."
      onBack={() => navigation.goBack()}
    >
      {stats ? (
        <View style={styles.chips}>
          <HeroChip icon="checkmark-circle" label={`${stats.active} actifs`} />
          <HeroChip label={`${stats.total} au total`} />
        </View>
      ) : null}
    </HeroHeader>
  );

  if (loading && !refreshing) {
    return (
      <Screen hero={hero}>
        <Card><LoadingState message="Chargement des ministères…" /></Card>
      </Screen>
    );
  }

  const currentLabel = selectedCategory === 'all' ? 'Tous les ministères' : categories.find(cat => cat.key === selectedCategory)?.label;

  return (
    <Screen hero={hero} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}>
      {/* Catégories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats} accessibilityLabel="Catégories">
        {categories.map((cat: any) => {
          const active = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => handleCategoryPress(cat.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              style={[styles.cat, { backgroundColor: active ? c.primary : c.card, borderColor: active ? c.primary : c.border }]}
            >
              <Ionicons name={cat.icon as any} size={16} color={active ? c.primaryForeground : c.mutedForeground} />
              <AppText variant="smallStrong" color={active ? c.primaryForeground : c.foreground}>{cat.label}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <AppText variant="overline" color={c.mutedForeground}>{currentLabel}</AppText>

      {ministries.length === 0 ? (
        <Card><EmptyState icon="people-outline" title="Aucun ministère" message="Aucun ministère dans cette catégorie pour le moment." /></Card>
      ) : (
        ministries.map((ministry: Ministry) => {
          const canContact = !!ministry.contactInfo && !!(ministry.contactInfo.phone || ministry.contactInfo.email);
          return (
            <Pressable
              key={ministry._id}
              onPress={() => handleMinistryPress(ministry)}
              accessibilityRole="button"
              accessibilityLabel={ministry.title}
              style={({ pressed }) => [styles.card, cardShadow, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.92 : 1 }]}
            >
              {ministry.imageUrl ? <Image source={{ uri: ministry.imageUrl }} style={styles.image} resizeMode="cover" /> : null}
              <View style={styles.cardBody}>
                <AppText variant="subtitle">{ministry.title}</AppText>
                <AppText variant="small" color={c.mutedForeground} numberOfLines={3}>{ministry.description}</AppText>
                {canContact || ministry.externalLink ? (
                  <View style={styles.actions}>
                    {canContact ? <Button title="Contacter" variant="outline" icon="call-outline" fullWidth={false} onPress={() => handleContactPress(ministry)} style={styles.action} /> : null}
                    {ministry.externalLink ? <Button title="En savoir plus" variant="ghost" icon="open-outline" fullWidth={false} onPress={() => handleExternalLink(ministry.externalLink!)} style={styles.action} /> : null}
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  cats: { gap: spacing.sm, paddingRight: spacing.lg },
  cat: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: MIN_TOUCH - 4, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1 },
  card: { borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  image: { width: '100%', height: 160 },
  cardBody: { padding: spacing.lg, gap: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  action: { minHeight: 40 },
});

export default MinistryScreen;
