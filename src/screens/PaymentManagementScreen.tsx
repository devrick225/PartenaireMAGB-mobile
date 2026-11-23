import logger from '../utils/logger';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useDS,
  AppText,
  Screen,
  HeroHeader,
  HeroChip,
  Card,
  Section,
  StatCard,
  StatusBadge,
  EmptyState,
  LoadingState,
  formatAmount,
  formatDate,
} from '../design/components';
import { spacing } from '../design/tokens';
import paymentService, { Payment } from '../store/services/paymentService';
import { showApiError } from '../store/services/apiClient';

interface PaymentManagementScreenProps {
  navigation: any;
}

const PaymentManagementScreen: React.FC<PaymentManagementScreenProps> = ({ navigation }) => {
  const { c } = useDS();
  
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async (showSpinner = true) => {
    try {
      if (showSpinner) setIsLoading(true);
      setLoadError(false);

      // Charger les paiements en attente
      const response = await paymentService.getPayments({
        status: 'pending',
        limit: 50,
        page: 1,
      });

      if (response.data.success) {
        const list = response.data.data.payments || [];
        setPendingPayments(list);
        // Nombre réel côté serveur (la liste est limitée à 50)
        setTotalPending(response.data.data.pagination?.totalDocs ?? list.length);
      }
    } catch (error) {
      logger.error('Erreur chargement paiements en attente:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingPayments(false); // pas d'écran de chargement plein pendant le tirer-pour-rafraîchir
    setRefreshing(false);
  };

  // Vérification ciblée d'un paiement (ex: un fidèle signale un paiement non pris en compte)
  const verifyIndividualPayment = (payment: Payment) => {
    if (verifyingId) return;
    Alert.alert(
      'Vérifier ce paiement',
      `Interroger ${paymentService.formatProvider(payment.provider)} pour le paiement de ${paymentService.formatAmount(payment.amount, payment.currency)} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vérifier',
          onPress: async () => {
            try {
              setVerifyingId(payment._id);
              const response = await paymentService.verifyPayment(payment._id);
              if (response.data.success) {
                const result = response.data.data;
                Alert.alert(
                  'Vérification terminée',
                  `Statut : ${paymentService.formatStatus(result.status)}${result.message ? `\n${result.message}` : ''}`
                );
                await loadPendingPayments(false);
              }
            } catch (error: any) {
              showApiError(error, 'Erreur lors de la vérification du paiement');
            } finally {
              setVerifyingId(null);
            }
          },
        },
      ]
    );
  };


  const totalXof = pendingPayments
    .filter(p => !p.currency || p.currency === 'XOF')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const moneyFusionCount = pendingPayments.filter(p => p.provider === 'moneyfusion').length;

  const renderPaymentItem = (item: Payment, index: number) => {
    const isVerifying = verifyingId === item._id;
    const userName = item.user ? `${item.user.firstName ?? ''} ${item.user.lastName ?? ''}`.trim() : 'Utilisateur supprimé';
    return (
      <Pressable
        key={item._id}
        onPress={() => verifyIndividualPayment(item)}
        disabled={!!verifyingId}
        accessibilityRole="button"
        accessibilityLabel={`Vérifier le paiement de ${formatAmount(item.amount, item.currency)} de ${userName}`}
        style={({ pressed }) => [
          styles.item,
          index < pendingPayments.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
          pressed && { backgroundColor: c.muted },
        ]}
      >
        <View style={styles.itemTop}>
          <View style={styles.flex}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {formatAmount(item.amount, item.currency)}
            </AppText>
            <AppText variant="small" color={c.mutedForeground} numberOfLines={1}>
              {paymentService.formatProvider(item.provider)} · {formatDate(item.createdAt, true)}
            </AppText>
          </View>
          <StatusBadge status={item.status} />
          {isVerifying ? (
            <ActivityIndicator size="small" color={c.primary} style={styles.trail} />
          ) : (
            <Ionicons name="refresh" size={20} color={c.primary} style={styles.trail} />
          )}
        </View>
        <View style={styles.itemMeta}>
          <Ionicons name="person-outline" size={13} color={c.mutedForeground} />
          <AppText variant="caption" color={c.mutedForeground} numberOfLines={1} style={styles.flex}>
            {userName}
            {item.donation
              ? ` · ${paymentService.formatCategory(item.donation.category)} (${item.donation.type === 'recurring' ? 'récurrent' : 'ponctuel'})`
              : ' · Don introuvable'}
          </AppText>
        </View>
      </Pressable>
    );
  };

  const hero = (
    <HeroHeader
      eyebrow="Trésorerie"
      eyebrowIcon="wallet-outline"
      title="Paiements en attente"
      subtitle="Vérifiez un paiement signalé comme non pris en compte."
      onBack={() => navigation.goBack()}
    >
      {!isLoading ? (
        <View style={styles.chips}>
          <HeroChip icon="time" label={`${totalPending} en attente`} />
        </View>
      ) : null}
    </HeroHeader>
  );

  return (
    <Screen
      hero={hero}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}
    >
      {isLoading ? (
        <Card>
          <LoadingState message="Chargement des paiements…" />
        </Card>
      ) : (
        <>
          <View style={styles.stats}>
            <StatCard label="En attente" value={totalPending} />
            <StatCard label="Montant (XOF)" value={totalXof.toLocaleString('fr-FR')} unit="FCFA" />
          </View>
          {moneyFusionCount > 0 ? (
            <View style={styles.stats}>
              <StatCard tinted tone="warning" icon="phone-portrait-outline" label="MoneyFusion" value={moneyFusionCount} />
              <StatCard
                tinted
                tone="info"
                icon="card-outline"
                label="Autres moyens"
                value={pendingPayments.length - moneyFusionCount}
              />
            </View>
          ) : null}

          <Card style={styles.notice}>
            <Ionicons name="sync-outline" size={20} color={c.primary} />
            <AppText variant="small" color={c.mutedForeground} style={styles.flex}>
              Les paiements en attente sont vérifiés automatiquement toutes les 30 minutes. Touchez un paiement pour le vérifier tout de suite.
            </AppText>
          </Card>

          {loadError ? (
            <Pressable onPress={() => loadPendingPayments()} accessibilityRole="button">
              <Card style={[styles.notice, { backgroundColor: c.destructiveSoft, borderColor: c.destructive }]}>
                <Ionicons name="alert-circle-outline" size={20} color={c.destructive} />
                <AppText variant="small" color={c.destructive} style={styles.flex}>
                  Impossible de charger les paiements. Touchez pour réessayer.
                </AppText>
              </Card>
            </Pressable>
          ) : null}

          {pendingPayments.length > 0 ? (
            <Section
              title={
                totalPending > pendingPayments.length
                  ? `${pendingPayments.length} sur ${totalPending} paiements`
                  : `${pendingPayments.length} paiement${pendingPayments.length > 1 ? 's' : ''}`
              }
            >
              {pendingPayments.map(renderPaymentItem)}
            </Section>
          ) : !loadError ? (
            <Card>
              <EmptyState icon="checkmark-done-outline" title="Aucun paiement en attente" message="Tous les paiements ont été traités." />
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  stats: { flexDirection: 'row', gap: spacing.md },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  item: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 6, minHeight: 64 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trail: { marginLeft: spacing.xs, width: 22 },
});

export default PaymentManagementScreen;
