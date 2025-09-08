import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, images } from '../constants';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { useAppDispatch } from '../store/hooks';
import authService from '../store/services/authService';
import { showError, showSuccess } from '../store/slices/notificationSlice';

const ForgotPasswordEmail = ({ navigation }) => {
    const [formData, setFormData] = useState({
        email: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const { colors, dark } = useTheme();
    const dispatch = useAppDispatch();

    const validateForm = () => {
        const errors = {};

        // Email validation
        if (!formData.email) {
            errors.email = 'L\'email est requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Format d\'email invalide';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Clear field error when user starts typing
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleForgotPassword = async () => {
        console.log('🔄 Tentative de récupération mot de passe:', formData.email);

        if (!validateForm()) {
            const errorMessages = Object.values(fieldErrors);
            if (errorMessages.length > 0) {
                dispatch(showError({
                    title: 'Erreur de validation',
                    message: errorMessages[0]
                }));
            }
            return;
        }

        setIsLoading(true);

        try {
            const result = await authService.forgotPassword(formData.email.toLowerCase().trim());
            
            console.log('✅ Demande de récupération réussie:', result);
            
            dispatch(showSuccess({
                title: 'Email envoyé',
                message: 'Un lien de réinitialisation a été envoyé à votre adresse email'
            }));
            
            // Navigate to success screen or back to login
            setTimeout(() => {
                navigation.navigate('EmailSentSuccess', { email: formData.email });
            }, 1500);
            
        } catch (error) {
            console.error('❌ Erreur récupération mot de passe:', error);
            
            dispatch(showError({
                title: 'Erreur',
                message: error.message || 'Une erreur est survenue lors de la demande'
            }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Header title="Mot de passe oublié" />
                <ScrollView style={{ marginVertical: 24 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={images.logo}
                            resizeMode='contain'
                            style={styles.logo}
                        />
                    </View>
                    
                    <Text style={[styles.title, {
                        color: dark ? COLORS.white : COLORS.black
                    }]}>Récupération du mot de passe</Text>
                    
                    <Text style={[styles.subtitle, {
                        color: dark ? COLORS.grayscale400 : COLORS.grayscale700
                    }]}>
                        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                    </Text>
                    
                    <View style={styles.inputContainer}>
                        <Input
                            id="email"
                            value={formData.email}
                            onInputChanged={(value) => handleInputChange('email', value)}
                            placeholder="Entrez votre adresse email"
                            placeholderTextColor={dark ? COLORS.grayTie : COLORS.grayscale600}
                            icon={icons.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                            errorText={fieldErrors.email}
                        />
                    </View>
                    
                    <Button
                        title={isLoading ? "Envoi en cours..." : "Envoyer le lien"}
                        filled
                        onPress={handleForgotPassword}
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        isLoading={isLoading}
                    />
                    
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Login")}
                        disabled={isLoading}
                        style={styles.backToLoginContainer}>
                        <Text style={[styles.backToLoginText, {
                            color: COLORS.primary,
                            opacity: isLoading ? 0.5 : 1
                        }]}>Retour à la connexion</Text>
                    </TouchableOpacity>
                </ScrollView>
                
                <View style={styles.bottomContainer}>
                    <Text style={[styles.bottomLeft, {
                        color: dark ? COLORS.white : COLORS.black
                    }]}>Vous n'avez pas de compte ?</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Signup")}
                        disabled={isLoading}>
                        <Text style={[styles.bottomRight, {
                            opacity: isLoading ? 0.5 : 1
                        }]}>{"  "}S'inscrire</Text>
                    </TouchableOpacity>
                </View>
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
        padding: 16,
        backgroundColor: COLORS.white
    },
    logo: {
        width: 80,
        height: 80,
    },
    logoContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 20
    },
    title: {
        fontSize: 24,
        fontFamily: "bold",
        color: COLORS.black,
        textAlign: "center",
        marginBottom: 12
    },
    subtitle: {
        fontSize: 16,
        fontFamily: "regular",
        color: COLORS.grayscale700,
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 22,
        paddingHorizontal: 16
    },
    inputContainer: {
        marginBottom: 24
    },
    button: {
        marginVertical: 16,
        width: SIZES.width - 32,
        borderRadius: 30
    },
    buttonDisabled: {
        opacity: 0.7
    },
    backToLoginContainer: {
        alignItems: 'center',
        marginTop: 16
    },
    backToLoginText: {
        fontSize: 16,
        fontFamily: "semiBold",
        color: COLORS.primary,
        textAlign: "center"
    },
    bottomContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 18,
        position: "absolute",
        bottom: 12,
        right: 0,
        left: 0,
    },
    bottomLeft: {
        fontSize: 14,
        fontFamily: "regular",
        color: "black"
    },
    bottomRight: {
        fontSize: 16,
        fontFamily: "medium",
        color: COLORS.primary
    }
})

export default ForgotPasswordEmail
