import logger from '../utils/logger';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import ticketService, { Ticket, TicketComment } from '../store/services/ticketService';
import useUserPermissions, { getUserRoleLabel, getUserRoleColor, UserRole } from '../hooks/useUserPermissions';
import { useSelector, useDispatch } from 'react-redux';
import { showError, showSuccess } from '../store/slices/notificationSlice';
import userService from '../store/services/userService';

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
}
import { RootState } from '../store';

import {
  useDS,
  AppText,
  Screen,
  HeroHeader,
  HeroChip,
  IconButton,
  Card,
  Badge,
  Button,
  ChoiceCard,
  TextField,
  InfoRow,
  EmptyState,
  LoadingState,
  Sheet,
  IconName,
} from '../design/components';
import { radius, spacing } from '../design/tokens';
interface TicketDetailScreenProps {
  navigation: any;
  route: {
    params: {
      ticketId: string;
    };
  };
}

const TicketDetailScreen: React.FC<TicketDetailScreenProps> = ({ navigation, route }) => {
  const { c } = useDS();
  const { ticketId } = route.params;
  const permissions = useUserPermissions();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const notifyError = (message: string) => dispatch(showError({ title: 'Erreur', message }) as any);
  const notifySuccess = (title: string, message = '') => dispatch(showSuccess({ title, message }) as any);
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  
  const [newComment, setNewComment] = useState('');
  // Note interne : visible uniquement par le staff, pas d'email envoyé à l'utilisateur
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showCloseReasonModal, setShowCloseReasonModal] = useState(false);
  const [selectedCloseReason, setSelectedCloseReason] = useState<'resolved' | 'duplicate' | 'spam' | 'irrelevant' | 'user_request'>('user_request');
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [assignToUser, setAssignToUser] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  // Action en cours (évite les doubles envois sur assigner / escalader / fermer / évaluer / statut)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  // Liste des agents (assigner / escalader) au lieu de saisir un ID technique
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  const loadStaff = async () => {
    if (staff.length > 0 || isLoadingStaff) return;
    try {
      setIsLoadingStaff(true);
      const roles = ['admin', 'moderator', 'support_agent'];
      const results = await Promise.allSettled(
        roles.map(role => userService.getAllUsers({ role, limit: 50 } as any))
      );
      const members: StaffMember[] = [];
      results.forEach(r => {
        if (r.status === 'fulfilled') members.push(...((r.value as any)?.data?.data?.users || []));
      });
      // Retirer l'utilisateur courant et les doublons
      const unique = members.filter((m, i, arr) =>
        m._id !== currentUser?.id && arr.findIndex(x => x._id === m._id) === i
      );
      setStaff(unique);
    } catch (e) {
      logger.error('Erreur chargement agents:', e);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const openAssignModal = () => { setAssignToUser(''); loadStaff(); setShowAssignModal(true); };
  const openEscalateModal = () => { setAssignToUser(''); setEscalateReason(''); loadStaff(); setShowEscalateModal(true); };

  useEffect(() => {
    loadTicketDetails();
  }, [ticketId]);

  const loadTicketDetails = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [ticketResponse, commentsResponse] = await Promise.all([
        ticketService.getTicketById(ticketId),
        ticketService.getTicketComments(ticketId)
      ]);

      setTicket(ticketResponse.data.ticket);
      setComments(commentsResponse.data.comments || []);
      setLoadFailed(false);
    } catch (error: any) {
      logger.error('Erreur chargement détails ticket:', error?.message);
      setLoadFailed(true);
      notifyError(error.message || 'Impossible de charger les détails du ticket');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isAddingComment) return;

    try {
      setIsAddingComment(true);
      
      await ticketService.addComment(ticketId, {
        comment: newComment.trim(),
        isInternal: permissions.isSupportRole ? isInternalComment : false
      });

      const wasInternal = isInternalComment;
      setNewComment('');
      setIsInternalComment(false);
      setShowCommentInput(false);
      
      // Recharger ticket + commentaires (un commentaire peut changer le statut, ex: en attente admin)
      await loadTicketDetails(true);
      notifySuccess(wasInternal ? 'Note interne ajoutée' : 'Commentaire publié',
        wasInternal ? 'Visible uniquement par l\'équipe support.' : '');
    } catch (error: any) {
      logger.error('Erreur ajout commentaire:', error?.message);
      notifyError(error.message || 'Impossible d\'ajouter le commentaire');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!assignToUser.trim()) {
      notifyError('Choisissez la personne à qui assigner le ticket');
      return;
    }
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await ticketService.assignTicket(ticketId, assignToUser.trim());
      setShowAssignModal(false);
      setAssignToUser('');
      notifySuccess('Ticket assigné');
      loadTicketDetails(true);
    } catch (error: any) {
      notifyError(error.message || 'Impossible d\'assigner le ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEscalateTicket = async () => {
    if (!assignToUser.trim() || !escalateReason.trim()) {
      notifyError('Choisissez un responsable et indiquez la raison de l\'escalade');
      return;
    }
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await ticketService.escalateTicket(ticketId, assignToUser.trim(), escalateReason.trim());
      setShowEscalateModal(false);
      setAssignToUser('');
      setEscalateReason('');
      notifySuccess('Ticket escaladé');
      loadTicketDetails(true);
    } catch (error: any) {
      notifyError(error.message || 'Impossible d\'escalader le ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeStatus = (newStatus: string) => {
    const isReopen = ticket?.status === 'closed' && newStatus === 'in_progress';
    const title = isReopen ? 'Rouvrir le ticket' : 'Changer le statut';
    const message = isReopen 
      ? 'Voulez-vous rouvrir ce ticket ? Il passera au statut "En cours".'
      : `Voulez-vous changer le statut vers "${ticketService.formatTicketStatus(newStatus)}" ?`;

    Alert.alert(
      title,
      message,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            if (isSubmitting) return;
            try {
              setIsSubmitting(true);
              await ticketService.changeTicketStatus(ticketId, newStatus);
              notifySuccess(isReopen ? 'Ticket rouvert' : 'Statut modifié');
              loadTicketDetails(true);
            } catch (error: any) {
              notifyError(error.message || 'Impossible de changer le statut');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleCloseTicket = () => {
    setSelectedCloseReason('user_request');
    setShowCloseReasonModal(true);
  };

  const confirmCloseTicket = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await ticketService.closeTicket(ticketId, selectedCloseReason);
      setShowCloseReasonModal(false);
      notifySuccess('Ticket fermé');
      loadTicketDetails(true);
    } catch (error: any) {
      notifyError(error.message || 'Impossible de fermer le ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRateTicket = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await ticketService.rateTicket(ticketId, {
        score: rating,
        comment: ratingComment.trim() || undefined
      });
      
      setShowRatingModal(false);
      setRatingComment('');
      notifySuccess('Merci !', 'Votre évaluation a été enregistrée');
      loadTicketDetails(true);
    } catch (error: any) {
      notifyError(error.message || 'Impossible d\'enregistrer l\'évaluation');
    } finally {
      setIsSubmitting(false);
    }
  };


  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  type Tone = 'primary' | 'info' | 'warning' | 'success' | 'neutral' | 'danger';
  const STATUS_TONE: Record<string, Tone> = {
    open: 'info', in_progress: 'primary', waiting_user: 'warning', waiting_admin: 'warning',
    resolved: 'success', closed: 'neutral', cancelled: 'neutral',
  };
  const PRIORITY_TONE: Record<string, Tone> = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' };
  const RATING_LABELS = ['', 'Très insatisfait', 'Insatisfait', 'Neutre', 'Satisfait', 'Très satisfait'];
  const CLOSE_REASONS = [
    { key: 'resolved', label: 'Résolu' },
    { key: 'duplicate', label: 'Doublon' },
    { key: 'spam', label: 'Spam' },
    { key: 'irrelevant', label: 'Non pertinent' },
    { key: 'user_request', label: 'À la demande de l\'utilisateur' },
  ];

  const SectionTitle = ({ children, icon, color }: { children: string; icon?: IconName; color?: string }) => (
    <View style={styles.sectionTitle}>
      {icon ? <Ionicons name={icon} size={16} color={color ?? c.mutedForeground} /> : null}
      <AppText variant="overline" color={color ?? c.mutedForeground} accessibilityRole="header">{children}</AppText>
    </View>
  );

  const Notice = ({ tone, icon, text }: { tone: 'success' | 'danger' | 'warning' | 'neutral'; icon: IconName; text: string }) => {
    const fg = tone === 'success' ? c.success : tone === 'danger' ? c.destructive : tone === 'warning' ? c.warning : c.mutedForeground;
    const bg = tone === 'success' ? c.successSoft : tone === 'danger' ? c.destructiveSoft : tone === 'warning' ? c.warningSoft : c.muted;
    return (
      <View style={[styles.notice, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={fg} />
        <AppText variant="small" color={fg} style={styles.flex}>{text}</AppText>
      </View>
    );
  };

  // Sélection d'un membre du support (assignation / escalade)
  const StaffPicker = () =>
    isLoadingStaff ? (
      <ActivityIndicator style={{ marginVertical: spacing.lg }} color={c.primary} />
    ) : staff.length === 0 ? (
      <AppText variant="small" color={c.mutedForeground}>Aucun autre membre du support trouvé.</AppText>
    ) : (
      <View style={{ gap: spacing.sm }}>
        {staff.map(member => (
          <ChoiceCard
            key={member._id}
            title={`${member.firstName} ${member.lastName}`}
            description={getUserRoleLabel(member.role as UserRole)}
            selected={assignToUser === member._id}
            onPress={() => setAssignToUser(member._id)}
          />
        ))}
      </View>
    );

  const hero = (
    <HeroHeader
      eyebrow={ticket?.ticketNumber ? `Ticket ${ticket.ticketNumber}` : 'Support'}
      eyebrowIcon="chatbubbles-outline"
      title={ticket?.subject ?? 'Détail du ticket'}
      subtitle={ticket ? `Ouvert il y a ${ticketService.getTicketAge(ticket)}` : undefined}
      onBack={() => navigation.goBack()}
      right={<IconButton icon={isRefreshing ? 'hourglass-outline' : 'refresh'} tone="hero" accessibilityLabel="Actualiser" onPress={() => loadTicketDetails(true)} />}
    >
      {ticket ? (
        <View style={styles.chips}>
          <HeroChip label={ticketService.formatTicketStatus(ticket.status)} />
          <HeroChip icon="flag" label={`Priorité ${ticketService.formatTicketPriority(ticket.priority).toLowerCase()}`} />
        </View>
      ) : null}
    </HeroHeader>
  );

  if (isLoading) {
    return (
      <Screen hero={hero}>
        <Card><LoadingState message="Chargement du ticket…" /></Card>
      </Screen>
    );
  }

  if (!ticket) {
    return (
      <Screen hero={hero}>
        <Card>
          <EmptyState
            icon="alert-circle-outline"
            title={loadFailed ? 'Impossible de charger le ticket' : 'Ticket introuvable'}
            action={<Button title="Réessayer" variant="outline" icon="refresh" onPress={() => loadTicketDetails()} />}
          />
        </Card>
      </Screen>
    );
  }

  const statusRules = ticketService.getTicketStatusRules(ticket);
  const actions = ticketService.getAvailableActions(ticket, currentUser?.id, currentUser?.role);
  const slaStatus = ticket.sla ? ticketService.getSLAStatus(ticket) : null;
  const slaOverdue = !!slaStatus && (slaStatus.responseOverdue || slaStatus.resolutionOverdue);
  const contextInfo = ticketService.getContextInfo(ticket);
  const hasMetrics = !!ticket.metrics && (!!ticket.metrics.firstResponseTime || !!ticket.metrics.resolutionTime || ticket.metrics.responseCount > 0);
  const isTerminal = ticket.status === 'closed' || ticket.status === 'cancelled';
  const showAdmin =
    permissions.isSupportRole && !isTerminal &&
    !(ticket.status === 'resolved' && !actions.canAssign && !actions.canEscalate) &&
    (actions.canChangeStatus || actions.canAssign || actions.canEscalate);

  return (
    <Screen
      hero={hero}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadTicketDetails(true)} colors={[c.primary]} tintColor={c.primary} />}
    >
      {/* Alertes d'état */}
      {statusRules.isClosed ? (
        <Notice tone="neutral" icon="lock-closed-outline" text={`Ticket fermé${ticket.closeReason ? ` (${ticketService.getCloseReasonLabel(ticket.closeReason)})` : ''}.`} />
      ) : statusRules.isOverdue ? (
        <Notice tone="danger" icon="warning-outline" text="Ce ticket a dépassé les délais de traitement prévus." />
      ) : statusRules.isEscalated ? (
        <Notice tone="warning" icon="trending-up" text="Ce ticket a été escaladé." />
      ) : null}

      {/* Informations */}
      <Card>
        <SectionTitle>Informations</SectionTitle>
        <InfoRow label="Statut" value={<Badge label={ticketService.formatTicketStatus(ticket.status)} tone={STATUS_TONE[ticket.status] ?? 'neutral'} />} />
        <InfoRow label="Priorité" value={<Badge label={ticketService.formatTicketPriority(ticket.priority)} tone={PRIORITY_TONE[ticket.priority] ?? 'neutral'} icon="flag-outline" />} />
        <InfoRow label="Catégorie" value={ticketService.formatTicketCategory(ticket.category)} />
        <InfoRow label="Créé le" value={formatDate(ticket.createdAt)} />
        {ticket.updatedAt !== ticket.createdAt ? <InfoRow label="Dernière activité" value={`il y a ${ticketService.getLastActivity(ticket)}`} /> : null}
        {permissions.canViewAllTickets && ticket.user ? (
          <InfoRow label="Demandeur" value={`${ticket.user.firstName} ${ticket.user.lastName}${ticket.user.role ? ` · ${getUserRoleLabel(ticket.user.role as UserRole)}` : ''}`} />
        ) : null}
        {permissions.canViewAllTickets && ticket.user?.email ? <InfoRow label="Email" value={ticket.user.email} /> : null}
        <InfoRow
          label="Assigné à"
          value={ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}${ticket.assignedAt ? `, le ${formatDate(ticket.assignedAt)}` : ''}` : 'Pas encore assigné'}
          last={!(ticket.tags && ticket.tags.length > 0)}
        />
        {ticket.tags && ticket.tags.length > 0 ? (
          <View style={styles.tags}>
            {ticket.tags.map((tag, i) => <Badge key={`${tag}-${i}`} label={tag} tone="primary" icon="pricetag-outline" />)}
          </View>
        ) : null}
      </Card>

      {/* Description */}
      <Card>
        <SectionTitle>Description</SectionTitle>
        <AppText variant="body" selectable>{ticket.description}</AppText>
      </Card>

      {/* Résolution */}
      {ticket.resolution ? (
        <Card style={{ borderColor: c.success }}>
          <SectionTitle icon="checkmark-circle-outline" color={c.success}>Résolution</SectionTitle>
          <AppText variant="body">{ticket.resolution}</AppText>
          {ticket.resolvedBy ? (
            <AppText variant="small" color={c.mutedForeground} style={{ marginTop: spacing.sm }}>
              Résolu par {ticket.resolvedBy.firstName} {ticket.resolvedBy.lastName}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {/* Évaluation */}
      {ticket.rating ? (
        <Card>
          <SectionTitle>Évaluation</SectionTitle>
          <View style={styles.stars} accessible accessibilityLabel={`Note : ${ticket.rating.score} sur 5`}>
            {[1, 2, 3, 4, 5].map(star => (
              <Ionicons key={star} name={star <= ticket.rating!.score ? 'star' : 'star-outline'} size={22} color={star <= ticket.rating!.score ? c.gold : c.border} />
            ))}
          </View>
          {ticket.rating.comment ? <AppText variant="body" style={{ fontStyle: 'italic', marginTop: spacing.sm }}>« {ticket.rating.comment} »</AppText> : null}
        </Card>
      ) : null}

      {/* Échanges */}
      <Card>
        <SectionTitle>{`Échanges (${comments.length})`}</SectionTitle>
        {comments.length === 0 ? (
          <AppText variant="small" color={c.mutedForeground}>Aucun échange pour le moment.</AppText>
        ) : (
          <View style={{ gap: spacing.md }}>
            {comments.map((comment, index) => {
              const role = comment.author?.role || 'user';
              const isStaff = role !== 'user';
              const bubbleBg = comment.isInternal ? c.warningSoft : isStaff ? c.primarySoft : c.muted;
              return (
                <View key={comment._id || `${comment.createdAt}-${index}`} style={[styles.bubble, { backgroundColor: bubbleBg, alignSelf: isStaff ? 'flex-start' : 'flex-end' }]}>
                  <View style={styles.bubbleHead}>
                    <Ionicons name={isStaff ? 'headset-outline' : 'person-outline'} size={14} color={isStaff ? c.primary : c.mutedForeground} />
                    <AppText variant="smallStrong" numberOfLines={1} style={styles.flexShrink}>
                      {comment.author ? `${comment.author.firstName ?? ''} ${comment.author.lastName ?? ''}`.trim() : 'Utilisateur supprimé'}
                    </AppText>
                    {isStaff ? <Badge label={getUserRoleLabel(role as UserRole)} tone="primary" /> : null}
                    {comment.isInternal ? <Badge label="Note interne" tone="warning" icon="lock-closed-outline" /> : null}
                  </View>
                  <AppText variant="body" selectable>{comment.content}</AppText>
                  {comment.attachments && comment.attachments.length > 0 ? (
                    <View style={{ gap: 4 }}>
                      {comment.attachments.map((a, i) => (
                        <View key={i} style={styles.attachment}>
                          <Ionicons name="attach" size={14} color={c.primary} />
                          <AppText variant="caption" numberOfLines={1} style={styles.flexShrink}>{a.filename}</AppText>
                          {a.size ? <AppText variant="caption" color={c.mutedForeground}>({Math.max(1, Math.round(a.size / 1024))} Ko)</AppText> : null}
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <AppText variant="caption" color={c.mutedForeground}>{formatDate(comment.createdAt)}</AppText>
                </View>
              );
            })}
          </View>
        )}
      </Card>

      {/* Suivi : métriques, délais, escalade, contexte */}
      {hasMetrics || slaStatus || ticketService.isTicketEscalated(ticket) || contextInfo.length > 0 ? (
        <Card>
          <SectionTitle>Suivi</SectionTitle>
          {ticket.metrics?.firstResponseTime ? <InfoRow label="Première réponse" value={ticketService.formatDuration(ticket.metrics.firstResponseTime)} /> : null}
          {ticket.metrics?.resolutionTime ? <InfoRow label="Temps de résolution" value={ticketService.formatDuration(ticket.metrics.resolutionTime)} /> : null}
          {hasMetrics ? <InfoRow label="Réponses" value={String(ticket.metrics!.responseCount)} /> : null}
          {ticket.metrics?.escalationCount ? <InfoRow label="Escalades" value={String(ticket.metrics.escalationCount)} /> : null}
          {slaStatus?.responseDeadline ? (
            <InfoRow label="Réponse attendue avant" value={formatDate(slaStatus.responseDeadline.toISOString())} valueColor={slaStatus.responseOverdue ? c.destructive : undefined} />
          ) : null}
          {slaStatus?.resolutionDeadline ? (
            <InfoRow label="Résolution attendue avant" value={formatDate(slaStatus.resolutionDeadline.toISOString())} valueColor={slaStatus.resolutionOverdue ? c.destructive : undefined} />
          ) : null}
          {ticketService.isTicketEscalated(ticket) && ticket.escalation ? (
            <>
              {ticket.escalation.escalatedAt ? <InfoRow label="Escaladé le" value={formatDate(ticket.escalation.escalatedAt)} /> : null}
              {ticket.escalation.escalatedTo ? <InfoRow label="Escaladé vers" value={`${ticket.escalation.escalatedTo.firstName} ${ticket.escalation.escalatedTo.lastName}`} /> : null}
              {ticket.escalation.escalationReason ? <InfoRow label="Motif" value={ticket.escalation.escalationReason} /> : null}
            </>
          ) : null}
          {contextInfo.map((info, i) => (
            <InfoRow key={`${info.label}-${i}`} label={info.label} value={String(info.value)} last={i === contextInfo.length - 1} />
          ))}
          {slaOverdue ? <Notice tone="danger" icon="time-outline" text="Les délais de traitement sont dépassés." /> : null}
        </Card>
      ) : null}

      {/* Actions administrateur */}
      {showAdmin ? (
        <Card style={{ gap: spacing.md }}>
          <SectionTitle icon="shield-outline">Gestion du ticket</SectionTitle>
          {actions.canChangeStatus && actions.availableStatusTransitions.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <AppText variant="smallStrong">Changer le statut</AppText>
              <View style={styles.transitions}>
                {actions.availableStatusTransitions.map(t => (
                  <Pressable
                    key={t.status}
                    onPress={() => handleChangeStatus(t.status)}
                    accessibilityRole="button"
                    accessibilityLabel={`Passer au statut ${t.label}`}
                    style={({ pressed }) => [styles.transition, { borderColor: c.border, backgroundColor: pressed ? c.muted : c.card }]}
                  >
                    <MaterialIcons name={ticketService.getStatusIcon(t.status) as any} size={16} color={c.primary} />
                    <AppText variant="smallStrong" numberOfLines={1}>{t.label}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          {actions.canAssign || actions.canEscalate ? (
            <View style={styles.row}>
              {actions.canAssign ? <Button title="Assigner" icon="person-add-outline" variant="outline" onPress={openAssignModal} fullWidth={false} style={styles.flex} /> : null}
              {actions.canEscalate ? <Button title="Escalader" icon="trending-up" variant="outline" onPress={openEscalateModal} fullWidth={false} style={styles.flex} /> : null}
            </View>
          ) : null}
          {!actions.canEscalate && ticketService.isTicketEscalated(ticket) ? <Notice tone="warning" icon="information-circle-outline" text="Ce ticket est déjà escaladé." /> : null}
        </Card>
      ) : null}

      {/* Actions */}
      {ticket.status === 'cancelled' ? (
        <Notice tone="danger" icon="ban-outline" text="Ce ticket a été annulé. Aucune action n'est possible." />
      ) : ticket.status === 'closed' ? (
        actions.canReopen ? <Button title="Rouvrir le ticket" icon="refresh" variant="outline" onPress={() => handleChangeStatus('in_progress')} /> : null
      ) : ticket.status === 'resolved' ? (
        actions.canClose || actions.canRate ? (
          <View style={{ gap: spacing.sm }}>
            <Notice tone="success" icon="checkmark-circle-outline" text="Ce ticket est résolu. Vous pouvez l'évaluer ou le fermer." />
            {actions.canRate ? <Button title="Évaluer le support" variant="gold" icon="star" onPress={() => setShowRatingModal(true)} /> : null}
            {actions.canClose ? <Button title="Fermer le ticket" variant="outline" icon="lock-closed-outline" onPress={handleCloseTicket} /> : null}
          </View>
        ) : null
      ) : actions.canComment || actions.canClose ? (
        <View style={{ gap: spacing.sm }}>
          {actions.canComment ? (
            <Button
              title={permissions.isSupportRole ? 'Répondre ou ajouter une note' : 'Répondre'}
              icon="chatbubble-ellipses-outline"
              onPress={() => setShowCommentInput(true)}
            />
          ) : null}
          {actions.canClose ? <Button title="Fermer le ticket" variant="outline" icon="close-circle-outline" onPress={handleCloseTicket} /> : null}
        </View>
      ) : null}

      {/* Réponse / note interne */}
      <Sheet
        visible={showCommentInput}
        title={isInternalComment ? 'Note interne' : 'Votre réponse'}
        onClose={() => { setShowCommentInput(false); setIsInternalComment(false); }}
      >
        <TextField
          placeholder={isInternalComment ? 'Note pour l\'équipe support (invisible pour l\'utilisateur)…' : 'Écrivez votre message…'}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          textAlignVertical="top"
          maxLength={1000}
          autoFocus
          style={{ minHeight: 120 }}
          editable={ticketService.canUserComment(ticket, currentUser?.id, currentUser?.role)}
          hint={`${newComment.length}/1000`}
        />
        {permissions.isSupportRole ? (
          <ChoiceCard
            icon="lock-closed-outline"
            title="Note interne"
            description="Invisible pour l'utilisateur, aucun email envoyé."
            selected={isInternalComment}
            onPress={() => setIsInternalComment(v => !v)}
          />
        ) : null}
        <Button
          title={isInternalComment ? 'Ajouter la note' : 'Envoyer'}
          icon="send"
          onPress={handleAddComment}
          loading={isAddingComment}
          disabled={!newComment.trim()}
        />
      </Sheet>

      {/* Évaluation */}
      <Sheet visible={showRatingModal} title="Évaluer le support" onClose={() => setShowRatingModal(false)}>
        <AppText variant="body" color={c.mutedForeground}>Comment évaluez-vous l'aide reçue ?</AppText>
        <View style={styles.starsPicker}>
          {[1, 2, 3, 4, 5].map(star => (
            <Pressable key={star} onPress={() => setRating(star)} accessibilityRole="radio" accessibilityState={{ checked: rating === star }} accessibilityLabel={`${star} étoile${star > 1 ? 's' : ''}`} hitSlop={6}>
              <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={36} color={star <= rating ? c.gold : c.border} />
            </Pressable>
          ))}
        </View>
        <AppText variant="bodyStrong" center>{RATING_LABELS[rating]}</AppText>
        <TextField placeholder="Un commentaire ? (facultatif)" value={ratingComment} onChangeText={setRatingComment} multiline textAlignVertical="top" maxLength={500} style={{ minHeight: 80 }} />
        <Button title="Envoyer l'évaluation" variant="gold" onPress={handleRateTicket} loading={isSubmitting} />
      </Sheet>

      {/* Assignation */}
      <Sheet visible={showAssignModal} title="Assigner le ticket" onClose={() => setShowAssignModal(false)}>
        <StaffPicker />
        <Button title="Assigner" onPress={handleAssignTicket} loading={isSubmitting} disabled={!assignToUser} />
      </Sheet>

      {/* Escalade */}
      <Sheet visible={showEscalateModal} title="Escalader le ticket" onClose={() => setShowEscalateModal(false)}>
        <StaffPicker />
        <TextField label="Motif de l'escalade" placeholder="Pourquoi escalader ce ticket ?" value={escalateReason} onChangeText={setEscalateReason} multiline textAlignVertical="top" style={{ minHeight: 90 }} />
        <Button title="Escalader" icon="trending-up" onPress={handleEscalateTicket} loading={isSubmitting} disabled={!assignToUser} />
      </Sheet>

      {/* Motif de fermeture */}
      <Sheet visible={showCloseReasonModal} title="Motif de fermeture" onClose={() => setShowCloseReasonModal(false)}>
        {CLOSE_REASONS.map(r => (
          <ChoiceCard key={r.key} title={r.label} selected={selectedCloseReason === r.key} onPress={() => setSelectedCloseReason(r.key as any)} />
        ))}
        <Button title="Fermer le ticket" variant="destructive" icon="lock-closed-outline" onPress={confirmCloseTicket} loading={isSubmitting} />
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderRadius: radius.lg, padding: spacing.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  stars: { flexDirection: 'row', gap: 4 },
  starsPicker: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  bubble: { maxWidth: '92%', borderRadius: radius.lg, padding: spacing.md, gap: 6 },
  bubbleHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  attachment: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  transitions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  transition: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1 },
});

export default TicketDetailScreen;
