import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    TouchableOpacity,
    Dimensions,
    Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, images } from '../constants';
import InputModern from '../components/InputModern';
import Checkbox from 'expo-checkbox';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { useAppDispatch } from '../store/hooks';
import { useAuth } from '../store/hooks';
import { loginUser, clearError } from '../store/slices/authSlice';
import { showSuccess, showError } from '../store/slices/notificationSlice';

const { width, height } = Dimensions.get('window');

const LoginModern = ({ navigation }) => {
    const [isChecked, setChecked] = useState(false);
    const { colors, dark } = useTheme();
    const dispatch = useAppDispatch();
    const { isAuthenticated, isLoading, error } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    const REMEMBER_KEY = 'auth_remember_me';
    const REMEMBER_EMAIL_KEY = 'auth_remember_email';

    useEffect(() => {
        dispatch(clearError());
        startAnimations();
    }, [dispatch]);

    const startAnimations = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // Pré-remplir email si "se souvenir de moi"
    useEffect(() => {
        (async () => {
            try {
                const remember = await AsyncStorage.getItem(REMEMBER_KEY);
                const savedEmail = await AsyncStorage.getItem(REMEMBER_EMAIL_KEY);
                const shouldRemember = remember === 'true';
                setChecked(shouldRemember);
                if (shouldRemember && savedEmail) {
                    setFormData(prev => ({ ...prev, email: savedEmail }));
                }
            } catch (e) {
                // noop
            }
        })();
    }, []);

    // Show authentication errors
    useEffect(() => {
        if (error) {
            dispatch(showError({
                title: 'Erreur de connexion',
                message: error
            }));
        }
    }, [error, dispatch]);

    // Redirect after successful login
    useEffect(() => {
        if (isAuthenticated) {
            dispatch(showSuccess({
                title: 'Connexion réussie',
                message: 'Bienvenue dans PARTENAIRE MAGB'
            }));
        }
    }, [isAuthenticated, dispatch]);

    const validateForm = () => {
        const errors = {};

        if (!formData.email) {
            errors.email = 'L\'email est requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email invalide';
        }

        if (!formData.password) {
            errors.password = 'Le mot de passe est requis';
        } else if (formData.password.length < 6) {
            errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleLogin = async () => {
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

        try {
            const result = await dispatch(loginUser({
                email: formData.email.toLowerCase().trim(),
                password: formData.password,
            })).unwrap();

            // Gérer "se souvenir de moi"
            try {
                if (isChecked) {
                    await AsyncStorage.setItem(REMEMBER_KEY, 'true');
                    await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, formData.email.toLowerCase().trim());
                } else {
                    await AsyncStorage.setItem(REMEMBER_KEY, 'false');
                    await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
                }
            } catch (e) {
                // noop
            }
        } catch (err) {
            console.error('❌ Erreur de connexion:', err);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header avec gradient */}
            <LinearGradient
                colors={['#26335F', '#1a2347']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Motifs décoratifs */}
                <View style={styles.decorativeCircle1} />
                <View style={styles.decorativeCircle2} />
                <View style={styles.decorativeCircle3} />

                <Animated.View
                    style={[
                        styles.headerContent,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                >
                    <View style={styles.logoContainer}>
                        <View style={styles.logoBackground}>
                            <Image
                                source={images.logo}
                                resizeMode='contain'
                                style={styles.logo}
                            />
                        </View>
                    </View>

                    <Text style={styles.welcomeTitle}>
                        Bienvenue ! 👋
                    </Text>
                    <Text style={styles.welcomeSubtitle}>
                        Connectez-vous à votre espace partenaire
                    </Text>
                </Animated.View>
            </LinearGradient>

            <ScrollView
                style={styles.formContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formContent}
            >
                <Animated.View
                    style={[
                        styles.formCard,
                        {
                            backgroundColor: dark ? COLORS.dark2 : '#FFFFFF',
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                >
                    <Text style={[styles.formTitle, { color: colors.text }]}>
                        Connexion
                    </Text>

                    {/* Champ Email */}
                    <InputModern
                        icon="email"
                        placeholder="Entrez votre email"
                        value={formData.email}
                        onInputChanged={(value) => handleInputChange('email', value)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                        errorText={fieldErrors.email}
                    />

                    {/* Champ Mot de passe */}
                    <InputModern
                        icon="lock"
                        placeholder="Entrez votre mot de passe"
                        value={formData.password}
                        onInputChanged={(value) => handleInputChange('password', value)}
                        showPasswordToggle={true}
                        secureTextEntry={true}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                        errorText={fieldErrors.password}
                    />

                    {/* Se souvenir de moi */}
                    <View style={styles.checkboxContainer}>
                        <View style={styles.checkboxRow}>
                            <Checkbox
                                style={styles.checkbox}
                                value={isChecked}
                                color={isChecked ? '#26335F' : dark ? '#26335F' : "gray"}
                                onValueChange={setChecked}
                            />
                            <Text style={[styles.checkboxText, { color: colors.text }]}>
                                Se souvenir de moi
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => navigation.navigate("ForgotPasswordMethods")}
                            disabled={isLoading}
                        >
                            <Text style={[styles.forgotText, { opacity: isLoading ? 0.5 : 1 }]}>
                                Mot de passe oublié ?
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bouton de connexion */}
                    <TouchableOpacity
                        style={[styles.loginButton, { opacity: isLoading ? 0.7 : 1 }]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={['#26335F', '#1a2347']}
                            style={styles.loginGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <MaterialIcons name="hourglass-empty" size={20} color="#FFFFFF" />
                                    <Text style={styles.loginButtonText}>Connexion...</Text>
                                </View>
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Text style={styles.loginButtonText}>Se connecter</Text>
                                    <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Actions secondaires */}
                <Animated.View
                    style={[
                        styles.secondaryActions,
                        { opacity: fadeAnim }
                    ]}
                >
                    <View style={styles.divider}>
                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                            ou
                        </Text>
                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    </View>

                    
                </Animated.View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Vous n'avez pas de compte ?
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Signup")}
                        disabled={isLoading}
                    >
                        <Text style={[styles.footerLink, { opacity: isLoading ? 0.5 : 1 }]}>
                            S'inscrire maintenant
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 40,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        position: 'relative',
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    decorativeCircle2: {
        position: 'absolute',
        top: 80,
        left: -30,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    decorativeCircle3: {
        position: 'absolute',
        bottom: -20,
        right: 50,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    headerContent: {
        alignItems: 'center',
        zIndex: 1,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoBackground: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    logo: {
        width: 60,
        height: 60,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 22,
    },
    formContainer: {
        flex: 1,
        marginTop: -20,
    },
    formContent: {
        padding: 20,
        paddingTop: 30,
    },
    formCard: {
        borderRadius: 24,
        padding: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        marginBottom: 30,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
    },

    checkboxContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        marginRight: 12,
        height: 20,
        width: 20,
        borderRadius: 6,
        borderColor: '#26335F',
        borderWidth: 2,
    },
    checkboxText: {
        fontSize: 14,
        fontWeight: '500',
    },
    forgotText: {
        fontSize: 14,
        color: '#26335F',
        fontWeight: '600',
    },
    loginButton: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    loginGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    secondaryActions: {
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: '500',
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
    },
    quickAction: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        marginBottom: 8,
    },
    footerLink: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#26335F',
    },
});

export default LoginModern