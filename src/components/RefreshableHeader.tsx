import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

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
  const { colors, dark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: backgroundColor || colors.background,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    leftFixed: {
      width: 40,
      height: 40,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    centerTitleWrapper: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rightFixed: {
      minWidth: 40,
      alignItems: 'flex-end',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: dark ? COLORS.dark2 : COLORS.white,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: textColor || colors.text,
    },
    iconButton: {
      padding: 8,
      marginLeft: 8,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    refreshButton: {
      backgroundColor: colors.primary + '15',
    },
    shareButton: {
      backgroundColor: colors.secondary + '15',
    },
    settingsButton: {
      backgroundColor: (textColor || colors.text) + '10',
    },
    refreshingContainer: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  const hasRightActions = !!(
    customRightComponent ||
    (showRefreshButton && onRefreshPress) ||
    (showShareButton && onSharePress) ||
    (showSettingsButton && onSettingsPress)
  );

  return (
    <View style={styles.container}>
      {/* Left (Back) */}
      <View style={styles.leftFixed}>
        {customLeftComponent ? (
          customLeftComponent
        ) : (
          showBackButton && onBackPress ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={textColor || colors.text} />
            </TouchableOpacity>
          ) : null
        )}
      </View>

      {/* Center Title */}
      <View style={styles.centerTitleWrapper}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>

      {/* Right Actions or Spacer */}
      <View style={styles.rightFixed}>
        {customRightComponent}

        {!customRightComponent && showRefreshButton && onRefreshPress && (
          <TouchableOpacity
            style={[styles.iconButton, styles.refreshButton]}
            onPress={onRefreshPress}
            activeOpacity={0.7}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <View style={styles.refreshingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <MaterialIcons name="refresh" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}

        {!customRightComponent && showShareButton && onSharePress && (
          <TouchableOpacity
            style={[styles.iconButton, styles.shareButton]}
            onPress={onSharePress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="share" size={20} color={colors.secondary} />
          </TouchableOpacity>
        )}

        {!customRightComponent && showSettingsButton && onSettingsPress && (
          <TouchableOpacity
            style={[styles.iconButton, styles.settingsButton]}
            onPress={onSettingsPress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="settings" size={20} color={textColor || colors.text} />
          </TouchableOpacity>
        )}

        {!hasRightActions && <View style={{ width: 40 }} />}
      </View>
    </View>
  );
};

export default RefreshableHeader;