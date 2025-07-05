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
      <Text variant="body" color={textColor} style={styles.text}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};

const getTextColor = (variant: ButtonVariant, disabled: boolean): string => {
  if (disabled) return '#9CA3AF';
  
  switch (variant) {
    case 'primary':
    case 'danger':
      return '#FFFFFF';
    case 'secondary':
      return '#0066CC';
    case 'text':
      return '#0066CC';
    default:
      return '#FFFFFF';
  }
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: '#0066CC',
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  text: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  danger: {
    backgroundColor: '#E53E3E',
    borderWidth: 0,
  },
  disabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  smallSize: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  mediumSize: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  largeSize: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 56,
  },
  text: {
    fontWeight: '600',
  },
});

export default Button;