import {View, Text, StyleSheet, Image, TouchableOpacity} from "react-native";
import React from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import {COLORS, SIZES, icons, images} from "../constants";
import SocialButtonV2 from "../components/SocialButtonV2";
import {useTheme} from "../theme/ThemeProvider";

const Welcome = ({navigation}) => {
    const {colors, dark} = useTheme();

    return (
        <SafeAreaView style={[styles.area, {backgroundColor: colors.background}]}>
            <View style={[styles.container, {backgroundColor: colors.background}]}>
                <Image source={images.logo} resizeMode="contain" style={styles.logo}/>
                <Text style={[styles.title, {color: colors.text}]}>Partenaire MAGB</Text>
                <Text style={[styles.subtitle, {color: dark ? COLORS.white : "black"}]}>
                    Ici, chaque don compte. Chaque geste rapproche un rêve de sa réalité.
                    Rejoignez une communauté de cœur, soutenez les causes qui vous inspirent, et vivez la joie de donner
                    avec simplicité et confiance.
                </Text>
                <View style={{marginVertical: 32}}>
                    <SocialButtonV2 title="Continuer avec le numéro de téléphone" icon={icons.phoneCall}
                                    onPress={() => navigation.navigate("Signup")}
                                    iconStyles={{tintColor: dark ? COLORS.white : COLORS.black}}/>
                    <SocialButtonV2 title="Continuer avec l'adresse mail" icon={icons.email2}
                                    onPress={() => navigation.navigate("Signup")}/>
                </View>
                <View style={{flexDirection: "row"}}>
                    <Text style={[styles.loginTitle, {
                        color: dark ? COLORS.white : "black"
                    }]}>Vous avez déjà un compte ? </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Login")}>
                        <Text style={styles.loginSubtitle}>Se connecter</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.bottomContainer}>
                <Text style={[styles.bottomTitle, {
                    color: dark ? COLORS.white : COLORS.black
                }]}>
                    En continuant, vous acceptez les conditions d'utilisation et
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                    <Text style={[styles.bottomSubtitle, {
                        color: dark ? COLORS.white : COLORS.black
                    }]}>la politique de confidentialité.</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 22,
        marginTop: -22,
    },
    title: {
        fontSize: 28,
        fontFamily: "bold",
        color: COLORS.black,
        marginVertical: 12,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 12,
        fontFamily: "regular",
        color: "black",
        textAlign: "center",
        paddingHorizontal: 16,
    },
    loginTitle: {
        fontSize: 14,
        fontFamily: "regular",
        color: "black",
    },
    loginSubtitle: {
        fontSize: 14,
        fontFamily: "semiBold",
        color: COLORS.primary,
    },
    bottomContainer: {
        position: "absolute",
        bottom: 32,
        right: 0,
        left: 0,
        width: SIZES.width - 32,
        alignItems: "center",
    },
    bottomTitle: {
        fontSize: 12,
        fontFamily: "regular",
        color: COLORS.black,
    },
    bottomSubtitle: {
        fontSize: 12,
        fontFamily: "regular",
        color: COLORS.black,
        textDecorationLine: "underline",
        marginTop: 2,
    },
});

export default Welcome;
