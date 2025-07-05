import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from '../components/ui';
import { StackNavigationProp } from '@react-navigation/stack';
import { directusClient, Form } from '../api/directus';

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
      console.log('Starting to load all forms...');
      setLoading(true);
      
      // Fetch all published forms
      console.log('Fetching all published forms');
      const allForms = await directusClient.getAllPublishedForms();
      console.log('Forms fetched:', allForms);
      
      if (allForms && allForms.length > 0) {
        setForms(allForms);
        console.log('Forms loaded successfully:', allForms.length);
        setError(null);
      } else {
        console.log('No forms found');
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
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text variant="body" style={styles.loadingText}>Loading available forms...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="body" style={styles.errorText}>{error}</Text>
        <Button variant="primary" title="Retry" onPress={loadAvailableForms} style={styles.retryButton} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="h2" style={styles.title}>Welcome to</Text>
        <Text variant="h1" style={styles.titleBold}>Aspect</Text>
        <Text variant="body" style={styles.subtitle}>
          Complete health surveys and assessments to help us provide better care
        </Text>
      </View>

      <View style={styles.content}>
        {forms.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text variant="body" style={styles.emptyText}>No forms available at the moment</Text>
          </Card>
        ) : (
          forms.map((form) => (
            <Card key={form.id} style={styles.formCard}>
              <View style={styles.formContent}>
                <Text variant="h3" style={styles.formTitle}>{form.title}</Text>
                {form.description && (
                  <Text variant="body" style={styles.formDescription}>{form.description}</Text>
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
          <Text variant="h3" style={styles.infoTitle}>📋 About Health Forms</Text>
          <Text variant="body" style={styles.infoText}>
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
    backgroundColor: '#F5F6FA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    backgroundColor: '#FF6B9D',
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
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    opacity: 0.9,
  },
  content: {
    padding: 24,
  },
  formCard: {
    marginBottom: 24,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  formContent: {
    padding: 28,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
  },
  formDescription: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 24,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#FF6B9D',
    borderRadius: 16,
    paddingVertical: 16,
  },
  startButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyCard: {
    padding: 28,
    borderRadius: 20,
    marginBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#7F8C8D',
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: '#FFF5F8',
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B9D',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#2C3E50',
  },
  infoText: {
    fontSize: 16,
    color: '#7F8C8D',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F6FA',
  },
  errorText: {
    fontSize: 18,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF6B9D',
    borderRadius: 16,
  },
});

export default HomeScreen;