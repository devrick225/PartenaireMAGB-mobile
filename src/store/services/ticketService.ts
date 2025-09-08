import apiClient from './apiClient';

// Types TypeScript pour les tickets - correspondance exacte avec le modèle backend
export interface TicketUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export interface TicketAttachment {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy?: TicketUser;
}

export interface TicketComment {
  _id?: string;
  content: string;
  author: TicketUser;
  isInternal: boolean;
  createdAt: string;
  attachments: Array<{
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  }>;
}

export interface TicketReminder {
  type: 'follow_up' | 'deadline' | 'escalation';
  scheduledFor: string;
  message: string;
  sent: boolean;
  sentAt?: string;
}

export interface TicketSLA {
  responseDeadline: string;
  resolutionDeadline: string;
  isResponseOverdue: boolean;
  isResolutionOverdue: boolean;
}

export interface TicketEscalation {
  isEscalated: boolean;
  escalatedAt?: string;
  escalatedBy?: TicketUser;
  escalationReason?: string;
  escalatedTo?: TicketUser;
}

export interface TicketHistory {
  action: 'created' | 'updated' | 'assigned' | 'status_changed' | 'priority_changed' | 'escalated' | 'resolved' | 'closed' | 'reopened' | 'comment_added';
  description: string;
  performedBy?: TicketUser;
  performedAt: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
}

export interface TicketContext {
  url?: string;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: string;
  errorDetails?: any;
  relatedDonation?: string;
  relatedPayment?: string;
}

export interface TicketMetrics {
  firstResponseTime?: number;
  resolutionTime?: number;
  responseCount: number;
  escalationCount: number;
}

export interface TicketRating {
  score: number;
  comment?: string;
  ratedAt: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: 'technical' | 'payment' | 'account' | 'donation' | 'bug_report' | 'feature_request' | 'general' | 'complaint' | 'suggestion';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'waiting_admin' | 'resolved' | 'closed' | 'cancelled';
  
  // Utilisateurs
  user: TicketUser;
  assignedTo?: TicketUser;
  assignedAt?: string;
  assignedBy?: TicketUser;
  resolvedBy?: TicketUser;
  closedBy?: TicketUser;
  
  // Contenu
  resolution?: string;
  comments: TicketComment[];
  attachments: TicketAttachment[];
  tags: string[];
  
  // Contexte et métadonnées
  context: TicketContext;
  rating?: TicketRating;
  metrics: TicketMetrics;
  escalation: TicketEscalation;
  sla: TicketSLA;
  history: TicketHistory[];
  reminders: TicketReminder[];
  
  // Informations de fermeture
  closeReason?: 'resolved' | 'duplicate' | 'spam' | 'irrelevant' | 'user_request';
  
  // Dates
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  
  // Virtuals (calculés côté backend)
  isOpen?: boolean;
  ageInHours?: number;
  timeSinceLastActivity?: number;
}

export interface TicketListParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  priority?: string;
  assignedTo?: string;
  user?: string;
}

export interface TicketListResponse {
  success: boolean;
  data: {
    tickets: Ticket[];
    pagination: {
      current: number;
      total: number;
      pages: number;
      limit: number;
      totalDocs: number;
    };
    filters: any;
  };
}

export interface CreateTicketData {
  subject: string;
  description: string;
  category: string;
  priority?: string;
  context?: Partial<TicketContext>;
  tags?: string[];
}

export interface AddCommentData {
  content: string;
  isInternal?: boolean;
}

export interface RateTicketData {
  score: number;
  comment?: string;
}

export interface UpdateTicketData {
  subject?: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  tags?: string[];
}

export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  waitingUserTickets: number;
  waitingAdminTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  cancelledTickets: number;
  
  // Par catégorie
  categoriesStats: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  
  // Par priorité
  prioritiesStats: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  
  // Métriques de performance
  averageFirstResponseTime?: number; // en minutes
  averageResolutionTime?: number; // en minutes
  totalEscalations: number;
  overdueTickets: number;
  
  // Tendances
  newTicketsToday: number;
  newTicketsThisWeek: number;
  newTicketsThisMonth: number;
  resolvedTicketsToday: number;
  resolvedTicketsThisWeek: number;
  resolvedTicketsThisMonth: number;
}

