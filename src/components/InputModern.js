import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

const InputModern = (props) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { dark } = useTheme();

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

  const isPassword = props.secureTextEntry || props.showPasswordToggle;
  const effectiveSecure = isPassword ? !showPassword : false;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: isFocused ? '#26335F' : 'rgba(38, 51, 95, 0.2)',
            backgroundColor: isFocused ? 'rgba(38, 51, 95, 0.08)' : 'rgba(38, 51, 95, 0.05)',
          },
          props.containerStyle,
        ]}
      >
        {props.icon && (
          <View style={styles.iconContainer}>
            <MaterialIcons 
              name={props.icon} 
              size={20} 
              color={isFocused ? '#26335F' : 'rgba(38, 51, 95, 0.6)'} 
            />
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            { color: dark ? COLORS.white : COLORS.black },
            props.inputStyle,
          ]}
          placeholder={props.placeholder}
          placeholderTextColor={props.placeholderTextColor || (dark ? COLORS.grayTie : COLORS.gray)}
          value={props.value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={effectiveSecure}
          keyboardType={props.keyboardType || 'default'}
          autoCapitalize={props.autoCapitalize || 'none'}
          autoCorrect={props.autoCorrect || false}
          editable={props.editable !== false}
        />

        {props.showPasswordToggle && (
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 56,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  eyeButton: {
    marginLeft: 12,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#D32235',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default InputModern;