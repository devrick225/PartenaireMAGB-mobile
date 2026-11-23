import React from 'react';
import { images } from '../constants';
import { OnboardingSlide } from '../design/components';

// Introduction au premier lancement — étape 4 sur 4
const Onboarding4 = ({ navigation }) => (
  <OnboardingSlide
    image={images.onboarding4}
    title="Prêt à commencer ?"
    tagline="Ensemble, faisons la différence"
    description="Il ne reste plus qu'un pas pour transformer vos bonnes intentions en impact concret. Créons votre compte."
    step={4}
    total={4}
    primaryLabel="Se connecter"
    onPrimary={() => navigation.navigate('Login')}
  />
);

export default Onboarding4;
