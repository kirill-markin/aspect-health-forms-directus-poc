import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from '../components/ui';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  Home: undefined;
  DemoForm: { formSlug: string };
  Success: { exitKey?: string };
};

type SuccessScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Success'>;
type SuccessScreenRouteProp = RouteProp<RootStackParamList, 'Success'>;

interface SuccessScreenProps {
  navigation: SuccessScreenNavigationProp;
  route: SuccessScreenRouteProp;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ navigation, route }) => {
  const { exitKey } = route.params || {};

  const getSuccessMessage = () => {
    switch (exitKey) {
      case 'high_risk':
        return {
          title: 'Thank you for your responses',
          message: 'Based on your answers, we recommend following up with a healthcare provider. Our team will be in touch soon.',
          emoji: '🩺',
          color: '#E74C3C'
        };
      case 'incomplete':
        return {
          title: 'Form Incomplete',
          message: 'It looks like you didn\'t complete all required questions. You can continue where you left off.',
          emoji: '⚠️',
          color: '#F39C12'
        };
      default:
        return {
          title: 'Thank you!',
          message: 'Your health survey has been completed successfully. We appreciate your time and feedback.',
          emoji: '✅',
          color: '#2ECC71'
        };
    }
  };

  const handleRestart = () => {
    navigation.navigate('DemoForm', { formSlug: 'demo-health-survey' });
  };

  const handleReturnToApp = () => {
    navigation.navigate('Home');
  };

  const successInfo = getSuccessMessage();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h2" style={styles.headerTitle}>Survey Complete</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <Text variant="h1" style={styles.emoji}>{successInfo.emoji}</Text>
            
            <Text variant="h2" color={successInfo.color} style={styles.title}>
              {successInfo.title}
            </Text>
            
            <Text variant="body" style={styles.message}>
              {successInfo.message}
            </Text>
            
            {exitKey === 'high_risk' && (
              <View style={styles.warningContainer}>
                <Text variant="small" style={styles.warningText}>
                  Important: If you are experiencing a medical emergency, please call 911 or go to the nearest emergency room immediately.
                </Text>
              </View>
            )}
          </View>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            variant="secondary"
            title="Return to Home"
            onPress={handleReturnToApp}
            style={styles.secondaryButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#FF6B9D',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    marginBottom: 32,
  },
  cardContent: {
    alignItems: 'center',
    padding: 36,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    color: '#7F8C8D',
  },
  warningContainer: {
    backgroundColor: '#FFF5F5',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  warningText: {
    fontSize: 14,
    color: '#742A2A',
    fontWeight: '500',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#FF6B9D',
    borderRadius: 16,
    paddingVertical: 16,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderColor: '#FF6B9D',
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 16,
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B9D',
  },
});

export default SuccessScreen;