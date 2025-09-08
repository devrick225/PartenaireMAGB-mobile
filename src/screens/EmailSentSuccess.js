import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, illustrations } from '../constants';
import Header from '../components/Header';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { useAppDispatch } from '../store/hooks';
import authService from '../store/services/authService';
import { showError, showSuccess } from '../store/slices/notificationSlice';

const EmailSentSuccess = ({ navigation, route }) => {
    const { email } = route.params || {};
    const [isResending, setIsResending] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const { colors, dark } = useTheme();
    const dispatch = useAppDispatch();

    useEffect(() => {
        // Countdown timer for resend button
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleResendEmail = async () => {
        if (!canResend || isResending) return;

        setIsResending(true);
        
        try {
            await authService.forgotPassword(email);
            
            dispatch(showSuccess({
                title: 'Email renvoyé',
                message: 'Un nouveau lien de réinitialisation a été envoyé'
            }));
            
            // Reset countdown
            setCanResend(false);
            setCountdown(60);
            
        } catch (error) {
            console.error('❌ Erreur renvoi email:', error);
            
            dispatch(showError({
                title: 'Erreur',
                message: error.message || 'Impossible de renvoyer l\'email'
            }));
        } finally {
            setIsResending(false);
        }
    };

    const handleOpenEmail = () => {
        // On mobile, we can suggest the user to open their email app
        dispatch(showSuccess({
            title: 'Conseil',
            message: 'Ouvrez votre application email pour consulter le message'
        }));
    };

    const handleTryAnotherEmail = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Header title="Email envoyé" />
                
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.illustrationContainer}>
                        <Image
                            source={dark ? illustrations.passwordSuccessDark : illustrations.passwordSuccess}
                            resizeMode='contain'
                            style={styles.illustration}
                        />
                    </View>
                    
                    <Text style={[styles.title, {
                        color: dark ? COLORS.white : COLORS.black
                    }]}>Vérifiez votre email</Text>
                    
                    <Text style={[styles.subtitle, {
                        color: dark ? COLORS.grayscale400 : COLORS.grayscale700
                    }]}>
                        Nous avons envoyé un lien de réinitialisation du mot de passe à :
                    </Text>
                    
                    <View style={[styles.emailContainer, {
                        backgroundColor: dark ? COLORS.dark2 : COLORS.secondaryWhite,
                        borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200
                    }]}>
                        <Image
                            source={icons.email}
                            style={[styles.emailIcon, {
                                tintColor: COLORS.primary
                            }]}
                        />
                        <Text style={[styles.emailText, {
                            color: dark ? COLORS.white : COLORS.black
                        }]}>{email}</Text>
                    </View>
                    
                    <Text style={[styles.instructionText, {
                        color: dark ? COLORS.grayscale400 : COLORS.grayscale700
                    }]}>
                        Cliquez sur le lien dans l'email pour réinitialiser votre mot de passe. 
                        Le lien expirera dans 10 minutes.
                    </Text>
                    
                    <View style={styles.actionButtons}>
                        <Button
                            title="Ouvrir l'email"
                            filled
                            onPress={handleOpenEmail}
                            style={styles.primaryButton}
                        />
                        
                        <TouchableOpacity
                            onPress={handleResendEmail}
                            disabled={!canResend || isResending}
                            style={[styles.resendButton, {
                                opacity: (!canResend || isResending) ? 0.5 : 1
                            }]}>
                            <Text style={[styles.resendButtonText, {
                                color: COLORS.primary
                            }]}>
                                {isResending 
                                    ? "Envoi en cours..." 
                                    : canResend 
                                        ? "Renvoyer l'email"
                                        : `Renvoyer dans ${countdown}s`
                                }
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={handleTryAnotherEmail}
                            style={styles.changeEmailButton}>
                            <Text style={[styles.changeEmailText, {
                                color: dark ? COLORS.grayscale400 : COLORS.grayscale700
                            }]}>
                                Utiliser une autre adresse email
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
                
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Login")}
                        style={styles.backToLoginButton}>
                        <Text style={[styles.backToLoginText, {
                            color: COLORS.primary
                        }]}>Retour à la connexion</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
        alignItems: 'center'
    },
    illustrationContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 32
    },
    illustration: {
        width: SIZES.width * 0.6,
        height: 200
    },
    title: {
        fontSize: 28,
        fontFamily: "bold",
        color: COLORS.black,
        textAlign: "center",
        marginBottom: 16
    },
    subtitle: {
        fontSize: 16,
        fontFamily: "regular",
        color: COLORS.grayscale700,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
        paddingHorizontal: 16
    },
    emailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondaryWhite,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.grayscale200,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 24,
        width: '100%'
    },
    emailIcon: {
        width: 20,
        height: 20,
        marginRight: 12,
        tintColor: COLORS.primary
    },
    emailText: {
        fontSize: 16,
        fontFamily: "semiBold",
        color: COLORS.black,
        flex: 1
    },
    instructionText: {
        fontSize: 14,
        fontFamily: "regular",
        color: COLORS.grayscale700,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 32,
        paddingHorizontal: 16
    },
    actionButtons: {
        width: '100%',
        alignItems: 'center'
    },
    primaryButton: {
        width: SIZES.width - 32,
        borderRadius: 30,
        marginBottom: 16
    },
    resendButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginBottom: 16
    },
    resendButtonText: {
        fontSize: 16,
        fontFamily: "semiBold",
        color: COLORS.primary,
        textAlign: "center"
    },
    changeEmailButton: {
        paddingVertical: 8,
        paddingHorizontal: 16
    },
    changeEmailText: {
        fontSize: 14,
        fontFamily: "medium",
        color: COLORS.grayscale700,
        textAlign: "center"
    },
    bottomContainer: {
        padding: 16,
        alignItems: 'center'
    },
    backToLoginButton: {
        paddingVertical: 12,
        paddingHorizontal: 24
    },
    backToLoginText: {
        fontSize: 16,
        fontFamily: "semiBold",
        color: COLORS.primary,
        textAlign: "center"
    }
});

export default EmailSentSuccess; 