export interface TicketStatsResponse {
  success: boolean;
  data: TicketStats;
}

class TicketService {
  // Récupérer la liste des tickets de l'utilisateur
  async getTickets(params: TicketListParams = {}): Promise<TicketListResponse> {
    try {
      console.log('🎫 Récupération des tickets avec params:', params);
      
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);
      if (params.priority) queryParams.append('priority', params.priority);
      if (params.assignedTo) queryParams.append('assignedTo', params.assignedTo);
      if (params.user) queryParams.append('user', params.user);

      const response = await apiClient.get(`/tickets?${queryParams.toString()}`);
      
      console.log('✅ Tickets récupérés:', response.data.data.tickets.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur récupération tickets:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des tickets');
    }
  }

  // Récupérer les détails d'un ticket
  async getTicketById(ticketId: string): Promise<{ success: boolean; data: { ticket: Ticket } }> {
    try {
      console.log('🎫 Récupération détails ticket:', ticketId);
      
      const response = await apiClient.get(`/tickets/${ticketId}`);
      
      console.log('✅ Détails ticket récupérés');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur récupération détails ticket:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération du ticket');
    }
  }

  // Créer un nouveau ticket
  async createTicket(ticketData: CreateTicketData): Promise<{ success: boolean; data: { ticket: Ticket } }> {
    try {
      console.log('🎫 Création ticket:', ticketData);
      
      const response = await apiClient.post('/tickets', ticketData);
      
      console.log('✅ Ticket créé:', response.data.data.ticket.ticketNumber);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur création ticket:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la création du ticket');
    }
  }

  // Mettre à jour un ticket
  async updateTicket(ticketId: string, updateData: UpdateTicketData): Promise<{ success: boolean; data: { ticket: Ticket } }> {
    try {
      console.log('🎫 Mise à jour ticket:', ticketId, updateData);
      
      const response = await apiClient.put(`/tickets/${ticketId}`, updateData);
      
      console.log('✅ Ticket mis à jour');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur mise à jour ticket:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la mise à jour du ticket');
    }
  }

