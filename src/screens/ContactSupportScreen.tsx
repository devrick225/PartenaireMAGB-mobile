import logger from '../utils/logger';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {
  useDS,
  AppText,
  Screen,
  HeroHeader,
  IconButton,
  Card,
  ChoiceCard,
  TextField,
  Button,
  EmptyState,
  Sheet,
  Row,
} from '../design/components';
import { radius, spacing } from '../design/tokens';
import apiClient from '../store/services/apiClient';
import useUserPermissions from '../hooks/useUserPermissions';
import { requestMediaLibraryPermission } from '../utils/permissions';


interface SupportCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
}

interface Priority {
  id: string;
  label: string;
  description: string;
  color: string;
}

interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uri: string;
}

interface ContactSupportScreenProps {
  navigation: any;
}


const ContactSupportScreen: React.FC<ContactSupportScreenProps> = ({ navigation }) => {
  const { c } = useDS();
  const permissions = useUserPermissions();
  
  // Vérification des permissions d'accès
  useEffect(() => {
    if (!permissions.canCreateTickets) {
      Alert.alert(
        'Accès non autorisé',
        'Vous n\'avez pas les permissions nécessaires pour créer des tickets de support.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [permissions.canCreateTickets, navigation]);

  
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'medium',
  });
  
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  const categories: SupportCategory[] = [
    {
      id: 'technical',
      title: 'Problème technique',
      icon: 'bug-report',
      description: 'Bugs, plantages, problèmes de performance',
    },
    {
      id: 'account',
      title: 'Problème de compte',
      icon: 'account-circle',
      description: 'Connexion, mot de passe, paramètres',
    },
    {
      id: 'payment',
      title: 'Problème de paiement',
      icon: 'payment',
      description: 'Transactions, remboursements, facturation',
    },
    {
      id: 'donation',
      title: 'Question sur les dons',
      icon: 'favorite',
      description: 'Processus de don, récépissés, historique',
    },
    {
      id: 'feature',
      title: 'Demande de fonctionnalité',
      icon: 'lightbulb',
      description: 'Suggestions d\'amélioration',
    },
    {
      id: 'other',
      title: 'Autre',
      icon: 'help',
      description: 'Questions générales',
    },
  ];

  const priorities: Priority[] = [
    {
      id: 'low',
      label: 'Faible',
      description: 'Question générale, pas urgent',
      color: '#4CAF50',
    },
    {
      id: 'medium',
      label: 'Moyen',
      description: 'Problème gênant mais contournable',
      color: '#FF9800',
    },
    {
      id: 'high',
      label: 'Élevé',
      description: 'Problème bloquant',
      color: '#F44336',
    },
    {
      id: 'urgent',
      label: 'Urgent',
      description: 'Problème critique nécessitant une réponse immédiate',
      color: '#E91E63',
    },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) {
      newErrors.category = 'Veuillez sélectionner une catégorie';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Le sujet est requis';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Le sujet doit contenir au moins 5 caractères';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'La description doit contenir au moins 20 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Créer le ticket d'abord avec les données de base
      const ticketData = {
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
      };

      const response = await apiClient.post('/tickets', ticketData);

      if (response.data.success) {
        const createdTicket = response.data.data.ticket || {};
        // Selon la sérialisation, l'identifiant est « _id » ou « id »
        const ticketId = createdTicket._id || createdTicket.id;
        let failedUploads = 0;

        // Upload des fichiers si présents
        if (attachments.length > 0 && ticketId) {
          logger.log('📎 Upload de', attachments.length, 'fichiers...');
          
          for (const file of attachments) {
            try {
              const fileData = new FormData();
              fileData.append('attachment', {
                uri: file.uri,
                type: file.type,
                name: file.name,
              } as any);

              await apiClient.post(`/tickets/${ticketId}/attachments`, fileData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              });
            } catch (fileError: any) {
              logger.error('❌ Erreur upload fichier:', file.name, fileError?.message);
              failedUploads++; // continuer, mais prévenir l'utilisateur
            }
          }
        }

        // Quitter tout de suite le formulaire (évite un second envoi si l'alerte est fermée autrement)
        navigation.goBack();
        Alert.alert(
          'Demande envoyée !',
          `Votre ticket${createdTicket.ticketNumber ? ` n°${createdTicket.ticketNumber}` : ''} a été créé.\n\nNotre équipe vous répondra dans les plus brefs délais.` +
            (failedUploads > 0
              ? `\n\n⚠️ ${failedUploads} pièce(s) jointe(s) n'ont pas pu être envoyées. Vous pourrez les ajouter depuis le ticket.`
              : '')
        );
      }
    } catch (error: any) {
      logger.error('❌ Erreur création ticket:', error?.message);
      let errorMessage = 'Impossible de créer votre demande. Veuillez réessayer.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        // Erreurs de validation
        const validationErrors = error.response.data.details.map((detail: any) => detail.msg).join('\n');
        errorMessage = `Erreurs de validation:\n${validationErrors}`;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) return;

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'text/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const newAttachment: AttachmentFile = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size || 0,
          type: file.mimeType || 'application/octet-stream',
          uri: file.uri,
        };

        if (attachments.length >= 5) {
          Alert.alert('Limite atteinte', 'Vous ne pouvez joindre que 5 fichiers maximum.');
          return;
        }

        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('Fichier trop volumineux', 'Les fichiers ne peuvent pas dépasser 10 MB.');
          return;
        }

        setAttachments(prev => [...prev, newAttachment]);
      }
    } catch (error) {
      logger.error('Erreur sélection fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier.');
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  const selectedCategory = categories.find(cat => cat.id === formData.category);
  const selectedPriority = priorities.find(p => p.id === formData.priority);

  const hero = (
    <HeroHeader
      eyebrow="Support"
      eyebrowIcon="headset-outline"
      title="Nouvelle demande"
      subtitle="Notre équipe vous répond au plus vite."
      onBack={() => navigation.goBack()}
      right={<IconButton icon="list-outline" tone="hero" accessibilityLabel="Mes demandes" onPress={() => navigation.navigate('TicketList')} />}
    />
  );

  // Accès refusé (vérifié après les hooks pour respecter les règles de React)
  if (!permissions.canCreateTickets) {
    return (
      <Screen hero={hero}>
        <Card>
          <EmptyState icon="lock-closed-outline" title="Accès non autorisé" message="Vous n'avez pas les permissions nécessaires pour créer une demande de support." />
        </Card>
      </Screen>
    );
  }

  const SelectField = ({ label, required, value, placeholder, icon, error, onPress }: { label: string; required?: boolean; value?: string; placeholder: string; icon: any; error?: string; onPress: () => void }) => (
    <View style={{ gap: 6 }}>
      <AppText variant="smallStrong">{label}{required ? <AppText variant="smallStrong" color={c.destructive}> *</AppText> : null}</AppText>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label} : ${value ?? placeholder}`}
        style={({ pressed }) => [styles.select, { backgroundColor: c.card, borderColor: error ? c.destructive : c.input, opacity: pressed ? 0.85 : 1 }]}
      >
        <MaterialIcons name={icon} size={18} color={c.primary} />
        <AppText variant="body" color={value ? c.foreground : c.mutedForeground} style={styles.flex} numberOfLines={1}>{value ?? placeholder}</AppText>
        <Ionicons name="chevron-down" size={18} color={c.mutedForeground} />
      </Pressable>
      {error ? <AppText variant="small" color={c.destructive}>{error}</AppText> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        hero={hero}
        footer={<Button title="Envoyer la demande" icon="send" onPress={handleSubmit} loading={isLoading} />}
      >
        <Card style={styles.notice}>
          <Ionicons name="information-circle-outline" size={20} color={c.primary} />
          <AppText variant="small" color={c.mutedForeground} style={styles.flex}>
            Décrivez votre problème en détail pour que nous puissions vous aider au mieux.
          </AppText>
        </Card>

        <Card style={{ gap: spacing.lg }}>
          <SelectField
            label="Catégorie"
            required
            value={selectedCategory?.title}
            placeholder="Choisir une catégorie"
            icon={selectedCategory?.icon ?? 'category'}
            error={errors.category}
            onPress={() => setShowCategoryModal(true)}
          />
          <SelectField
            label="Priorité"
            value={selectedPriority ? `${selectedPriority.label} — ${selectedPriority.description}` : undefined}
            placeholder="Choisir une priorité"
            icon="flag"
            onPress={() => setShowPriorityModal(true)}
          />
          <TextField
            label="Sujet *"
            placeholder="Résumez votre demande en quelques mots"
            value={formData.subject}
            onChangeText={(text) => updateFormData('subject', text)}
            maxLength={100}
            error={errors.subject}
            hint={`${formData.subject.length}/100`}
          />
          <TextField
            label="Description *"
            placeholder="Décrivez votre problème en détail…"
            value={formData.description}
            onChangeText={(text) => updateFormData('description', text)}
            multiline
            textAlignVertical="top"
            maxLength={2000}
            style={{ minHeight: 140 }}
            error={errors.description}
            hint={`${formData.description.length}/2000`}
          />
        </Card>

        <Card style={{ gap: spacing.md }}>
          <View>
            <AppText variant="bodyStrong">Pièces jointes (facultatif)</AppText>
            <AppText variant="small" color={c.mutedForeground}>Captures d'écran, reçus… (5 fichiers maximum, 10 Mo chacun)</AppText>
          </View>
          {attachments.map((file) => (
            <View key={file.id} style={[styles.attachment, { backgroundColor: c.muted }]}>
              <Ionicons name="document-attach-outline" size={20} color={c.primary} />
              <View style={styles.flex}>
                <AppText variant="smallStrong" numberOfLines={1}>{file.name}</AppText>
                <AppText variant="caption" color={c.mutedForeground}>{formatFileSize(file.size)}</AppText>
              </View>
              <IconButton icon="close" accessibilityLabel={`Retirer ${file.name}`} onPress={() => removeAttachment(file.id)} />
            </View>
          ))}
          <Button title="Ajouter un fichier" variant="outline" icon="attach" onPress={pickDocument} disabled={attachments.length >= 5} />
        </Card>
      </Screen>

      <Sheet visible={showCategoryModal} title="Catégorie" onClose={() => setShowCategoryModal(false)}>
        {categories.map(cat => (
          <ChoiceCard
            key={cat.id}
            title={cat.title}
            description={cat.description}
            selected={formData.category === cat.id}
            onPress={() => { updateFormData('category', cat.id); setShowCategoryModal(false); }}
          />
        ))}
      </Sheet>

      <Sheet visible={showPriorityModal} title="Priorité" onClose={() => setShowPriorityModal(false)}>
        {priorities.map(p => (
          <ChoiceCard
            key={p.id}
            title={p.label}
            description={p.description}
            selected={formData.priority === p.id}
            onPress={() => { updateFormData('priority', p.id); setShowPriorityModal(false); }}
          />
        ))}
      </Sheet>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  select: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 50, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  attachment: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, paddingLeft: spacing.md },
});

export default ContactSupportScreen;
