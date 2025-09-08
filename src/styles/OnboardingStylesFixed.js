import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: COLORS.primary,
        position: 'relative',
    },
    illustration: {
        width: width * 0.85,
        height: height * 0.4,
        alignSelf: 'center',
        marginTop: height * 0.08,
        marginBottom: 20,
    },
    ornament: {
        position: "absolute",
        top: height * 0.35,
        alignSelf: 'center',
        zIndex: -1,
        width: width * 0.7,
        height: height * 0.15,
    },
    titleContainer: {
        marginVertical: 20,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        ...FONTS.h2,
        color: COLORS.black,
        textAlign: "center",
        marginBottom: 8,
    },
    subTitle: {
        ...FONTS.h3,
        color: COLORS.primary,
        textAlign: "center",
        fontWeight: 'bold',
    },
    description: {
        ...FONTS.body3,
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    dotsContainer: {
        marginBottom: 25,
        marginTop: 15,
        alignItems: 'center',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 22,
        borderTopLeftRadius: SIZES.radius * 2,
        borderTopRightRadius: SIZES.radius * 2,
        minHeight: 280,
        justifyContent: 'flex-end',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    nextButton: {
        width: width - 44,
        marginBottom: 16,
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        borderRadius: SIZES.radius,
        paddingVertical: 16,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    skipButton: {
        width: width - 44,
        marginBottom: 20,
        backgroundColor: 'transparent',
        borderColor: COLORS.primary,
        borderWidth: 1,
        borderRadius: SIZES.radius,
        paddingVertical: 16,
    },
    // Styles pour corriger les décalages
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 320, // Espace pour le buttonContainer
    },
    contentWrapper: {
        flex: 1,
        justifyContent: 'space-between',
    },
    textSection: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 320, // Même hauteur que buttonContainer
    },
});

export default styles;