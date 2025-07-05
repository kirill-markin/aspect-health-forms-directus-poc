import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from '../components/ui';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

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
          color: '#E53E3E'
        };
      case 'incomplete':
        return {
          title: 'Form Incomplete',
          message: 'It looks like you didn\'t complete all required questions. You can continue where you left off.',
          emoji: '⚠️',
          color: '#F56500'
        };
      default:
        return {
          title: 'Thank you!',
          message: 'Your health survey has been completed successfully. We appreciate your time and feedback.',
          emoji: '✅',
          color: '#38A169'
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
      <LinearGradient
        colors={['#0066CC', '#4A90E2']}
        style={styles.header}
      >
        <Text variant="h2" color="#FFFFFF" style={styles.headerTitle}>Survey Complete</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <Text variant="h1" style={styles.emoji}>{successInfo.emoji}</Text>
            
            <Text variant="h2" color={successInfo.color} style={styles.title}>
              {successInfo.title}
            </Text>
            
            <Text variant="body" color="#4A5568" style={styles.message}>
              {successInfo.message}
            </Text>
            
            {exitKey === 'high_risk' && (
              <View style={styles.warningContainer}>
                <Text variant="small" color="#742A2A" style={styles.warningText}>
                  Important: If you are experiencing a medical emergency, please call 911 or go to the nearest emergency room immediately.
                </Text>
              </View>
            )}
          </View>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            title="Take Another Survey"
            onPress={handleRestart}
            style={styles.primaryButton}
          />
          
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 32,
  },
  cardContent: {
    alignItems: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    color: '#4A5568',
  },
  warningContainer: {
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E53E3E',
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
    backgroundColor: '#0066CC',
    borderRadius: 12,
    paddingVertical: 4,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderColor: '#0066CC',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 4,
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
});

export default SuccessScreen;