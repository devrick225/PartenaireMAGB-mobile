import logger from '../utils/logger';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import donationService from '../store/services/donationService';
import {
  useDS,
  AppText,
  HeroHeader,
  HeroChip,
  IconButton,
  SegmentedTabs,
  Card,
  Badge,
  Button,
  EmptyState,
  LoadingState,
  formatAmount as dsFormatAmount,
  formatDate,
} from '../design/components';
import { cardShadow, radius, spacing } from '../design/tokens';

interface RecurringDonationsScreenProps {
  navigation: any;
}

interface RecurringDonation {
  _id: string;
  amount: number;
  currency: string;
  category: string;
  status: string;
  recurring: {
    frequency: string;
    interval: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
    startDate: string;
    endDate?: string;
    maxOccurrences?: number;
    isActive: boolean;
    nextPaymentDate: string;
    totalExecutions: number;
  };
  createdAt: string;
  formattedAmount: string;
}

interface OccurrenceItem {
  id: string;
  donationId: string;
  dueDate: string;
  amount: number;
  currency: string;
  category: string;
  status: 'upcoming' | 'due' | 'paid' | 'overdue' | 'failed';
  paymentId?: string;
  occurrence: number;
}



const RecurringDonationsScreen: React.FC<RecurringDonationsScreenProps> = ({ navigation }) => {
  const { c } = useDS();

  const [recurringDonations, setRecurringDonations] = useState<RecurringDonation[]>([]);
  const [upcomingOccurrences, setUpcomingOccurrences] = useState<OccurrenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'occurrences'>('active');

  useEffect(() => {
    loadRecurringDonations();
  }, []);

  const loadRecurringDonations = async () => {
    try {
      const response = await donationService.getRecurringDonations();
      if (response.data.success) {
        // Ignorer les entrées sans configuration de récurrence (évite les plantages sur donation.recurring.xxx)
        const donations = (response.data.data.donations || []).filter((d: any) => d && d.recurring);

        // Formater les montants si pas déjà fait
        const formattedDonations = donations.map((donation: any) => ({
          ...donation,
          formattedAmount: donation.formattedAmount || formatAmount(donation.amount, donation.currency)
        }));

        setRecurringDonations(formattedDonations);
        generateUpcomingOccurrences(formattedDonations);
      } else {
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les dons récurrents');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const generateUpcomingOccurrences = (donations: RecurringDonation[]) => {
    const occurrences: OccurrenceItem[] = [];
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);

    donations.forEach(donation => {
      if (!donation.recurring.isActive) return;

      const { frequency, interval, dayOfWeek, dayOfMonth, startDate, endDate, maxOccurrences, totalExecutions } = donation.recurring;
      if (!donation.recurring.nextPaymentDate) return;
      let currentDate = new Date(donation.recurring.nextPaymentDate);
      if (isNaN(currentDate.getTime())) return;
      let occurrence = (totalExecutions || 0) + 1;

      // Générer les 10 prochaines occurrences ou jusqu'à 3 mois
      for (let i = 0; i < 10 && currentDate <= threeMonthsFromNow; i++) {
        // Vérifier les limites
        if (endDate && currentDate > new Date(endDate)) break;
        if (maxOccurrences && occurrence > maxOccurrences) break;

        let status: OccurrenceItem['status'] = 'upcoming';
        const daysDiff = Math.floor((currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
          status = 'overdue';
        } else if (daysDiff <= 0) {
          status = 'due';
        } else if (daysDiff <= 7) {
          status = 'upcoming';
        }

        occurrences.push({
          id: `${donation._id}-${occurrence}`,
          donationId: donation._id,
          dueDate: currentDate.toISOString(),
          amount: donation.amount,
          currency: donation.currency,
          category: donation.category,
          status,
          occurrence
        });

        // Calculer la prochaine date
        currentDate = calculateNextDate(currentDate, frequency, interval || 1, dayOfWeek, dayOfMonth);
        occurrence++;
      }
    });

    // Trier par date
    occurrences.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    setUpcomingOccurrences(occurrences);
  };

  const addMonthsClamped = (date: Date, months: number, day?: number) => {
    const target = new Date(date.getFullYear(), date.getMonth() + months, 1, date.getHours(), date.getMinutes());
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(day || date.getDate(), lastDay));
    return target;
  };

  const calculateNextDate = (current: Date, frequency: string, interval: number, dayOfWeek?: number, dayOfMonth?: number): Date => {
    if (frequency === 'monthly') return addMonthsClamped(current, interval, dayOfMonth);
    if (frequency === 'quarterly') return addMonthsClamped(current, interval * 3, dayOfMonth);
    if (frequency === 'yearly') return addMonthsClamped(current, interval * 12, dayOfMonth);
    const next = new Date(current);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + interval);
        break;
      case 'weekly':
        next.setDate(next.getDate() + (interval * 7));
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + interval);
        if (dayOfMonth) {
          next.setDate(dayOfMonth);
        }
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + (interval * 3));
        if (dayOfMonth) {
          next.setDate(dayOfMonth);
        }
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + interval);
        if (dayOfMonth) {
          next.setDate(dayOfMonth);
        }
        break;
    }

    return next;
  };

  // Le backend crée lui-même un don « échéance » (recurringParent + occurrenceNumber) à chaque date
  // prévue et prévient le donateur. On paie CE don : en créer un nouveau ici provoquait un double paiement.
  const handlePayOccurrence = async (occurrence: OccurrenceItem) => {
    try {
      setIsRefreshing(true);
      const response = await donationService.getDonationHistory({ status: 'pending', limit: 50 } as any);
      const pending: any[] = response.data?.data?.donations || [];
      const parentId = (d: any) => (typeof d.recurringParent === 'object' ? d.recurringParent?._id : d.recurringParent);
      const candidates = pending.filter(d => parentId(d) === occurrence.donationId);
      const match =
        candidates.find(d => d.occurrenceNumber === occurrence.occurrence) ||
        candidates.sort((x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime())[0];

      if (match) {
        navigation.navigate('DonationDetail', { donationId: match._id });
      } else {
        Alert.alert(
          'Échéance en préparation',
          'Cette échéance est générée automatiquement le jour prévu. Vous recevrez une notification et la retrouverez dans « Mes dons » pour la payer.'
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer cette échéance. Réessayez dans quelques instants.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStopRecurring = async (donation: RecurringDonation) => {
    Alert.alert(
      'Arrêter le don récurrent',
      `Êtes-vous sûr de vouloir arrêter ce don récurrent ? Les paiements futurs seront annulés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Arrêter',
          style: 'destructive',
          onPress: async () => {
            try {
              await donationService.cancelRecurringDonation(donation._id, 'Arrêté par l\'utilisateur');
              Alert.alert('Don récurrent arrêté', 'Aucune nouvelle échéance ne sera générée.');
              loadRecurringDonations();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'arrêter le don récurrent');
            }
          }
        }
      ]
    );
  };

  const formatAmount = (amount: number, currency: string) => dsFormatAmount(amount, currency);

  const formatCategory = (category: string) => {
    const categories: { [key: string]: string } = {
      'don_mensuel': 'Mensuelle',
      'don_trimestriel': 'Trimestrielle',
      'don_semestriel': 'Semestrielle',
      'don_ponctuel': 'Ponctuel',
    };
    return categories[category] || category;
  };

  const formatDonorType = (type: string) => {
    const types: { [key: string]: string } = {
      'homme': 'Homme',
      'femme': 'Femme',
      'entreprise': 'Entreprise',
    };
    return types[type] || type;
  };

  const formatFrequency = (frequency: string, interval: number) => {
    const frequencies: { [key: string]: string } = {
      'daily': 'jour',
      'weekly': 'semaine',
      'monthly': 'mois',
      'quarterly': 'trimestre',
      'yearly': 'année'
    };

    const unit = frequencies[frequency] || frequency;
    return interval === 1 ? `Tous les ${unit}s` : `Tous les ${interval} ${unit}s`;
  };


  // Libellé et ton d'une échéance
  const OCCURRENCE_STATUS: Record<OccurrenceItem['status'], { label: string; tone: 'primary' | 'warning' | 'danger' | 'success' }> = {
    upcoming: { label: 'À venir', tone: 'primary' },
    due: { label: 'À payer', tone: 'warning' },
    overdue: { label: 'En retard', tone: 'danger' },
    paid: { label: 'Payé', tone: 'success' },
    failed: { label: 'Échoué', tone: 'danger' },
  };

  const refresh = () => {
    setIsRefreshing(true);
    loadRecurringDonations();
  };

  const activeDonations = recurringDonations.filter(d => d.recurring.isActive);
  const pendingOccurrences = upcomingOccurrences.filter(o => o.status !== 'paid');
  const monthlyTotal = activeDonations
    .filter(d => d.recurring.frequency === 'monthly' && (!d.currency || d.currency === 'XOF'))
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const renderRecurringDonationCard = ({ item }: { item: RecurringDonation }) => (
    <Pressable
      onPress={() => navigation.navigate('DonationDetail', { donationId: item._id })}
      accessibilityRole="button"
      accessibilityLabel={`Don récurrent de ${item.formattedAmount}, ${formatFrequency(item.recurring.frequency, item.recurring.interval)}`}
      style={({ pressed }) => [styles.card, cardShadow, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.iconTile, { backgroundColor: c.primarySoft }]}>
          <Ionicons name="repeat" size={22} color={c.primary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="subtitle" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {item.formattedAmount}
          </AppText>
          <AppText variant="small" color={c.mutedForeground} numberOfLines={1}>
            {formatCategory(item.category)} · {formatFrequency(item.recurring.frequency, item.recurring.interval).toLowerCase()}
          </AppText>
        </View>
        <Badge label={item.recurring.isActive ? 'Actif' : 'Arrêté'} tone={item.recurring.isActive ? 'success' : 'neutral'} />
      </View>

      <View style={[styles.stats, { borderTopColor: c.border }]}>
        <View style={styles.flex}>
          <AppText variant="caption" color={c.mutedForeground}>Échéances réglées</AppText>
          <AppText variant="bodyStrong">
            {item.recurring.totalExecutions || 0}
            {item.recurring.maxOccurrences ? ` / ${item.recurring.maxOccurrences}` : ''}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="caption" color={c.mutedForeground}>Prochaine échéance</AppText>
          <AppText variant="bodyStrong" color={c.primary}>
            {formatDate(item.recurring.nextPaymentDate)}
          </AppText>
        </View>
      </View>

      {item.recurring.isActive ? (
        <Button
          title="Arrêter ce don"
          variant="outline"
          icon="stop-circle-outline"
          onPress={() => handleStopRecurring(item)}
          style={{ marginTop: spacing.md, minHeight: 44 }}
        />
      ) : null}
    </Pressable>
  );

  const renderOccurrenceCard = ({ item }: { item: OccurrenceItem }) => {
    const st = OCCURRENCE_STATUS[item.status];
    const payable = item.status === 'due' || item.status === 'overdue';
    return (
      <View style={[styles.card, cardShadow, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.cardTop}>
          <View style={[styles.dateTile, { backgroundColor: c.primarySoft }]}>
            <AppText variant="subtitle" color={c.primary}>{new Date(item.dueDate).getDate()}</AppText>
            <AppText variant="caption" color={c.primary}>
              {new Date(item.dueDate).toLocaleDateString('fr-FR', { month: 'short' })}
            </AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong" numberOfLines={1}>{formatAmount(item.amount, item.currency)}</AppText>
            <AppText variant="small" color={c.mutedForeground} numberOfLines={1}>
              {formatCategory(item.category)} · échéance n°{item.occurrence}
            </AppText>
          </View>
          <Badge label={st.label} tone={st.tone} />
        </View>
        {payable ? (
          <Button title="Payer cette échéance" icon="card-outline" onPress={() => handlePayOccurrence(item)} style={{ marginTop: spacing.md }} />
        ) : null}
      </View>
    );
  };

  const header = (
    <>
      <HeroHeader
        eyebrow="Mes dons"
        eyebrowIcon="repeat"
        title="Dons récurrents"
        subtitle="Vos engagements et leurs prochaines échéances."
        onBack={() => navigation.goBack()}
        right={<IconButton icon={isRefreshing ? 'hourglass-outline' : 'refresh'} tone="hero" accessibilityLabel="Actualiser" onPress={refresh} />}
      >
        {!isLoading ? (
          <View style={styles.chips}>
            <HeroChip icon="checkmark-circle" label={`${activeDonations.length} actif${activeDonations.length > 1 ? 's' : ''}`} />
            {monthlyTotal > 0 ? <HeroChip icon="calendar" label={`${dsFormatAmount(monthlyTotal)} / mois`} /> : null}
          </View>
        ) : null}
      </HeroHeader>
      <View style={styles.headerBody}>
        <SegmentedTabs
          value={selectedTab}
          onChange={setSelectedTab}
          options={[
            { key: 'active', label: `Engagements (${activeDonations.length})`, icon: 'repeat' },
            { key: 'occurrences', label: `Échéances (${pendingOccurrences.length})`, icon: 'calendar-outline' },
          ]}
        />
        {selectedTab === 'active' ? (
          <Button
            title="Nouveau don récurrent"
            variant="gold"
            icon="add-circle-outline"
            onPress={() => navigation.navigate('CreateDonation', { initialType: 'recurring' })}
          />
        ) : null}
      </View>
    </>
  );

  const isActiveTab = selectedTab === 'active';

  return (
    <View style={[styles.flex, { backgroundColor: c.background }]}>
      <FlatList<any>
        data={isLoading ? [] : isActiveTab ? activeDonations : upcomingOccurrences}
        keyExtractor={(item: any) => (isActiveTab ? item._id : item.id)}
        renderItem={isActiveTab ? (renderRecurringDonationCard as any) : (renderOccurrenceCard as any)}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} colors={[c.primary]} tintColor={c.primary} />}
        ListEmptyComponent={
          isLoading ? (
            <LoadingState message="Chargement des dons récurrents…" />
          ) : (
            <View style={styles.pad}>
              <Card>
                <EmptyState
                  icon={isActiveTab ? 'repeat' : 'calendar-outline'}
                  title={isActiveTab ? 'Aucun don récurrent actif' : 'Aucune échéance à venir'}
                  message={
                    isActiveTab
                      ? 'Programmez un don mensuel, trimestriel ou semestriel pour soutenir le ministère dans la durée.'
                      : 'Vos prochaines échéances apparaîtront ici.'
                  }
                />
              </Card>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { paddingBottom: spacing.xxl },
  headerBody: { paddingHorizontal: spacing.lg, marginTop: -spacing.lg, marginBottom: spacing.lg, gap: spacing.md },
  pad: { paddingHorizontal: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  card: { marginHorizontal: spacing.lg, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconTile: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dateTile: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});

export default RecurringDonationsScreen;
