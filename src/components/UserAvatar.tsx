import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';

const { width, height } = Dimensions.get('window');

interface UserAvatarProps {
  user: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  size?: number;
  onPress?: () => void;
  showFullScreenOnPress?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 56,
  onPress,
  showFullScreenOnPress = true,
}) => {
  const { colors } = useTheme();
  const [showFullScreen, setShowFullScreen] = useState(false);

  const getInitials = () => {
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (showFullScreenOnPress && user?.avatar) {
      setShowFullScreen(true);
    }
  };

  const avatarStyles = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.avatarContainer, { borderColor: colors.primary }, avatarStyles]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {user?.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={[styles.avatar, avatarStyles]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }, avatarStyles]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.32 }]}>
              {getInitials()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal pour afficher la photo en grand */}
      <Modal
        visible={showFullScreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullScreen(false)}
      >
        <StatusBar backgroundColor="rgba(0, 0, 0, 0.9)" barStyle="light-content" />
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFullScreen(false)}
          >
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.imageContainer}>
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.fullScreenPlaceholder}>
                <Text style={styles.fullScreenInitials}>
                  {getInitials()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    // Styles dynamiques appliqués via props
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fullScreenImage: {
    width: width - 40,
    height: height * 0.7,
    maxWidth: 400,
    maxHeight: 400,
  },
  fullScreenPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenInitials: {
    fontSize: 60,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  userInfo: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default UserAvatar;