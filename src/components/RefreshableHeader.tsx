/**
 * Barre supérieure des écrans secondaires — reprend la barre du haut de
 * MobileLayout (frontend-new) : fond carte, bordure basse, titre Playfair.
 *
 * Les écrans qui l'utilisent gèrent eux-mêmes la zone sûre (SafeAreaView),
 * d'où une barre simple plutôt que le hero en dégradé de src/design.
 */
import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AppText, IconButton, useDS } from '../design/components';
import { MIN_TOUCH, spacing } from '../design/tokens';

interface RefreshableHeaderProps {
  title: string;
  onBackPress?: () => void;
  onRefreshPress?: () => void;
  onSharePress?: () => void;
  onSettingsPress?: () => void;
  isRefreshing?: boolean;
  showBackButton?: boolean;
  showRefreshButton?: boolean;
  showShareButton?: boolean;
  showSettingsButton?: boolean;
  customLeftComponent?: React.ReactNode;
  customRightComponent?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
}

const RefreshableHeader: React.FC<RefreshableHeaderProps> = ({
  title,
  onBackPress,
  onRefreshPress,
  onSharePress,
  onSettingsPress,
  isRefreshing = false,
  showBackButton = true,
  showRefreshButton = true,
  showShareButton = false,
  showSettingsButton = false,
  customLeftComponent,
  customRightComponent,
  backgroundColor,
  textColor,
}) => {
  const { c } = useDS();

  return (
    <View style={[styles.bar, { backgroundColor: backgroundColor ?? c.card, borderBottomColor: c.border }]}>
      <View style={styles.side}>
        {customLeftComponent ??
          (showBackButton && onBackPress ? (
            <IconButton icon="chevron-back" onPress={onBackPress} accessibilityLabel="Retour" />
          ) : null)}
      </View>

      <AppText
        variant="title"
        color={textColor ?? c.foreground}
        numberOfLines={1}
        accessibilityRole="header"
        style={styles.title}
      >
        {title}
      </AppText>

      <View style={[styles.side, styles.right]}>
        {customRightComponent}
        {showShareButton && onSharePress ? (
          <IconButton icon="share-outline" onPress={onSharePress} accessibilityLabel="Partager" />
        ) : null}
        {showSettingsButton && onSettingsPress ? (
          <IconButton icon="settings-outline" onPress={onSettingsPress} accessibilityLabel="Paramètres" />
        ) : null}
        {showRefreshButton && onRefreshPress ? (
          isRefreshing ? (
            <View style={styles.spinner}>
              <ActivityIndicator color={c.primary} />
            </View>
          ) : (
            <IconButton icon="refresh" onPress={onRefreshPress} accessibilityLabel="Actualiser" />
          )
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  side: { minWidth: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  right: { justifyContent: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
  spinner: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
});

export default RefreshableHeader;
