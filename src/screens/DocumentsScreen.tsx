import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import documentsService, { AvailableDocuments, DownloadProgress, DownloadResult } from '../store/services/documentsService';
import RefreshableHeader from '../components/RefreshableHeader';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

interface DocumentsScreenProps {
  navigation: any;
}

interface DownloadItem {
  id: string;
  title: string;
  type: 'receipt' | 'schedule-pdf' | 'schedule-excel' | 'report';
  downloadUrl: string;
  metadata?: any;
}

const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const [documents, setDocuments] = useState<AvailableDocuments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadingItems, setDownloadingItems] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [currentDownload, setCurrentDownload] = useState<{ title: string; progress: number } | null>(null);

  // Prévisualisation
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFilePath, setPreviewFilePath] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'pdf' | 'excel' | null>(null);
  const [webViewError, setWebViewError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await documentsService.getAvailableDocuments();
      setDocuments(response.data);
    } catch (error: any) {
      console.error('Erreur chargement documents:', error);
      Alert.alert('Erreur', 'Impossible de charger les documents disponibles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDocuments();
    setIsRefreshing(false);
  };

  const handleOpenPreview = (filePath: string, type: 'pdf' | 'excel') => {
    setWebViewError(null);
    setPreviewFilePath(filePath);
    setPreviewType(type);
    setPreviewVisible(true);
  };

  const handleClosePreview = () => {
    setPreviewVisible(false);
    setPreviewFilePath(null);
    setPreviewType(null);
    setWebViewError(null);
  };

  const openWithNativeViewer = async () => {
    if (!previewFilePath) return;
    try {
      // En Expo Go, les modules natifs custom ne sont pas disponibles
      if (Constants.appOwnership === 'expo') {
        if (previewType) {
          await documentsService.shareFile(previewFilePath, previewType);
        }
        return;
      }
      const { default: FileViewer } = await import('react-native-file-viewer');
      await FileViewer.open(previewFilePath, { showOpenWithDialog: true });
    } catch (err) {
      if (previewType) {
        await documentsService.shareFile(previewFilePath, previewType);
      }
    }
  };

  const handleShare = async () => {
    if (!previewFilePath || !previewType) return;
    await documentsService.shareFile(previewFilePath, previewType);
  };

  const handleDownload = async (item: DownloadItem) => {
    if (downloadingItems.has(item.id)) {
      Alert.alert('Téléchargement en cours', 'Ce document est déjà en cours de téléchargement');
      return;
    }

    setDownloadingItems(prev => new Set([...prev, item.id]));
    setCurrentDownload({ title: item.title, progress: 0 });
    setShowProgressModal(true);

    const onProgress = (progress: DownloadProgress) => {
      const progressPercent = Math.round(progress.progress * 100);
      setDownloadProgress(prev => ({ ...prev, [item.id]: progressPercent }));
      setCurrentDownload(prev => prev ? { ...prev, progress: progressPercent } : null);
    };

    let result: DownloadResult;

    try {
      switch (item.type) {
        case 'receipt':
          result = await documentsService.downloadDonationReceipt(item.metadata.donationId, onProgress);
          break;
        case 'schedule-pdf':
          result = await documentsService.downloadSchedulePDF(item.metadata.recurringDonationId, onProgress);
          break;
        case 'schedule-excel':
          result = await documentsService.downloadScheduleExcel(item.metadata.recurringDonationId, onProgress);
          break;
        case 'report':
          result = await documentsService.downloadDonationsReport(item.metadata.filters || {}, onProgress);
          break;
        default:
          throw new Error('Type de document non supporté');
      }

      if (result.success && result.filePath) {
        if (item.type === 'receipt' || item.type === 'schedule-pdf') {
          handleOpenPreview(result.filePath, 'pdf');
        } else {
          Alert.alert(
            'Téléchargement réussi',
            `Le document "${item.title}" a été téléchargé.`,
            [
              { text: 'Fermer', style: 'cancel' },
              { text: 'Partager', onPress: () => documentsService.shareFile(result.filePath!, 'excel') },
            ]
          );
        }
      } else {
        Alert.alert('Erreur de téléchargement', result.error || 'Une erreur est survenue');
      }
    } catch (error: any) {
      console.error('Erreur téléchargement:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors du téléchargement');
    } finally {
      setDownloadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[item.id];
        return newProgress;
      });
      setShowProgressModal(false);
      setCurrentDownload(null);
    }
  };

  const renderDocumentItem = ({ item }: { item: DownloadItem }) => {
    const isDownloading = downloadingItems.has(item.id);
    const progress = downloadProgress[item.id] || 0;

    return (
      <TouchableOpacity
        style={[styles.documentItem, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
        onPress={() => handleDownload(item)}
        disabled={isDownloading}
        activeOpacity={0.7}
      >
        <View style={styles.documentIcon}>
          <MaterialIcons
            name={getDocumentIcon(item.type) as any}
            size={24}
            color={isDownloading ? colors.primary : colors.text}
          />
        </View>
        
        <View style={styles.documentInfo}>
          <Text style={[styles.documentTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.documentMeta, { color: dark ? COLORS.grayTie : COLORS.gray }]}> 
            {formatDocumentType(item.type)} • {getDocumentSize(item.type)}
          </Text>
          {item.metadata?.amount && (
            <Text style={[styles.documentAmount, { color: colors.primary }]}> 
              {formatCurrency(item.metadata.amount, item.metadata.currency)}
            </Text>
          )}
        </View>

        <View style={styles.downloadAction}>
          {isDownloading ? (
            <View style={styles.downloadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.progressText, { color: colors.primary }]}> 
                {progress}%
              </Text>
            </View>
          ) : (
            <MaterialIcons name="download" size={24} color={colors.primary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, items: DownloadItem[], emptyText: string) => {
    if (items.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          <View style={styles.emptySection}>
            <MaterialIcons name="info" size={24} color={dark ? COLORS.grayTie : COLORS.gray} />
            <Text style={[styles.emptyText, { color: dark ? COLORS.grayTie : COLORS.gray }]}> 
              {emptyText}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        <FlatList
          data={items}
          renderItem={renderDocumentItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const getDocumentItems = (): { receipts: DownloadItem[]; schedules: DownloadItem[]; reports: DownloadItem[] } => {
    if (!documents) return { receipts: [], schedules: [], reports: [] };

    const receipts: DownloadItem[] = documents.donationReceipts.map(receipt => ({
      id: `receipt-${receipt.id}`,
      title: `Reçu de don - ${formatCurrency(receipt.amount, receipt.currency)}`,
      type: 'receipt',
      downloadUrl: receipt.downloadUrl,
      metadata: {
        donationId: receipt.id,
        amount: receipt.amount,
        currency: receipt.currency,
        date: receipt.date,
        category: receipt.category
      }
    }));

    const schedules: DownloadItem[] = documents.schedules.flatMap(schedule => [
      {
        id: `schedule-pdf-${schedule.id}`,
        title: `Échéancier PDF - ${formatFrequency(schedule.frequency)}`,
        type: 'schedule-pdf' as const,
        downloadUrl: schedule.pdfUrl,
        metadata: {
          recurringDonationId: schedule.id,
          amount: schedule.amount,
          currency: schedule.currency,
          frequency: schedule.frequency
        }
      },
      {
        id: `schedule-excel-${schedule.id}`,
        title: `Échéancier Excel - ${formatFrequency(schedule.frequency)}`,
        type: 'schedule-excel' as const,
        downloadUrl: schedule.excelUrl,
        metadata: {
          recurringDonationId: schedule.id,
          amount: schedule.amount,
          currency: schedule.currency,
          frequency: schedule.frequency
        }
      }
    ]);

    const reports: DownloadItem[] = [{
      id: 'donations-report',
      title: 'Rapport complet de mes donations',
      type: 'report',
      downloadUrl: documents.reports.donationsReportUrl,
      metadata: {
        filters: {}
      }
    }];

    return { receipts, schedules, reports };
  };

  const { receipts, schedules, reports } = getDocumentItems();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <RefreshableHeader
          title="Mes Documents"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          showRefreshButton={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}> 
            Chargement des documents...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const previewDir = previewFilePath ? previewFilePath.substring(0, previewFilePath.lastIndexOf('/') + 1) : undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <RefreshableHeader
        title="Mes Documents"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        showRefreshButton={true}
        onRefreshPress={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {documents && (
          <View style={[styles.summaryCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}> 
            <View style={styles.summaryHeader}>
              <MaterialIcons name="description" size={24} color={colors.primary} />
              <Text style={[styles.summaryTitle, { color: colors.text }]}> 
                Documents Disponibles
              </Text>
            </View>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}> 
                  {documents.summary.donationsCount}
                </Text>
                <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}> 
                  Reçus
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}> 
                  {documents.summary.recurringDonationsCount}
                </Text>
                <Text style={[styles.statLabel, { color: dark ? COLORS.grayTie : COLORS.gray }]}> 
                  Échéanciers
                </Text>
              </View>
            </View>
          </View>
        )}

        {renderSection('Reçus de Donation', receipts, 'Aucun reçu disponible. Effectuez un don pour obtenir un reçu.')}
        {renderSection('Échéanciers de Dons Récurrents', schedules, 'Aucun échéancier disponible. Configurez un don récurrent pour obtenir un échéancier.')}
        {renderSection('Rapports', reports, 'Aucun rapport disponible.')}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Modal de progression */}
      <Modal
        visible={showProgressModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProgressModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.progressModal, { backgroundColor: colors.background }]}> 
            <Text style={[styles.progressTitle, { color: colors.text }]}> 
              Téléchargement en cours...
            </Text>
            {currentDownload && (
              <>
                <Text style={[styles.progressSubtitle, { color: dark ? COLORS.grayTie : COLORS.gray }]}> 
                  {currentDownload.title}
                </Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: dark ? COLORS.dark3 : '#E5E7EB' }]}> 
                    <View
                      style={[
                        styles.progressFill,
                        { backgroundColor: colors.primary, width: `${currentDownload.progress}%` }
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressPercent, { color: colors.primary }]}> 
                    {currentDownload.progress}%
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de prévisualisation */}
      <Modal
        visible={previewVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={handleClosePreview}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
            <TouchableOpacity onPress={handleClosePreview} style={{ padding: 8, marginRight: 8 }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>Aperçu du document</Text>
            <View style={{ flex: 1 }} />
            {previewFilePath && (
              <>
                <TouchableOpacity onPress={openWithNativeViewer} style={{ padding: 8 }}>
                  <Ionicons name="open-outline" size={22} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={{ padding: 8 }}>
                  <Ionicons name="share-outline" size={22} color={colors.text} />
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={{ flex: 1, backgroundColor: dark ? COLORS.dark2 : COLORS.white }}>
            {previewType === 'pdf' && previewFilePath ? (
              Platform.OS === 'android' ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                  <MaterialIcons name="picture-as-pdf" size={48} color={colors.primary} />
                  <Text style={{ marginTop: 12, color: colors.text, textAlign: 'center' }}>
                    Aperçu PDF limité sur Android. Utilisez "Ouvrir" pour afficher dans une application compatible.
                  </Text>
                  <TouchableOpacity onPress={openWithNativeViewer} style={{ marginTop: 16, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>Ouvrir</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <WebView
                  originWhitelist={["*"]}
                  source={{ uri: previewFilePath }}
                  allowingReadAccessToURL={previewDir}
                  allowFileAccess
                  allowFileAccessFromFileURLs
                  javaScriptEnabled
                  domStorageEnabled
                  onMessage={() => {}}
                  startInLoadingState
                  onError={(e) => setWebViewError(e.nativeEvent.description || 'Erreur de chargement du PDF')}
                  style={{ flex: 1 }}
                />
              )
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="insert-drive-file" size={48} color={colors.primary} />
                <Text style={{ marginTop: 12, color: colors.text, textAlign: 'center', paddingHorizontal: 16 }}>
                  Aperçu non disponible pour ce type de fichier. Utilisez les boutons ci-dessus.
                </Text>
              </View>
            )}

            {Platform.OS === 'ios' && webViewError && (
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: dark ? COLORS.dark3 : '#E5E7EB' }}>
                <Text style={{ color: colors.text, marginBottom: 8 }}>Impossible d'afficher le PDF dans l'aperçu.</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity onPress={openWithNativeViewer} style={{ padding: 10, backgroundColor: colors.primary, borderRadius: 8 }}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>Ouvrir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// Fonctions utilitaires
const getDocumentIcon = (type: string): string => {
  switch (type) {
    case 'receipt': return 'receipt';
    case 'schedule-pdf': return 'schedule';
    case 'schedule-excel': return 'table-chart';
    case 'report': return 'assessment';
    default: return 'description';
  }
};

const formatDocumentType = (type: string): string => {
  switch (type) {
    case 'receipt': return 'Reçu PDF';
    case 'schedule-pdf': return 'Échéancier PDF';
    case 'schedule-excel': return 'Échéancier Excel';
    case 'report': return 'Rapport Excel';
    default: return 'Document';
  }
};

const getDocumentSize = (type: string): string => {
  switch (type) {
    case 'receipt':
    case 'schedule-pdf': return '~150 KB';
    case 'schedule-excel':
    case 'report': return '~50 KB';
    default: return 'Taille inconnue';
  }
};

const formatCurrency = (amount: number, currency: string = 'XOF'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatFrequency = (frequency: string): string => {
  const frequencies: { [key: string]: string } = {
    'daily': 'Quotidien',
    'weekly': 'Hebdomadaire',
    'monthly': 'Mensuel',
    'quarterly': 'Trimestriel',
    'yearly': 'Annuel'
  };
  return frequencies[frequency] || frequency;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  summaryCard: {
    marginVertical: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
    marginBottom: 2,
  },
  documentAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  downloadAction: {
    padding: 8,
  },
  downloadingContainer: {
    alignItems: 'center',
    minWidth: 40,
  },
  progressText: {
    fontSize: 10,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressModal: {
    margin: 20,
    padding: 24,
    borderRadius: 12,
    minWidth: 280,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    backgroundColor: '#E5E7EB',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 80,
  },
});

export default DocumentsScreen;