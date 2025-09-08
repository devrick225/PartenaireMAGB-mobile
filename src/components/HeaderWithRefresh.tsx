import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import MenuRefreshIcon from './MenuRefreshIcon';

interface HeaderWithRefreshProps {
  title: string;
  onBackPress?: () => void;
  onRefreshPress?: () => void;
  isRefreshing?: boolean;
  showBackButton?: boolean;
  backgroundColor?: string;
  children?: React.ReactNode;
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
}

const HeaderWithRefresh: React.FC<HeaderWithRefreshProps> = ({
  title,
  onBackPress,
  onRefreshPress,
  isRefreshing = false,
  showBackButton = true,
  backgroundColor,
  children,
  rightComponent,
  leftComponent,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: backgroundColor || colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      marginRight: 16,
      padding: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    content: {
      marginTop: children ? 12 : 0,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {leftComponent || (
            <>
              {showBackButton && onBackPress && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={onBackPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
              )}
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            </>
          )}
        </View>
        
        <View style={styles.rightSection}>
          {onRefreshPress && (
            <MenuRefreshIcon
              onPress={onRefreshPress}
              isRefreshing={isRefreshing}
              size={24}
              color={colors.primary}
              style={{ backgroundColor: colors.primary + '15' }}
            />
          )}
          {rightComponent}
        </View>
      </View>
      
      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

export default HeaderWithRefresh;