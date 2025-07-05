import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TouchableOpacityProps } from 'react-native';
import Text from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  title: string;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  title,
  disabled = false,
  loading = false,
  style,
  onPress,
  ...props
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`${size}Size`],
    disabled && styles.disabled,
    style
  ] as ViewStyle[];

  const textColor = getTextColor(variant, disabled);

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      <Text variant="body" color={textColor} style={styles.textStyle}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};

const getTextColor = (variant: ButtonVariant, disabled: boolean): string => {
  if (disabled) return '#BDC3C7';
  
  switch (variant) {
    case 'primary':
    case 'danger':
      return '#FFFFFF';
    case 'secondary':
      return '#FF6B9D';
    case 'text':
      return '#FF6B9D';
    default:
      return '#FFFFFF';
  }
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primary: {
    backgroundColor: '#FF6B9D',
    borderWidth: 0,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF6B9D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  danger: {
    backgroundColor: '#E74C3C',
    borderWidth: 0,
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  mediumSize: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 48,
  },
  largeSize: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    minHeight: 56,
  },
  textStyle: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default Button;