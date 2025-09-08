import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import ticketService, { Ticket, TicketComment } from '../store/services/ticketService';
import useUserPermissions, { getUserRoleLabel, getUserRoleColor, UserRole } from '../hooks/useUserPermissions';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import RefreshableHeader from '../components/RefreshableHeader';

interface TicketDetailScreenProps {
  navigation: any;
  route: {
    params: {
      ticketId: string;
    };
  };
}

const TicketDetailScreen: React.FC<TicketDetailScreenProps> = ({ navigation, route }) => {
  const { colors, dark } = useTheme();
  const { ticketId } = route.params;
  const permissions = useUserPermissions();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  
  const [newComment, setNewComment] = useState('');
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
      setComments(commentsResponse.data.comments);
    } catch (error: any) {
      console.error('Erreur chargement détails ticket:', error);
      Alert.alert('Erreur', error.message || 'Impossible de charger les détails du ticket');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un commentaire');
      return;
    }

    try {
      setIsAddingComment(true);
      
      await ticketService.addComment(ticketId, {
        content: newComment.trim(),
        isInternal: false
      });

      setNewComment('');
      setShowCommentInput(false);
      
      // Recharger les commentaires
      const commentsResponse = await ticketService.getTicketComments(ticketId);
      setComments(commentsResponse.data.comments);
      
      Alert.alert('Succès', 'Commentaire ajouté avec succès');
    } catch (error: any) {
      console.error('Erreur ajout commentaire:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'ajouter le commentaire');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!assignToUser.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir l\'ID de l\'utilisateur à assigner');
      return;
    }

    try {
      await ticketService.assignTicket(ticketId, assignToUser.trim());
      setShowAssignModal(false);
      setAssignToUser('');
      Alert.alert('Succès', 'Ticket assigné avec succès');
      loadTicketDetails();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'assigner le ticket');
    }
  };

  const handleEscalateTicket = async () => {
    if (!assignToUser.trim() || !escalateReason.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      await ticketService.escalateTicket(ticketId, assignToUser.trim(), escalateReason.trim());
      setShowEscalateModal(false);
      setAssignToUser('');
      setEscalateReason('');
      Alert.alert('Succès', 'Ticket escaladé avec succès');
      loadTicketDetails();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'escalader le ticket');
    }
  };

  const handleChangeStatus = (newStatus: string) => {
    Alert.alert(
      'Changer le statut',
      `Voulez-vous changer le statut du ticket vers "${ticketService.formatTicketStatus(newStatus)}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await ticketService.changeTicketStatus(ticketId, newStatus);
              Alert.alert('Succès', 'Statut modifié avec succès');
              loadTicketDetails();
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de changer le statut');
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
    try {
      await ticketService.closeTicket(ticketId, selectedCloseReason);
      setShowCloseReasonModal(false);
      Alert.alert('Succès', 'Ticket fermé avec succès');
      loadTicketDetails();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de fermer le ticket');
    }
  };

  const handleRateTicket = async () => {
    try {
      await ticketService.rateTicket(ticketId, {
        score: rating,
        comment: ratingComment.trim() || undefined
      });
      
      setShowRatingModal(false);
      setRatingComment('');
      Alert.alert('Merci !', 'Votre évaluation a été enregistrée');
      loadTicketDetails();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'enregistrer l\'évaluation');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTicketHeader = () => (
    <View style={[styles.ticketHeader, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
      <View style={styles.headerTop}>
        <View style={styles.ticketNumberContainer}>
          <MaterialIcons name="confirmation-number" size={20} color={colors.primary} />
          <Text style={[styles.ticketNumber, { color: colors.primary }]}>
            {ticket?.ticketNumber}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: ticketService.getStatusColor(ticket?.status || '') + '20' }
        ]}>
          <MaterialIcons 
            name={ticketService.getStatusIcon(ticket?.status || '') as any}
            size={16} 
            color={ticketService.getStatusColor(ticket?.status || '')} 
          />
          <Text style={[
            styles.statusText,
            { color: ticketService.getStatusColor(ticket?.status || '') }
          ]}>
            {ticketService.formatTicketStatus(ticket?.status || '')}
          </Text>
        </View>
      </View>

      <Text style={[styles.ticketSubject, { color: colors.text }]}>
        {ticket?.subject}
      </Text>

      <View style={styles.ticketMeta}>
        <View style={styles.metaRow}>
          <MaterialIcons 
            name={ticketService.getCategoryIcon(ticket?.category || '') as any} 
            size={16} 
            color={dark ? COLORS.grayTie : COLORS.gray} 
          />
          <Text style={[styles.metaText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {ticketService.formatTicketCategory(ticket?.category || '')}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialIcons 
            name={ticketService.getPriorityIcon(ticket?.priority || '') as any} 
            size={16} 
            color={ticketService.getPriorityColor(ticket?.priority || '')} 
          />
          <Text style={[styles.metaText, { color: ticketService.getPriorityColor(ticket?.priority || '') }]}>
            Priorité {ticketService.formatTicketPriority(ticket?.priority || '')}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialIcons name="schedule" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
          <Text style={[styles.metaText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Créé il y a {ticket ? ticketService.getTicketAge(ticket) : 'N/A'}
          </Text>
        </View>
        {ticket?.updatedAt !== ticket?.createdAt && (
          <View style={styles.metaRow}>
            <MaterialIcons name="update" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
            <Text style={[styles.metaText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Dernière activité il y a {ticket ? ticketService.getLastActivity(ticket) : 'N/A'}
            </Text>
          </View>
        )}
      </View>

      {/* Tags si présents */}
      {ticket?.tags && ticket.tags.length > 0 && (
        <View style={styles.tagsSection}>
          <MaterialIcons name="label" size={16} color={colors.primary} />
          <View style={styles.tagsContainer}>
            {ticket.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Informations utilisateur pour les agents de support */}
      {permissions.canViewAllTickets && ticket?.user && (
        <View style={styles.userSection}>
          <MaterialIcons name="person" size={16} color={colors.primary} />
          <Text style={[styles.userText, { color: colors.text }]}>
            Créé par {ticket.user.firstName} {ticket.user.lastName}
          </Text>
          <Text style={[styles.userEmail, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {ticket.user.email}
          </Text>
          {ticket.user.role && (
            <View style={[styles.userRoleBadge, { backgroundColor: getUserRoleColor(ticket.user.role as UserRole) + '20' }]}>
              <Text style={[styles.userRoleText, { color: getUserRoleColor(ticket.user.role as UserRole) }]}>
                {getUserRoleLabel(ticket.user.role as UserRole)}
              </Text>
            </View>
          )}
        </View>
      )}

      {ticket?.assignedTo && (
        <View style={styles.assignedSection}>
          <MaterialIcons name="person" size={16} color={colors.primary} />
          <Text style={[styles.assignedText, { color: colors.primary }]}>
            Assigné à {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
          </Text>
          {ticket.assignedAt && (
            <Text style={[styles.assignedDate, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              le {formatDate(ticket.assignedAt)}
            </Text>
          )}
        </View>
      )}

      {/* Alertes de statut */}
      {ticket && (() => {
        const statusRules = ticketService.getTicketStatusRules(ticket);
        
        if (statusRules.isClosed) {
          return (
            <View style={[styles.headerAlert, { backgroundColor: COLORS.gray + '20' }]}>
              <MaterialIcons name="lock" size={16} color={COLORS.gray} />
              <Text style={[styles.headerAlertText, { color: COLORS.gray }]}>
                Ticket fermé {ticket.closeReason ? `(${ticketService.getCloseReasonLabel(ticket.closeReason)})` : ''}
              </Text>
            </View>
          );
        }
        
        if (statusRules.isOverdue) {
          return (
            <View style={[styles.headerAlert, { backgroundColor: COLORS.error + '20' }]}>
              <MaterialIcons name="warning" size={16} color={COLORS.error} />
              <Text style={[styles.headerAlertText, { color: COLORS.error }]}>
                Ticket en retard SLA
              </Text>
            </View>
          );
        }
        
        if (statusRules.isEscalated) {
          return (
            <View style={[styles.headerAlert, { backgroundColor: COLORS.warning + '20' }]}>
              <MaterialIcons name="trending-up" size={16} color={COLORS.warning} />
              <Text style={[styles.headerAlertText, { color: COLORS.warning }]}>
                Ticket escaladé
              </Text>
            </View>
          );
        }
        
        return null;
      })()}
    </View>
  );

  const renderDescription = () => (
    <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
      <Text style={[styles.description, { color: colors.text }]}>
        {ticket?.description}
      </Text>
    </View>
  );

  const renderMetrics = () => {
    if (!ticket?.metrics || (!ticket.metrics.firstResponseTime && !ticket.metrics.resolutionTime && ticket.metrics.responseCount === 0)) {
      return null;
    }

    return (
      <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Métriques</Text>
        <View style={styles.metricsGrid}>
          {ticket.metrics.firstResponseTime && (
            <View style={styles.metricItem}>
              <MaterialIcons name="schedule" size={20} color={colors.primary} />
              <Text style={[styles.metricLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Premier réponse
              </Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {ticketService.formatDuration(ticket.metrics.firstResponseTime)}
              </Text>
            </View>
          )}
          
          {ticket.metrics.resolutionTime && (
            <View style={styles.metricItem}>
              <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
              <Text style={[styles.metricLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Temps de résolution
              </Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {ticketService.formatDuration(ticket.metrics.resolutionTime)}
              </Text>
            </View>
          )}
          
          <View style={styles.metricItem}>
            <MaterialIcons name="chat" size={20} color={colors.primary} />
            <Text style={[styles.metricLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Réponses
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {ticket.metrics.responseCount}
            </Text>
          </View>
          
          {ticket.metrics.escalationCount > 0 && (
            <View style={styles.metricItem}>
              <MaterialIcons name="trending-up" size={20} color={COLORS.warning} />
              <Text style={[styles.metricLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Escalades
              </Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {ticket.metrics.escalationCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSLAInfo = () => {
    if (!ticket?.sla) return null;

    const slaStatus = ticketService.getSLAStatus(ticket);
    const hasOverdue = slaStatus.responseOverdue || slaStatus.resolutionOverdue;

    if (!hasOverdue && !slaStatus.responseDeadline && !slaStatus.resolutionDeadline) {
      return null;
    }

    return (
      <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <View style={styles.slaHeader}>
          <MaterialIcons 
            name={hasOverdue ? "warning" : "schedule"} 
            size={20} 
            color={hasOverdue ? COLORS.error : colors.primary} 
          />
          <Text style={[styles.sectionTitle, { color: hasOverdue ? COLORS.error : colors.text }]}>
            SLA {hasOverdue ? "(En retard)" : ""}
          </Text>
        </View>
        
        <View style={styles.slaGrid}>
          {slaStatus.responseDeadline && (
            <View style={styles.slaItem}>
              <Text style={[styles.slaLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Deadline réponse
              </Text>
              <Text style={[
                styles.slaValue, 
                { 
                  color: slaStatus.responseOverdue ? COLORS.error : colors.text 
                }
              ]}>
                {formatDate(slaStatus.responseDeadline.toISOString())}
              </Text>
              {slaStatus.responseOverdue && (
                <Text style={[styles.overdueText, { color: COLORS.error }]}>
                  En retard
                </Text>
              )}
            </View>
          )}

          {slaStatus.resolutionDeadline && (
            <View style={styles.slaItem}>
              <Text style={[styles.slaLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Deadline résolution
              </Text>
              <Text style={[
                styles.slaValue, 
                { 
                  color: slaStatus.resolutionOverdue ? COLORS.error : colors.text 
                }
              ]}>
                {formatDate(slaStatus.resolutionDeadline.toISOString())}
              </Text>
              {slaStatus.resolutionOverdue && (
                <Text style={[styles.overdueText, { color: COLORS.error }]}>
                  En retard
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEscalationInfo = () => {
    if (!ticketService.isTicketEscalated(ticket!)) return null;

    return (
      <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <View style={styles.escalationHeader}>
          <MaterialIcons name="trending-up" size={20} color={COLORS.warning} />
          <Text style={[styles.sectionTitle, { color: COLORS.warning }]}>
            Escalade
          </Text>
        </View>
        
        <View style={styles.escalationInfo}>
          {ticket?.escalation.escalatedAt && (
            <Text style={[styles.escalationDate, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Escaladé le {formatDate(ticket.escalation.escalatedAt)}
            </Text>
          )}
          
          {ticket?.escalation.escalatedTo && (
            <Text style={[styles.escalationUser, { color: colors.text }]}>
              Escaladé vers : {ticket.escalation.escalatedTo.firstName} {ticket.escalation.escalatedTo.lastName}
            </Text>
          )}
          
          {ticket?.escalation.escalationReason && (
            <View style={styles.escalationReason}>
              <Text style={[styles.escalationReasonLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Raison :
              </Text>
              <Text style={[styles.escalationReasonText, { color: colors.text }]}>
                {ticket.escalation.escalationReason}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderContextInfo = () => {
    if (!ticket) return null;

    const contextInfo = ticketService.getContextInfo(ticket);
    if (contextInfo.length === 0) return null;

    return (
      <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <View style={styles.contextHeader}>
          <MaterialIcons name="info" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Informations contextuelles
          </Text>
        </View>
        
        <View style={styles.contextGrid}>
          {contextInfo.map((info, index) => (
            <View key={index} style={styles.contextItem}>
              <Text style={[styles.contextLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                {info.label}
              </Text>
              <Text style={[styles.contextValue, { color: colors.text }]} numberOfLines={2}>
                {info.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderResolution = () => {
    if (!ticket?.resolution) return null;

    return (
      <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <View style={styles.resolutionHeader}>
          <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
          <Text style={[styles.sectionTitle, { color: COLORS.success }]}>Résolution</Text>
        </View>
        <Text style={[styles.description, { color: colors.text }]}>
          {ticket.resolution}
        </Text>
        {ticket.resolvedBy && (
          <Text style={[styles.resolvedBy, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Résolu par {ticket.resolvedBy.firstName} {ticket.resolvedBy.lastName}
          </Text>
        )}
      </View>
    );
  };

  const renderComments = () => (
    <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
      <View style={styles.commentsHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Commentaires ({comments.length})
        </Text>
      </View>

      {comments.length > 0 ? (
        comments.map((comment) => (
          <View key={comment._id || Math.random()} style={styles.commentItem}>
            <View style={styles.commentHeader}>
              <View style={styles.commentAuthor}>
                <MaterialIcons 
                  name={comment.author.role === 'user' ? 'person' : 'support-agent'} 
                  size={16} 
                  color={comment.author.role === 'user' ? colors.primary : COLORS.success} 
                />
                <Text style={[styles.commentAuthorName, { color: colors.text }]}>
                  {comment.author.firstName} {comment.author.lastName}
                </Text>
                {comment.author.role !== 'user' && (
                  <View style={[styles.supportBadge, { backgroundColor: getUserRoleColor(comment.author.role as UserRole) + '20' }]}>
                    <Text style={[styles.supportBadgeText, { color: getUserRoleColor(comment.author.role as UserRole) }]}>
                      {getUserRoleLabel(comment.author.role as UserRole)}
                    </Text>
                  </View>
                )}
                {comment.isInternal && (
                  <View style={[styles.internalBadge, { backgroundColor: COLORS.warning + '20' }]}>
                    <Text style={[styles.internalBadgeText, { color: COLORS.warning }]}>
                      Interne
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.commentDate, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                {formatDate(comment.createdAt)}
              </Text>
            </View>
            <Text style={[styles.commentText, { color: colors.text }]}>
              {comment.content}
            </Text>
            
            {/* Affichage des pièces jointes du commentaire */}
            {comment.attachments && comment.attachments.length > 0 && (
              <View style={styles.commentAttachments}>
                {comment.attachments.map((attachment, index) => (
                  <View key={index} style={[styles.attachmentItem, { backgroundColor: dark ? COLORS.dark3 : COLORS.greyscale300 }]}>
                    <MaterialIcons name="attachment" size={16} color={colors.primary} />
                    <Text style={[styles.attachmentName, { color: colors.text }]}>
                      {attachment.filename}
                    </Text>
                    <Text style={[styles.attachmentSize, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                      ({Math.round(attachment.size / 1024)}KB)
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      ) : (
        <Text style={[styles.noComments, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
          Aucun commentaire pour le moment
        </Text>
      )}
    </View>
  );

  const renderAdminActions = () => {
    if (!permissions.isSupportRole || !ticket) return null;

    const actions = ticketService.getAvailableActions(ticket, currentUser?.id, currentUser?.role);
    
    // Si aucune action administrative possible, ne pas afficher
    if (!actions.canChangeStatus && !actions.canAssign && !actions.canEscalate) {
      return null;
    }

    return (
      <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions administrateur</Text>
        
        {/* Changement de statut */}
        {actions.canChangeStatus && actions.availableStatusTransitions.length > 0 && (
          <View style={styles.adminActionGroup}>
            <Text style={[styles.adminActionLabel, { color: colors.text }]}>Changer le statut</Text>
            <View style={styles.statusActions}>
              {actions.availableStatusTransitions.slice(0, 4).map((transition) => (
                <TouchableOpacity
                  key={transition.status}
                  style={[
                    styles.statusActionButton,
                    { 
                      backgroundColor: ticketService.getStatusColor(transition.status) + '20'
                    }
                  ]}
                  onPress={() => handleChangeStatus(transition.status)}
                >
                  <MaterialIcons 
                    name={ticketService.getStatusIcon(transition.status) as any} 
                    size={16} 
                    color={ticketService.getStatusColor(transition.status)} 
                  />
                  <Text style={[
                    styles.statusActionText, 
                    { color: ticketService.getStatusColor(transition.status) }
                  ]}>
                    {transition.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Afficher les autres transitions si nombreuses */}
            {actions.availableStatusTransitions.length > 4 && (
              <View style={styles.moreStatusActions}>
                {actions.availableStatusTransitions.slice(4).map((transition) => (
                  <TouchableOpacity
                    key={transition.status}
                    style={[
                      styles.statusActionButton,
                      { 
                        backgroundColor: ticketService.getStatusColor(transition.status) + '20',
                        flex: 1
                      }
                    ]}
                    onPress={() => handleChangeStatus(transition.status)}
                  >
                    <MaterialIcons 
                      name={ticketService.getStatusIcon(transition.status) as any} 
                      size={16} 
                      color={ticketService.getStatusColor(transition.status)} 
                    />
                    <Text style={[
                      styles.statusActionText, 
                      { color: ticketService.getStatusColor(transition.status) }
                    ]}>
                      {transition.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Actions de gestion */}
        {(actions.canAssign || actions.canEscalate) && (
          <View style={styles.adminActionGroup}>
            <Text style={[styles.adminActionLabel, { color: colors.text }]}>Gestion</Text>
            <View style={styles.managementActions}>
              {actions.canAssign && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowAssignModal(true)}
                >
                  <MaterialIcons name="person-add" size={20} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>Assigner</Text>
                </TouchableOpacity>
              )}

              {actions.canEscalate && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: COLORS.warning }]}
                  onPress={() => setShowEscalateModal(true)}
                >
                  <MaterialIcons name="trending-up" size={20} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>Escalader</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Informations sur les restrictions */}
        {!actions.canChangeStatus && ticket.status === 'cancelled' && (
          <View style={[styles.restrictionInfo, { backgroundColor: COLORS.error + '10' }]}>
            <MaterialIcons name="block" size={16} color={COLORS.error} />
            <Text style={[styles.restrictionText, { color: COLORS.error }]}>
              Les tickets annulés ne peuvent plus être modifiés.
            </Text>
          </View>
        )}

        {!actions.canEscalate && ticketService.isTicketEscalated(ticket) && (
          <View style={[styles.restrictionInfo, { backgroundColor: COLORS.warning + '10' }]}>
            <MaterialIcons name="info" size={16} color={COLORS.warning} />
            <Text style={[styles.restrictionText, { color: COLORS.warning }]}>
              Ce ticket est déjà escaladé.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderActions = () => {
    if (!ticket) return null;

    const actions = ticketService.getAvailableActions(ticket, currentUser?.id, currentUser?.role);
    const statusRules = ticketService.getTicketStatusRules(ticket);

    // Si aucune action possible, ne pas afficher la section
    if (!actions.canComment && !actions.canClose && !actions.canRate && !actions.canReopen) {
      return null;
    }

    return (
      <View style={[styles.actionsSection, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
        
        {/* Message informatif selon le statut */}
        {statusRules.isClosed && (
          <View style={[styles.statusAlert, { backgroundColor: COLORS.gray + '20' }]}>
            <MaterialIcons name="info" size={20} color={COLORS.gray} />
            <Text style={[styles.statusAlertText, { color: COLORS.gray }]}>
              Ce ticket est fermé. Seule la réouverture est possible.
            </Text>
          </View>
        )}

        {statusRules.isResolved && !statusRules.isClosed && (
          <View style={[styles.statusAlert, { backgroundColor: COLORS.success + '20' }]}>
            <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
            <Text style={[styles.statusAlertText, { color: COLORS.success }]}>
              Ce ticket est résolu.
            </Text>
          </View>
        )}

        {statusRules.isOverdue && (
          <View style={[styles.statusAlert, { backgroundColor: COLORS.error + '20' }]}>
            <MaterialIcons name="warning" size={20} color={COLORS.error} />
            <Text style={[styles.statusAlertText, { color: COLORS.error }]}>
              Ce ticket est en retard selon les SLA définis.
            </Text>
          </View>
        )}

        {/* Bouton réouverture - Désactivé pour les tickets résolus */}
        {actions.canReopen && ticket.status !== 'resolved' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleChangeStatus('in_progress')}
          >
            <MaterialIcons name="refresh" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText} numberOfLines={1} ellipsizeMode="tail">Rouvrir le ticket</Text>
          </TouchableOpacity>
        )}

        {/* Bouton commentaire */}
        {actions.canComment && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowCommentInput(true)}
          >
            <MaterialIcons name="comment" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText} numberOfLines={1} ellipsizeMode="tail">Ajouter un commentaire</Text>
          </TouchableOpacity>
        )}

        {/* Bouton fermeture */}
        {actions.canClose && (
          <TouchableOpacity
            style={[styles.actionButton, styles.closeButton]}
            onPress={handleCloseTicket}
          >
            <MaterialIcons name="close" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText} numberOfLines={1} ellipsizeMode="tail">Fermer le ticket</Text>
          </TouchableOpacity>
        )}

        {/* Bouton évaluation */}
        {actions.canRate && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowRatingModal(true)}
          >
            <MaterialIcons name="star" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText} numberOfLines={1} ellipsizeMode="tail">Évaluer le support</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderRating = () => {
    if (!ticket?.rating) return null;

    return (
      <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Évaluation client</Text>
        <View style={styles.ratingDisplay}>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialIcons
                key={star}
                name="star"
                size={24}
                color={star <= ticket.rating!.score ? '#FFD700' : dark ? COLORS.dark3 : COLORS.greyscale300}
              />
            ))}
          </View>
          {ticket.rating.comment && (
            <Text style={[styles.ratingCommentText, { color: colors.text }]}>
              "{ticket.rating.comment}"
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderAssignModal = () => (
    <Modal
      visible={showAssignModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAssignModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.adminModal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Assigner le ticket
            </Text>
            <TouchableOpacity
              onPress={() => setShowAssignModal(false)}
              style={[styles.modalCloseButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale300 }]}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.adminInput,
              {
                backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                color: colors.text,
                borderColor: dark ? COLORS.dark3 : COLORS.greyscale300,
              },
            ]}
            placeholder="ID de l'utilisateur à assigner"
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
            value={assignToUser}
            onChangeText={setAssignToUser}
          />

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleAssignTicket}
          >
            <Text style={styles.submitButtonText}>Assigner</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderEscalateModal = () => (
    <Modal
      visible={showEscalateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEscalateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.adminModal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Escalader le ticket
            </Text>
            <TouchableOpacity
              onPress={() => setShowEscalateModal(false)}
              style={[styles.modalCloseButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale300 }]}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.adminInput,
              {
                backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                color: colors.text,
                borderColor: dark ? COLORS.dark3 : COLORS.greyscale300,
              },
            ]}
            placeholder="ID de l'utilisateur supérieur"
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
            value={assignToUser}
            onChangeText={setAssignToUser}
          />

          <TextInput
            style={[
              styles.adminTextArea,
              {
                backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                color: colors.text,
                borderColor: dark ? COLORS.dark3 : COLORS.greyscale300,
              },
            ]}
            placeholder="Raison de l'escalade"
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
            value={escalateReason}
            onChangeText={setEscalateReason}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: COLORS.warning }]}
            onPress={handleEscalateTicket}
          >
            <Text style={styles.submitButtonText}>Escalader</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderCommentModal = () => (
    <Modal
      visible={showCommentInput}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCommentInput(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.commentModal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Ajouter un commentaire
            </Text>
            <TouchableOpacity
              onPress={() => setShowCommentInput(false)}
              style={[styles.modalCloseButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale300 }]}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.commentInput,
              {
                backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                color: colors.text,
                borderColor: dark ? COLORS.dark3 : COLORS.greyscale300,
              },
            ]}
            placeholder="Saisissez votre commentaire..."
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
            value={newComment}
            onChangeText={setNewComment}
            multiline={true}
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
            editable={ticketService.canUserComment(ticket!, currentUser?.id, currentUser?.role)}
          />

          <View style={styles.commentActions}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: dark ? COLORS.dark3 : COLORS.greyscale300 }]}
              onPress={() => setShowCommentInput(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Annuler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isAddingComment || !newComment.trim() ? 0.5 : 1,
                },
              ]}
              onPress={handleAddComment}
              disabled={isAddingComment || !newComment.trim()}
            >
              {isAddingComment ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Publier</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderRatingModal = () => (
    <Modal
      visible={showRatingModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowRatingModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.ratingModal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Évaluer le support
            </Text>
            <TouchableOpacity
              onPress={() => setShowRatingModal(false)}
              style={[styles.modalCloseButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale300 }]}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.ratingLabel, { color: colors.text }]}>
            Comment évaluez-vous le support reçu ?
          </Text>

          <View style={styles.starsSelector}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <MaterialIcons
                  name="star"
                  size={32}
                  color={star <= rating ? '#FFD700' : dark ? COLORS.dark3 : COLORS.greyscale300}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.ratingDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {rating === 1 && "Très insatisfait"}
            {rating === 2 && "Insatisfait"}
            {rating === 3 && "Neutre"}
            {rating === 4 && "Satisfait"}
            {rating === 5 && "Très satisfait"}
          </Text>

          <TextInput
            style={[
              styles.ratingCommentInput,
              {
                backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                color: colors.text,
                borderColor: dark ? COLORS.dark3 : COLORS.greyscale300,
              },
            ]}
            placeholder="Commentaire (optionnel)"
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
            value={ratingComment}
            onChangeText={setRatingComment}
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.submitRatingButton, { backgroundColor: colors.primary }]}
            onPress={handleRateTicket}
          >
            <Text style={styles.submitRatingButtonText}>Envoyer l'évaluation</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>        
        <RefreshableHeader
          title="Détails du ticket"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          showRefreshButton={true}
          onRefreshPress={() => loadTicketDetails(true)}
          isRefreshing={isRefreshing}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>            
            Chargement des détails...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>        
        <RefreshableHeader
          title="Détails du ticket"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          showRefreshButton={true}
          onRefreshPress={() => loadTicketDetails(true)}
          isRefreshing={isRefreshing}
        />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={80} color={dark ? COLORS.grayTie : COLORS.gray} />
          <Text style={[styles.errorText, { color: colors.text }]}>            
            Ticket non trouvé
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>      
      <RefreshableHeader
        title="Détails du ticket"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        showRefreshButton={true}
        onRefreshPress={() => loadTicketDetails(true)}
        isRefreshing={isRefreshing}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadTicketDetails(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderTicketHeader()}
        {renderDescription()}
        {renderMetrics()}
        {renderSLAInfo()}
        {renderEscalationInfo()}
        {renderContextInfo()}
        {renderResolution()}
        {renderRating()}
        {renderComments()}
        {renderAdminActions()}
        {renderActions()}
      </ScrollView>

      {renderCommentModal()}
      {renderRatingModal()}
      {renderAssignModal()}
      {renderEscalateModal()}

      {/* Modal motif de fermeture */}
      <Modal
        visible={showCloseReasonModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCloseReasonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.commentModal, { backgroundColor: colors.background }]}>            
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Motif de fermeture</Text>
              <TouchableOpacity
                onPress={() => setShowCloseReasonModal(false)}
                style={[styles.modalCloseButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale300 }]}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, gap: 10 }}>
              {[
                { key: 'resolved', label: 'Résolu' },
                { key: 'duplicate', label: 'Doublon' },
                { key: 'spam', label: 'Spam' },
                { key: 'irrelevant', label: 'Non pertinent' },
                { key: 'user_request', label: 'Demande utilisateur' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: dark ? COLORS.dark3 : COLORS.greyscale300,
                    backgroundColor: selectedCloseReason === (opt.key as any) ? colors.primary + '15' : 'transparent',
                  }}
                  onPress={() => setSelectedCloseReason(opt.key as any)}
                >
                  <Text style={{ color: colors.text, fontSize: 16 }}>{opt.label}</Text>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: selectedCloseReason === (opt.key as any) ? colors.primary : (dark ? COLORS.dark3 : COLORS.greyscale300),
                      backgroundColor: selectedCloseReason === (opt.key as any) ? colors.primary : 'transparent',
                    }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20 }}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: dark ? COLORS.dark3 : COLORS.greyscale300 }]}
                onPress={() => setShowCloseReasonModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: COLORS.error }]}
                onPress={confirmCloseTicket}
              >
                <Text style={styles.submitButtonText}>Fermer le ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyscale300,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  ticketHeader: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ticketSubject: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 26,
  },
  ticketMeta: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
  },
  assignedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyscale300,
  },
  assignedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resolvedBy: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addCommentButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyscale300,
    paddingBottom: 16,
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  supportBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  supportBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noComments: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionsSection: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
    paddingHorizontal: 12,
  },
  closeButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    maxWidth: '90%',
  },
  ratingDisplay: {
    alignItems: 'flex-start',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  ratingCommentText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  // Styles des modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentModal: {
    width: '90%',
    borderRadius: 16,
    paddingBottom: 20,
  },
  ratingModal: {
    width: '90%',
    borderRadius: 16,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyscale300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInput: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 120,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  ratingLabel: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  starsSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  ratingCommentInput: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 80,
  },
  submitRatingButton: {
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitRatingButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  adminActionGroup: {
    marginBottom: 20,
  },
  adminActionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  statusActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  managementActions: {
    flexDirection: 'row',
    gap: 8,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyscale300,
  },
  userText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  adminModal: {
    width: '90%',
    borderRadius: 16,
    paddingBottom: 20,
  },
  adminInput: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  adminTextArea: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 80,
  },
  // Nouveaux styles pour les fonctionnalités ajoutées
  tagsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyscale300,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userRoleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  userRoleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  assignedDate: {
    fontSize: 12,
    marginLeft: 8,
  },
  // Styles pour les métriques
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.greyscale300 + '20',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  internalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  internalBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  commentAttachments: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: '600',
  },
  attachmentSize: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  // Styles pour les nouvelles sections
  slaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  slaGrid: {
    gap: 12,
  },
  slaItem: {
    padding: 12,
    backgroundColor: COLORS.greyscale300 + '20',
    borderRadius: 8,
  },
  slaLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  slaValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  escalationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  escalationInfo: {
    gap: 8,
  },
  escalationDate: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  escalationUser: {
    fontSize: 14,
    fontWeight: '600',
  },
  escalationReason: {
    marginTop: 8,
    padding: 12,
    backgroundColor: COLORS.warning + '10',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  escalationReasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  escalationReasonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contextGrid: {
    gap: 8,
  },
  contextItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyscale300,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  contextValue: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  statusAlert: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusAlertText: {
    fontSize: 14,
    fontWeight: '600',
  },
  moreStatusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  restrictionInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restrictionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyscale300,
    padding: 8,
    borderRadius: 6,
  },
  headerAlertText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TicketDetailScreen; 