import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../constants';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { useAppDispatch } from '../store/hooks';
import { showSuccess, showError } from '../store/slices/notificationSlice';

const ProfileWizardScreen = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const dispatch = useAppDispatch();
  
  const [currentSection, setCurrentSection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalTarget, setModalTarget] = useState('');
  
  // Données du formulaire complet
  const [formData, setFormData] = useState({
    // Informations personnelles
    gender: '',
    maritalStatus: '',
    occupation: '',
    employer: '',
    monthlyIncome: '',
    
    // Adresse
    address: {
      street: '',
      neighborhood: '',
      postalCode: '',
      state: ''
    },
    
    // Informations religieuses
    churchMembership: {
      churchName: 'MAGB',
      churchRole: 'member',
      ministry: ''
    },
    
    // Contact d'urgence
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    
    // Préférences de don
    donationPreferences: {
      preferredFrequency: 'monthly',
      donationCategories: []
    },
    
    // Préférences de communication
    communicationPreferences: {
      language: 'fr',
      preferredContactMethod: 'email',
      receiveNewsletters: true,
      receiveEventNotifications: true,
      receiveDonationReminders: true
    },
    
    // Bénévolat
    volunteer: {
      isAvailable: false,
      skills: [],
      interests: []
    }
  });

  // Options pour les listes déroulantes
  const genderOptions = [
    { label: 'Homme', value: 'male' },
    { label: 'Femme', value: 'female' }
  ];

  const maritalStatusOptions = [
    { label: 'Célibataire', value: 'single' },
    { label: 'Marié(e)', value: 'married' },
    { label: 'Divorcé(e)', value: 'divorced' },
    { label: 'Veuf/Veuve', value: 'widowed' }
  ];

  const churchRoleOptions = [
    { label: 'Membre', value: 'member' },
    { label: 'Diacre', value: 'deacon' },
    { label: 'Ancien', value: 'elder' },
    { label: 'Pasteur', value: 'pastor' },
    { label: 'Autre', value: 'other' }
  ];

  const relationshipOptions = [
    { label: 'Conjoint(e)', value: 'spouse' },
    { label: 'Parent', value: 'parent' },
    { label: 'Frère/Sœur', value: 'sibling' },
    { label: 'Ami(e)', value: 'friend' },
    { label: 'Autre', value: 'other' }
  ];

  const frequencyOptions = [
    { label: 'Hebdomadaire', value: 'weekly' },
    { label: 'Mensuel', value: 'monthly' },
    { label: 'Trimestriel', value: 'quarterly' },
    { label: 'Annuel', value: 'yearly' }
  ];

  const contactMethodOptions = [
    { label: 'Email', value: 'email' },
    { label: 'Téléphone', value: 'phone' },
    { label: 'SMS', value: 'sms' },
    { label: 'WhatsApp', value: 'whatsapp' }
  ];

  const skillsOptions = [
    { label: 'Musique', value: 'music' },
    { label: 'Chant', value: 'singing' },
    { label: 'Enseignement', value: 'teaching' },
    { label: 'Technique', value: 'technical' },
    { label: 'Organisation', value: 'organization' },
    { label: 'Communication', value: 'communication' }
  ];

  // Sections du formulaire
  const sections = [
    {
      title: 'Informations Personnelles',
      description: 'Vos informations de base'
    },
    {
      title: 'Adresse',
      description: 'Votre adresse complète'
    },
    {
      title: 'Informations Religieuses',
      description: 'Votre appartenance à l\'église'
    },
    {
      title: 'Contact d\'Urgence',
      description: 'Personne à contacter en cas d\'urgence'
    },
    {
      title: 'Préférences de Don',
      description: 'Vos préférences pour les dons'
    },
    {
      title: 'Communication',
      description: 'Comment vous préférez être contacté'
    },
    {
      title: 'Bénévolat',
      description: 'Vos disponibilités et compétences'
    }
  ];

  const handleInputChange = (section, field, value) => {
    setFormData(prev => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      } else {
        return {
          ...prev,
          [field]: value
        };
      }
    });
  };

  const openModal = (target, data) => {
    setModalTarget(target);
    setModalData(data);
    setShowModal(true);
  };

  const handleModalSelect = (value) => {
    const parts = modalTarget.split('.');
    if (parts.length === 2) {
      handleInputChange(parts[0], parts[1], value);
    } else {
      handleInputChange(null, parts[0], value);
    }
    setShowModal(false);
  };

  const renderPersonalInfo = () => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
        onPress={() => openModal('gender', genderOptions)}>
        <Text style={[styles.selectFieldText, { color: formData.gender ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {genderOptions.find(option => option.value === formData.gender)?.label || 'Sexe'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
        onPress={() => openModal('maritalStatus', maritalStatusOptions)}>
        <Text style={[styles.selectFieldText, { color: formData.maritalStatus ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {maritalStatusOptions.find(option => option.value === formData.maritalStatus)?.label || 'Statut matrimonial'}
        </Text>
      </TouchableOpacity>

      <Input
        placeholder="Profession"
        value={formData.occupation}
        onInputChanged={(value) => handleInputChange(null, 'occupation', value)}
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />

      <Input
        placeholder="Employeur"
        value={formData.employer}
        onInputChanged={(value) => handleInputChange(null, 'employer', value)}
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />

      <Input
        placeholder="Revenu mensuel (FCFA)"
        value={formData.monthlyIncome}
        onInputChanged={(value) => handleInputChange(null, 'monthlyIncome', value)}
        keyboardType="numeric"
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />
    </View>
  );

  const renderAddress = () => (
    <View style={styles.sectionContainer}>
      <Input
        placeholder="Rue"
        value={formData.address.street}
        onInputChanged={(value) => handleInputChange('address', 'street', value)}
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />

      <Input
        placeholder="Quartier"
        value={formData.address.neighborhood}
        onInputChanged={(value) => handleInputChange('address', 'neighborhood', value)}
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />

      <Input
        placeholder="Code postal"
        value={formData.address.postalCode}
        onInputChanged={(value) => handleInputChange('address', 'postalCode', value)}
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />

      <Input
        placeholder="Ville/État"
        value={formData.address.state}
        onInputChanged={(value) => handleInputChange('address', 'state', value)}
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />
    </View>
  );

  const renderChurchInfo = () => (
    <View style={styles.sectionContainer}>
      <Input
        placeholder="Nom de l'église"
        value={formData.churchMembership.churchName}
        onInputChanged={(value) => handleInputChange('churchMembership', 'churchName', value)}
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />

      <TouchableOpacity
        style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
        onPress={() => openModal('churchMembership.churchRole', churchRoleOptions)}>
        <Text style={[styles.selectFieldText, { color: formData.churchMembership.churchRole ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {churchRoleOptions.find(option => option.value === formData.churchMembership.churchRole)?.label || 'Rôle dans l\'église'}
        </Text>
      </TouchableOpacity>

      <Input
        placeholder="Ministère"
        value={formData.churchMembership.ministry}
        onInputChanged={(value) => handleInputChange('churchMembership', 'ministry', value)}
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />
    </View>
  );

  const renderEmergencyContact = () => (
    <View style={styles.sectionContainer}>
      <Input
        placeholder="Nom complet"
        value={formData.emergencyContact.name}
        onInputChanged={(value) => handleInputChange('emergencyContact', 'name', value)}
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />

      <TouchableOpacity
        style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
        onPress={() => openModal('emergencyContact.relationship', relationshipOptions)}>
        <Text style={[styles.selectFieldText, { color: formData.emergencyContact.relationship ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {relationshipOptions.find(option => option.value === formData.emergencyContact.relationship)?.label || 'Relation'}
        </Text>
      </TouchableOpacity>

      <Input
        placeholder="Téléphone"
        value={formData.emergencyContact.phone}
        onInputChanged={(value) => handleInputChange('emergencyContact', 'phone', value)}
        keyboardType="phone-pad"
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />

      <Input
        placeholder="Email (optionnel)"
        value={formData.emergencyContact.email}
        onInputChanged={(value) => handleInputChange('emergencyContact', 'email', value)}
        keyboardType="email-address"
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />
    </View>
  );

  const renderDonationPreferences = () => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
        onPress={() => openModal('donationPreferences.preferredFrequency', frequencyOptions)}>
        <Text style={[styles.selectFieldText, { color: formData.donationPreferences.preferredFrequency ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {frequencyOptions.find(option => option.value === formData.donationPreferences.preferredFrequency)?.label || 'Fréquence préférée'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCommunicationPreferences = () => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
        onPress={() => openModal('communicationPreferences.preferredContactMethod', contactMethodOptions)}>
        <Text style={[styles.selectFieldText, { color: formData.communicationPreferences.preferredContactMethod ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {contactMethodOptions.find(option => option.value === formData.communicationPreferences.preferredContactMethod)?.label || 'Méthode de contact préférée'}
        </Text>
      </TouchableOpacity>

      <View style={styles.toggleContainer}>
        <View style={styles.toggleContent}>
          <Text style={[styles.toggleLabel, { color: dark ? COLORS.white : COLORS.black }]}>
            Recevoir les newsletters
          </Text>
          <Text style={[styles.toggleDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Recevez les dernières nouvelles de l'église
          </Text>
        </View>
        <Switch
          value={formData.communicationPreferences.receiveNewsletters}
          onValueChange={(value) => handleInputChange('communicationPreferences', 'receiveNewsletters', value)}
          trackColor={{ false: COLORS.gray, true: COLORS.primary }}
          thumbColor={formData.communicationPreferences.receiveNewsletters ? COLORS.white : COLORS.gray}
        />
      </View>

      <View style={styles.toggleContainer}>
        <View style={styles.toggleContent}>
          <Text style={[styles.toggleLabel, { color: dark ? COLORS.white : COLORS.black }]}>
            Notifications d'événements
          </Text>
          <Text style={[styles.toggleDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Soyez informé des événements à venir
          </Text>
        </View>
        <Switch
          value={formData.communicationPreferences.receiveEventNotifications}
          onValueChange={(value) => handleInputChange('communicationPreferences', 'receiveEventNotifications', value)}
          trackColor={{ false: COLORS.gray, true: COLORS.primary }}
          thumbColor={formData.communicationPreferences.receiveEventNotifications ? COLORS.white : COLORS.gray}
        />
      </View>

      <View style={styles.toggleContainer}>
        <View style={styles.toggleContent}>
          <Text style={[styles.toggleLabel, { color: dark ? COLORS.white : COLORS.black }]}>
            Rappels de dons
          </Text>
          <Text style={[styles.toggleDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Recevez des rappels pour vos dons réguliers
          </Text>
        </View>
        <Switch
          value={formData.communicationPreferences.receiveDonationReminders}
          onValueChange={(value) => handleInputChange('communicationPreferences', 'receiveDonationReminders', value)}
          trackColor={{ false: COLORS.gray, true: COLORS.primary }}
          thumbColor={formData.communicationPreferences.receiveDonationReminders ? COLORS.white : COLORS.gray}
        />
      </View>
    </View>
  );

  const renderVolunteer = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.toggleContainer}>
        <View style={styles.toggleContent}>
          <Text style={[styles.toggleLabel, { color: dark ? COLORS.white : COLORS.black }]}>
            Disponible pour le bénévolat
          </Text>
          <Text style={[styles.toggleDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Indiquez si vous êtes disponible pour aider
          </Text>
        </View>
        <Switch
          value={formData.volunteer.isAvailable}
          onValueChange={(value) => handleInputChange('volunteer', 'isAvailable', value)}
          trackColor={{ false: COLORS.gray, true: COLORS.primary }}
          thumbColor={formData.volunteer.isAvailable ? COLORS.white : COLORS.gray}
        />
      </View>

      {formData.volunteer.isAvailable && (
        <View style={styles.skillsContainer}>
          <Text style={[styles.skillsTitle, { color: dark ? COLORS.white : COLORS.black }]}>
            Compétences disponibles
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skillsScroll}>
            {skillsOptions.map(skill => (
              <TouchableOpacity
                key={skill.value}
                style={[
                  styles.skillChip,
                  formData.volunteer.skills.includes(skill.value) && styles.skillChipSelected
                ]}
                onPress={() => {
                  const currentSkills = formData.volunteer.skills || [];
                  const newSkills = currentSkills.includes(skill.value)
                    ? currentSkills.filter(s => s !== skill.value)
                    : [...currentSkills, skill.value];
                  handleInputChange('volunteer', 'skills', newSkills);
                }}>
                <Text style={[
                  styles.skillChipText,
                  formData.volunteer.skills.includes(skill.value) && styles.skillChipTextSelected
                ]}>
                  {skill.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderSectionContent = () => {
    switch (currentSection) {
      case 0: return renderPersonalInfo();
      case 1: return renderAddress();
      case 2: return renderChurchInfo();
      case 3: return renderEmergencyContact();
      case 4: return renderDonationPreferences();
      case 5: return renderCommunicationPreferences();
      case 6: return renderVolunteer();
      default: return <View />;
    }
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      handleSaveProfile();
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      console.log('Saving complete profile:', formData);
      
      dispatch(showSuccess({
        title: 'Profil complet sauvegardé',
        message: 'Toutes vos informations ont été mises à jour avec succès'
      }));
      
      navigation.goBack();
    } catch (error) {
      dispatch(showError({
        title: 'Erreur',
        message: 'Impossible de sauvegarder le profil complet'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Assistant Profil" />
        
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentSection + 1) / sections.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: dark ? COLORS.white : COLORS.black }]}>
            {currentSection + 1} / {sections.length}
          </Text>
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: dark ? COLORS.white : COLORS.black }]}>
            {sections[currentSection].title}
          </Text>
          <Text style={[styles.sectionDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {sections[currentSection].description}
          </Text>
        </View>

        {/* Section content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderSectionContent()}
        </ScrollView>

        {/* Navigation buttons */}
        <View style={styles.navigationContainer}>
          {currentSection > 0 && (
            <Button
              title="Précédent"
              onPress={handlePrevious}
              style={[styles.navButton, styles.prevButton]}
              filled={false}
            />
          )}
          <Button
            title={currentSection === sections.length - 1 ? "Terminer" : "Suivant"}
            onPress={handleNext}
            style={[styles.navButton, styles.nextButton]}
            filled
            isLoading={isLoading}
          />
        </View>

        {/* Selection modal */}
        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: dark ? COLORS.white : COLORS.black }]}>
                Sélectionner une option
              </Text>
              <FlatList
                data={modalData}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleModalSelect(item.value)}>
                    <Text style={[styles.modalOptionText, { color: dark ? COLORS.white : COLORS.black }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <Button
                title="Annuler"
                onPress={() => setShowModal(false)}
                style={styles.modalCancelButton}
                filled={false}
              />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.gray,
    borderRadius: 2,
    marginRight: 12
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'medium',
    color: COLORS.black
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'bold',
    color: COLORS.black,
    marginBottom: 4
  },
  sectionDescription: {
    fontSize: 16,
    fontFamily: 'regular',
    color: COLORS.gray
  },
  content: {
    flex: 1,
    paddingHorizontal: 16
  },
  sectionContainer: {
    paddingVertical: 12
  },
  selectField: {
    borderWidth: 1,
    borderColor: COLORS.black2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'transparent'
  },
  selectFieldText: {
    fontSize: 16,
    fontFamily: 'regular',
    color: COLORS.gray
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black2,
    marginBottom: 12
  },
  toggleContent: {
    flex: 1,
    paddingRight: 12
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: 'medium',
    color: COLORS.black,
    marginBottom: 4
  },
  toggleDescription: {
    fontSize: 14,
    fontFamily: 'regular',
    color: COLORS.gray
  },
  skillsContainer: {
    marginTop: 16
  },
  skillsTitle: {
    fontSize: 16,
    fontFamily: 'medium',
    color: COLORS.black,
    marginBottom: 12
  },
  skillsScroll: {
    paddingVertical: 8
  },
  skillChip: {
    backgroundColor: COLORS.black2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8
  },
  skillChipSelected: {
    backgroundColor: COLORS.primary
  },
  skillChipText: {
    fontSize: 14,
    fontFamily: 'regular',
    color: COLORS.black
  },
  skillChipTextSelected: {
    color: COLORS.white
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12
  },
  navButton: {
    flex: 1,
    borderRadius: 12
  },
  prevButton: {
    borderColor: COLORS.primary,
    borderWidth: 1
  },
  nextButton: {
    // Default button styles
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: SIZES.width * 0.85,
    maxHeight: SIZES.height * 0.6,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 16
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black2
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'regular',
    color: COLORS.black
  },
  modalCancelButton: {
    marginTop: 16,
    borderRadius: 12
  }
});

export default ProfileWizardScreen; 