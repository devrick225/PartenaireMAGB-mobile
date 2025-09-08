import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface RefreshButtonProps {
  onPress: () => void;
  isRefreshing?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline' | 'floating';
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'center';
  style?: any;
  disabled?: boolean;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
  onPress,
  isRefreshing = false,
  size = 'medium',
  variant = 'primary',
  position = 'top-right',
  style,
  disabled = false,
}) => {
  const { colors, dark } = useTheme();
  const spinValue = React.useRef(new Animated.Value(0)).current;

  // Animation de rotation pour l'icône
  React.useEffect(() => {
    if (isRefreshing) {
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
  }, [isRefreshing]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSizeValues = () => {
    switch (size) {
      case 'small':
        return { width: 36, height: 36, iconSize: 18 };
      case 'large':
        return { width: 56, height: 56, iconSize: 28 };
      default: // medium
        return { width: 48, height: 48, iconSize: 24 };
    }
  };

  const getPositionStyle = () => {
    const sizeValues = getSizeValues();
    const offset = 16;

    switch (position) {
      case 'top-right':
        return {
          position: 'absolute',
          top: offset,
          right: offset,
          zIndex: 1000,
        };
      case 'bottom-right':
        return {
          position: 'absolute',
          bottom: offset,
          right: offset,
          zIndex: 1000,
        };
      case 'bottom-left':
        return {
          position: 'absolute',
          bottom: offset,
          left: offset,
          zIndex: 1000,
        };
      case 'center':
        return {
          alignSelf: 'center',
        };
      default:
        return {};
    }
  };

  const getVariantStyle = () => {
    const sizeValues = getSizeValues();

    const baseStyle = {
      width: sizeValues.width,
      height: sizeValues.height,
      borderRadius: sizeValues.width / 2,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: variant === 'floating' ? 6 : 2,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: variant === 'floating' ? 3 : 1,
      },
      shadowOpacity: variant === 'floating' ? 0.3 : 0.15,
      shadowRadius: variant === 'floating' ? 4 : 2,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.secondary,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.primary,
        };
      case 'floating':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
          elevation: 8,
          shadowOpacity: 0.4,
        };
      default:
        return baseStyle;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'outline':
        return colors.primary;
      case 'primary':
      case 'secondary':
      case 'floating':
        return colors.surface || '#FFFFFF';
      default:
        return colors.text;
    }
  };

  const styles = StyleSheet.create({
    button: {
      ...getVariantStyle(),
      ...getPositionStyle(),
      opacity: disabled ? 0.6 : 1,
    },
    pressed: {
      transform: [{ scale: 0.95 }],
    },
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  const sizeValues = getSizeValues();

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || isRefreshing}
    >
      <Animated.View 
        style={[
          styles.iconContainer,
          isRefreshing && { transform: [{ rotate: spin }] }
        ]}
      >
        {isRefreshing ? (
          <ActivityIndicator 
            size={size === 'small' ? 'small' : 'small'} 
            color={getIconColor()} 
          />
        ) : (
          <MaterialIcons
            name="refresh"
            size={sizeValues.iconSize}
            color={getIconColor()}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default RefreshButton;