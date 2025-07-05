import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';

interface ActivityIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  animating?: boolean;
  style?: ViewStyle;
}

const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  size = 'medium',
  color = '#FF6B9D',
  animating = true,
  style,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animating) {
      const animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [animating, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const indicatorStyle = [
    styles.base,
    styles[size],
    { borderColor: `${color}33`, borderTopColor: color },
    style
  ];

  if (!animating) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          indicatorStyle,
          { transform: [{ rotate: rotation }] }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  base: {
    borderWidth: 2,
    borderRadius: 50,
    borderStyle: 'solid',
  },
  small: {
    width: 16,
    height: 16,
  },
  medium: {
    width: 24,
    height: 24,
  },
  large: {
    width: 32,
    height: 32,
  },
});

export default ActivityIndicator;