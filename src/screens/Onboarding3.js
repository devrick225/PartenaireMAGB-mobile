import React from 'react';
import { images } from '../constants';
import { OnboardingSlide } from '../design/components';

// Introduction au premier lancement — étape 3 sur 4
const Onboarding3 = ({ navigation }) => (
  <OnboardingSlide
    image={images.onboarding3}
    title="Débloquez des récompenses"
    tagline="Gagnez des badges à chaque étape"
    description="Plus vous donnez, plus vous progressez : Bronze, Argent, Or… Chaque contribution vous fait évoluer."
    step={3}
    total={4}
    primaryLabel="Suivant"
    onPrimary={() => navigation.navigate('Onboarding4')}
      onSkip={() => navigation.navigate('Login')}
  />
);

export default Onboarding3;
