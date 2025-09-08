import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme/ThemeProvider';
import AvatarUpload from '../components/AvatarUpload';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';

const ProfileSettingsScreen = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  
  // Récupérer les informations utilisateur depuis Redux
  const user = useSelector((state: RootState) => state.auth.user);
  const [localAvatar, setLocalAvatar] = useState(user?.avatar || null);

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setLocalAvatar(newAvatarUrl);
    // Mettre à jour l'avatar dans le store Redux si nécessaire
    // dispatch(updateUserAvatar(newAvatarUrl));
  };

  const settingsSections = [
    {
      title: 'Préférences générales',
      items: [
        {
          icon: 'dark-mode',
          title: 'Mode sombre',
          subtitle: 'Basculer entre thème clair et sombre',
          type: 'switch',
          value: isDarkMode,
          onPress: toggleTheme,
        },
        {
          icon: 'language',
          title: 'Langue',
          subtitle: 'Français',
          type: 'arrow',
          onPress: () => {
            Alert.alert(
              'Langue',
              'Cette fonctionnalité sera disponible prochainement'
            );
          },
        },
      ],
    },
    {
      title: 'Sécurité',
      items: [
        {
          icon: 'lock',
          title: 'Changer le mot de passe',
          subtitle: 'Modifier votre mot de passe',
          type: 'arrow',
          onPress: () => {
            navigation.navigate('ChangePasswordScreen' as never);
          },
        },
      ],
    },
  ];

  const renderSettingItem = (item: any, index: number) => {
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.settingItem,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.colors.border,
          }
        ]}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <View style={styles.settingContent}>
          <View style={styles.settingLeft}>
            <View style={[
              styles.iconContainer,
              { 
                backgroundColor: item.danger ? '#FFF5F5' : theme.colors.primary + '15'
              }
            ]}>
              <MaterialIcons
                name={item.icon}
                size={24}
                color={item.danger ? '#E53E3E' : theme.colors.primary}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[
                styles.settingTitle,
                { 
                  color: item.danger ? '#E53E3E' : theme.colors.text 
                }
              ]}>
                {item.title}
              </Text>
              <Text style={[
                styles.settingSubtitle,
                { color: theme.colors.textSecondary }
              ]}>
                {item.subtitle}
              </Text>
            </View>
          </View>
          
          <View style={styles.settingRight}>
            {item.type === 'switch' ? (
              <Switch
                value={item.value}
                onValueChange={item.onPress}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary + '40'
                }}
                thumbColor={item.value ? theme.colors.primary : '#f4f3f4'}
              />
            ) : (
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={theme.colors.textSecondary}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (section: any, sectionIndex: number) => {
    return (
      <View key={sectionIndex} style={styles.section}>
        <Text style={[
          styles.sectionTitle,
          { color: theme.colors.textSecondary }
        ]}>
          {section.title}
        </Text>
        <View style={[
          styles.sectionContainer,
          { backgroundColor: theme.colors.card }
        ]}>
          {section.items.map((item: any, index: number) => 
            renderSettingItem(item, index)
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: theme.colors.background }
    ]}>
      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: theme.colors.card }
      ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          { color: theme.colors.text }
        ]}>
          Paramètres du profil
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Avatar */}
        <View style={[
          styles.avatarSection,
          { backgroundColor: theme.colors.card }
        ]}>
          <Text style={[
            styles.sectionTitle,
            { color: theme.colors.textSecondary, marginBottom: 20 }
          ]}>
            Photo de profil
          </Text>
          
          <AvatarUpload
            currentAvatar={localAvatar}
            onAvatarUpdate={handleAvatarUpdate}
            size={120}
            showEditIcon={true}
          />
          
          <View style={styles.userInfo}>
            <Text style={[
              styles.userName,
              { color: theme.colors.text }
            ]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={[
              styles.userEmail,
              { color: theme.colors.textSecondary }
            ]}>
              {user?.email}
            </Text>
          </View>
        </View>

        {/* Sections de paramètres */}
        {settingsSections.map((section, index) => 
          renderSection(section, index)
        )}

        {/* Espacement final */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 20,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  settingRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacing: {
    height: 32,
  },
});

export default ProfileSettingsScreen;