  // Ajouter un commentaire à un ticket (les commentaires sont maintenant dans le ticket)
  async addComment(ticketId: string, commentData: AddCommentData): Promise<{ success: boolean; data: { ticket: Ticket } }> {
    try {
      console.log('💬 Ajout commentaire au ticket:', ticketId, commentData);
      
      const response = await apiClient.post(`/tickets/${ticketId}/comments`, commentData);
      
      console.log('✅ Commentaire ajouté');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur ajout commentaire:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de l\'ajout du commentaire');
    }
  }

  // Récupérer les commentaires d'un ticket (maintenant inclus dans le ticket)
  async getTicketComments(ticketId: string): Promise<{ success: boolean; data: { comments: TicketComment[] } }> {
    try {
      console.log('💬 Récupération commentaires ticket:', ticketId);
      
      // Les commentaires sont maintenant dans le ticket, on récupère le ticket complet
      const ticketResponse = await this.getTicketById(ticketId);
      
      console.log('✅ Commentaires récupérés:', ticketResponse.data.ticket.comments.length);
      return {
        success: true,
        data: {
          comments: ticketResponse.data.ticket.comments
        }
      };
    } catch (error: any) {
      console.error('❌ Erreur récupération commentaires:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des commentaires');
    }
  }

  // Changer le statut d'un ticket (pour fermer par exemple)
  async changeTicketStatus(
    ticketId: string, 
    status: string, 
    reason?: string, 
    resolution?: string
  ): Promise<any> {
    try {
      console.log('🔄 Changement statut ticket:', ticketId, 'vers', status);
      
      const data: any = { status };
      if (reason) data.reason = reason;
      if (resolution) data.resolution = resolution;

      const response = await apiClient.post(`/tickets/${ticketId}/status`, data);
      
      console.log('✅ Statut ticket changé');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur changement statut:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors du changement de statut');
    }
  }

  // Fermer un ticket
  async closeTicket(ticketId: string, reason?: string, resolution?: string): Promise<any> {
    try {
      console.log('🔒 Fermeture ticket:', ticketId);
      
      const data: any = {};
      if (reason) data.reason = reason;
      if (resolution) data.resolution = resolution;

      const response = await apiClient.post(`/tickets/${ticketId}/close`, data);
      
      console.log('✅ Ticket fermé');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur fermeture ticket:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la fermeture du ticket');
    }
  }

  // Évaluer le support reçu
  async rateTicket(ticketId: string, ratingData: RateTicketData): Promise<any> {
    try {
      console.log('⭐ Évaluation ticket:', ticketId, ratingData);
      
      const response = await apiClient.post(`/tickets/${ticketId}/rating`, ratingData);
      
      console.log('✅ Évaluation enregistrée');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur évaluation:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de l\'évaluation');
    }
  }

  // Upload d'un fichier pour un ticket
  async uploadAttachment(ticketId: string, file: any): Promise<{ success: boolean; data: any }> {
    try {
      console.log('📎 Upload fichier pour ticket:', ticketId);
      
      const formData = new FormData();
      formData.append('attachment', file);

      const response = await apiClient.post(`/tickets/${ticketId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Fichier uploadé');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur upload fichier:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de l\'upload du fichier');
    }
  }

  // Actions pour les rôles administratifs (support_agent, moderator, admin)
  
  // Assigner un ticket à un agent
  async assignTicket(ticketId: string, assignedTo: string): Promise<any> {
    try {
      console.log('👤 Assignation ticket:', ticketId, 'à', assignedTo);
      
      const response = await apiClient.post(`/tickets/${ticketId}/assign`, {
        assignedTo
      });
      
      console.log('✅ Ticket assigné');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur assignation:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de l\'assignation');
    }
  }

  // Escalader un ticket
  async escalateTicket(ticketId: string, escalatedTo: string, reason: string): Promise<any> {
    try {
      console.log('⬆️ Escalade ticket:', ticketId);
      
      const response = await apiClient.post(`/tickets/${ticketId}/escalate`, {
        escalatedTo,
        reason
      });
      
      console.log('✅ Ticket escaladé');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur escalade:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de l\'escalade');
    }
  }

  // Obtenir les statistiques des tickets
  async getTicketStats(period: 'week' | 'month' | 'year' = 'month'): Promise<TicketStatsResponse> {
    try {
      console.log('📊 Récupération statistiques tickets:', period);
      
      const response = await apiClient.get(`/tickets/stats?period=${period}`);
      
      console.log('✅ Statistiques récupérées');
      
      // Transformer les données du backend en format attendu
      const backendData = response.data.data;
      
      // Le backend peut retourner une structure d'agrégation complexe
      // On va normaliser les données pour l'interface
      const processedStats = this.processTicketStats(backendData);
      
      return {
        success: true,
        data: processedStats
      };
    } catch (error: any) {
      console.error('❌ Erreur récupération statistiques:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des statistiques');
    }
  }

  // Méthode privée pour traiter les statistiques du backend
  private processTicketStats(backendData: any): TicketStats {
    // Nouveau: gérer la forme { stats: { ... }, categoryStats: [...], priorityStats: [...], overdueTickets }
    if (backendData && backendData.stats) {
      const s = backendData.stats;
      const categoriesStats = Array.isArray(backendData.categoryStats)
        ? backendData.categoryStats.map((c: any) => ({
            category: c._id || c.category || 'unknown',
            count: c.count || 0,
            percentage: 0,
          }))
        : [];
      const prioritiesStats = Array.isArray(backendData.priorityStats)
        ? backendData.priorityStats.map((p: any) => ({
            priority: p._id || p.priority || 'unknown',
            count: p.count || 0,
            percentage: 0,
          }))
        : [];

      const totalTickets = s.totalTickets || 0;

      // Calcul des pourcentages
      for (const c of categoriesStats) {
        c.percentage = totalTickets > 0 ? Math.round((c.count / totalTickets) * 100) : 0;
      }
      for (const p of prioritiesStats) {
        p.percentage = totalTickets > 0 ? Math.round((p.count / totalTickets) * 100) : 0;
      }

      return {
        totalTickets,
        openTickets: s.openTickets || 0,
        inProgressTickets: 0, // Non fourni directement → on reconstitue approximativement si besoin
        waitingUserTickets: 0,
        waitingAdminTickets: 0,
        resolvedTickets: s.resolvedTickets || 0,
        closedTickets: s.closedTickets || 0,
        cancelledTickets: 0,
        categoriesStats,
        prioritiesStats,
        averageFirstResponseTime: s.averageFirstResponseTime !== undefined ? Math.round(s.averageFirstResponseTime) : undefined,
        averageResolutionTime: s.averageResolutionTime !== undefined ? Math.round(s.averageResolutionTime) : undefined,
        totalEscalations: 0,
        overdueTickets: backendData.overdueTickets || 0,
        newTicketsToday: 0,
        newTicketsThisWeek: 0,
        newTicketsThisMonth: 0,
        resolvedTicketsToday: 0,
        resolvedTicketsThisWeek: 0,
        resolvedTicketsThisMonth: 0,
      };
    }

    // Si les données sont déjà dans le bon format (plat)
    if (backendData && backendData.totalTickets !== undefined) {
      return backendData as TicketStats;
    }

    // Si les données viennent de l'agrégation MongoDB (format complexe)
    if (Array.isArray(backendData) && backendData.length > 0) {
      const aggregatedData = backendData[0];
      
      // Traitement des statistiques agrégées
      const stats = aggregatedData.stats || [];
      
      let totalTickets = 0;
      let openTickets = 0;
      let inProgressTickets = 0;
      let waitingUserTickets = 0;
      let waitingAdminTickets = 0;
      let resolvedTickets = 0;
      let closedTickets = 0;
      let cancelledTickets = 0;
      
      const categoriesMap = new Map<string, number>();
      const prioritiesMap = new Map<string, number>();
      let totalEscalations = 0;
      let totalFirstResponseTime = 0;
      let totalResolutionTime = 0;
      let responseTimeCount = 0;
      let resolutionTimeCount = 0;
      
      // Traiter chaque entrée de statistique
      stats.forEach((stat: any) => {
        const count = stat.count || 0;
        totalTickets += count;
        
        // Compter par statut
        switch (stat.status) {
          case 'open':
            openTickets += count;
            break;
          case 'in_progress':
            inProgressTickets += count;
            break;
          case 'waiting_user':
            waitingUserTickets += count;
            break;
          case 'waiting_admin':
            waitingAdminTickets += count;
            break;
          case 'resolved':
            resolvedTickets += count;
            break;
          case 'closed':
            closedTickets += count;
            break;
          case 'cancelled':
            cancelledTickets += count;
            break;
        }
        
        // Compter par catégorie
        if (stat.category) {
          categoriesMap.set(stat.category, (categoriesMap.get(stat.category) || 0) + count);
        }
        
        // Compter par priorité
        if (stat.priority) {
          prioritiesMap.set(stat.priority, (prioritiesMap.get(stat.priority) || 0) + count);
        }
        
        // Métriques de performance
        if (stat.avgFirstResponseTime) {
          totalFirstResponseTime += stat.avgFirstResponseTime * count;
          responseTimeCount += count;
        }
        
        if (stat.avgResolutionTime) {
          totalResolutionTime += stat.avgResolutionTime * count;
          resolutionTimeCount += count;
        }
      });
      
      // Construire les statistiques par catégorie
      const categoriesStats = Array.from(categoriesMap.entries()).map(([category, count]) => ({
        category,
        count,
        percentage: totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0
      }));
      
      // Construire les statistiques par priorité
      const prioritiesStats = Array.from(prioritiesMap.entries()).map(([priority, count]) => ({
        priority,
        count,
        percentage: totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0
      }));
      
      return {
        totalTickets,
        openTickets,
        inProgressTickets,
        waitingUserTickets,
        waitingAdminTickets,
        resolvedTickets,
        closedTickets,
        cancelledTickets,
        categoriesStats,
        prioritiesStats,
        averageFirstResponseTime: responseTimeCount > 0 ? Math.round(totalFirstResponseTime / responseTimeCount) : undefined,
        averageResolutionTime: resolutionTimeCount > 0 ? Math.round(totalResolutionTime / resolutionTimeCount) : undefined,
        totalEscalations,
        overdueTickets: 0, // À calculer séparément si nécessaire
        newTicketsToday: 0,
        newTicketsThisWeek: 0,
        newTicketsThisMonth: 0,
        resolvedTicketsToday: 0,
        resolvedTicketsThisWeek: 0,
        resolvedTicketsThisMonth: 0
      };
    }
    
    // Format de fallback si la structure est inconnue
    return {
      totalTickets: backendData?.totalTickets || 0,
      openTickets: 0,
      inProgressTickets: 0,
      waitingUserTickets: 0,
      waitingAdminTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0,
      cancelledTickets: 0,
      categoriesStats: [],
      prioritiesStats: [],
      totalEscalations: 0,
      overdueTickets: 0,
      newTicketsToday: 0,
      newTicketsThisWeek: 0,
      newTicketsThisMonth: 0,
      resolvedTicketsToday: 0,
      resolvedTicketsThisWeek: 0,
      resolvedTicketsThisMonth: 0
    };
  }

  // Méthodes utilitaires
  formatTicketStatus(status: string): string {
    const statusLabels: Record<string, string> = {
      'open': 'Ouvert',
      'in_progress': 'En cours',
      'waiting_user': 'En attente utilisateur',
      'waiting_admin': 'En attente admin',
      'resolved': 'Résolu',
      'closed': 'Fermé',
      'cancelled': 'Annulé'
    };
    return statusLabels[status] || status;
  }

  formatTicketPriority(priority: string): string {
    const priorityLabels: Record<string, string> = {
      'low': 'Faible',
      'medium': 'Moyen',
      'high': 'Élevé',
      'urgent': 'Urgent'
    };
    return priorityLabels[priority] || priority;
  }

  formatTicketCategory(category: string): string {
    const categoryLabels: Record<string, string> = {
      'technical': 'Problème technique',
      'payment': 'Problème de paiement',
      'account': 'Problème de compte',
      'donation': 'Question sur les dons',
      'bug_report': 'Rapport de bug',
      'feature_request': 'Demande de fonctionnalité',
      'general': 'Question générale',
      'complaint': 'Réclamation',
      'suggestion': 'Suggestion'
    };
    return categoryLabels[category] || category;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'open': '#2196F3',
      'in_progress': '#FF9800',
      'waiting_user': '#9C27B0',
      'waiting_admin': '#607D8B',
      'resolved': '#4CAF50',
      'closed': '#757575',
      'cancelled': '#F44336'
    };
    return colors[status] || '#757575';
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'low': '#4CAF50',
      'medium': '#FF9800',
      'high': '#F44336',
      'urgent': '#E91E63'
    };
    return colors[priority] || '#757575';
  }

  // Nouvelles méthodes utilitaires
  formatDuration(milliseconds?: number): string {
    if (!milliseconds) return 'N/A';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}j ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'open': 'radio-button-unchecked',
      'in_progress': 'play-arrow',
      'waiting_user': 'schedule',
      'waiting_admin': 'admin-panel-settings',
      'resolved': 'check-circle',
      'closed': 'lock',
      'cancelled': 'cancel'
    };
    return icons[status] || 'help';
  }

  getPriorityIcon(priority: string): string {
    const icons: Record<string, string> = {
      'low': 'keyboard-arrow-down',
      'medium': 'remove',
      'high': 'keyboard-arrow-up',
      'urgent': 'priority-high'
    };
    return icons[priority] || 'remove';
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'technical': 'settings',
      'payment': 'payment',
      'account': 'account-circle',
      'donation': 'volunteer-activism',
      'bug_report': 'bug-report',
      'feature_request': 'lightbulb',
      'general': 'help',
      'complaint': 'report-problem',
      'suggestion': 'tips-and-updates'
    };
    return icons[category] || 'help';
  }

  isTicketEditable(ticket: Ticket): boolean {
    return !['closed', 'cancelled'].includes(ticket.status);
  }

  canUserComment(ticket: Ticket, currentUserId?: string, userRole?: string): boolean {
    // Tickets fermés/annulés : aucun commentaire
    if (!this.isTicketEditable(ticket)) {
      return false;
    }
    
    // Tickets résolus : seuls les admins peuvent commenter (pour réouverture)
    if (ticket.status === 'resolved') {
      return ['admin', 'moderator', 'support_agent'].includes(userRole || '');
    }
    
    // Tickets ouverts : propriétaire, assigné, ou admin
    const isOwner = ticket.user._id === currentUserId;
    const isAssigned = ticket.assignedTo?._id === currentUserId;
    const isAdmin = ['admin', 'moderator', 'support_agent'].includes(userRole || '');
    
    return isOwner || isAssigned || isAdmin;
  }

  canUserClose(ticket: Ticket, currentUserId?: string, userRole?: string): boolean {
    // Aligné avec le backend: seuls propriétaire OU admin/moderator peuvent fermer
    if (['closed', 'cancelled'].includes(ticket.status)) {
      return false;
    }

    const isOwner = ticket.user._id === currentUserId;
    const isAdmin = ['admin', 'moderator', 'support_agent'].includes(userRole || '');

    return isOwner || isAdmin;
  }

  canUserRate(ticket: Ticket, currentUserId?: string): boolean {
    // Peut évaluer seulement si :
    // 1. Ticket résolu
    // 2. Pas encore évalué
    // 3. Est le propriétaire du ticket
    return ticket.status === 'resolved' && 
           !ticket.rating && 
           ticket.user._id === currentUserId;
  }

  canUserReopen(ticket: Ticket, currentUserId?: string, userRole?: string): boolean {
    // Peut rouvrir si :
    // 1. Ticket fermé (pas annulé)
    // 2. Est le propriétaire OU admin
    if (ticket.status !== 'closed') {
      return false;
    }
    
    const isOwner = ticket.user._id === currentUserId;
    const isAdmin = ['admin', 'moderator', 'support_agent'].includes(userRole || '');
    
    return isOwner || isAdmin;
  }

  // Permissions administratives
  canUserAssign(ticket: Ticket, userRole?: string): boolean {
    // Seuls les admins peuvent assigner
    // Et seulement sur tickets non fermés/annulés
    return this.isTicketEditable(ticket) && 
           ['admin', 'moderator', 'support_agent'].includes(userRole || '');
  }

  canUserEscalate(ticket: Ticket, currentUserId?: string, userRole?: string): boolean {
    // Peut escalader si :
    // 1. Ticket ouvert/en cours
    // 2. Pas déjà escaladé au niveau max
    // 3. Est assigné OU admin
    if (!this.isTicketEditable(ticket) || ticket.status === 'resolved') {
      return false;
    }
    
    const isAssigned = ticket.assignedTo?._id === currentUserId;
    const isAdmin = ['admin', 'moderator', 'support_agent'].includes(userRole || '');
    
    return isAssigned || isAdmin;
  }

  canUserChangeStatus(ticket: Ticket, newStatus: string, userRole?: string): boolean {
    // Seuls les admins peuvent changer le statut
    if (!['admin', 'moderator', 'support_agent'].includes(userRole || '')) {
      return false;
    }
    
    // Transitions de statut autorisées
    const allowedTransitions: Record<string, string[]> = {
      'open': ['in_progress', 'waiting_admin', 'resolved', 'closed', 'cancelled'],
      'in_progress': ['waiting_user', 'waiting_admin', 'resolved', 'closed', 'cancelled'],
      'waiting_user': ['in_progress', 'waiting_admin', 'resolved', 'closed', 'cancelled'],
      'waiting_admin': ['in_progress', 'resolved', 'closed', 'cancelled'],
      // Important: un ticket résolu ne peut pas être rouvert (pas de retour vers in_progress)
      'resolved': ['closed'],
      // Un ticket fermé peut éventuellement être rouvert (si politique le permet)
      'closed': ['in_progress'],
      'cancelled': []
    };
    
    return allowedTransitions[ticket.status]?.includes(newStatus) || false;
  }

  canUserViewTicket(ticket: Ticket, currentUserId?: string, userRole?: string): boolean {
    // Admin peut tout voir
    if (['admin', 'moderator', 'support_agent'].includes(userRole || '')) {
      return true;
    }
    
    // Propriétaire peut voir son ticket
    if (ticket.user._id === currentUserId) {
      return true;
    }
    
    // Assigné peut voir le ticket assigné
    if (ticket.assignedTo?._id === currentUserId) {
      return true;
    }
    
    return false;
  }

  getTicketStatusRules(ticket: Ticket): {
    isEditable: boolean;
    isClosed: boolean;
    isResolved: boolean;
    isEscalated: boolean;
    isOverdue: boolean;
    canBeReopened: boolean;
  } {
    const overdueStatus = this.isTicketOverdue(ticket);
    
    return {
      isEditable: this.isTicketEditable(ticket),
      isClosed: ['closed', 'cancelled'].includes(ticket.status),
      isResolved: ticket.status === 'resolved',
      isEscalated: this.isTicketEscalated(ticket),
      isOverdue: overdueStatus.response || overdueStatus.resolution,
      canBeReopened: ticket.status === 'closed'
    };
  }

  getAvailableActions(ticket: Ticket, currentUserId?: string, userRole?: string): {
    canComment: boolean;
    canClose: boolean;
    canRate: boolean;
    canReopen: boolean;
    canAssign: boolean;
    canEscalate: boolean;
    canChangeStatus: boolean;
    availableStatusTransitions: Array<{ status: string; label: string }>;
  } {
    const statusTransitions = [
      { status: 'open', label: 'Ouvrir' },
      { status: 'in_progress', label: 'En cours' },
      { status: 'waiting_user', label: 'Attendre utilisateur' },
      { status: 'waiting_admin', label: 'Attendre admin' },
      { status: 'resolved', label: 'Résoudre' },
      { status: 'closed', label: 'Fermer' },
      { status: 'cancelled', label: 'Annuler' }
    ];

    const availableTransitions = statusTransitions.filter(transition => 
      this.canUserChangeStatus(ticket, transition.status, userRole) &&
      transition.status !== ticket.status
    );

    return {
      canComment: this.canUserComment(ticket, currentUserId, userRole),
      canClose: this.canUserClose(ticket, currentUserId, userRole),
      canRate: this.canUserRate(ticket, currentUserId),
      canReopen: this.canUserReopen(ticket, currentUserId, userRole),
      canAssign: this.canUserAssign(ticket, userRole),
      canEscalate: this.canUserEscalate(ticket, currentUserId, userRole),
      canChangeStatus: ['admin', 'moderator', 'support_agent'].includes(userRole || ''),
      availableStatusTransitions: availableTransitions
    };
  }

  // Nouvelles méthodes pour exploiter le modèle backend complet
  
  getTicketAge(ticket: Ticket): string {
    // Utiliser ageInHours du backend si disponible, sinon calculer
    if (ticket.ageInHours !== undefined) {
      return this.formatDuration(ticket.ageInHours * 60 * 60 * 1000);
    }
    
    const now = new Date();
    const created = new Date(ticket.createdAt);
    const diffMs = now.getTime() - created.getTime();
    return this.formatDuration(diffMs);
  }

  getLastActivity(ticket: Ticket): string {
    // Utiliser timeSinceLastActivity du backend si disponible, sinon calculer
    if (ticket.timeSinceLastActivity !== undefined) {
      return this.formatDuration(ticket.timeSinceLastActivity * 60 * 60 * 1000);
    }
    
    const lastUpdate = new Date(ticket.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    return this.formatDuration(diffMs);
  }
  
  isTicketOverdue(ticket: Ticket): { response: boolean; resolution: boolean } {
    return {
      response: ticket.sla?.isResponseOverdue || false,
      resolution: ticket.sla?.isResolutionOverdue || false
    };
  }

  isTicketEscalated(ticket: Ticket): boolean {
    return ticket.escalation?.isEscalated || false;
  }

  getEscalationInfo(ticket: Ticket): string | null {
    if (!this.isTicketEscalated(ticket) || !ticket.escalation.escalationReason) {
      return null;
    }
    return ticket.escalation.escalationReason;
  }

  getSLAStatus(ticket: Ticket): {
    responseDeadline?: Date;
    resolutionDeadline?: Date;
    responseOverdue: boolean;
    resolutionOverdue: boolean;
  } {
    return {
      responseDeadline: ticket.sla?.responseDeadline ? new Date(ticket.sla.responseDeadline) : undefined,
      resolutionDeadline: ticket.sla?.resolutionDeadline ? new Date(ticket.sla.resolutionDeadline) : undefined,
      responseOverdue: ticket.sla?.isResponseOverdue || false,
      resolutionOverdue: ticket.sla?.isResolutionOverdue || false
    };
  }

  getTicketMetrics(ticket: Ticket): {
    firstResponseTime?: string;
    resolutionTime?: string;
    responseCount: number;
    escalationCount: number;
  } {
    return {
      firstResponseTime: ticket.metrics.firstResponseTime ? 
        this.formatDuration(ticket.metrics.firstResponseTime * 60 * 1000) : undefined,
      resolutionTime: ticket.metrics.resolutionTime ? 
        this.formatDuration(ticket.metrics.resolutionTime * 60 * 1000) : undefined,
      responseCount: ticket.metrics.responseCount,
      escalationCount: ticket.metrics.escalationCount
    };
  }

  getCloseReasonLabel(reason?: string): string {
    const labels: Record<string, string> = {
      'resolved': 'Résolu',
      'duplicate': 'Doublon',
      'spam': 'Spam',
      'irrelevant': 'Non pertinent',
      'user_request': 'Demande utilisateur'
    };
    return labels[reason || ''] || reason || 'Non spécifié';
  }

  hasRelatedDonation(ticket: Ticket): boolean {
    return !!ticket.context?.relatedDonation;
  }

  hasRelatedPayment(ticket: Ticket): boolean {
    return !!ticket.context?.relatedPayment;
  }

  getContextInfo(ticket: Ticket): Array<{ label: string; value: string }> {
    const info: Array<{ label: string; value: string }> = [];
    
    if (ticket.context?.url) {
      info.push({ label: 'URL', value: ticket.context.url });
    }
    if (ticket.context?.userAgent) {
      info.push({ label: 'Navigateur', value: ticket.context.userAgent });
    }
    if (ticket.context?.deviceInfo) {
      info.push({ label: 'Appareil', value: ticket.context.deviceInfo });
    }
    if (ticket.context?.relatedDonation) {
      info.push({ label: 'Don lié', value: ticket.context.relatedDonation });
    }
    if (ticket.context?.relatedPayment) {
      info.push({ label: 'Paiement lié', value: ticket.context.relatedPayment });
    }
    
    return info;
  }
}

export const ticketService = new TicketService();
export default ticketService; 