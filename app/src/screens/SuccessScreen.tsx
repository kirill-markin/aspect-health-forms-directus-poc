import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
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
          color: '#e74c3c'
        };
      case 'incomplete':
        return {
          title: 'Form Incomplete',
          message: 'It looks like you didn\'t complete all required questions. You can continue where you left off.',
          color: '#f39c12'
        };
      default:
        return {
          title: 'Thank you!',
          message: 'Your health survey has been completed successfully. We appreciate your time and feedback.',
          color: '#2ecc71'
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
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <Text style={[styles.title, { color: successInfo.color }]}>
            {successInfo.title}
          </Text>
          
          <Text style={styles.message}>
            {successInfo.message}
          </Text>
          
          {exitKey === 'high_risk' && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                Important: If you are experiencing a medical emergency, please call 911 or go to the nearest emergency room immediately.
              </Text>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleRestart}
              style={styles.button}
            >
              Take Another Survey
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleReturnToApp}
              style={styles.button}
            >
              Return to App
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  content: {
    alignItems: 'center',
    padding: 20,
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
    color: '#333',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    marginVertical: 4,
  },
});

export default SuccessScreen;