import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import userService from '../store/services/userService';
import donationService from '../store/services/donationService';
import useUserPermissions, { getUserRoleLabel, getUserRoleColor } from '../hooks/useUserPermissions';
import { logoutUser, updateUser } from '../store/slices/authSlice';
import { RootState } from '../store';

interface SettingItem {
  id: string;
  title: string;
  icon: string;
  type: 'toggle' | 'navigation' | 'selection' | 'action';
  value?: boolean | string;
  options?: Array<{ label: string; value: string }>;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = useUserPermissions();

  
  const [preferences, setPreferences] = useState({
    emailNotifications: {
      donations: true,
      reminders: true,
      newsletters: false,
    },
    smsNotifications: {
      donations: false,
      reminders: false,
    },
    language: 'fr',
    currency: 'XOF',
    theme: 'auto',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Charger les préférences de l'utilisateur au démarrage
  useEffect(() => {
    if (user) {
      // Initialiser avec les valeurs de l'utilisateur connecté
      setPreferences(prev => ({
        ...prev,
        language: user.language || 'fr',
        currency: user.currency || 'XOF',
      }));
      loadUserPreferences();
    }
  }, [user]);
  
  const loadUserPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getUserPreferences();
      
      if (response.data?.data) {
        const userPrefs = response.data.data;
        setPreferences(userPrefs);
      }
    } catch (error) {
      console.error('Erreur chargement préférences:', error);
      // Garder les valeurs par défaut en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  };
  const [currentSelection, setCurrentSelection] = useState<{
    title: string;
    options: Array<{ label: string; value: string }>;
    current: string;
    onSelect: (value: string) => void;
  } | null>(null);

  const languages = [
    { label: 'Français', value: 'fr' },
    { label: 'English', value: 'en' },
  ];

  const currencies = [
    { label: 'XOF (Franc CFA)', value: 'XOF' },
    { label: 'EUR (Euro)', value: 'EUR' },
    { label: 'USD (Dollar)', value: 'USD' },
  ];

  const themes = [
    { label: 'Automatique', value: 'auto' },
    { label: 'Clair', value: 'light' },
    { label: 'Sombre', value: 'dark' },
  ];

  const showSelectionModal = (
    title: string,
    options: Array<{ label: string; value: string }>,
    current: string,
    onSelect: (value: string) => void
  ) => {
    setCurrentSelection({ title, options, current, onSelect });
    setModalVisible(true);
  };

  const updatePreferences = async (newPreferences: any) => {
    try {
      setIsLoading(true);
      const response = await userService.updateUserPreferences(newPreferences);
      
      // Mettre à jour l'état local
      if (newPreferences.language || newPreferences.currency || newPreferences.theme) {
        setPreferences(prev => {
          const updated = { ...prev };
          if (newPreferences.language) updated.language = newPreferences.language;
          if (newPreferences.currency) updated.currency = newPreferences.currency;
          if (newPreferences.theme) updated.theme = newPreferences.theme;
          return updated;
        });
      }

      // Mettre à jour le Redux store pour persister les changements
      if (newPreferences.language || newPreferences.currency) {
        const updatedUser = { ...user };
        if (newPreferences.language) updatedUser.language = newPreferences.language;
        if (newPreferences.currency) updatedUser.currency = newPreferences.currency;
        
        // Dispatch pour mettre à jour le store
        dispatch(updateUser(updatedUser) as any);
      }
      
      console.log('✅ Préférences mises à jour avec succès:', newPreferences);
    } catch (error) {
      console.error('Erreur mise à jour préférences:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour les préférences');
      
      // En cas d'erreur, on remet l'état précédent pour les toggles
      if (newPreferences.emailNotifications || newPreferences.smsNotifications) {
        setPreferences(prev => {
          const updated = { ...prev };
          if (newPreferences.emailNotifications) {
            updated.emailNotifications = {
              ...prev.emailNotifications,
              ...newPreferences.emailNotifications,
            };
          }
          if (newPreferences.smsNotifications) {
            updated.smsNotifications = {
              ...prev.smsNotifications,
              ...newPreferences.smsNotifications,
            };
          }
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => {
            dispatch(logoutUser() as any);
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirmation',
              'Veuillez saisir votre mot de passe pour confirmer la suppression :',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Confirmer',
                  style: 'destructive',
                  onPress: async (password) => {
                    if (password) {
                      try {
                        await userService.deleteAccount(password);
                        navigation.navigate('Login');
                      } catch (error) {
                        Alert.alert('Erreur', 'Impossible de supprimer le compte');
                      }
                    }
                  },
                },
              ],
              'secure-text'
            );
          },
        },
      ]
    );
  };

