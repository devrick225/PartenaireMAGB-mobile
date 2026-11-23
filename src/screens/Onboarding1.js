import React from 'react';
import { images } from '../constants';
import { OnboardingSlide } from '../design/components';

// Introduction au premier lancement — étape 1 sur 4
const Onboarding = ({ navigation }) => (
  <OnboardingSlide
    image={images.onboarding1}
    title="Bienvenue"
    tagline="Partenaire MAGB"
    description="Rejoignez une communauté engagée et impactez des vies à travers des dons simples, réguliers et personnalisés."
    step={1}
    total={4}
    primaryLabel="Suivant"
    onPrimary={() => navigation.navigate('Onboarding2')}
      onSkip={() => navigation.navigate('Login')}
  />
);

export default Onboarding;
