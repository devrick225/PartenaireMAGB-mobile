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
  phone: '+2250103212054',
  email: 'info@genevievebrou.com',
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

  const handlePhoneCall = () => {
    Alert.alert(
      'Appeler le Ministère',
      `Voulez-vous appeler le ${CONTACT_INFO.phone} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Appeler', 
          onPress: () => Linking.openURL(`tel:${CONTACT_INFO.phone}`)
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

  const renderEmailForm = () => (
    <View style={[styles.emailFormContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.emailFormHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.emailFormTitle, { color: colors.text }]}>
          Envoyer un message
        </Text>
        <TouchableOpacity
          onPress={() => setShowEmailForm(false)}
          style={styles.closeButton}
        >
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.emailFormContent} showsVerticalScrollIndicator={false}>
        <InputModern
          icon="person"
          placeholder="Votre nom complet"
          value={emailForm.name}
          onInputChanged={(value) => setEmailForm(prev => ({ ...prev, name: value }))}
          editable={!isLoading}
        />

        <InputModern
          icon="email"
          placeholder="Votre adresse email"
          value={emailForm.email}
          onInputChanged={(value) => setEmailForm(prev => ({ ...prev, email: value }))}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />

        <InputModern
          icon="subject"
          placeholder="Objet du message"
          value={emailForm.subject}
          onInputChanged={(value) => setEmailForm(prev => ({ ...prev, subject: value }))}
          editable={!isLoading}
        />

        <View style={styles.messageContainer}>
          <Text style={[styles.messageLabel, { color: colors.text }]}>Message</Text>
          <View style={[styles.messageInputContainer, { borderColor: colors.border, backgroundColor: dark ? '#2A2A2A' : '#FFFFFF' }]}>
            <MaterialIcons name="message" size={20} color={colors.textSecondary} style={styles.messageIcon} />
            <TextInput
              style={[styles.messageInput, { color: colors.text }]}
              placeholder="Tapez votre message ici..."
              placeholderTextColor={colors.textSecondary}
              value={emailForm.message}
              onChangeText={(value) => setEmailForm(prev => ({ ...prev, message: value }))}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, { opacity: isLoading ? 0.7 : 1 }]}
          onPress={handleSendCustomEmail}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#26335F', '#1a2347']}
            style={styles.sendButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <MaterialIcons name="hourglass-empty" size={20} color="#FFFFFF" />
            ) : (
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.sendButtonText}>
              {isLoading ? 'Envoi...' : 'Envoyer le message'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
            'Téléphone',
            CONTACT_INFO.phone,
            handlePhoneCall,
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
  emailFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  emailFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailFormContent: {
    flex: 1,
    padding: 20,
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  messageInputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
  },
  messageIcon: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 40,
    paddingTop: 0,
  },
  sendButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ContactMinistereSimple;