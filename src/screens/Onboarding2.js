import React from 'react';
import { images } from '../constants';
import { OnboardingSlide } from '../design/components';

// Introduction au premier lancement — étape 2 sur 4
const Onboarding2 = ({ navigation }) => (
  <OnboardingSlide
    image={images.onboarding2}
    title="Donnez selon votre rythme"
    tagline="Choisissez votre type de don"
    description="Ponctuel ou récurrent ? Vous êtes libre de contribuer comme vous le souhaitez, quand vous le souhaitez."
    step={2}
    total={4}
    primaryLabel="Suivant"
    onPrimary={() => navigation.navigate('Onboarding3')}
      onSkip={() => navigation.navigate('Login')}
  />
);

export default Onboarding2;
