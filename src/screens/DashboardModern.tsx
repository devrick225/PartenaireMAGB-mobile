import logger from '../utils/logger';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
  useDS,
  AppText,
  Screen,
  HeroHeader,
  HeroChip,
  IconButton,
  Card,
  Section,
  Row,
  StatCard,
  StatusBadge,
  Button,
  ChoiceCard,
  EmptyState,
  LoadingState,
  Sheet,
  formatAmount as dsFormatAmount,
  formatDate as dsFormatDate,
} from '../design/components';
import { spacing } from '../design/tokens';
import userService from '../store/services/userService';
import donationService from '../store/services/donationService';
import { RootState } from '../store';
import { checkAuthStatus, updateUser } from '../store/slices/authSlice';
import useLogout from '../hooks/useLogout';
import UserAvatar from '../components/UserAvatar';


interface UserStats {
  totalDonations: number;
  donationCount: number;
  averageDonation: number;
  level: number;
  points: number;
  badges: Array<{
    name: string;
    icon: string;
    earnedAt: string;
  }>;
  activeRecurringDonations: number;
  partnerLevel: 'classique' | 'bronze' | 'argent' | 'or';
  partnerLevelDetails: {
    name: string;
    range: string;
    minAmount: number;
    maxAmount: number;
    color: string;
    icon: string;
  };
  lastDonation: {
    amount: number;
    currency: string;
    category: string;
    date: string;
  } | null;
  memberSince: string;
  profileCompletion: number;
}

interface DonationStats {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  activeRecurringDonations: number;
  categoriesBreakdown: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  monthlyEvolution: Array<{
    _id: {
      year: number;
      month: number;
    };
    count: number;
    totalAmount: number;
  }>;
}

interface DashboardModernProps {
  navigation: any;
}

