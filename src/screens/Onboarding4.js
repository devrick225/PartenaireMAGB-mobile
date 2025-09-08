import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PageContainer from '../components/PageContainer';
import DotsView from '../components/DotsView';
import Button from '../components/Button';
import Onboarding1Styles from '../styles/OnboardingStyles';
import { images } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

const Onboarding4 = ({ navigation }) => {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[Onboarding1Styles.container, {
      backgroundColor: colors.background }]}>
      <PageContainer>
        <View style={Onboarding1Styles.contentContainer}>
        <ImageBackground
            source={images.onboarding4}
            style={Onboarding1Styles.backgroundImage}
            resizeMode="cover"
          ></ImageBackground>
          <View style={[Onboarding1Styles.buttonContainer, {
            backgroundColor: colors.background
          }]}>
            <View style={Onboarding1Styles.titleContainer}>
              <Text style={[Onboarding1Styles.title, { color: colors.text }]}>Prêt à commencer ?</Text>
              <Text style={Onboarding1Styles.subTitle}> Ensemble, faisons la différence</Text>
            </View>

            <Text style={[Onboarding1Styles.description, { color: colors.text }]}>
              Il ne reste plus qu’un pas pour transformer vos bonnes intentions en impact concret. Créons votre compte.
            </Text>

            <View style={Onboarding1Styles.dotsContainer}>
           <DotsView progress={1} numDots={4} />
            </View>
            <Button
              title="Se connecter"
              filled
              onPress={() => navigation.navigate('Login')}
              style={Onboarding1Styles.nextButton}
            />
           
          </View>
        </View>
      </PageContainer>
    </SafeAreaView>
  );
};

export default Onboarding4;
