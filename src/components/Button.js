import {
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import React from 'react';
import { COLORS, SIZES } from '../constants';

const Button = (props) => {
    const filledBgColor = props.color || '#472A6F' // Bleu principal
    const outlinedBgColor = 'transparent'
    const bgColor = props.filled ? filledBgColor : outlinedBgColor
    const textColor = props.filled
        ? COLORS.white || props.textColor
        : props.textColor || '#472A6F' // Bleu principal
    const isLoading = props.isLoading || false

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={props.title}
            accessibilityState={{ disabled: !!props.disabled, busy: isLoading }}
            disabled={props.disabled || isLoading}
            style={{
                ...styles.btn,
                ...{ backgroundColor: bgColor },
                ...props.style,
            }}
            onPress={props.onPress}
        >
            {isLoading && isLoading == true ? (
                <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
                <Text maxFontSizeMultiplier={1.4} style={{ fontSize: 16, fontFamily: "semiBold", ...{ color: textColor } }}>
                    {props.title}
                </Text>
            )}
        </TouchableOpacity>
    )
}
const styles = StyleSheet.create({
    btn: {
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding,
        borderColor: COLORS.primary,
        borderWidth: 1,
        borderRadius: 12, // --radius de la charte
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50
    },
})

export default Button