const DashboardModern: React.FC<DashboardModernProps> = ({ navigation }) => {
  const { c } = useDS();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const { logout, handleAuthError } = useLogout();

  // logger.log('user', user) — retiré : ne pas logger les données utilisateur en clair

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [donationStats, setDonationStats] = useState<DonationStats | null>(null);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDonationTypeModal, setShowDonationTypeModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);


  // Besoin de vérification ?
  const needsEmailVerification = user ? !user.isEmailVerified : false;
  const needsPhoneVerification = user ? (!!user.phone && !user.isPhoneVerified) : false;

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Au retour sur le tableau de bord (après un don, un paiement…), rafraîchir sans écran de chargement
  const hasLoadedOnceRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnceRef.current) loadDashboardData(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [userStatsResponse, donationStatsResponse, recentDonationsResponse, profileResponse] = await Promise.all([
        userService.getMyStats(),
        donationService.getStats(),
        donationService.getRecentDonations(3),
        userService.getProfile(),
      ]);

      setUserStats(userStatsResponse.data.data.stats);
      setDonationStats(donationStatsResponse.data.data.stats);
      setRecentDonations(recentDonationsResponse.data.data.donations || []);
      hasLoadedOnceRef.current = true;

      // Mettre à jour les données utilisateur dans le store Redux si nécessaire
      if (profileResponse.data?.data?.profile?.user) {
        const profileUser = profileResponse.data.data.profile.user;
        if (profileUser.avatar && profileUser.avatar !== user?.avatar) {
          dispatch(updateUser({ avatar: profileUser.avatar }));
        }
      }
    } catch (error: any) {
      logger.error('Erreur lors du chargement du dashboard:', error?.message);
      // 401/403 → forceLogout : RootNavigator bascule automatiquement vers AuthNavigator
      if (handleAuthError(error?.response?.status)) return;
      if (silent) return; // rafraîchissement en arrière-plan : pas d'alerte
      Alert.alert(
        'Erreur',
        "Impossible de charger le tableau de bord. Vérifiez votre connexion et réessayez.",
        [{ text: 'Réessayer', onPress: () => loadDashboardData() }, { text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData(true);
    setRefreshing(false);
  };

  const handleStartDonation = () => {
    if (needsEmailVerification || needsPhoneVerification) {
      setShowVerificationModal(true);
      return;
    }
    setShowDonationTypeModal(true);
  };

  const [isRefreshingVerification, setIsRefreshingVerification] = useState(false);

  const handleRefreshVerification = async () => {
    if (isRefreshingVerification) return;
    try {
      setIsRefreshingVerification(true);
      const result: any = await (dispatch(checkAuthStatus() as any) as any).unwrap();
      const freshUser = result?.data?.user;
      const emailOk = !!freshUser?.isEmailVerified;
      const phoneOk = !freshUser?.phone || !!freshUser?.isPhoneVerified;
      if (emailOk && phoneOk) {
        // Tout est vérifié : on ferme et on enchaîne sur le don
        setShowVerificationModal(false);
        setShowDonationTypeModal(true);
      } else {
        Alert.alert(
          'Vérification incomplète',
          !emailOk && !phoneOk
            ? 'Votre email et votre téléphone ne sont pas encore vérifiés.'
            : !emailOk ? 'Votre email n\'est pas encore vérifié.' : 'Votre téléphone n\'est pas encore vérifié.'
        );
      }
    } catch (_) {
      Alert.alert('Erreur', 'Impossible d\'actualiser. Vérifiez votre connexion.');
    } finally {
      setIsRefreshingVerification(false);
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

  const formatAmount = (amount: number, currency: string = 'FCFA') => {
    return `${amount?.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Complété';
      case 'pending': return 'En attente';
      case 'failed': return 'Échoué';
      default: return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'soutien': 'favorite',
      'tithe': 'church',
      'offering': 'gift',
      'building': 'business',
      'missions': 'globe',
      'charity': 'heart',
      'education': 'school',
      'youth': 'child-care',
      'women': 'woman',
      'men': 'man',
      'special': 'star',
      'emergency': 'warning',
      'don_mensuel': 'calendar-month',
      'don_trimestriel': 'date-range',
      'don_semestriel': 'event-repeat',
      'don_ponctuel': 'favorite',
    };
    return iconMap[category] || 'help-circle';
  };

  const getPartnerLevelRange = (level: string) => {
    const ranges = {
      classique: "Jusqu'à 300 000 FCFA",
      bronze: "300 001 - 1M FCFA",
      argent: "1M - 10M FCFA",
      or: "10M+ FCFA",
    };
    return ranges[level as keyof typeof ranges] || "Niveau inconnu";
  };


  const LEVEL_LABELS: Record<string, string> = { classique: 'Classique', bronze: 'Bronze', argent: 'Argent', or: 'Or' };
  const firstName = user?.firstName || 'Partenaire';
  const levelKey = userStats?.partnerLevel || 'classique';
  const needsVerification = needsEmailVerification || needsPhoneVerification;
  const isSupportStaff = ['admin', 'moderator', 'support_agent'].includes(user?.role as string);

  const hero = (
    <HeroHeader
      eyebrow="Bonjour 👋"
      title={firstName}
      subtitle="Voici un aperçu de vos contributions."
      right={
        <View style={styles.heroActions}>
          <IconButton icon={refreshing ? 'hourglass-outline' : 'refresh'} tone="hero" accessibilityLabel="Actualiser" onPress={onRefresh} />
          <Pressable onPress={() => navigation.navigate('ProfileImage')} accessibilityRole="button" accessibilityLabel="Ma photo de profil">
            <UserAvatar user={{ firstName: user?.firstName, lastName: user?.lastName, avatar: user?.avatar }} size={44} />
          </Pressable>
        </View>
      }
    >
      <View style={styles.chips}>
        <HeroChip icon="trophy" label={`Niveau ${LEVEL_LABELS[levelKey] ?? levelKey}`} />
        {userStats?.partnerLevelDetails?.range || getPartnerLevelRange(levelKey) ? (
          <HeroChip label={userStats?.partnerLevelDetails?.range || getPartnerLevelRange(levelKey)} />
        ) : null}
      </View>
    </HeroHeader>
  );

  if (isLoading) {
    return (
      <Screen hero={hero}>
        <Card>
          <LoadingState message="Chargement de votre tableau de bord…" />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      hero={hero}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}
    >
      {/* Chiffres clés */}
      <View style={styles.row2}>
        <StatCard label="Total des dons" value={(userStats?.totalDonations || 0).toLocaleString('fr-FR')} unit="FCFA" />
        <StatCard label="Dons effectués" value={userStats?.donationCount || 0} unit="contributions" tone="neutral" />
      </View>
      <View style={styles.row3}>
        <StatCard tinted tone="success" icon="repeat" label="Récurrents" value={userStats?.activeRecurringDonations || 0} />
        <StatCard tinted tone="info" icon="trending-up" label="Don moyen" value={(userStats?.averageDonation || 0).toLocaleString('fr-FR')} />
        <StatCard tinted tone="warning" icon="person-circle-outline" label="Profil" value={`${userStats?.profileCompletion ?? 0}%`} />
      </View>

      {/* Vérification du compte */}
      {needsVerification ? (
        <Card style={[styles.notice, { backgroundColor: c.warningSoft, borderColor: c.warning }]}>
          <Ionicons name="shield-checkmark-outline" size={22} color={c.warning} />
          <View style={styles.flex}>
            <AppText variant="bodyStrong" color={c.warning}>Vérifiez votre compte</AppText>
            <AppText variant="small" color={c.warning}>
              {needsEmailVerification && needsPhoneVerification
                ? 'Votre email et votre téléphone doivent être vérifiés avant un don.'
                : needsEmailVerification ? 'Votre email doit être vérifié avant un don.' : 'Votre téléphone doit être vérifié avant un don.'}
            </AppText>
          </View>
          <Button title="Vérifier" variant="outline" fullWidth={false} onPress={() => setShowVerificationModal(true)} style={{ minHeight: 40 }} />
        </Card>
      ) : null}

      <Button title="Faire un don" variant="gold" icon="heart" onPress={handleStartDonation} />

      {/* Derniers dons */}
      <Section
        title="Derniers dons"
        action={
          recentDonations.length > 0 ? (
            <Pressable onPress={() => navigation.navigate('DonationHistory')} accessibilityRole="button" hitSlop={8}>
              <AppText variant="smallStrong" color={c.primary}>Voir tout</AppText>
            </Pressable>
          ) : undefined
        }
      >
        {recentDonations.length === 0 ? (
          <EmptyState icon="heart-outline" title="Aucun don pour le moment" message="Votre premier don apparaîtra ici." />
        ) : (
          recentDonations.map((d: any, i: number) => (
            <Pressable
              key={d._id}
              onPress={() => navigation.navigate('DonationDetail', { donationId: d._id })}
              accessibilityRole="button"
              accessibilityLabel={`Don de ${dsFormatAmount(d.amount, d.currency)}, ${dsFormatDate(d.createdAt)}`}
              style={({ pressed }) => [
                styles.donationRow,
                i < recentDonations.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
                pressed && { backgroundColor: c.muted },
              ]}
            >
              <View style={[styles.iconTile, { backgroundColor: c.primarySoft }]}>
                <MaterialIcons name={getCategoryIcon(d.category) as any} size={18} color={c.primary} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong" numberOfLines={1}>{dsFormatAmount(d.amount, d.currency)}</AppText>
                <AppText variant="small" color={c.mutedForeground} numberOfLines={1}>
                  {donationService.formatCategory(d.category)} · {dsFormatDate(d.createdAt)}
                </AppText>
              </View>
              <StatusBadge status={d.status} />
            </Pressable>
          ))
        )}
      </Section>

      {/* Actions rapides */}
      <Section title="Actions rapides">
        <Row icon="repeat" label="Mes dons récurrents" onPress={() => navigation.navigate('RecurringDonations')} chevron />
        <Row icon="document-text-outline" label="Mes reçus et documents" onPress={() => navigation.navigate('Documents')} chevron />
        <Row
          icon="chatbubbles-outline"
          label={isSupportStaff ? 'Tickets de support' : 'Contacter le support'}
          onPress={() => (isSupportStaff ? navigation.navigate('TicketList') : navigation.navigate('ContactSupport'))}
          chevron
        />
        <Row icon="help-circle-outline" label="Centre d'aide" onPress={() => navigation.navigate('HelpCenter')} chevron last />
      </Section>

      <Section title="Le ministère">
        <Row icon="globe-outline" label="Missions" onPress={() => navigation.navigate('Missions')} chevron />
        <Row icon="logo-instagram" label="Réseaux sociaux" onPress={() => navigation.navigate('SocialMedia')} chevron />
        <Row icon="call-outline" label="Contacter le ministère" onPress={() => navigation.navigate('ContactMinistere')} chevron last />
      </Section>

      {userStats?.memberSince ? (
        <AppText variant="caption" color={c.mutedForeground} center>
          Partenaire depuis le {dsFormatDate(userStats.memberSince)}
        </AppText>
      ) : null}

      {/* Vérification requise avant un don */}
      <Sheet visible={showVerificationModal} title="Vérification requise" onClose={() => setShowVerificationModal(false)}>
        <AppText variant="body" color={c.mutedForeground}>
          Pour effectuer un don, vérifiez d'abord vos informations de contact.
        </AppText>
        <Card padded={false}>
          {needsEmailVerification ? (
            <Row
              icon="mail-outline"
              label="Email non vérifié"
              sublabel="Recevoir un code par email"
              onPress={() => { setShowVerificationModal(false); navigation.navigate('EmailVerification'); }}
              chevron
              last={!needsPhoneVerification}
            />
          ) : null}
          {needsPhoneVerification ? (
            <Row
              icon="phone-portrait-outline"
              label="Téléphone non vérifié"
              sublabel="Recevoir un code par SMS"
              onPress={() => { setShowVerificationModal(false); navigation.navigate('PhoneVerification'); }}
              chevron
              last
            />
          ) : null}
        </Card>
        <Button title="J'ai vérifié, actualiser" icon="refresh" onPress={handleRefreshVerification} loading={isRefreshingVerification} />
        <Button title="Ouvrir les paramètres" variant="ghost" onPress={() => { setShowVerificationModal(false); navigation.navigate('Settings'); }} />
      </Sheet>

      {/* Choix du type de don */}
      <Sheet visible={showDonationTypeModal} title="Quel type de don ?" onClose={() => setShowDonationTypeModal(false)}>
        <ChoiceCard
          icon="flash-outline"
          title="Don ponctuel"
          description="Un don unique, sans engagement."
          selected={false}
          onPress={() => { setShowDonationTypeModal(false); navigation.navigate('CreateDonation', { initialType: 'one_time' }); }}
        />
        <ChoiceCard
          icon="repeat"
          title="Don récurrent"
          description="Mensuel, trimestriel ou semestriel."
          selected={false}
          onPress={() => { setShowDonationTypeModal(false); navigation.navigate('CreateDonation', { initialType: 'recurring' }); }}
        />
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  row2: { flexDirection: 'row', gap: spacing.md },
  row3: { flexDirection: 'row', gap: spacing.sm },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  donationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 60 },
  iconTile: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

export default DashboardModern;
