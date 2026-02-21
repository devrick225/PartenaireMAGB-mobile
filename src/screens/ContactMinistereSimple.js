import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Linking,
  Alert,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useAppDispatch } from '../store/hooks';
import { showSuccess, showError } from '../store/slices/notificationSlice';
import InputModern from '../components/InputModern';
import apiService from '../services/apiService';
import RefreshableHeader from '../components/RefreshableHeader';
const { width, height } = Dimensions.get('window');

// Coordonnées du Ministère de l'Agriculture et de l'Équipement Rural du Sénégal
const MINISTERE_LOCATION = {
  latitude: 14.6928,
  longitude: -17.4467,
  address: 'Abidjan, Cocodyrr',
};

// Informations de contact du ministère
const CONTACT_INFO = {
  name: 'Ministère d\'Adoration Geneviève Brou',
  address: 'Abidjan, Cocody',
  phone1: '0768306162',
  phone1Display: '07 68 30 61 62',
  phone2: '0555055454',
  phone2Display: '05 55 05 54 54',
  email: 'partenaireadorationgene.brou@gmail.com',
  website: 'https://www.genevievebrou.com/',
  horaires: {
    semaine: 'Lundi - Vendredi: 8h00 - 17h00',
    weekend: 'Samedi: 8h00 - 12h00',
    ferme: 'Dimanche: Fermé'
  }
};

