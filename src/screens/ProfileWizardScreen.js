import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../constants';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { showSuccess, showError } from '../store/slices/notificationSlice';
import { profileService } from '../store/services/profileService';

const ProfileWizardScreen = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [currentSection, setCurrentSection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalTarget, setModalTarget] = useState('');
  
  // Données du formulaire complet correspondant au modèle backend
  const [formData, setFormData] = useState({
    // Informations personnelles
    personType: 'particulier',
    dateOfBirth: null,
    gender: '',
    maritalStatus: 'single',
    occupation: '',
    employer: '',
    monthlyIncome: '',
    
    // Adresse
    address: {
      street: '',
      neighborhood: '',
      postalCode: '',
      state: '',
      country: 'CI'
    },
    
    // Informations religieuses
    churchMembership: {
      isChurchMember: true,
      churchName: 'MAGB',
      churchRole: 'member',
      membershipDate: null,
      baptismDate: null,
      ministry: ''
    },
    
    // Contact d'urgence
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    
    // Préférences de don étendues
    donationPreferences: {
      preferredAmount: '',
      preferredFrequency: 'monthly',
      preferredDay: '',
      preferredPaymentMethod: 'mobile_money',
      donationCategories: []
    },
    
    // Informations financières
    financialInfo: {
      bankName: '',
      accountNumber: '',
      mobileMoney: {
        provider: '',
        number: ''
      }
    },
    
    // Préférences de communication
    communicationPreferences: {
      language: 'fr',
      preferredContactMethod: 'email',
      receiveNewsletters: true,
      receiveEventNotifications: true,
      receiveDonationReminders: true
    },
    
    // Bénévolat complet
    volunteer: {
      isAvailable: false,
      skills: [],
      availability: {
        days: [],
        timeSlots: []
      },
      interests: []
    },
    
    // Informations familiales complètes
    familyInfo: {
      numberOfChildren: 0,
      children: [],
      spouse: {
        name: '',
        dateOfBirth: null,
        isChurchMember: false
      }
    }
  });

  // Fonction pour charger le profil existant
  const loadExistingProfile = async () => {
    try {
      setIsInitialLoading(true);
      
      if (!user?.id) {
        console.log('Pas d\'utilisateur connecté');
        setIsInitialLoading(false);
        return;
      }

      console.log('Chargement du profil pour l\'utilisateur:', user.id);
      
      const existingProfile = await profileService.getProfile();
      
      if (existingProfile) {
        console.log('Profil existant trouvé');
        
        // Mapper les données existantes vers le format du formulaire
        const mappedData = {
          // Informations personnelles
          personType: existingProfile.personType || 'particulier',
          dateOfBirth: existingProfile.dateOfBirth || null,
          gender: existingProfile.gender || '',
          maritalStatus: existingProfile.maritalStatus || 'single',
          occupation: existingProfile.occupation || '',
          employer: existingProfile.employer || '',
          monthlyIncome: existingProfile.monthlyIncome?.toString() || '',
          
          // Adresse
          address: {
            street: existingProfile.address?.street || '',
            neighborhood: existingProfile.address?.neighborhood || '',
            postalCode: existingProfile.address?.postalCode || '',
            state: existingProfile.address?.state || '',
            country: existingProfile.address?.country || 'CI'
          },
          
          // Informations religieuses
          churchMembership: {
            isChurchMember: existingProfile.churchMembership?.isChurchMember !== false,
            churchName: existingProfile.churchMembership?.churchName || 'MAGB',
            churchRole: existingProfile.churchMembership?.churchRole || 'member',
            membershipDate: existingProfile.churchMembership?.membershipDate || null,
            baptismDate: existingProfile.churchMembership?.baptismDate || null,
            ministry: existingProfile.churchMembership?.ministry || ''
          },
          
          // Contact d'urgence
          emergencyContact: {
            name: existingProfile.emergencyContact?.name || '',
            relationship: existingProfile.emergencyContact?.relationship || '',
            phone: existingProfile.emergencyContact?.phone || '',
            email: existingProfile.emergencyContact?.email || ''
          },
          
          // Préférences de don
          donationPreferences: {
            preferredAmount: existingProfile.donationPreferences?.preferredAmount?.toString() || '',
            preferredFrequency: existingProfile.donationPreferences?.preferredFrequency || 'monthly',
            preferredDay: existingProfile.donationPreferences?.preferredDay?.toString() || '',
            preferredPaymentMethod: existingProfile.donationPreferences?.preferredPaymentMethod || 'mobile_money',
            donationCategories: existingProfile.donationPreferences?.donationCategories || []
          },
          
          // Informations financières
          financialInfo: {
            bankName: existingProfile.financialInfo?.bankName || '',
            accountNumber: existingProfile.financialInfo?.accountNumber || '',
            mobileMoney: {
              provider: existingProfile.financialInfo?.mobileMoney?.provider || '',
              number: existingProfile.financialInfo?.mobileMoney?.number || ''
            }
          },
          
          // Préférences de communication
          communicationPreferences: {
            language: existingProfile.communicationPreferences?.language || user?.language || 'fr',
            preferredContactMethod: existingProfile.communicationPreferences?.preferredContactMethod || 'email',
            receiveNewsletters: existingProfile.communicationPreferences?.receiveNewsletters !== false,
            receiveEventNotifications: existingProfile.communicationPreferences?.receiveEventNotifications !== false,
            receiveDonationReminders: existingProfile.communicationPreferences?.receiveDonationReminders !== false
          },
          
          // Bénévolat
          volunteer: {
            isAvailable: existingProfile.volunteer?.isAvailable || false,
            skills: existingProfile.volunteer?.skills || [],
            availability: {
              days: existingProfile.volunteer?.availability?.days || [],
              timeSlots: existingProfile.volunteer?.availability?.timeSlots || []
            },
            interests: existingProfile.volunteer?.interests || []
          },
          
          // Informations familiales
          familyInfo: {
            numberOfChildren: existingProfile.familyInfo?.numberOfChildren || 0,
            children: existingProfile.familyInfo?.children || [],
            spouse: {
              name: existingProfile.familyInfo?.spouse?.name || '',
              dateOfBirth: existingProfile.familyInfo?.spouse?.dateOfBirth || null,
              isChurchMember: existingProfile.familyInfo?.spouse?.isChurchMember || false
            }
          }
        };
        
        console.log('Données mappées avec succès');
        setFormData(mappedData);
        
      } else {
        console.log('Aucun profil existant trouvé, utilisation des valeurs par défaut');
        
        // Remplir avec les données utilisateur de base
        setFormData(prev => ({
          ...prev,
          occupation: user?.occupation || '',
          address: {
            ...prev.address,
            state: user?.city || '',
            country: user?.country || 'CI'
          },
          communicationPreferences: {
            ...prev.communicationPreferences,
            language: user?.language || 'fr'
          }
        }));
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      dispatch(showError('Impossible de charger votre profil. Utilisation des valeurs par défaut.'));
      
      // Remplir avec les données utilisateur de base en cas d'erreur
      if (user) {
        setFormData(prev => ({
          ...prev,
          occupation: user.occupation || '',
          address: {
            ...prev.address,
            state: user.city || '',
            country: user.country || 'CI'
          },
          communicationPreferences: {
            ...prev.communicationPreferences,
            language: user.language || 'fr'
          }
        }));
      }
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Charger le profil existant au montage du composant
  useEffect(() => {
    loadExistingProfile();
  }, [user?.id]);

  // Options pour les listes déroulantes (basées sur le modèle backend)
  const fieldOptions = {
    personType: [
      { label: 'Particulier', value: 'particulier' },
      { label: 'Personne Morale (Entreprise)', value: 'personne_morale' },
    ],
    gender: [
      { label: 'Homme', value: 'male' },
      { label: 'Femme', value: 'female' },
      { label: 'Autre', value: 'other' }
    ],
    maritalStatus: [
      { label: 'Célibataire', value: 'single' },
      { label: 'Marié(e)', value: 'married' },
      { label: 'Divorcé(e)', value: 'divorced' },
      { label: 'Veuf/Veuve', value: 'widowed' }
    ],
    churchRole: [
      { label: 'Membre', value: 'member' },
      { label: 'Diacre', value: 'deacon' },
      { label: 'Ancien', value: 'elder' },
      { label: 'Pasteur', value: 'pastor' },
      { label: 'Évangéliste', value: 'evangelist' },
      { label: 'Autre', value: 'other' }
    ],
    relationship: [
      { label: 'Conjoint(e)', value: 'spouse' },
      { label: 'Parent', value: 'parent' },
      { label: 'Frère/Sœur', value: 'sibling' },
      { label: 'Ami(e)', value: 'friend' },
      { label: 'Autre', value: 'other' }
    ],
    donationFrequency: [
      { label: 'Hebdomadaire', value: 'weekly' },
      { label: 'Mensuel', value: 'monthly' },
      { label: 'Trimestriel', value: 'quarterly' },
      { label: 'Annuel', value: 'yearly' }
    ],
    paymentMethod: [
      { label: 'Carte bancaire', value: 'card' },
      { label: 'Mobile Money', value: 'mobile_money' },
      { label: 'Virement bancaire', value: 'bank_transfer' },
      { label: 'Espèces', value: 'cash' }
    ],
    donationCategories: [
      { label: 'Mensuelle', value: 'don_mensuel' },
      { label: 'Trimestrielle', value: 'don_trimestriel' },
      { label: 'Semestrielle', value: 'don_semestriel' },
      { label: 'Ponctuel', value: 'don_ponctuel' },
    ],
    contactMethod: [
      { label: 'Email', value: 'email' },
      { label: 'SMS', value: 'sms' },
      { label: 'Téléphone', value: 'phone' },
      { label: 'WhatsApp', value: 'whatsapp' }
    ],
    language: [
      { label: 'Français', value: 'fr' },
      { label: 'English', value: 'en' }
    ],
    mobileMoneyProvider: [
      { label: 'Orange Money', value: 'orange' },
      { label: 'MTN Money', value: 'mtn' },
      { label: 'Moov Money', value: 'moov' },
      { label: 'Wave', value: 'wave' }
    ],
    volunteerInterests: [
      { label: 'Enseignement', value: 'teaching' },
      { label: 'Musique', value: 'music' },
      { label: 'Technique', value: 'technical' },
      { label: 'Administration', value: 'administration' },
      { label: 'Conseil', value: 'counseling' },
      { label: 'Enfants', value: 'children' },
      { label: 'Jeunesse', value: 'youth' },
      { label: 'Personnes âgées', value: 'elderly' }
    ],
    weekDays: [
      { label: 'Lundi', value: 'monday' },
      { label: 'Mardi', value: 'tuesday' },
      { label: 'Mercredi', value: 'wednesday' },
      { label: 'Jeudi', value: 'thursday' },
      { label: 'Vendredi', value: 'friday' },
      { label: 'Samedi', value: 'saturday' },
      { label: 'Dimanche', value: 'sunday' }
    ]
  };

  // Sections du formulaire (10 sections au total maintenant)
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
      description: 'Vos préférences détaillées pour les dons'
    },
    {
      title: 'Informations Financières',
      description: 'Vos informations bancaires (optionnel)'
    },
    {
      title: 'Communication',
      description: 'Comment vous préférez être contacté'
    },
    {
      title: 'Bénévolat',
      description: 'Vos disponibilités et compétences'
    },
    {
      title: 'Famille',
      description: 'Informations sur votre famille'
    },
    {
      title: 'Récapitulatif',
      description: 'Vérifiez vos informations avant validation'
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

  const handleNestedInputChange = (section, nestedSection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedSection]: {
          ...prev[section][nestedSection],
          [field]: value
        }
      }
    }));
  };

  const handleArrayToggle = (section, field, value) => {
    setFormData(prev => {
      const currentArray = prev[section][field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      };
    });
  };

  const openModal = (target, data) => {
    setModalTarget(target);
    setModalData(data);
    setShowModal(true);
  };

  const handleModalSelect = (value) => {
    const parts = modalTarget.split('.');
    if (parts.length === 3) {
      handleNestedInputChange(parts[0], parts[1], parts[2], value);
    } else if (parts.length === 2) {
      handleInputChange(parts[0], parts[1], value);
    } else {
      handleInputChange(null, parts[0], value);
    }
    setShowModal(false);
  };

  const addChild = () => {
    const newChild = {
      name: '',
      dateOfBirth: new Date(),
      gender: 'male'
    };
    
    setFormData(prev => ({
      ...prev,
      familyInfo: {
        ...prev.familyInfo,
        children: [...prev.familyInfo.children, newChild],
        numberOfChildren: prev.familyInfo.children.length + 1
      }
    }));
  };

  const removeChild = (index) => {
    setFormData(prev => ({
      ...prev,
      familyInfo: {
        ...prev.familyInfo,
        children: prev.familyInfo.children.filter((_, i) => i !== index),
        numberOfChildren: Math.max(0, prev.familyInfo.children.length - 1)
      }
    }));
  };

  const addTimeSlot = () => {
    const newTimeSlot = { start: '09:00', end: '17:00' };
    setFormData(prev => ({
      ...prev,
      volunteer: {
        ...prev.volunteer,
        availability: {
          ...prev.volunteer.availability,
          timeSlots: [...prev.volunteer.availability.timeSlots, newTimeSlot]
        }
      }
    }));
  };

  const renderPersonalInfo = () => (
    <View style={styles.sectionContainer}>
      {/* Type de personne */}
      <TouchableOpacity
        style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
        onPress={() => openModal('personType', fieldOptions.personType)}>
        <Text style={[styles.selectFieldText, { color: formData.personType ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {fieldOptions.personType.find(option => option.value === formData.personType)?.label || 'Type de personne (Particulier / Personne Morale)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
        onPress={() => openModal('gender', fieldOptions.gender)}>
        <Text style={[styles.selectFieldText, { color: formData.gender ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {fieldOptions.gender.find(option => option.value === formData.gender)?.label || 'Sexe'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
        onPress={() => openModal('maritalStatus', fieldOptions.maritalStatus)}>
        <Text style={[styles.selectFieldText, { color: formData.maritalStatus ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {fieldOptions.maritalStatus.find(option => option.value === formData.maritalStatus)?.label || 'Statut matrimonial'}
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
        onPress={() => openModal('churchMembership.churchRole', fieldOptions.churchRole)}>
        <Text style={[styles.selectFieldText, { color: formData.churchMembership.churchRole ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {fieldOptions.churchRole.find(option => option.value === formData.churchMembership.churchRole)?.label || 'Rôle dans l\'église'}
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
        onPress={() => openModal('emergencyContact.relationship', fieldOptions.relationship)}>
        <Text style={[styles.selectFieldText, { color: formData.emergencyContact.relationship ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {fieldOptions.relationship.find(option => option.value === formData.emergencyContact.relationship)?.label || 'Relation'}
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

  const renderDonationPreferencesExtended = () => (
    <View style={styles.sectionContainer}>
      <Input
        placeholder="Montant préféré (FCFA)"
        value={formData.donationPreferences.preferredAmount}
        onInputChanged={(value) => handleInputChange('donationPreferences', 'preferredAmount', value)}
        keyboardType="numeric"
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />

      <TouchableOpacity
        style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
        onPress={() => openModal('donationPreferences.preferredFrequency', fieldOptions.donationFrequency)}>
        <Text style={[styles.selectFieldText, { color: formData.donationPreferences.preferredFrequency ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {fieldOptions.donationFrequency.find(option => option.value === formData.donationPreferences.preferredFrequency)?.label || 'Fréquence préférée'}
        </Text>
      </TouchableOpacity>

      <Input
        placeholder="Jour préféré du mois (1-31)"
        value={formData.donationPreferences.preferredDay}
        onInputChanged={(value) => handleInputChange('donationPreferences', 'preferredDay', value)}
        keyboardType="numeric"
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />

      <TouchableOpacity
        style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
        onPress={() => openModal('donationPreferences.preferredPaymentMethod', fieldOptions.paymentMethod)}>
        <Text style={[styles.selectFieldText, { color: formData.donationPreferences.preferredPaymentMethod ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {fieldOptions.paymentMethod.find(option => option.value === formData.donationPreferences.preferredPaymentMethod)?.label || 'Méthode de paiement préférée'}
        </Text>
      </TouchableOpacity>

      <View style={styles.categoryContainer}>
        <Text style={[styles.categoryTitle, { color: dark ? COLORS.white : COLORS.black }]}>
          Catégories de donation préférées
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {fieldOptions.donationCategories.map(category => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryChip,
                formData.donationPreferences.donationCategories.includes(category.value) && styles.categoryChipSelected
              ]}
              onPress={() => handleArrayToggle('donationPreferences', 'donationCategories', category.value)}>
              <Text style={[
                styles.categoryChipText,
                formData.donationPreferences.donationCategories.includes(category.value) && styles.categoryChipTextSelected
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderFinancialInfo = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionNote, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
        Ces informations sont optionnelles et sécurisées
      </Text>

      <Input
        placeholder="Nom de la banque"
        value={formData.financialInfo.bankName}
        onInputChanged={(value) => handleInputChange('financialInfo', 'bankName', value)}
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />

      <Input
        placeholder="Numéro de compte (sera chiffré)"
        value={formData.financialInfo.accountNumber}
        onInputChanged={(value) => handleInputChange('financialInfo', 'accountNumber', value)}
        secureTextEntry
        placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
      />

      <View style={styles.subsectionContainer}>
        <Text style={[styles.subsectionTitle, { color: dark ? COLORS.white : COLORS.black }]}>
          Mobile Money
        </Text>

        <TouchableOpacity
          style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
          onPress={() => openModal('financialInfo.mobileMoney.provider', fieldOptions.mobileMoneyProvider)}>
          <Text style={[styles.selectFieldText, { color: formData.financialInfo.mobileMoney.provider ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
            {fieldOptions.mobileMoneyProvider.find(option => option.value === formData.financialInfo.mobileMoney.provider)?.label || 'Fournisseur Mobile Money'}
          </Text>
        </TouchableOpacity>

        <Input
          placeholder="Numéro Mobile Money"
          value={formData.financialInfo.mobileMoney.number}
          onInputChanged={(value) => handleNestedInputChange('financialInfo', 'mobileMoney', 'number', value)}
          keyboardType="phone-pad"
          placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
        />
      </View>
    </View>
  );

  const renderCommunicationPreferences = () => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
        onPress={() => openModal('communicationPreferences.language', fieldOptions.language)}>
        <Text style={[styles.selectFieldText, { color: formData.communicationPreferences.language ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {fieldOptions.language.find(option => option.value === formData.communicationPreferences.language)?.label || 'Langue préférée'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
        onPress={() => openModal('communicationPreferences.preferredContactMethod', fieldOptions.contactMethod)}>
        <Text style={[styles.selectFieldText, { color: formData.communicationPreferences.preferredContactMethod ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
          {fieldOptions.contactMethod.find(option => option.value === formData.communicationPreferences.preferredContactMethod)?.label || 'Méthode de contact préférée'}
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

  const renderVolunteerExtended = () => (
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
            {fieldOptions.volunteerInterests.map(skill => (
              <TouchableOpacity
                key={skill.value}
                style={[
                  styles.skillChip,
                  formData.volunteer.interests.includes(skill.value) && styles.skillChipSelected
                ]}
                onPress={() => {
                  const currentSkills = formData.volunteer.interests || [];
                  const newSkills = currentSkills.includes(skill.value)
                    ? currentSkills.filter(s => s !== skill.value)
                    : [...currentSkills, skill.value];
                  handleInputChange('volunteer', 'interests', newSkills);
                }}>
                <Text style={[
                  styles.skillChipText,
                  formData.volunteer.interests.includes(skill.value) && styles.skillChipTextSelected
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

  const renderFamilyInfoComplete = () => (
    <View style={styles.sectionContainer}>
      {/* Informations conjoint */}
      <View style={styles.subsectionContainer}>
        <Text style={[styles.subsectionTitle, { color: dark ? COLORS.white : COLORS.black }]}>
          Conjoint(e)
        </Text>

        <Input
          placeholder="Nom du conjoint"
          value={formData.familyInfo.spouse.name}
          onInputChanged={(value) => handleNestedInputChange('familyInfo', 'spouse', 'name', value)}
          placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
        />

        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleLabel, { color: dark ? COLORS.white : COLORS.black }]}>
            Membre de l'église
          </Text>
          <Switch
            value={formData.familyInfo.spouse.isChurchMember}
            onValueChange={(value) => handleNestedInputChange('familyInfo', 'spouse', 'isChurchMember', value)}
            trackColor={{ false: COLORS.gray, true: COLORS.primary }}
            thumbColor={formData.familyInfo.spouse.isChurchMember ? COLORS.white : COLORS.gray}
          />
        </View>
      </View>

      {/* Informations enfants */}
      <View style={styles.subsectionContainer}>
        <View style={styles.childrenHeader}>
          <Text style={[styles.subsectionTitle, { color: dark ? COLORS.white : COLORS.black }]}>
            Enfants ({formData.familyInfo.numberOfChildren})
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={addChild}>
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {formData.familyInfo.children.map((child, index) => (
          <View key={index} style={styles.childContainer}>
            <View style={styles.childHeader}>
              <Text style={[styles.childTitle, { color: dark ? COLORS.white : COLORS.black }]}>
                Enfant {index + 1}
              </Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeChild(index)}>
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <Input
              placeholder="Nom de l'enfant"
              value={child.name}
              onInputChanged={(value) => {
                const updatedChildren = [...formData.familyInfo.children];
                updatedChildren[index].name = value;
                setFormData(prev => ({
                  ...prev,
                  familyInfo: {
                    ...prev.familyInfo,
                    children: updatedChildren
                  }
                }));
              }}
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
            />

            <TouchableOpacity
              style={[styles.selectField, { borderColor: dark ? COLORS.gray : COLORS.black2 }]}
              onPress={() => {
                Alert.alert(
                  'Sexe de l\'enfant',
                  'Sélectionnez le sexe',
                  [
                    { text: 'Garçon', onPress: () => {
                      const updatedChildren = [...formData.familyInfo.children];
                      updatedChildren[index].gender = 'male';
                      setFormData(prev => ({
                        ...prev,
                        familyInfo: {
                          ...prev.familyInfo,
                          children: updatedChildren
                        }
                      }));
                    }},
                    { text: 'Fille', onPress: () => {
                      const updatedChildren = [...formData.familyInfo.children];
                      updatedChildren[index].gender = 'female';
                      setFormData(prev => ({
                        ...prev,
                        familyInfo: {
                          ...prev.familyInfo,
                          children: updatedChildren
                        }
                      }));
                    }}
                  ]
                );
              }}>
              <Text style={[styles.selectFieldText, { color: child.gender ? (dark ? COLORS.white : COLORS.black) : COLORS.gray }]}>
                {child.gender === 'male' ? 'Garçon' : child.gender === 'female' ? 'Fille' : 'Sexe de l\'enfant'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSummary = () => (
    <ScrollView style={styles.summaryContainer}>
      <Text style={[styles.summaryTitle, { color: dark ? COLORS.white : COLORS.black }]}>
        Récapitulatif de votre profil
      </Text>
      
      <View style={styles.summarySection}>
        <Text style={[styles.summarySubtitle, { color: dark ? COLORS.white : COLORS.black }]}>
          Informations personnelles
        </Text>
        <Text style={[styles.summaryText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
          Type: {fieldOptions.personType.find(p => p.value === formData.personType)?.label || 'Non renseigné'}
        </Text>
        <Text style={[styles.summaryText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
          Sexe: {fieldOptions.gender.find(g => g.value === formData.gender)?.label || 'Non renseigné'}
        </Text>
        <Text style={[styles.summaryText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
          Profession: {formData.occupation || 'Non renseigné'}
        </Text>
        <Text style={[styles.summaryText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
          Statut: {fieldOptions.maritalStatus.find(m => m.value === formData.maritalStatus)?.label}
        </Text>
      </View>

      <View style={styles.summarySection}>
        <Text style={[styles.summarySubtitle, { color: dark ? COLORS.white : COLORS.black }]}>
          Contact d'urgence
        </Text>
        <Text style={[styles.summaryText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
          {formData.emergencyContact.name || 'Non renseigné'} ({formData.emergencyContact.relationship || 'Relation non définie'})
        </Text>
      </View>

      <View style={styles.summarySection}>
        <Text style={[styles.summarySubtitle, { color: dark ? COLORS.white : COLORS.black }]}>
          Préférences de don
        </Text>
        <Text style={[styles.summaryText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
          Fréquence: {fieldOptions.donationFrequency.find(f => f.value === formData.donationPreferences.preferredFrequency)?.label}
        </Text>
        <Text style={[styles.summaryText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
          Catégories: {formData.donationPreferences.donationCategories.length} sélectionnées
        </Text>
      </View>

      <View style={styles.summarySection}>
        <Text style={[styles.summarySubtitle, { color: dark ? COLORS.white : COLORS.black }]}>
          Bénévolat
        </Text>
        <Text style={[styles.summaryText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
          Disponible: {formData.volunteer.isAvailable ? 'Oui' : 'Non'}
        </Text>
        {formData.volunteer.isAvailable && (
          <Text style={[styles.summaryText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Compétences: {formData.volunteer.interests.length} sélectionnées
          </Text>
        )}
      </View>
    </ScrollView>
  );

  const renderSectionContent = () => {
    switch (currentSection) {
      case 0: return renderPersonalInfo();
      case 1: return renderAddress();
      case 2: return renderChurchInfo();
      case 3: return renderEmergencyContact();
      case 4: return renderDonationPreferencesExtended();
      case 5: return renderFinancialInfo();
      case 6: return renderCommunicationPreferences();
      case 7: return renderVolunteerExtended();
      case 8: return renderFamilyInfoComplete();
      case 9: return renderSummary();
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

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      console.log('Sauvegarde du profil complet:', formData);
      
      if (!user?.id) {
        throw new Error('Utilisateur non connecté');
      }

      // Appel au service pour sauvegarder/mettre à jour le profil
      const result = await profileService.updateProfile(user.id, formData);
      
      console.log('Profil sauvegardé avec succès:', result);
      
      dispatch(showSuccess({
        title: 'Profil complet sauvegardé',
        message: 'Toutes vos informations ont été mises à jour avec succès'
      }));
      
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      
      dispatch(showError({
        title: 'Erreur de sauvegarde',
        message: error.response?.data?.error || 'Impossible de sauvegarder le profil complet. Veuillez réessayer.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Assistant Profil Complet" />
        
        {/* Écran de chargement initial */}
        {isInitialLoading ? (
          <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Chargement de votre profil...
            </Text>
            <Text style={[styles.loadingSubText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Récupération de vos informations existantes
            </Text>
          </View>
        ) : (
          <>
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
                  onPress={() => setCurrentSection(currentSection - 1)}
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
          </>
        )}
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
    justifyContent: 'space-between',
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
    color: COLORS.black
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
  },
  sectionNote: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center'
  },
  subsectionContainer: {
    marginVertical: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.black2
  },
  subsectionTitle: {
    fontSize: 18,
    fontFamily: 'medium',
    marginBottom: 12
  },
  categoryContainer: {
    marginTop: 16
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'medium',
    marginBottom: 12
  },
  categoryScroll: {
    paddingVertical: 8
  },
  categoryChip: {
    backgroundColor: COLORS.black2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: 'regular',
    color: COLORS.black
  },
  categoryChipTextSelected: {
    color: COLORS.white
  },
  childrenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'medium'
  },
  childContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.black2,
    borderRadius: 8
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  childTitle: {
    fontSize: 16,
    fontFamily: 'medium'
  },
  removeButton: {
    backgroundColor: COLORS.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  removeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'bold'
  },
  summaryContainer: {
    flex: 1
  },
  summaryTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  summarySection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black2
  },
  summarySubtitle: {
    fontSize: 16,
    fontFamily: 'medium',
    marginBottom: 8
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'regular',
    marginBottom: 4
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'bold',
    color: COLORS.black,
    marginBottom: 16
  },
  loadingSubText: {
    fontSize: 14,
    fontFamily: 'regular',
    color: COLORS.gray
  }
});

export default ProfileWizardScreen; 