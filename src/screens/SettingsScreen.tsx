import logger from '../utils/logger';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import Constants from 'expo-constants';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import {
  useDS,
  AppText,
  Screen,
  HeroHeader,
  Card,
  Section,
  Row,
  Badge,
  Sheet,
  IconName,
} from '../design/components';
import { spacing } from '../design/tokens';
import userService from '../store/services/userService';
import useUserPermissions, { getUserRoleLabel, getUserRoleColor } from '../hooks/useUserPermissions';
import { logoutUser, updateUser } from '../store/slices/authSlice';
import useLogout from '../hooks/useLogout';
import { RootState } from '../store';
import { showError, showSuccess } from '../store/slices/notificationSlice';
import {
  getBiometricSupport,
  isBiometricEnabled,
  setBiometricEnabled,
  disableBiometric,
  getSavedCredentials,
  authenticateBiometric,
} from '../utils/biometricAuth';

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
  const { c } = useDS();
  const dispatch = useDispatch();
  const { logout } = useLogout();
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
  
  // isLoading : action longue (vérification paiements) -> overlay
  // isSaving : enregistrement d'une préférence -> pas d'écran bloquant, juste les contrôles désactivés
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Face ID / Touch ID
  const [biometric, setBiometric] = useState({ available: false, enrolled: false, label: 'Face ID', enabled: false });

  useEffect(() => {
    (async () => {
      const support = await getBiometricSupport();
      const enabled = await isBiometricEnabled();
      setBiometric({ ...support, enabled: enabled && support.enrolled });
    })();
  }, []);

  const handleToggleBiometric = async (value: boolean) => {
    if (!value) {
      await disableBiometric();
      setBiometric(prev => ({ ...prev, enabled: false }));
      dispatch(showSuccess({ title: `${biometric.label} désactivé`, message: 'Vous vous connecterez avec votre mot de passe.' }));
      return;
    }

    if (!biometric.enrolled) {
      dispatch(showError({
        title: `${biometric.label} non configuré`,
        message: `Configurez ${biometric.label} dans les Réglages de votre téléphone, puis réessayez.`,
      }));
      return;
    }

    try {
      // Vérifier l'identité avant d'activer
      const auth = await authenticateBiometric(`Activer ${biometric.label}`);
      if (!auth.success) {
        if (!auth.cancelled) {
          dispatch(showError({ title: 'Échec', message: `Impossible d'activer ${biometric.label}.` }));
        }
        return;
      }
      await setBiometricEnabled(true);
      setBiometric(prev => ({ ...prev, enabled: true }));

      const saved = await getSavedCredentials();
      dispatch(showSuccess({
        title: `${biometric.label} activé`,
        message: saved
          ? `Vous pourrez vous connecter avec ${biometric.label}.`
          : `${biometric.label} sera disponible après votre prochaine connexion avec mot de passe.`,
      }));
    } catch (e) {
      logger.error('Erreur activation biométrie:', e);
      dispatch(showError({ title: 'Erreur', message: `Impossible d'activer ${biometric.label}.` }));
    }
  };

  // Charger les préférences à l'ouverture (dépend de l'id : updateUser ne relance pas le chargement)
  useEffect(() => {
    if (user) {
      setPreferences(prev => ({
        ...prev,
        language: user.language || 'fr',
        currency: user.currency || 'XOF',
      }));
      loadUserPreferences();
    }
  }, [user?.id]);

  const loadUserPreferences = async () => {
    try {
      const response = await userService.getUserPreferences();
      const userPrefs = response.data?.data;
      if (userPrefs) {
        // Fusion avec les valeurs par défaut : le serveur peut omettre certains champs
        setPreferences(prev => ({
          ...prev,
          ...userPrefs,
          emailNotifications: { ...prev.emailNotifications, ...(userPrefs.emailNotifications || {}) },
          smsNotifications: { ...prev.smsNotifications, ...(userPrefs.smsNotifications || {}) },
        }));
      }
    } catch (error) {
      logger.error('Erreur chargement préférences:', error);
      // Garder les valeurs par défaut en cas d'erreur
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
    const previous = preferences; // pour annuler en cas d'échec
    // Mise à jour optimiste de l'affichage
    setPreferences(prev => ({
      ...prev,
      ...(newPreferences.language && { language: newPreferences.language }),
      ...(newPreferences.currency && { currency: newPreferences.currency }),
      ...(newPreferences.theme && { theme: newPreferences.theme }),
      ...(newPreferences.emailNotifications && {
        emailNotifications: { ...prev.emailNotifications, ...newPreferences.emailNotifications },
      }),
      ...(newPreferences.smsNotifications && {
        smsNotifications: { ...prev.smsNotifications, ...newPreferences.smsNotifications },
      }),
    }));

    try {
      setIsSaving(true);
      await userService.updateUserPreferences(newPreferences);

      // Persister langue / devise dans le store Redux
      if (newPreferences.language || newPreferences.currency) {
        dispatch(updateUser({
          ...(newPreferences.language && { language: newPreferences.language }),
          ...(newPreferences.currency && { currency: newPreferences.currency }),
        }) as any);
      }
    } catch (error) {
      logger.error('Erreur mise à jour préférences:', error);
      setPreferences(previous); // retour à l'état d'avant
      dispatch(showError({
        title: 'Erreur',
        message: 'Impossible de mettre à jour les préférences. Réessayez.',
      }));
    } finally {
      setIsSaving(false);
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
          // logout → RootNavigator bascule automatiquement vers AuthNavigator
          onPress: () => logout(),
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
                        dispatch(logoutUser() as any);
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
            updatePreferences({ emailNotifications: { donations: value } });
          },
        },
        {
          id: 'email_reminders',
          title: 'Rappels par email',
          icon: 'schedule',
          type: 'toggle' as const,
          value: preferences.emailNotifications.reminders,
          onToggle: (value: boolean) => {
            updatePreferences({ emailNotifications: { reminders: value } });
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
    // Section « Préférences » (langue, devise) retirée : l'app reste en français / XOF pour l'instant
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
        // Interrupteur Face ID / Touch ID (seulement si le téléphone a la biométrie)
        ...(biometric.available ? [{
          id: 'biometric_login',
          title: `Connexion avec ${biometric.label}`,
          icon: biometric.label === 'Face ID' ? 'face' : 'fingerprint',
          type: 'toggle' as const,
          value: biometric.enabled,
          onToggle: handleToggleBiometric,
        }] : []),

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
        // « Mes tickets » pour qui ne voit pas déjà « Tous les tickets » (utilisateurs, trésorier)
        ...(!permissions.canViewAllTickets ? [
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
        // « Vérification rapide » masquée : la tâche cron backend vérifie les paiements en attente toutes les 30 min
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

  const sections = finalSections();


  // Icônes MaterialIcons des données → équivalents Ionicons du design system
  const ICONS: Record<string, IconName> = {
    'account-circle': 'person-circle-outline',
    'admin-panel-settings': 'shield-outline',
    article: 'newspaper-outline',
    assignment: 'clipboard-outline',
    'contact-support': 'chatbox-ellipses-outline',
    'delete-forever': 'trash-outline',
    download: 'download-outline',
    email: 'mail-outline',
    help: 'help-circle-outline',
    'help-outline': 'help-circle-outline',
    lock: 'lock-closed-outline',
    logout: 'log-out-outline',
    notifications: 'notifications-outline',
    payment: 'card-outline',
    'privacy-tip': 'document-lock-outline',
    schedule: 'time-outline',
    security: 'shield-checkmark-outline',
    sms: 'chatbubble-outline',
    'support-agent': 'headset-outline',
    'verified-user': 'checkmark-done-outline',
    face: 'scan-outline',
    fingerprint: 'finger-print-outline',
  };

  const renderSettingItem = (item: SettingItem, sectionIndex: number, itemIndex: number) => {
    const last = itemIndex === sections[sectionIndex].items.length - 1;
    const icon = ICONS[item.icon] ?? 'ellipse-outline';
    if (item.type === 'toggle') {
      return (
        <Row
          key={item.id}
          icon={icon}
          label={item.title}
          last={last}
          onPress={isLoading || isSaving ? undefined : () => item.onToggle?.(!item.value)}
          accessibilityLabel={`${item.title} : ${item.value ? 'activé' : 'désactivé'}`}
          right={
            <Switch
              value={!!item.value}
              onValueChange={(v) => item.onToggle?.(v)}
              disabled={isSaving}
              trackColor={{ false: c.input, true: c.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={c.input}
            />
          }
        />
      );
    }
    return (
      <Row
        key={item.id}
        icon={icon}
        label={item.title}
        value={item.type === 'selection' ? String(item.value ?? '') : undefined}
        destructive={item.destructive}
        onPress={isLoading ? undefined : item.onPress}
        chevron={item.type === 'navigation' || item.type === 'selection'}
        last={last}
      />
    );
  };

  const hero = (
    <HeroHeader
      eyebrow="Mon compte"
      eyebrowIcon="settings-outline"
      title="Paramètres"
      onBack={() => navigation.goBack()}
    />
  );

  return (
    <Screen hero={hero}>
      {/* Carte utilisateur */}
      <Card style={styles.userCard}>
        <Pressable onPress={() => navigation.navigate('ProfileImage')} accessibilityRole="button" accessibilityLabel="Modifier la photo de profil">
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: c.primarySoft }]}>
              <AppText variant="subtitle" color={c.primary}>{user?.firstName?.[0]}{user?.lastName?.[0]}</AppText>
            </View>
          )}
        </Pressable>
        <View style={styles.flex}>
          <AppText variant="subtitle" numberOfLines={2}>{user?.firstName} {user?.lastName}</AppText>
          <AppText variant="small" color={c.mutedForeground} numberOfLines={1} ellipsizeMode="middle">{user?.email}</AppText>
          {user?.phone ? <AppText variant="small" color={c.mutedForeground}>{user.phone}</AppText> : null}
          <View style={styles.badges}>
            {user?.isEmailVerified ? (
              <Badge label="Email vérifié" tone="success" icon="checkmark-circle" />
            ) : (
              <Pressable onPress={() => navigation.navigate('EmailVerification')} accessibilityRole="button">
                <Badge label="Vérifier l'email" tone="warning" icon="mail-outline" />
              </Pressable>
            )}
            {user?.phone ? (
              user?.isPhoneVerified ? (
                <Badge label="Téléphone vérifié" tone="success" icon="checkmark-circle" />
              ) : (
                <Pressable onPress={() => navigation.navigate('PhoneVerification')} accessibilityRole="button">
                  <Badge label="Vérifier le téléphone" tone="warning" icon="call-outline" />
                </Pressable>
              )
            ) : null}
            {user?.role && permissions.canAccessAdminFeatures ? (
              <Badge label={getUserRoleLabel(user.role as any)} tone="primary" icon="shield-outline" />
            ) : null}
          </View>
        </View>
      </Card>

      {sections.map((section, sectionIndex) => (
        <Section key={section.title} title={section.title}>
          {section.items.map((item, itemIndex) => renderSettingItem(item, sectionIndex, itemIndex))}
        </Section>
      ))}

      <AppText variant="caption" color={c.mutedForeground} center>
        Partenaire MAGB · version {Constants.expoConfig?.version ?? '1.0.0'}
      </AppText>

      <Sheet visible={modalVisible} title={currentSelection?.title ?? ''} onClose={() => setModalVisible(false)}>
        <Card padded={false}>
          {(currentSelection?.options ?? []).map((o, i, arr) => {
            const active = o.value === currentSelection?.current;
            return (
              <Row
                key={o.value}
                label={o.label}
                onPress={() => currentSelection?.onSelect(o.value)}
                right={active ? <Ionicons name="checkmark" size={20} color={c.primary} /> : undefined}
                last={i === arr.length - 1}
              />
            );
          })}
        </Card>
      </Sheet>

      {isLoading ? (
        <View style={[styles.loadingOverlay, { backgroundColor: c.overlay }]} pointerEvents="auto">
          <Card style={styles.loadingBox}>
            <ActivityIndicator size="large" color={c.primary} />
            <AppText variant="body">Traitement en cours…</AppText>
          </Card>
        </View>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  userCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  loadingBox: { alignItems: 'center', gap: spacing.md, minWidth: 200 },
});

export default SettingsScreen;
