import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface MenuRefreshIconProps {
  onPress: () => void;
  isRefreshing?: boolean;
  size?: number;
  color?: string;
  style?: any;
  disabled?: boolean;
  animated?: boolean;
}

const MenuRefreshIcon: React.FC<MenuRefreshIconProps> = ({
  onPress,
  isRefreshing = false,
  size = 24,
  color,
  style,
  disabled = false,
  animated = true,
}) => {
  const { colors } = useTheme();
  const spinValue = React.useRef(new Animated.Value(0)).current;

  // Animation de rotation
  React.useEffect(() => {
    if (isRefreshing && animated) {
      const spin = () => {
        spinValue.setValue(0);
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          if (isRefreshing) {
            spin();
          }
        });
      };
      spin();
    }
  }, [isRefreshing, animated]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const iconColor = color || colors.text;

  const styles = StyleSheet.create({
    container: {
      padding: 8,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.5 : 1,
    },
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={disabled || isRefreshing}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          animated && isRefreshing && { transform: [{ rotate: spin }] }
        ]}
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <MaterialIcons name="refresh" size={size} color={iconColor} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default MenuRefreshIcon;