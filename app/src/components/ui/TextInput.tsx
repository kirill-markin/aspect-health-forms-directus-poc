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
        <Text variant="small" color="#374151" style={styles.label}>
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
          placeholderTextColor="#9CA3AF"
          {...props}
        />
      </View>
      {error && (
        <Text variant="small" color="#E53E3E" style={styles.errorText}>
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
    marginBottom: 4,
    fontWeight: '500',
  },
  container: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  default: {
    borderBottomWidth: 2,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  outlined: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  filled: {
    backgroundColor: '#F9FAFB',
    borderColor: 'transparent',
  },
  focused: {
    borderColor: '#0066CC',
  },
  error: {
    borderColor: '#E53E3E',
  },
  disabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  smallSize: {
    minHeight: 32,
  },
  mediumSize: {
    minHeight: 44,
  },
  largeSize: {
    minHeight: 56,
  },
  input: {
    fontSize: 16,
    color: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
  },
  smallInput: {
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  mediumInput: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  largeInput: {
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  disabledInput: {
    color: '#9CA3AF',
  },
  errorText: {
    marginTop: 4,
  },
});

export default TextInput;