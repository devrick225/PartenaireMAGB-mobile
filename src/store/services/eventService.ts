import apiClient from './apiClient';

interface CreateEventData {
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  adresse?: string;
  latitude?: number;
  longitude?: number;
  prix?: number;
  capaciteMax?: number;
  type: 'conference' | 'formation' | 'reunion' | 'celebration' | 'autre';
  isPublic?: boolean;
  requiresApproval?: boolean;
  tags?: string[];
}

interface GetEventsParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  lieu?: string;
  organisateurId?: string;
}

class EventService {
  async getEvents(params: GetEventsParams = {}) {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const url = `/events${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get(url);
  }

  async getEventById(eventId: string) {
    return apiClient.get(`/events/${eventId}`);
  }

  async createEvent(eventData: CreateEventData) {
    return apiClient.post('/events', eventData);
  }

  async updateEvent(eventId: string, eventData: Partial<CreateEventData>) {
    return apiClient.put(`/events/${eventId}`, eventData);
  }

  async deleteEvent(eventId: string) {
    return apiClient.delete(`/events/${eventId}`);
  }

  async inscribeToEvent(eventId: string) {
    return apiClient.post(`/events/${eventId}/inscribe`);
  }

  async cancelInscription(inscriptionId: string) {
    return apiClient.delete(`/events/inscriptions/${inscriptionId}`);
  }

  async getMyEvents() {
    return apiClient.get('/events/my-events');
  }

  async getMyInscriptions() {
    return apiClient.get('/events/my-inscriptions');
  }

  async getEventInscriptions(eventId: string) {
    return apiClient.get(`/events/${eventId}/inscriptions`);
  }

  async approveInscription(inscriptionId: string) {
    return apiClient.patch(`/events/inscriptions/${inscriptionId}/approve`);
  }

  async rejectInscription(inscriptionId: string) {
    return apiClient.patch(`/events/inscriptions/${inscriptionId}/reject`);
  }

  async publishEvent(eventId: string) {
    return apiClient.patch(`/events/${eventId}/publish`);
  }

  async cancelEvent(eventId: string, reason?: string) {
    return apiClient.patch(`/events/${eventId}/cancel`, { reason });
  }

  async completeEvent(eventId: string) {
    return apiClient.patch(`/events/${eventId}/complete`);
  }

  async uploadEventImage(eventId: string, formData: FormData) {
    return apiClient.post(`/events/${eventId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getEventStats(eventId: string) {
    return apiClient.get(`/events/${eventId}/stats`);
  }

  async exportEventInscriptions(eventId: string) {
    return apiClient.get(`/events/${eventId}/export-inscriptions`, {
      responseType: 'blob',
    });
  }

  async getEventsByLocation(latitude: number, longitude: number, radius: number = 10) {
    return apiClient.get(`/events/nearby`, {
      params: { latitude, longitude, radius },
    });
  }

  async getPopularEvents(limit: number = 10) {
    return apiClient.get(`/events/popular`, {
      params: { limit },
    });
  }

  async getUpcomingEvents(limit: number = 10) {
    return apiClient.get(`/events/upcoming`, {
      params: { limit },
    });
  }

  async searchEvents(query: string, filters: Partial<GetEventsParams> = {}) {
    const params = { search: query, ...filters };
    return this.getEvents(params);
  }

  async getEventTypes() {
    return apiClient.get('/events/types');
  }

  async sendEventNotification(eventId: string, title: string, message: string) {
    return apiClient.post(`/events/${eventId}/notification`, {
      title,
      message,
    });
  }

  async getEventFeedback(eventId: string) {
    return apiClient.get(`/events/${eventId}/feedback`);
  }

  async submitEventFeedback(eventId: string, rating: number, comment?: string) {
    return apiClient.post(`/events/${eventId}/feedback`, {
      rating,
      comment,
    });
  }

  async duplicateEvent(eventId: string, modifications?: Partial<CreateEventData>) {
    return apiClient.post(`/events/${eventId}/duplicate`, modifications);
  }

  async getEventCalendar(year: number, month: number) {
    return apiClient.get(`/events/calendar`, {
      params: { year, month },
    });
  }
}

const eventService = new EventService();
export default eventService; 