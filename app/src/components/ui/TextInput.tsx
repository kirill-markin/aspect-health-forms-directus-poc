import React, { useState } from 'react';
import { 
  TextInput as RNTextInput, 
  View, 
  StyleSheet, 
  TextInputProps as RNTextInputProps,
  ViewStyle
} from 'react-native';
import Text from './Text';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  variant = 'outlined',
  size = 'medium',
  disabled = false,
  style,
  onFocus,
  onBlur,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const containerStyle = [
    styles.container,
    styles[variant],
    styles[`${size}Size`],
    isFocused && styles.focused,
    error && styles.error,
    disabled && styles.disabled,
    style
  ] as ViewStyle[];

  const inputStyle = [
    styles.input,
    styles[`${size}Input`],
    disabled && styles.disabledInput,
  ];

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text variant="small" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={containerStyle}>
        <RNTextInput
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          editable={!disabled}
          placeholderTextColor="#BDC3C7"
          selectionColor="#FF6B9D"
          underlineColorAndroid="transparent"
          textAlignVertical="top"
          {...props}
        />
      </View>
      {error && (
        <Text variant="small" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 16,
    color: '#2C3E50',
  },
  container: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8E9EA',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  default: {
    borderBottomWidth: 2,
    borderRadius: 0,
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  outlined: {
    borderWidth: 2,
    borderColor: '#E8E9EA',
  },
  filled: {
    backgroundColor: '#F5F6FA',
    borderColor: 'transparent',
  },
  focused: {
    borderColor: '#FF6B9D',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  error: {
    borderColor: '#E74C3C',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  disabled: {
    backgroundColor: '#E8E9EA',
    borderColor: '#BDC3C7',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  smallSize: {
    minHeight: 40,
  },
  mediumSize: {
    minHeight: 48,
  },
  largeSize: {
    minHeight: 64,
  },
  input: {
    fontSize: 16,
    color: '#2C3E50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
    fontWeight: '500',
    outline: 'none',
    outlineWidth: 0,
  },
  smallInput: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mediumInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  largeInput: {
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  disabledInput: {
    color: '#BDC3C7',
  },
  errorText: {
    marginTop: 8,
    color: '#E74C3C',
    fontWeight: '500',
  },
});

export default TextInput;