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
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import apiClient from '../store/services/apiClient';
import useUserPermissions from '../hooks/useUserPermissions';

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
  const { colors, dark } = useTheme();
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

  // Si l'utilisateur n'a pas les permissions, on affiche un écran vide
  if (!permissions.canCreateTickets) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Contact Support</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.unauthorizedContainer}>
          <MaterialIcons name="block" size={64} color={colors.text} />
          <Text style={[styles.unauthorizedTitle, { color: colors.text }]}>
            Accès non autorisé
          </Text>
          <Text style={[styles.unauthorizedText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Vous n'avez pas les permissions nécessaires pour créer des tickets de support.
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
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
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Créer le ticket d'abord avec les données de base
      const ticketData = {
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
      };

      console.log('🎫 Création du ticket avec:', ticketData);

      const response = await apiClient.post('/tickets', ticketData);

      if (response.data.success) {
        const ticketId = response.data.data.ticket.id;
        console.log('✅ Ticket créé avec succès, ID:', ticketId);

        // Upload des fichiers si présents
        if (attachments.length > 0) {
          console.log('📎 Upload de', attachments.length, 'fichiers...');
          
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
              console.log('✅ Fichier uploadé:', file.name);
            } catch (fileError) {
              console.error('❌ Erreur upload fichier:', file.name, fileError);
              // Continuer même si un fichier échoue
            }
          }
        }

        Alert.alert(
          'Demande envoyée !',
          `Votre ticket a été créé avec succès.\nNuméro: ${response.data.data.ticket.ticketNumber}\n\nNotre équipe vous répondra dans les plus brefs délais.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Erreur création ticket:', error);
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
      console.error('Erreur sélection fichier:', error);
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

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Choisir une catégorie
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(false)}
              style={[styles.modalCloseButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale300 }]}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  {
                    backgroundColor: formData.category === item.id
                      ? colors.primary + '20'
                      : 'transparent',
                  },
                ]}
                onPress={() => {
                  updateFormData('category', item.id);
                  setShowCategoryModal(false);
                }}
              >
                <MaterialIcons name={item.icon as any} size={24} color={colors.primary} />
                <View style={styles.categoryOptionText}>
                  <Text style={[styles.categoryOptionTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.categoryOptionDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    {item.description}
                  </Text>
                </View>
                {formData.category === item.id && (
                  <MaterialIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderPriorityModal = () => (
    <Modal
      visible={showPriorityModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPriorityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Choisir la priorité
            </Text>
            <TouchableOpacity
              onPress={() => setShowPriorityModal(false)}
              style={[styles.modalCloseButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale300 }]}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={priorities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.priorityOption,
                  {
                    backgroundColor: formData.priority === item.id
                      ? item.color + '20'
                      : 'transparent',
                  },
                ]}
                onPress={() => {
                  updateFormData('priority', item.id);
                  setShowPriorityModal(false);
                }}
              >
                <View style={[styles.priorityIndicator, { backgroundColor: item.color }]} />
                <View style={styles.priorityOptionText}>
                  <Text style={[styles.priorityOptionTitle, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.priorityOptionDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    {item.description}
                  </Text>
                </View>
                {formData.priority === item.id && (
                  <MaterialIcons name="check" size={20} color={item.color} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const selectedCategory = categories.find(c => c.id === formData.category);
  const selectedPriority = priorities.find(p => p.id === formData.priority);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Contact Support</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('TicketList')}
          style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
        >
          <MaterialIcons name="support-agent" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Information */}
        <View style={[styles.infoCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="support-agent" size={24} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Notre équipe est là pour vous aider
            </Text>
          </View>
          <Text style={[styles.infoText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Décrivez votre problème en détail pour que nous puissions vous apporter la meilleure assistance possible.
          </Text>
        </View>

        {/* Formulaire */}
        <View style={[styles.formCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          {/* Catégorie */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Catégorie <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(true)}
              style={[
                styles.selectInput,
                {
                  borderColor: errors.category ? '#FF5722' : (dark ? COLORS.dark3 : COLORS.greyscale300),
                  backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                },
              ]}
            >
              {selectedCategory ? (
                <View style={styles.selectedOption}>
                  <MaterialIcons name={selectedCategory.icon as any} size={20} color={colors.primary} />
                  <Text style={[styles.selectedOptionText, { color: colors.text }]}>
                    {selectedCategory.title}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.placeholderText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Sélectionnez une catégorie
                </Text>
              )}
              <MaterialIcons name="expand-more" size={24} color={dark ? COLORS.grayTie : COLORS.gray} />
            </TouchableOpacity>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* Priorité */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Priorité</Text>
            <TouchableOpacity
              onPress={() => setShowPriorityModal(true)}
              style={[
                styles.selectInput,
                {
                  borderColor: dark ? COLORS.dark3 : COLORS.greyscale300,
                  backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                },
              ]}
            >
              {selectedPriority && (
                <View style={styles.selectedOption}>
                  <View style={[styles.priorityIndicator, { backgroundColor: selectedPriority.color }]} />
                  <Text style={[styles.selectedOptionText, { color: colors.text }]}>
                    {selectedPriority.label}
                  </Text>
                </View>
              )}
              <MaterialIcons name="expand-more" size={24} color={dark ? COLORS.grayTie : COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* Sujet */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Sujet <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  borderColor: errors.subject ? '#FF5722' : (dark ? COLORS.dark3 : COLORS.greyscale300),
                  backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                  color: colors.text,
                },
              ]}
              placeholder="Résumez votre problème en quelques mots"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
              value={formData.subject}
              onChangeText={(text) => updateFormData('subject', text)}
              maxLength={100}
            />
            <View style={styles.charCount}>
              <Text style={[styles.charCountText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                {formData.subject.length}/100
              </Text>
            </View>
            {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textAreaInput,
                {
                  borderColor: errors.description ? '#FF5722' : (dark ? COLORS.dark3 : COLORS.greyscale300),
                  backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                  color: colors.text,
                },
              ]}
              placeholder="Décrivez votre problème en détail..."
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
            />
            <View style={styles.charCount}>
              <Text style={[styles.charCountText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                {formData.description.length}/2000
              </Text>
            </View>
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Pièces jointes */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Pièces jointes (optionnel)
            </Text>
            <Text style={[styles.inputHelp, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Images, captures d'écran, documents (max. 5 fichiers, 10 MB chacun)
            </Text>
            
            <TouchableOpacity
              onPress={pickDocument}
              style={[styles.attachButton, { borderColor: colors.primary }]}
            >
              <MaterialIcons name="attach-file" size={24} color={colors.primary} />
              <Text style={[styles.attachButtonText, { color: colors.primary }]}>
                Ajouter un fichier
              </Text>
            </TouchableOpacity>

            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((file) => (
                  <View key={file.id} style={[styles.attachmentItem, { backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100 }]}>
                    <MaterialIcons name="description" size={20} color={colors.primary} />
                    <View style={styles.attachmentInfo}>
                      <Text style={[styles.attachmentName, { color: colors.text }]} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={[styles.attachmentSize, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                        {formatFileSize(file.size)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeAttachment(file.id)}>
                      <MaterialIcons name="close" size={20} color="#FF5722" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bouton d'envoi */}
      <View style={[styles.submitSection, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.primary,
              opacity: isLoading ? 0.7 : 1,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="send" size={24} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Envoyer la demande</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {renderCategoryModal()}
      {renderPriorityModal()}
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
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF5722',
  },
  inputHelp: {
    fontSize: 12,
    marginBottom: 8,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  selectedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedOptionText: {
    fontSize: 16,
    marginLeft: 8,
  },
  placeholderText: {
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  charCountText: {
    fontSize: 12,
  },
  errorText: {
    color: '#FF5722',
    fontSize: 12,
    marginTop: 4,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  attachButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  attachmentsList: {
    marginTop: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  attachmentSize: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomPadding: {
    height: 100,
  },
  submitSection: {
    padding: 20,
    paddingTop: 10,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    marginVertical: 2,
  },
  categoryOptionText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  categoryOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryOptionDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    marginVertical: 2,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityOptionText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  priorityOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  priorityOptionDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unauthorizedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  unauthorizedText: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
});

export default ContactSupportScreen; 