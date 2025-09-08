import { StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        position: 'relative',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        // Assure que l'image couvre tout l'écran
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        resizeMode: 'cover'
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Overlay sombre pour améliorer la lisibilité
    },
    contentWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 360, // Espace pour le buttonContainer
    },
    ornament: {
        position: "absolute",
        top: SIZES.height * 0.25,
        alignSelf: 'center',
        zIndex: -1,
        width: SIZES.width * 0.7,
        height: SIZES.height * 0.15,
    },
    titleContainer: {
        marginVertical: 18,
        alignItems: 'center',
    },
    title: {
        ...FONTS.h2,
        color: COLORS.white,
        textAlign: "center",
        fontWeight: 'bold',
    },
    subTitle: {
        ...FONTS.h3,
        color: COLORS.primary,
        textAlign: "center",
        marginTop: 8,
        fontWeight: 'bold',
    },
    description: {
        ...FONTS.body3,
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 22,
    },scription: {
        ...FONTS.body3,
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 22,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    dotsContainer: {
        marginBottom: 20,
        marginTop: 8,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 22,
        borderTopLeftRadius: SIZES.radius * 2,
        borderTopRightRadius: SIZES.radius * 2,
        minHeight: 360,
        justifyContent: 'flex-end',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        // Gradient background pour le container
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
    },
    nextButton: {
        width: SIZES.width - 44,
        marginBottom: SIZES.padding,
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        marginTop: 22
    },
    skipButton: {
        width: SIZES.width - 44,
        marginBottom: SIZES.padding,
        backgroundColor: 'transparent',
        borderColor: COLORS.primary
    },
});

export default styles;