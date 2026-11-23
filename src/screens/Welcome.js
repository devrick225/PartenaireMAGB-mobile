import { View, StyleSheet, Image, Pressable } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { images } from "../constants";
import { AppText, Button, useDS } from "../design/components";
import { spacing } from "../design/tokens";

// Écran d'accueil — hero violet de la charte frontend-new, logo, accroche et actions
const Welcome = ({ navigation }) => {
    const { c, gradient } = useDS();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.flex, { backgroundColor: c.background }]}>
            <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}
            >
                <View style={styles.logoWrap}>
                    <Image source={images.logo} resizeMode="contain" style={styles.logo} />
                </View>
                <AppText variant="display" color="#FFFFFF" center accessibilityRole="header">
                    Partenaire MAGB
                </AppText>
                <AppText variant="body" color="rgba(255,255,255,0.82)" center style={styles.tagline}>
                    Ici, chaque don compte. Soutenez l'œuvre du ministère avec simplicité et confiance.
                </AppText>
            </LinearGradient>

            <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
                <Button title="Créer mon compte" variant="gold" icon="person-add-outline" onPress={() => navigation.navigate("Signup")} />
                <Button title="Se connecter" variant="outline" icon="log-in-outline" onPress={() => navigation.navigate("Login")} />
                <AppText variant="caption" color={c.mutedForeground} center style={styles.legal}>
                    En continuant, vous acceptez les conditions d'utilisation et la politique de confidentialité.
                </AppText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    hero: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxl,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    logoWrap: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: "rgba(255,255,255,0.95)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.xl,
    },
    logo: { width: 80, height: 80 },
    tagline: { marginTop: spacing.sm, maxWidth: 320 },
    actions: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
    legal: { marginTop: spacing.sm },
});

export default Welcome;
