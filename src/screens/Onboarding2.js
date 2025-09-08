import React from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PageContainer from '../components/PageContainer';
import DotsView from '../components/DotsView';
import Button from '../components/Button';
import Onboarding1Styles from '../styles/OnboardingStyles';
import { images } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

const Onboarding2 = ({ navigation }) => {
  const { colors } = useTheme();


  return (
    <SafeAreaView style={[Onboarding1Styles.container, {
      backgroundColor: colors.background }]}>
      <PageContainer>
        <View style={Onboarding1Styles.contentContainer}>
          <View style={Onboarding1Styles.contentWrapper}>
            {/* Section Image */}
            <View style={Onboarding1Styles.imageContainer}>
              <Image
                source={images.onboarding2}
                resizeMode="contain"
                style={Onboarding1Styles.illustration}
              />
            </View>
          </View>
         
          {/* Section Contenu Fixe */}
          <View style={[Onboarding1Styles.buttonContainer, {
            backgroundColor: colors.background
          }]}>
            <View style={Onboarding1Styles.titleContainer}>
              <Text style={[Onboarding1Styles.title, { color: colors.text }]}>Donnez selon votre rythme</Text>
              <Text style={Onboarding1Styles.subTitle}>Choisissez votre type de don</Text>
            </View>

            <Text style={[Onboarding1Styles.description, { color: colors.text }]}>
            Ponctuel ou récurrent ? Vous êtes libre de contribuer comme vous le souhaitez, quand vous le souhaitez.          </Text>

            <View style={Onboarding1Styles.dotsContainer}>
           <DotsView progress={0.5} numDots={4} />
            </View>
            <Button
              title="Suivant"
              filled
              onPress={() => navigation.navigate('Onboarding3')}
              style={Onboarding1Styles.nextButton}
            />
            <Button
              title="Sauter"
              onPress={() => navigation.navigate('Login')}
              textColor={colors.primary}
              style={Onboarding1Styles.skipButton}
            />
          </View>
        </View>
      </PageContainer>
    </SafeAreaView>
  );
};

export default Onboarding2;
