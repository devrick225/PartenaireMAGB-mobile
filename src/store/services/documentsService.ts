import apiClient from './apiClient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

export interface DocumentInfo {
  id: string;
  type: 'receipt' | 'schedule-pdf' | 'schedule-excel' | 'report';
  title: string;
  description: string;
  format: 'pdf' | 'excel';
  downloadUrl: string;
  filename: string;
  size?: number;
  createdAt: string;
}

export interface AvailableDocuments {
  summary: {
    donationsCount: number;
    recurringDonationsCount: number;
    documentsAvailable: boolean;
  };
  donationReceipts: Array<{
    id: string;
    amount: number;
    currency: string;
    category: string;
    date: string;
    status: string;
    downloadUrl: string;
  }>;
  schedules: Array<{
    id: string;
    amount: number;
    currency: string;
    category: string;
    frequency: string;
    nextPayment: string;
    pdfUrl: string;
    excelUrl: string;
  }>;
  reports: {
    donationsReportUrl: string;
  };
}

export interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progress: number;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
  filename?: string;
}

class DocumentsService {
  // Obtenir la liste des documents disponibles
  async getAvailableDocuments(): Promise<{ data: AvailableDocuments }> {
    try {
      const response = await apiClient.get('/documents/available');
      return response.data;
    } catch (error: any) {
      console.error('Erreur récupération documents disponibles:', error);
      throw error;
    }
  }

  // Télécharger un reçu de donation
  async downloadDonationReceipt(
    donationId: string, 
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult> {
    try {
      const filename = `recu_donation_${donationId}_${new Date().toISOString().split('T')[0]}.pdf`;
      const downloadUrl = `/documents/donation-receipt/${donationId}`;
      return await this.downloadFile(downloadUrl, filename, 'pdf', onProgress);
    } catch (error: any) {
      console.error('Erreur téléchargement reçu:', error);
      return { success: false, error: error.message || 'Erreur lors du téléchargement du reçu' };
    }
  }

  // Télécharger un échéancier en PDF
  async downloadSchedulePDF(
    recurringDonationId: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult> {
    try {
      const filename = `echeancier_don_${recurringDonationId}_${new Date().toISOString().split('T')[0]}.pdf`;
      const downloadUrl = `/documents/schedule-pdf/${recurringDonationId}`;
      return await this.downloadFile(downloadUrl, filename, 'pdf', onProgress);
    } catch (error: any) {
      console.error("Erreur téléchargement échéancier PDF:", error);
      return { success: false, error: error.message || "Erreur lors du téléchargement de l'échéancier PDF" };
    }
  }

  // Télécharger un échéancier en Excel
  async downloadScheduleExcel(
    recurringDonationId: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult> {
    try {
      const filename = `echeancier_don_${recurringDonationId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      const downloadUrl = `/documents/schedule-excel/${recurringDonationId}`;
      return await this.downloadFile(downloadUrl, filename, 'excel', onProgress);
    } catch (error: any) {
      console.error("Erreur téléchargement échéancier Excel:", error);
      return { success: false, error: error.message || "Erreur lors du téléchargement de l'échéancier Excel" };
    }
  }

  // Télécharger un rapport de donations
  async downloadDonationsReport(
    filters: {
      startDate?: string;
      endDate?: string;
      category?: string;
      status?: string;
      period?: string;
    } = {},
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });
      const filename = `rapport_donations_${new Date().toISOString().split('T')[0]}.xlsx`;
      const downloadUrl = `/documents/donations-report?${queryParams.toString()}`;
      return await this.downloadFile(downloadUrl, filename, 'excel', onProgress);
    } catch (error: any) {
      console.error('Erreur téléchargement rapport:', error);
      return { success: false, error: error.message || 'Erreur lors du téléchargement du rapport' };
    }
  }

  // Fonction générique de téléchargement de fichiers
  private async downloadFile(
    url: string,
    filename: string,
    fileType: 'pdf' | 'excel',
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult> {
    try {
      const documentsDirectory = FileSystem.documentDirectory;
      if (!documentsDirectory) {
        return { success: false, error: "Impossible d'accéder au répertoire de documents" };
      }
      const filePath = `${documentsDirectory}${filename}`;

      // Récupérer baseURL depuis l'instance axios
      const baseURL = apiClient.getAxiosInstance().defaults.baseURL || '';
      const token = await this.getAuthToken();
      const fullUrl = `${baseURL}${url}`;

      console.log('🔄 Début du téléchargement:', { url: fullUrl, filename, filePath });

      const downloadResumable = FileSystem.createDownloadResumable(
        fullUrl,
        filePath,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            Accept: fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        },
        (progress) => {
          if (onProgress) {
            const { totalBytesWritten, totalBytesExpectedToWrite } = progress;
            const pct = totalBytesExpectedToWrite
              ? totalBytesWritten / totalBytesExpectedToWrite
              : 0;
            onProgress({ totalBytesWritten, totalBytesExpectedToWrite, progress: pct });
          }
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (result?.status !== 200) {
        return { success: false, error: 'Erreur lors du téléchargement du fichier' };
      }

      // Ne pas partager automatiquement: laisser l'UI décider (prévisualisation, partage, etc.)
      return { success: true, filePath, filename };
    } catch (error: any) {
      console.error('Erreur téléchargement:', error);
      return { success: false, error: error.message || 'Erreur lors du téléchargement' };
    }
  }

  private async getAuthToken(): Promise<string | null> {
    // Utilise l'apiClient pour récupérer le token (stocké via AsyncStorage dans apiClient)
    try {
      return await apiClient.getToken();
    } catch {
      return null;
    }
  }

  // Partager un fichier téléchargé à la demande
  async shareFile(filePath: string, fileType: 'pdf' | 'excel'): Promise<boolean> {
    try {
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) return false;
      await Sharing.shareAsync(filePath, {
        mimeType: fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Partager le document',
      });
      return true;
    } catch (error) {
      console.error('Erreur partage fichier:', error);
      return false;
    }
  }

  // Obtenir les informations d'un fichier téléchargé
  async getFileInfo(filePath: string): Promise<FileSystem.FileInfo | null> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists ? fileInfo : null;
    } catch (error) {
      console.error('Erreur récupération info fichier:', error);
      return null;
    }
  }

  // Supprimer un fichier téléchargé
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(filePath);
      return true;
    } catch (error) {
      console.error('Erreur suppression fichier:', error);
      return false;
    }
  }

  // Lister les fichiers téléchargés
  async getDownloadedFiles(): Promise<Array<{ name: string; path: string; size: number; modificationTime: number }>> {
    try {
      const documentsDirectory = FileSystem.documentDirectory;
      if (!documentsDirectory) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(documentsDirectory);
      const fileInfos = await Promise.all(
        files
          .filter(filename => filename.endsWith('.pdf') || filename.endsWith('.xlsx'))
          .map(async filename => {
            const filePath = `${documentsDirectory}${filename}`;
            const info = await FileSystem.getInfoAsync(filePath);
            return {
              name: filename,
              path: filePath,
              size: info.size || 0,
              modificationTime: info.modificationTime || 0
            };
          })
      );

      return fileInfos.sort((a, b) => b.modificationTime - a.modificationTime);
    } catch (error) {
      console.error('Erreur listage fichiers:', error);
      return [];
    }
  }

  // Formater la taille d'un fichier
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // Formater le type de fichier
  formatFileType(filename: string): string {
    if (filename.endsWith('.pdf')) return 'PDF';
    if (filename.endsWith('.xlsx')) return 'Excel';
    return 'Inconnu';
  }
}

const documentsService = new DocumentsService();
export default documentsService;