  const handleVerifyAllPayments = () => {
    Alert.alert(
      'Vérification des paiements',
      'Lancer la vérification de tous les paiements en attente ? Cette opération peut prendre quelques secondes.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vérifier',
          onPress: async () => {
            try {
              setIsLoading(true);
              const response = await donationService.verifyAllPayments();
              
              if (response.data.success) {
                const stats = response.data.data;
                Alert.alert(
                  'Vérification terminée',
                  `✅ ${stats.completed} paiements complétés\n❌ ${stats.failed} paiements échoués\n🔍 ${stats.checked} paiements rs\n⚠️ ${stats.errors} erreurs`,
                  [{ text: 'OK' }]
                );
              }
            } catch (error: any) {
              console.error('Erreur vérification globale:', error);
              Alert.alert('Erreur', error.response?.data?.error || 'Erreur lors de la vérification');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };


  const settingSections = [
    {
      title: 'Notifications',
      icon: 'notifications',
      items: [
        {
          id: 'email_donations',
          title: 'Notifications de dons par email',
          icon: 'email',
          type: 'toggle' as const,
          value: preferences.emailNotifications.donations,
          onToggle: (value: boolean) => {
            console.log('🔄 Toggle donations email:', value);
            console.log('📊 État avant:', preferences.emailNotifications);
            
            // Mise à jour immédiate de l'état local
            setPreferences(prev => {
              const newState = {
                ...prev,
                emailNotifications: {
                  ...prev.emailNotifications,
                  donations: value,
                },
              };
              return newState;
            });
            
            // Envoi au backend
            const newPrefs = {
              emailNotifications: {
                donations: value,
              },
            };
            updatePreferences(newPrefs);
          },
        },
        {
          id: 'email_reminders',
          title: 'Rappels par email',
          icon: 'schedule',
          type: 'toggle' as const,
          value: preferences.emailNotifications.reminders,
          onToggle: (value: boolean) => {
            // Mise à jour immédiate de l'état local
            setPreferences(prev => {
              const newState = {
                ...prev,
                emailNotifications: {
                  ...prev.emailNotifications,
                  reminders: value,
                },
              };
              console.log('📊 Nouvel état:', newState.emailNotifications);
              return newState;
            });
            
            // Envoi au backend
            const newPrefs = {
              emailNotifications: {
                reminders: value,
              },
            };
            updatePreferences(newPrefs);
          },
        },
        /*
        {
          id: 'email_newsletters',
          title: 'Newsletter',
          icon: 'article',
          type: 'toggle' as const,
          value: preferences.emailNotifications.newsletters,
          onToggle: (value: boolean) => {
            const newPrefs = {
              emailNotifications: {
                ...preferences.emailNotifications,
                newsletters: value,
              },
            };
            updatePreferences(newPrefs);
          },
        },
        {
          id: 'sms_donations',
          title: 'SMS pour les dons',
          icon: 'sms',
          type: 'toggle' as const,
          value: preferences.smsNotifications.donations,
          onToggle: (value: boolean) => {
            const newPrefs = {
              smsNotifications: {
                ...preferences.smsNotifications,
                donations: value,
              },
            };
            updatePreferences(newPrefs);
          },
        },*/
      ],
    },
    {
      title: 'Préférences',
      icon: 'tune',
      items: [
        {
          id: 'language',
          title: 'Langue',
          icon: 'language',
          type: 'selection' as const,
          value: languages.find(l => l.value === preferences.language)?.label || 'Français',
          onPress: () => {
            showSelectionModal(
              'Choisir la langue',
              languages,
              preferences.language,
              (value) => {
                updatePreferences({ language: value });
                setModalVisible(false);
              }
            );
          },
        },
        {
          id: 'currency',
          title: 'Devise',
          icon: 'attach-money',
          type: 'selection' as const,
          value: currencies.find(c => c.value === preferences.currency)?.label || 'XOF (Franc CFA)',
          onPress: () => {
            showSelectionModal(
              'Choisir la devise',
              currencies,
              preferences.currency,
              (value) => {
                updatePreferences({ currency: value });
                setModalVisible(false);
              }
            );
          },
        },
        /*
        {
          id: 'theme',
          title: 'Thème',
          icon: 'palette',
          type: 'selection' as const,
          value: themes.find(t => t.value === preferences.theme)?.label || 'Automatique',
          onPress: () => {
            showSelectionModal(
              'Choisir le thème',
              themes,
              preferences.theme,
              (value) => {
                updatePreferences({ theme: value });
                setModalVisible(false);
              }
            );
          },
        },
        */
      ],
    },
    {
      title: 'Sécurité',
      icon: 'security',
      items: [
        {
          id: 'change_password',
          title: 'Changer le mot de passe',
          icon: 'lock',
          type: 'navigation' as const,
          onPress: () => navigation.navigate('ChangePassword'),
        },

        {
          id: 'privacy_policy',
          title: 'Politique de confidentialité',
          icon: 'privacy-tip',
          type: 'navigation' as const,
          onPress: () => navigation.navigate('PrivacyPolicy'),
        },
        /* 
        {
          id: 'two_factor',
          title: 'Authentification à deux facteurs',
          icon: 'verified-user',
          type: 'navigation' as const,
          onPress: () => navigation.navigate('TwoFactor'),
        },
        {
          id: 'download_data',
          title: 'Télécharger mes données',
          icon: 'download',
          type: 'action' as const,
          onPress: async () => {
            try {
              setIsLoading(true);
              await userService.downloadPersonalData();
              Alert.alert('Succès', 'Vos données ont été téléchargées');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de télécharger les données');
            } finally {
              setIsLoading(false);
            }
          },
        },
        */
      ],
    },
    {
      title: 'Support',
      icon: 'help',
      items: [
        {
          id: 'faq',
          title: 'Foire aux questions',
          icon: 'help-outline',
          type: 'navigation' as const,
          onPress: () => navigation.navigate('HelpCenter'),
        },
        // Afficher "Mes tickets" uniquement pour les admins
        ...(permissions.canAccessAdminFeatures ? [
          {
            id: 'my_tickets',
            title: 'Mes tickets de support',
            icon: 'support-agent',
            type: 'navigation' as const,
            onPress: () => navigation.navigate('TicketList'),
          },
        ] : []),
        {
          id: 'contact_support',
          title: 'Contacter le support',
          icon: 'contact-support',
          type: 'navigation' as const,
          onPress: () => navigation.navigate('ContactSupport'),
        },
      ],
    },
    {
      title: 'Compte',
      icon: 'account-circle',
      items: [
        {
          id: 'logout',
          title: 'Déconnexion',
          icon: 'logout',
          type: 'action' as const,
          onPress: handleLogout,
        },
  /*
        {
          id: 'delete_account',
          title: 'Supprimer le compte',
          icon: 'delete-forever',
          type: 'action' as const,
          destructive: true,
          onPress: handleDeleteAccount,
        },*/
      ],
    },
  ];

  // Section d'administration uniquement pour les rôles autorisés
  const getAdminSection = () => {
    if (!permissions.canAccessAdminFeatures) return null;
    
    return {
      title: 'Administration',
      icon: 'admin-panel-settings',
      items: [
        ...(permissions.canViewAllPayments ? [{
          id: 'payment_management',
          title: 'Gestion des paiements',
          icon: 'payment',
          type: 'navigation' as const,
          onPress: () => navigation.navigate('PaymentManagement'),
        }] : []),
        ...(permissions.canViewPaymentStats ? [{
          id: 'verify_all_payments',
          title: 'Vérification rapide',
          icon: 'sync',
          type: 'action' as const,
          onPress: handleVerifyAllPayments,
        }] : []),
        ...(permissions.canViewAllTickets ? [{
          id: 'all_tickets',
          title: 'Tous les tickets',
          icon: 'assignment',
          type: 'navigation' as const,
          onPress: () => navigation.navigate('TicketList'),
        }] : []),
      ],
    };
  };

  // Créer la liste finale des sections
  const finalSections = () => {
    const adminSection = getAdminSection();
    if (adminSection && adminSection.items.length > 0) {
      // Insérer la section admin avant la section Compte
      return [...settingSections.slice(0, -1), adminSection, settingSections[settingSections.length - 1]];
    }
    return settingSections;
  };

  const renderSettingItem = (item: SettingItem, sectionIndex: number, itemIndex: number) => {
    const sections = finalSections();
    const isLastInSection = itemIndex === sections[sectionIndex].items.length - 1;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingItem,
          { borderBottomColor: dark ? COLORS.dark3 : COLORS.greyscale300 },
          isLastInSection && { borderBottomWidth: 0 },
        ]}
        onPress={item.onPress}
        disabled={item.type === 'toggle' || isLoading}
      >
        <View style={styles.settingItemLeft}>
          <MaterialIcons
            name={item.icon as any}
            size={24}
            color={item.destructive ? '#FF5722' : colors.primary}
          />
          <View style={styles.settingItemText}>
            <Text
              style={[
                styles.settingItemTitle,
                {
                  color: item.destructive
                    ? '#FF5722'
                    : colors.text,
                },
              ]}
            >
              {item.title}
            </Text>
            {item.type === 'selection' && (
              <Text style={[styles.settingItemValue, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                {item.value as string}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.settingItemRight}>
          {item.type === 'toggle' && (
            <TouchableOpacity
              onPress={() => item.onToggle?.(!item.value)}
              disabled={isLoading}
              style={styles.checkboxContainer}
            >
              <MaterialIcons
                name={item.value ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={item.value ? colors.primary : (dark ? COLORS.grayTie : COLORS.gray)}
            />
            </TouchableOpacity>
          )}
          {(item.type === 'navigation' || item.type === 'selection') && (
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={dark ? COLORS.grayTie : COLORS.gray}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectionModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {currentSelection?.title}
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[styles.modalCloseButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale300 }]}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={currentSelection?.options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  {
                    backgroundColor:
                      item.value === currentSelection?.current
                        ? colors.primary + '20'
                        : 'transparent',
                  },
                ]}
                onPress={() => currentSelection?.onSelect(item.value)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    {
                      color:
                        item.value === currentSelection?.current
                          ? colors.primary
                          : colors.text,
                      fontWeight:
                        item.value === currentSelection?.current
                          ? '600'
                          : 'normal',
                    },
                  ]}
                >
                  {item.label}
                </Text>
                {item.value === currentSelection?.current && (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Mise à jour en cours...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Paramètres</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Informations utilisateur */}
        <View style={[styles.userSection, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.userInfo}>
            {user?.avatar ? (
              <TouchableOpacity
              style={styles.userInfo}
              onPress={() => navigation.navigate('ProfileImage')}
            ><Image  
            source={{ uri: user.avatar }} 
            style={styles.userAvatarImage}
          />

            </TouchableOpacity>
              
            ) : (
            <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.userAvatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
            )}
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.firstName} {user?.lastName}
              </Text>

              {/* CTA inline à côté du nom pour vérifications */}
              <View style={styles.inlineCtas}>
                {!user?.isEmailVerified && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('EmailVerification')}
                    style={[styles.ctaBadge, { borderColor: colors.primary, backgroundColor: colors.primary + '12' }]}
                  >
                    <MaterialIcons name="email" size={14} color={colors.primary} />
                    <Text style={[styles.ctaBadgeText, { color: colors.primary }]}>Vérifier email</Text>
                  </TouchableOpacity>
                )}

                {user?.phone && !user?.isPhoneVerified && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PhoneVerification')}
                    style={[styles.ctaBadge, { borderColor: colors.primary, backgroundColor: colors.primary + '12' }]}
                  >
                    <MaterialIcons name="phone-iphone" size={14} color={colors.primary} />
                    <Text style={[styles.ctaBadgeText, { color: colors.primary }]}>Vérifier téléphone</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.emailContainer}>
                <Text style={[styles.userEmail, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  {user?.email}
                </Text>
                {user?.isEmailVerified && (
                  <View style={styles.verifiedContainer}>
                    <MaterialIcons name="verified" size={14} color={COLORS.primary} />
                  </View>
                )}
              </View>

              {user?.phone && (
                <View style={styles.phoneContainer}>
                  <Text style={[styles.userPhone, { color: dark ? COLORS.grayTie : COLORS.gray }]}> 
                    {user.phone}
                  </Text>
                  {user?.isPhoneVerified && (
                    <View style={styles.verifiedContainer}>
                      <MaterialIcons name="verified" size={14} color={COLORS.primary} />
                    </View>
                  )}
                </View>
              )}
              
              <View style={styles.userLevel}>
                {user?.role && permissions.canAccessAdminFeatures && (
                  <View style={[styles.roleBadge, { backgroundColor: getUserRoleColor(user.role as any) + '20' }]}>
                    <MaterialIcons name="admin-panel-settings" size={14} color={getUserRoleColor(user.role as any)} />
                    <Text style={[styles.roleBadgeText, { color: getUserRoleColor(user.role as any) }]}>
                      {getUserRoleLabel(user.role as any)}
                    </Text>
                  </View>
                )}
                {(user as any)?.level && (
                  <View style={styles.levelBadge}>
                    <MaterialIcons name="star" size={14} color={colors.primary} />
                    <Text style={[styles.userLevelText, { color: colors.primary }]}> 
                      Niveau {(user as any)?.level || 1}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Sections de paramètres */}
        {finalSections().map((section, sectionIndex) => (
          <View
            key={section.title}
            style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
          >
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name={section.icon as any}
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
            </View>
            
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) =>
                renderSettingItem(item, sectionIndex, itemIndex)
              )}
            </View>
          </View>
        ))}

        {/* Version de l'app */}
        <View style={styles.versionSection}>
          <Text style={[styles.versionText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Version 1.0.0
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderSelectionModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    resizeMode: 'cover',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  inlineCtas: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  ctaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ctaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center', 
    marginBottom: 8,
  },
  verifiedContainer: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  userEmail: {
    fontSize: 14,
  },
  userPhone: {
    fontSize: 14,
  },
  verifiedBadge: {
    marginLeft: 8,
    alignSelf: 'center',
  },
  userLevel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userLevelText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    marginLeft: 16,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingItemValue: {
    fontSize: 14,
    marginTop: 2,
  },
  settingItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionSection: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 12,
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    marginVertical: 2,
  },
  modalOptionText: {
    fontSize: 16,
  },
  settingIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingDescription: {
    fontSize: 14,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 8,
  },
  verifyLink: {
    marginLeft: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  verifyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkboxContainer: {
    padding: 4,
  },
});

export default SettingsScreen; 