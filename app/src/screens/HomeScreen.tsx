import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from '../components/ui';
import { StackNavigationProp } from '@react-navigation/stack';
import { directusClient, Form } from '../api/directus';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  Home: undefined;
  DemoForm: { formSlug: string };
  Success: { exitKey?: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableForms();
  }, []);

  const loadAvailableForms = async () => {
    try {
      console.log('Starting to load forms...');
      setLoading(true);
      
      // For the POC, we'll hardcode the demo form
      // In a real app, you'd fetch all published forms
      console.log('Fetching form with slug: demo-health-survey');
      const demoForm = await directusClient.getFormBySlug('demo-health-survey');
      console.log('Form fetched:', demoForm);
      
      if (demoForm) {
        setForms([demoForm]);
        console.log('Form loaded successfully');
      } else {
        console.log('No form found');
        setError('No forms available');
      }
    } catch (err) {
      console.error('Error loading forms:', err);
      setError('Failed to load forms: ' + (err as Error).message);
    } finally {
      console.log('Loading complete');
      setLoading(false);
    }
  };

  const handleStartForm = (formSlug: string) => {
    // Set up user context and UTM parameters
    const utmParams = {
      utm_source: 'demo_app',
      utm_medium: 'mobile',
      utm_campaign: 'health_survey',
      utm_content: 'home_screen'
    };
    
    // Store UTM parameters for form session
    // In a real app, you might want to use AsyncStorage or Redux
    
    navigation.navigate('DemoForm', { formSlug });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text variant="body" color="#718096" style={styles.loadingText}>Loading available forms...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="body" color="#E53E3E" style={styles.errorText}>{error}</Text>
        <Button variant="primary" title="Retry" onPress={loadAvailableForms} style={styles.retryButton} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#0066CC', '#4A90E2']}
        style={styles.header}
      >
        <Text variant="h2" color="#FFFFFF" style={styles.title}>Welcome to</Text>
        <Text variant="h1" color="#FFFFFF" style={styles.titleBold}>Aspect</Text>
        <Text variant="body" color="#E6F3FF" style={styles.subtitle}>
          Complete health surveys and assessments to help us provide better care
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {forms.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text variant="body" color="#718096" style={styles.emptyText}>No forms available at the moment</Text>
          </Card>
        ) : (
          forms.map((form) => (
            <Card key={form.id} style={styles.formCard}>
              <View style={styles.formContent}>
                <Text variant="h3" color="#1A202C" style={styles.formTitle}>{form.title}</Text>
                {form.description && (
                  <Text variant="body" color="#718096" style={styles.formDescription}>{form.description}</Text>
                )}
                
                <Button
                  variant="primary"
                  title="Start Survey"
                  onPress={() => handleStartForm(form.slug)}
                  style={styles.startButton}
                />
              </View>
            </Card>
          ))
        )}

        <Card style={styles.infoCard}>
          <Text variant="h3" color="#1A202C" style={styles.infoTitle}>📋 About Health Forms</Text>
          <Text variant="body" color="#4A5568" style={styles.infoText}>
            Your responses help us understand your health needs better and provide 
            personalized care recommendations. All information is kept confidential 
            and secure.
          </Text>
        </Card>
      </View>
    </ScrollView>
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
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  titleBold: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#E6F3FF',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  content: {
    padding: 20,
  },
  formCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formContent: {
    padding: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 24,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    paddingVertical: 4,
  },
  startButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#718096',
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: '#EBF8FF',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1A202C',
  },
  infoText: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    fontSize: 18,
    color: '#E53E3E',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
  },
});

export default HomeScreen;