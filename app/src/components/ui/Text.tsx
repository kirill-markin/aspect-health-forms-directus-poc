import React from 'react';
import { Text as RNText, StyleSheet, TextProps as RNTextProps } from 'react-native';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'caption';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  children: React.ReactNode;
}

const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = '#2C3E50',
  style,
  children,
  ...props
}) => {
  const textStyle = [
    styles.base,
    styles[variant],
    { color },
    style
  ];

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
  },
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
  },
  h3: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  body: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});

export default Text;