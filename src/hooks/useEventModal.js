import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENT_PARTICIPATED_KEY = 'event_participated';

export const useEventModal = () => {
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    checkShouldShowEventModal();
  }, []);

  const checkShouldShowEventModal = async () => {
    try {
      const hasParticipated = await AsyncStorage.getItem(EVENT_PARTICIPATED_KEY);
      
      // Afficher la modal seulement si l'utilisateur n'a pas encore participé
      if (!hasParticipated) {
        setShowEventModal(true);
      }
    } catch (error) {
      console.log('Erreur lors de la vérification de la modal:', error);
      // En cas d'erreur, afficher la modal par défaut
      setShowEventModal(true);
    }
  };

  // Fermer temporairement (bouton "Plus tard")
  const dismissEventModal = () => {
    setShowEventModal(false);
    // Ne pas sauvegarder - la modal réapparaîtra à la prochaine connexion
  };

  // Marquer comme participé (bouton "Participer")
  const markAsParticipated = async () => {
    try {
      await AsyncStorage.setItem(EVENT_PARTICIPATED_KEY, 'true');
      setShowEventModal(false);
    } catch (error) {
      console.log('Erreur lors de la sauvegarde:', error);
      setShowEventModal(false);
    }
  };

  const triggerEventModal = () => {
    setShowEventModal(true);
  };

  // Fonction pour réinitialiser (utile pour les tests)
  const resetEventModal = async () => {
    try {
      await AsyncStorage.removeItem(EVENT_PARTICIPATED_KEY);
    } catch (error) {
      console.log('Erreur lors de la réinitialisation:', error);
    }
  };

  return {
    showEventModal,
    dismissEventModal,
    markAsParticipated,
    triggerEventModal,
    resetEventModal,
  };
};