import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import documentsService, { AvailableDocuments, DownloadProgress, DownloadResult } from '../store/services/documentsService';
import { showApiError } from '../store/services/apiClient';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

import { useDS, AppText, Screen, HeroHeader, IconButton, Card, StatCard, Section, Button, EmptyState, LoadingState } from '../design/components';
import { radius, spacing } from '../design/tokens';
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
  const { c } = useDS();
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
      showApiError(error, 'Impossible de charger les documents disponibles');
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
      if (Constants.executionEnvironment === 'storeClient') { // Expo Go : pas de module natif file-viewer
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
      showApiError(error, 'Une erreur est survenue lors du téléchargement');
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

  const DocumentRow = ({ item, last }: { item: DownloadItem; last: boolean }) => {
    const isDownloading = downloadingItems.has(item.id);
    const progress = downloadProgress[item.id] || 0;
    return (
      <Pressable
        onPress={() => handleDownload(item)}
        disabled={isDownloading}
        accessibilityRole="button"
        accessibilityLabel={`Télécharger ${item.title}`}
        style={({ pressed }) => [
          styles.docRow,
          !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
          pressed && { backgroundColor: c.muted },
        ]}
      >
        <View style={[styles.iconTile, { backgroundColor: c.primarySoft }]}>
          <MaterialIcons name={getDocumentIcon(item.type) as any} size={20} color={c.primary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong" numberOfLines={2}>{item.title}</AppText>
          <AppText variant="small" color={c.mutedForeground}>
            {formatDocumentType(item.type)} · {getDocumentSize(item.type)}
            {item.metadata?.date ? ` · ${new Date(item.metadata.date).toLocaleDateString('fr-FR')}` : ''}
          </AppText>
        </View>
        {isDownloading ? (
          <View style={styles.progress}>
            <ActivityIndicator size="small" color={c.primary} />
            <AppText variant="caption" color={c.primary}>{progress}%</AppText>
          </View>
        ) : (
          <Ionicons name="download-outline" size={22} color={c.primary} />
        )}
      </Pressable>
    );
  };

  const DocSection = ({ title, items, empty, icon }: { title: string; items: DownloadItem[]; empty: string; icon: any }) => (
    <Section title={title}>
      {items.length === 0 ? (
        <EmptyState icon={icon} title="Rien pour le moment" message={empty} />
      ) : (
        items.map((item, i) => <DocumentRow key={item.id} item={item} last={i === items.length - 1} />)
      )}
    </Section>
  );

  const { receipts, schedules, reports } = getDocumentItems();

  const hero = (
    <HeroHeader
      eyebrow="Mon compte"
      eyebrowIcon="folder-open-outline"
      title="Mes documents"
      subtitle="Reçus fiscaux, échéanciers et rapports à télécharger."
      onBack={() => navigation.goBack()}
      right={<IconButton icon={isRefreshing ? 'hourglass-outline' : 'refresh'} tone="hero" accessibilityLabel="Actualiser" onPress={handleRefresh} />}
    />
  );

  if (isLoading) {
    return (
      <Screen hero={hero}>
        <Card><LoadingState message="Chargement des documents…" /></Card>
      </Screen>
    );
  }

  const previewDir = previewFilePath ? previewFilePath.substring(0, previewFilePath.lastIndexOf('/') + 1) : undefined;

  return (
    <>
      <Screen
        hero={hero}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={c.primary} colors={[c.primary]} />}
      >
        {documents ? (
          <View style={styles.stats}>
            <StatCard tinted tone="primary" icon="receipt-outline" label="Reçus" value={documents.summary.donationsCount} />
            <StatCard tinted tone="info" icon="calendar-outline" label="Échéanciers" value={documents.summary.recurringDonationsCount} />
          </View>
        ) : null}
        <DocSection title="Reçus de dons" items={receipts} icon="receipt-outline" empty="Vos reçus apparaîtront ici après chaque don payé." />
        <DocSection title="Échéanciers" items={schedules} icon="calendar-outline" empty="Programmez un don récurrent pour obtenir son échéancier." />
        <DocSection title="Rapports" items={reports} icon="stats-chart-outline" empty="Aucun rapport disponible." />
      </Screen>

      {/* Téléchargement en cours */}
      <Modal visible={showProgressModal} transparent animationType="fade" onRequestClose={() => setShowProgressModal(false)} statusBarTranslucent>
        <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
          <Card style={styles.progressCard}>
            <AppText variant="subtitle">Téléchargement…</AppText>
            {currentDownload ? (
              <>
                <AppText variant="small" color={c.mutedForeground} numberOfLines={2}>{currentDownload.title}</AppText>
                <View style={[styles.bar, { backgroundColor: c.muted }]}>
                  <View style={[styles.barFill, { backgroundColor: c.primary, width: `${currentDownload.progress}%` }]} />
                </View>
                <AppText variant="smallStrong" color={c.primary}>{currentDownload.progress}%</AppText>
              </>
            ) : null}
          </Card>
        </View>
      </Modal>

      {/* Aperçu */}
      <Modal visible={previewVisible} transparent={false} animationType="slide" onRequestClose={handleClosePreview}>
        <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
          <View style={[styles.previewBar, { borderBottomColor: c.border }]}>
            <IconButton icon="chevron-back" accessibilityLabel="Fermer l'aperçu" onPress={handleClosePreview} />
            <AppText variant="title" style={styles.flex} numberOfLines={1}>Aperçu</AppText>
            {previewFilePath ? (
              <>
                <IconButton icon="open-outline" accessibilityLabel="Ouvrir dans une autre application" onPress={openWithNativeViewer} />
                <IconButton icon="share-outline" accessibilityLabel="Partager" onPress={handleShare} />
              </>
            ) : null}
          </View>
          <View style={[styles.flex, { backgroundColor: c.card }]}>
            {previewType === 'pdf' && previewFilePath ? (
              Platform.OS === 'android' ? (
                <View style={styles.previewEmpty}>
                  <EmptyState
                    icon="document-text-outline"
                    title="Aperçu limité sur Android"
                    message="Ouvrez le document dans une application compatible."
                    action={<Button title="Ouvrir" icon="open-outline" onPress={openWithNativeViewer} />}
                  />
                </View>
              ) : (
                <WebView
                  originWhitelist={['*']}
                  source={{ uri: previewFilePath }}
                  allowingReadAccessToURL={previewDir}
                  allowFileAccess
                  allowFileAccessFromFileURLs
                  javaScriptEnabled
                  domStorageEnabled
                  onMessage={() => {}}
                  startInLoadingState
                  onError={(e) => setWebViewError(e.nativeEvent.description || 'Erreur de chargement du PDF')}
                  style={styles.flex}
                />
              )
            ) : (
              <View style={styles.previewEmpty}>
                <EmptyState icon="document-outline" title="Aperçu indisponible" message="Utilisez « Ouvrir » ou « Partager » en haut de l'écran." />
              </View>
            )}
            {Platform.OS === 'ios' && webViewError ? (
              <View style={[styles.previewError, { backgroundColor: c.muted }]}>
                <AppText variant="small" style={styles.flex}>Impossible d'afficher le PDF dans l'aperçu.</AppText>
                <Button title="Ouvrir" fullWidth={false} onPress={openWithNativeViewer} />
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>
    </>
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
  flex: { flex: 1 },
  stats: { flexDirection: 'row', gap: spacing.sm },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 64 },
  iconTile: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  progress: { alignItems: 'center', gap: 2 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  progressCard: { alignSelf: 'stretch', gap: spacing.sm },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  previewBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  previewEmpty: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  previewError: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
});

export default DocumentsScreen;
