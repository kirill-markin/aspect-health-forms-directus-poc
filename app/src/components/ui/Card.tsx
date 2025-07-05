import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  elevation?: 'none' | 'small' | 'medium' | 'large';
  padding?: 'none' | 'small' | 'medium' | 'large';
  backgroundColor?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  elevation = 'medium',
  padding = 'medium',
  backgroundColor = '#FFFFFF',
  style,
  ...props
}) => {
  const cardStyle = [
    styles.base,
    styles[elevation],
    styles[`${padding}Padding`],
    { backgroundColor },
    style
  ] as ViewStyle[];

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  nonePadding: {
    padding: 0,
  },
  smallPadding: {
    padding: 12,
  },
  mediumPadding: {
    padding: 20,
  },
  largePadding: {
    padding: 28,
  },
});

export default Card;