const ContactMinistereSimple = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const dispatch = useAppDispatch();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePhoneCall = (phoneNumber, phoneDisplay) => {
    Alert.alert(
      'Appeler le Ministère',
      `Voulez-vous appeler le ${phoneDisplay} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Appeler', 
          onPress: () => Linking.openURL(`tel:${phoneNumber}`)
        }
      ]
    );
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Contact depuis l\'application PartenaireMAGB');
    const body = encodeURIComponent('Bonjour,\n\nJe vous contacte depuis l\'application mobile PartenaireMAGB.\n\n');
    Linking.openURL(`mailto:${CONTACT_INFO.email}?subject=${subject}&body=${body}`);
  };

  const handleWebsite = () => {
    Linking.openURL(CONTACT_INFO.website);
  };

  const handleOpenMap = () => {
    const { latitude, longitude } = MINISTERE_LOCATION;
    
    Alert.alert(
      'Ouvrir la carte',
      'Choisissez votre application de navigation préférée',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Google Maps',
          onPress: () => {
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
            Linking.openURL(googleMapsUrl);
          }
        },
        {
          text: 'Apple Plans',
          onPress: () => {
            const appleMapsUrl = `http://maps.apple.com/?q=${latitude},${longitude}`;
            Linking.openURL(appleMapsUrl);
          }
        }
      ]
    );
  };

  const handleDirections = () => {
    const { latitude, longitude } = MINISTERE_LOCATION;
    
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(Ministère d'Adoration Geneviève Brou)`
    });
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback vers Google Maps web
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        Linking.openURL(googleMapsUrl);
      }
    });
  };

  const handleSendCustomEmail = async () => {
    if (!emailForm.name || !emailForm.email || !emailForm.subject || !emailForm.message) {
      dispatch(showError({
        title: 'Champs requis',
        message: 'Veuillez remplir tous les champs'
      }));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(emailForm.email)) {
      dispatch(showError({
        title: 'Email invalide',
        message: 'Veuillez saisir une adresse email valide'
      }));
      return;
    }

    setIsLoading(true);
    
    try {
      // Appel à l'API pour envoyer le message de contact
      const contactData = {
        name: emailForm.name.trim(),
        email: emailForm.email.toLowerCase().trim(),
        subject: emailForm.subject.trim(),
        message: emailForm.message.trim(),
        type: 'ministere_contact',
        recipient: 'ministere_agriculture'
      };

      console.log('📤 Envoi du message de contact:', contactData);

      // Utiliser l'endpoint de contact du ministère
      const response = await fetch(`${apiService.getConfig().baseURL}/contact/ministere`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        dispatch(showSuccess({
          title: 'Message envoyé ! 📧',
          message: 'Votre message a été transmis au Ministère de l\'Agriculture. Vous recevrez une réponse sous 48h.'
        }));
        
        setShowEmailForm(false);
        setEmailForm({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error(result.message || 'Erreur lors de l\'envoi');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      
      let errorMessage = 'Impossible d\'envoyer le message. Veuillez réessayer.';
      
      if (error.message && error.message !== 'Erreur lors de l\'envoi') {
        errorMessage = error.message;
      }
      
      dispatch(showError({
        title: 'Erreur d\'envoi',
        message: errorMessage
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const renderContactCard = (icon, title, subtitle, onPress, color = '#26335F') => (
    <TouchableOpacity
      style={[styles.contactCard, { backgroundColor: dark ? '#2A2A2A' : '#FFFFFF' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.contactIcon, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderFormField = (icon, label, placeholder, value, onChange, options = {}) => (
    <View style={styles.formField}>
      <Text style={[styles.formFieldLabel, { color: colors.text }]}>{label}</Text>
      <View style={[
        styles.formFieldInputWrapper,
        { 
          borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(38,51,95,0.18)',
          backgroundColor: dark ? '#1E1E2E' : '#F8F9FF',
        }
      ]}>
        <MaterialIcons name={icon} size={20} color="#26335F" style={styles.formFieldIcon} />
        <TextInput
          style={[styles.formFieldInput, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
          value={value}
          onChangeText={onChange}
          editable={!isLoading}
          {...options}
        />
      </View>
    </View>
  );

  const renderEmailForm = () => (
    <View style={[styles.emailFormContainer, { backgroundColor: colors.background }]}>
      {/* Header avec gradient */}
      <LinearGradient
        colors={['#26335F', '#1a2347']}
        style={styles.emailFormGradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          onPress={() => setShowEmailForm(false)}
          style={styles.emailFormBackBtn}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.emailFormHeaderText}>
          <Text style={styles.emailFormTitleMain}>Nous écrire</Text>
          <Text style={styles.emailFormSubtitle}>Votre message nous parviendra directement</Text>
        </View>
        <View style={styles.emailFormHeaderIcon}>
          <MaterialIcons name="mail-outline" size={28} color="rgba(255,255,255,0.6)" />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.emailFormContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.emailFormContentInner}
        keyboardShouldPersistTaps="handled"
      >
        {/* Carte du destinataire */}
        <View style={[styles.recipientCard, { backgroundColor: dark ? '#1E1E2E' : '#EEF1FF' }]}>
          <MaterialIcons name="send" size={18} color="#26335F" />
          <Text style={[styles.recipientText, { color: '#26335F' }]}>
            À : {CONTACT_INFO.email}
          </Text>
        </View>

        {/* Champs du formulaire */}
        <View style={[styles.formCard, { backgroundColor: dark ? '#252535' : '#FFFFFF' }]}>
          {renderFormField(
            'person',
            'Nom complet',
            'Votre nom et prénom',
            emailForm.name,
            (v) => setEmailForm(prev => ({ ...prev, name: v }))
          )}
          {renderFormField(
            'email',
            'Adresse email',
            'votre@email.com',
            emailForm.email,
            (v) => setEmailForm(prev => ({ ...prev, email: v })),
            { keyboardType: 'email-address', autoCapitalize: 'none' }
          )}
          {renderFormField(
            'title',
            'Objet',
            'Sujet de votre message',
            emailForm.subject,
            (v) => setEmailForm(prev => ({ ...prev, subject: v }))
          )}

          {/* Champ message */}
          <View style={styles.formField}>
            <Text style={[styles.formFieldLabel, { color: colors.text }]}>Message</Text>
            <View style={[
              styles.formFieldInputWrapper,
              styles.formMessageWrapper,
              { 
                borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(38,51,95,0.18)',
                backgroundColor: dark ? '#1E1E2E' : '#F8F9FF',
              }
            ]}>
              <MaterialIcons name="message" size={20} color="#26335F" style={[styles.formFieldIcon, { top: 14 }]} />
              <TextInput
                style={[styles.formFieldInput, styles.formMessageInput, { color: colors.text }]}
                placeholder="Rédigez votre message ici..."
                placeholderTextColor={dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                value={emailForm.message}
                onChangeText={(v) => setEmailForm(prev => ({ ...prev, message: v }))}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!isLoading}
              />
            </View>
            <Text style={[styles.charCounter, { color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }]}>
              {emailForm.message.length} / 1000
            </Text>
          </View>
        </View>

        {/* Bouton envoyer */}
        <TouchableOpacity
          style={[styles.sendButton, { opacity: isLoading ? 0.7 : 1 }]}
          onPress={handleSendCustomEmail}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#26335F', '#1a2347']}
            style={styles.sendButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <>
                <MaterialIcons name="hourglass-empty" size={22} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>Envoi en cours...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="send" size={22} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>Envoyer le message</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.formDisclaimer, { color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
          Nous vous répondrons dans les plus brefs délais.
        </Text>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
   {/* Header */}
   <RefreshableHeader
        title="Nos Contacts"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        showRefreshButton={false}
        showShareButton={false}
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Carte de géolocalisation statique */}
        <Animated.View 
          style={[
            styles.mapContainer,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📍 Localisation
          </Text>
          <TouchableOpacity 
            style={styles.mapWrapper}
            onPress={handleOpenMap}
            activeOpacity={0.8}
          >
            {/* Image de carte statique ou placeholder */}
            <View style={[styles.mapPlaceholder, { backgroundColor: dark ? '#2A2A2A' : '#F5F5F5' }]}>
              <MaterialIcons name="map" size={60} color="#26335F" />
              <Text style={[styles.mapPlaceholderText, { color: colors.text }]}>
              Ministère d'Adoration Geneviève Brou
              </Text>
              <View style={styles.mapOverlay}>
                <MaterialIcons name="touch-app" size={20} color="#FFFFFF" />
                <Text style={styles.mapOverlayText}>Toucher pour ouvrir</Text>
              </View>
            </View>
            
            <View style={styles.mapActions}>
              <TouchableOpacity
                style={styles.mapActionButton}
                onPress={handleDirections}
              >
                <MaterialIcons name="directions" size={20} color="#FFFFFF" />
                <Text style={styles.mapActionText}>Itinéraire</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.mapActionButton, { backgroundColor: '#4CAF50' }]}
                onPress={handleOpenMap}
              >
                <MaterialIcons name="map" size={20} color="#FFFFFF" />
                <Text style={styles.mapActionText}>Voir sur la carte</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Informations de contact */}
        <Animated.View 
          style={[
            styles.contactSection,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📞 Informations de Contact
          </Text>

          {renderContactCard(
            'phone',
            'Téléphone 1',
            CONTACT_INFO.phone1Display,
            () => handlePhoneCall(CONTACT_INFO.phone1, CONTACT_INFO.phone1Display),
            '#4CAF50'
          )}

          {renderContactCard(
            'phone',
            'Téléphone 2',
            CONTACT_INFO.phone2Display,
            () => handlePhoneCall(CONTACT_INFO.phone2, CONTACT_INFO.phone2Display),
            '#4CAF50'
          )}

          {renderContactCard(
            'email',
            'Email officiel',
            CONTACT_INFO.email,
            handleEmail,
            '#2196F3'
          )}

          {renderContactCard(
            'language',
            'Site web',
            CONTACT_INFO.website,
            handleWebsite,
            '#FF9800'
          )}

          {renderContactCard(
            'edit',
            'Nous envoyer un message',
            'Formulaire de contact personnalisé',
            () => setShowEmailForm(true),
            '#9C27B0'
          )}
        </Animated.View>

        {/* Horaires d'ouverture */}
        <Animated.View 
          style={[
            styles.hoursSection,
            { 
              opacity: fadeAnim,
              backgroundColor: dark ? '#2A2A2A' : '#FFFFFF'
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🕒 Horaires d'ouverture
          </Text>
          
          <View style={styles.hoursItem}>
            <MaterialIcons name="schedule" size={20} color="#4CAF50" />
            <Text style={[styles.hoursText, { color: colors.text }]}>
              {CONTACT_INFO.horaires.semaine}
            </Text>
          </View>
          
          <View style={styles.hoursItem}>
            <MaterialIcons name="schedule" size={20} color="#FF9800" />
            <Text style={[styles.hoursText, { color: colors.text }]}>
              {CONTACT_INFO.horaires.weekend}
            </Text>
          </View>
          
          <View style={styles.hoursItem}>
            <MaterialIcons name="schedule" size={20} color="#F44336" />
            <Text style={[styles.hoursText, { color: colors.text }]}>
              {CONTACT_INFO.horaires.ferme}
            </Text>
          </View>
        </Animated.View>

        {/* Adresse complète */}
        <Animated.View 
          style={[
            styles.addressSection,
            { 
              opacity: fadeAnim,
              backgroundColor: dark ? '#2A2A2A' : '#FFFFFF'
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🏢 Adresse
          </Text>
          <View style={styles.addressContent}>
            <MaterialIcons name="location-on" size={24} color="#26335F" />
            <View style={styles.addressText}>
              <Text style={[styles.addressTitle, { color: colors.text }]}>
                {CONTACT_INFO.name}
              </Text>
              <Text style={[styles.addressDetails, { color: colors.textSecondary }]}>
                {CONTACT_INFO.address}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Formulaire d'email modal */}
      {showEmailForm && renderEmailForm()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  mapContainer: {
    marginBottom: 30,
  },
  mapWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  mapPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(38, 51, 95, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  mapOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mapActions: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  mapActionButton: {
    flex: 1,
    backgroundColor: '#26335F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  mapActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  contactSection: {
    marginBottom: 30,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
  },
  hoursSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hoursItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  hoursText: {
    fontSize: 14,
    flex: 1,
  },
  addressSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressText: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    lineHeight: 20,
  },
  emailFormContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 10,
  },
  emailFormGradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  emailFormBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailFormHeaderText: {
    flex: 1,
  },
  emailFormTitleMain: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emailFormSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  emailFormHeaderIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailFormContent: {
    flex: 1,
  },
  emailFormContentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  recipientText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  formCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  formField: {
    marginBottom: 18,
  },
  formFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formFieldInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  formFieldIcon: {
    marginRight: 10,
  },
  formFieldInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  formMessageWrapper: {
    height: 'auto',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingTop: 14,
  },
  formMessageInput: {
    height: 'auto',
    minHeight: 110,
    paddingTop: 0,
  },
  charCounter: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  sendButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#26335F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 10,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  formDisclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ContactMinistereSimple;