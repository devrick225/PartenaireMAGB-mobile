import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import React from 'react';
import { COLORS, SIZES, icons, illustrations } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';

const ForgotPasswordMethods = ({ navigation }) => {
  const { colors, dark } = useTheme();

  const handleContinue = () => {
    navigation.navigate('ForgotPasswordEmail');
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Mot de passe oublié" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.passwordContainer}>
            <Image
              source={dark ? illustrations.passwordDark : illustrations.password}
              resizeMode='contain'
              style={styles.password}
            />
          </View>
          
          <Text style={[styles.title, {
            color: dark ? COLORS.white : COLORS.greyscale900
          }]}>Récupération de mot de passe</Text>
          
          <Text style={[styles.subtitle, {
            color: dark ? COLORS.grayscale400 : COLORS.grayscale700
          }]}>
            Nous vous enverrons un lien de réinitialisation par email pour récupérer l'accès à votre compte en toute sécurité.
          </Text>
          
          <View style={[styles.methodContainer, {
            backgroundColor: dark ? COLORS.dark2 : COLORS.secondaryWhite,
            borderColor: COLORS.primary,
            borderWidth: 2
          }]}>
            <View style={styles.iconContainer}>
              <Image
                source={icons.email}
                resizeMode='contain'
                style={styles.icon} 
              />
            </View>
            <View style={styles.methodContent}>
              <Text style={[styles.methodTitle, {
                color: dark ? COLORS.white : COLORS.black
              }]}>Récupération par email</Text>
              <Text style={[styles.methodDescription, {
                color: dark ? COLORS.grayscale400 : COLORS.grayscale700
              }]}>
                Un lien de réinitialisation sera envoyé à votre adresse email enregistrée
              </Text>
            </View>
          </View>
          
          <View style={[styles.infoContainer, {
            backgroundColor: dark ? COLORS.dark2 : COLORS.primaryLight,
            borderColor: dark ? COLORS.primary : COLORS.primaryLight
          }]}>
            <Text style={[styles.infoText, {
              color: dark ? COLORS.white : COLORS.primary
            }]}>
              💡 Le lien de réinitialisation expire après 10 minutes pour votre sécurité
            </Text>
          </View>
          
        </ScrollView>
        
        <Button
          title="Continuer"
          filled
          style={styles.button}
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  password: {
    width: 276,
    height: 250
  },
  passwordContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 32
  },
  title: {
    fontSize: 28,
    fontFamily: "bold",
    color: COLORS.greyscale900,
    textAlign: "center",
    marginBottom: 16
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "regular",
    color: COLORS.grayscale700,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16
  },
  methodContainer: {
    width: SIZES.width - 32,
    borderRadius: 24,
    borderColor: COLORS.primary,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 24,
    backgroundColor: COLORS.secondaryWhite
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.tansparentPrimary,
    marginRight: 16
  },
  icon: {
    width: 28,
    height: 28,
    tintColor: COLORS.primary
  },
  methodContent: {
    flex: 1
  },
  methodTitle: {
    fontSize: 18,
    fontFamily: "bold",
    color: COLORS.black,
    marginBottom: 4
  },
  methodDescription: {
    fontSize: 14,
    fontFamily: "regular",
    color: COLORS.grayscale700,
    lineHeight: 20
  },
  infoContainer: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    padding: 16,
    marginBottom: 32
  },
  infoText: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.primary,
    textAlign: "center",
    lineHeight: 20
  },
  button: {
    borderRadius: 32,
    marginVertical: 16
  }
});

export default ForgotPasswordMethods
