import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useDeepLinking } from '../hooks/useDeepLinking';

const DeepLinkHandler: React.FC = () => {
  const navigation = useNavigation();
  
  // Initialiser le deep linking avec la navigation
  useDeepLinking(navigation);
  
  // Ce composant ne rend rien, il gère juste le deep linking
  return null;
};

export default DeepLinkHandler; 