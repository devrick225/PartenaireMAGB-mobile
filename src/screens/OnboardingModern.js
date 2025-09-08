import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
  Animated,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { images } from '../constants';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    image: images.onboarding1,
    title: 'Bienvenue dans',
    subtitle: 'Partenaire MAGB',
    description: 'Rejoignez une communauté engagée et impactez des vies à travers des dons simples, réguliers et personnalisés.',
    backgroundColor: '#26335F',
    accentColor: '#FFD61D',
  },
  {
    id: 2,
    image: images.onboarding2,
    title: 'Donnez selon votre rythme',
    subtitle: 'Choisissez votre type de don',
    description: 'Ponctuel ou récurrent ? Vous êtes libre de contribuer comme vous le souhaitez, quand vous le souhaitez.',
    backgroundColor: '#D32235',
    accentColor: '#FFD61D',
  },
  {
    id: 3,
    image: images.onboarding3,
    title: 'Débloquez des récompenses',
    subtitle: 'Gagnez des badges à chaque étape',
    description: 'Plus vous donnez, plus vous progressez : Bronze, Argent, Or… Chaque contribution vous fait évoluer.',
    backgroundColor: '#FFD61D',
    accentColor: '#26335F',
  },
  {
    id: 4,
    image: images.onboarding4,
    title: 'Prêt à commencer ?',
    subtitle: 'Ensemble, faisons la différence',
    description: 'Il ne reste plus qu\'un pas pour transformer vos bonnes intentions en impact concret. Créons votre compte.',
    backgroundColor: '#26335F',
    accentColor: '#FFD61D',
  },
];

const OnboardingModern = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      
      // Animation de sortie puis changement
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
        
        // Animation d'entrée
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    
    if (index !== currentIndex && index >= 0 && index < onboardingData.length) {
      setCurrentIndex(index);
    }
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingData.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentIndex 
                ? onboardingData[currentIndex].accentColor 
                : 'rgba(255,255,255,0.3)',
              width: index === currentIndex ? 24 : 8,
            }
          ]}
          onPress={() => {
            setCurrentIndex(index);
            scrollViewRef.current?.scrollTo({
              x: index * width,
              animated: true,
            });
          }}
        />
      ))}
    </View>
  );

  const currentData = onboardingData[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={currentData.backgroundColor}
        translucent={false}
      />
      
      <LinearGradient
        colors={[currentData.backgroundColor, currentData.backgroundColor + 'E6']}
        style={styles.container}
      >
        {/* Header avec bouton skip */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={[styles.skipText, { color: currentData.accentColor }]}>
              Passer
            </Text>
          </TouchableOpacity>
        </View>

        {/* ScrollView pour les images */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.imageScrollView}
          contentContainerStyle={styles.imageScrollContent}
        >
          {onboardingData.map((item, index) => (
            <View key={item.id} style={styles.imageContainer}>
              <Animated.View
                style={[
                  styles.imageWrapper,
                  {
                    opacity: index === currentIndex ? fadeAnim : 0.3,
                    transform: [
                      {
                        translateY: index === currentIndex ? slideAnim : 50,
                      },
                      {
                        scale: index === currentIndex ? 1 : 0.8,
                      },
                    ],
                  },
                ]}
              >
                <Image
                  source={item.image}
                  style={styles.illustration}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
          ))}
        </ScrollView>

        {/* Contenu textuel */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: '#FFFFFF' }]}>
              {currentData.title}
            </Text>
            <Text style={[styles.subtitle, { color: currentData.accentColor }]}>
              {currentData.subtitle}
            </Text>
            <Text style={[styles.description, { color: 'rgba(255,255,255,0.9)' }]}>
              {currentData.description}
            </Text>
          </View>

          {renderDots()}

          {/* Boutons d'action */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                { backgroundColor: currentData.accentColor }
              ]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.nextButtonText,
                { color: currentData.backgroundColor }
              ]}>
                {currentIndex === onboardingData.length - 1 ? 'Commencer' : 'Suivant'}
              </Text>
              <MaterialIcons 
                name={currentIndex === onboardingData.length - 1 ? 'login' : 'arrow-forward'} 
                size={20} 
                color={currentData.backgroundColor} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Motifs décoratifs */}
        <View style={styles.decorativeElements}>
          <View style={[styles.circle1, { backgroundColor: currentData.accentColor + '20' }]} />
          <View style={[styles.circle2, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
          <View style={[styles.circle3, { backgroundColor: currentData.accentColor + '15' }]} />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerSpacer: {
    width: 60,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imageScrollView: {
    flex: 1,
    maxHeight: height * 0.45,
  },
  imageScrollContent: {
    alignItems: 'center',
  },
  imageContainer: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: width * 0.8,
    height: height * 0.35,
    maxWidth: 300,
    maxHeight: 300,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 26,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 200,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  circle1: {
    position: 'absolute',
    top: 100,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  circle2: {
    position: 'absolute',
    top: 200,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  circle3: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
};

export default OnboardingModern;