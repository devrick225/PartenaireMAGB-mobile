import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../constants';
import { useTheme } from '../theme/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

const Input = (props) => {
  const [isFocused, setIsFocused] = useState(false);
  const { dark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  // Ne pas propager showPasswordToggle au TextInput
  const { showPasswordToggle, ...textInputProps } = props;

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const onChangeText = (text) => {
    if (props.onInputChanged) {
      props.onInputChanged(text);
    }
  };

  const isPassword = props.secureTextEntry || showPasswordToggle;
  const effectiveSecure = isPassword ? !showPassword : false;

  return (
    <View style={[styles.container]}>
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: isFocused ? COLORS.primary : dark ? COLORS.dark2 : COLORS.greyscale500,
            backgroundColor: isFocused ? COLORS.tansparentPrimary : dark ? COLORS.dark2 : COLORS.greyscale500,
          },
        ]}
      >
        {props.icon && (
          React.isValidElement(props.icon) ? (
            <View style={styles.icon}>{props.icon}</View>
          ) : typeof props.icon === 'string' ? (
            <MaterialIcons name={props.icon} size={20} color={COLORS.primary} style={styles.icon} />
          ) : (
            <Image source={props.icon} style={[styles.imageIcon]} resizeMode="contain" />
          )
        )}
        <TextInput
          {...textInputProps}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, { color: dark ? COLORS.white : COLORS.black }]}
          placeholder={props.placeholder}
          placeholderTextColor={props.placeholderTextColor}
          autoCapitalize={props.autoCapitalize || 'none'}
          secureTextEntry={effectiveSecure}
          keyboardType={props.keyboardType || 'default'}
          editable={props.editable !== false}
          value={props.value}
        />

        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(prev => !prev)}
            disabled={props.editable === false}
          >
            <MaterialIcons
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={20}
              color={dark ? COLORS.grayTie : COLORS.gray}
            />
          </TouchableOpacity>
        )}
      </View>
      {props.errorText && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {Array.isArray(props.errorText) ? props.errorText[0] : props.errorText}
          </Text>
        </View>
      )}
    </View>
  );
};

Input.defaultProps = {
  onInputChanged: () => {},
  id: '',
  errorText: null,
  icon: null,
  placeholderTextColor: '#BCBCBC',
  editable: true,
  autoCapitalize: 'none',
  secureTextEntry: false,
  keyboardType: 'default',
  showPasswordToggle: false,
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding2,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 5,
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  imageIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  input: {
    color: COLORS.black,
    flex: 1,
    fontFamily: 'regular',
    fontSize: 14,
    paddingTop: 0,
  },
  eyeButton: {
    marginLeft: 8,
  },
  errorContainer: {
    marginVertical: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
});

export default Input;