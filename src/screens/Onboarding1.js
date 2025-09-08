import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PageContainer from '../components/PageContainer';
import DotsView from '../components/DotsView';
import Button from '../components/Button';
import Onboarding1Styles from '../styles/OnboardingStyles';
import { images } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

const Onboarding = ({ navigation }) => {
  const { colors } = useTheme();


  return (
    <SafeAreaView style={[Onboarding1Styles.container, {
      backgroundColor: colors.background }]}>
      <PageContainer>
        <View style={Onboarding1Styles.contentContainer}>
          <ImageBackground
            source={images.onboarding1}
            style={Onboarding1Styles.backgroundImage}
            resizeMode="cover"
          >
            {/* Overlay pour améliorer la lisibilité */}
            
            {/* Section Contenu Fixe */}
            <View style={[Onboarding1Styles.buttonContainer, {
              backgroundColor: colors.background
            }]}>
            <View style={Onboarding1Styles.titleContainer}>
              <Text style={[Onboarding1Styles.title, {
                color: colors.text
              }]}>Bienvenue dans</Text>
              <Text style={Onboarding1Styles.subTitle}>Partenaire MAGB</Text>
            </View>

            <Text style={[Onboarding1Styles.description, { color: colors.text }]}>
              Rejoignez une communauté engagée et impactez des vies à travers des dons simples, réguliers et personnalisés.
            </Text>

            <View style={Onboarding1Styles.dotsContainer}>
              <DotsView progress={0} numDots={4} />
            </View>
            <Button
              title="Suivant"
              filled
              onPress={() => navigation.navigate('Onboarding2')}
              style={Onboarding1Styles.nextButton}
            />
            <Button
              title="Sauter"
              onPress={() => navigation.navigate('Login')}
              textColor={colors.primary}
              style={Onboarding1Styles.skipButton}
            />
            </View>
          </ImageBackground>
        </View>
      </PageContainer>
    </SafeAreaView>
  );
};

export default Onboarding;
