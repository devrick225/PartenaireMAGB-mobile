import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { SIZES, COLORS, icons } from '../constants';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';

const Header = ({ title, showBackButton = true }) => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  return (
    <View style={[styles.container, {
      backgroundColor: 'transparent'
    }]}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        {showBackButton && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={12}
            onPress={() => navigation.goBack()}>
            <Image
              source={icons.back}
              resizeMode='contain'
              style={[styles.backIcon, {
                tintColor: colors.text
              }]} />
          </TouchableOpacity>
        )}
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.4} style={[styles.title, {
          color: colors.text
        }]}>{title}</Text>
      </View>
    </View>
  )
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    width: SIZES.width - 32,
    flexDirection: "row",
    alignItems: "center",
  },
  backIcon: {
    width: 24,
    height: 24,
    marginRight: 16
  },
  title: {
    fontSize: 24,
    fontFamily: "PlayfairDisplay_700Bold", // titres de la charte
    color: COLORS.black
  }
})

export default Header