import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import { directusClient, Form } from '../api/directus';

interface HomeScreenProps {
  onStartForm: (formSlug: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartForm }) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableForms();
  }, []);

  const loadAvailableForms = async () => {
    try {
      setLoading(true);
      
      // For the POC, we'll hardcode the demo form
      // In a real app, you'd fetch all published forms
      const demoForm = await directusClient.getFormBySlug('demo-health-survey');
      
      if (demoForm) {
        setForms([demoForm]);
      } else {
        setError('No forms available');
      }
    } catch (err) {
      console.error('Error loading forms:', err);
      setError('Failed to load forms');
    } finally {
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
    
    onStartForm(formSlug);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading available forms...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="outlined" onPress={loadAvailableForms} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Aspect Health Forms</Text>
        <Text style={styles.subtitle}>
          Complete health surveys and assessments to help us provide better care
        </Text>
      </View>

      <View style={styles.formsContainer}>
        <Text style={styles.sectionTitle}>Available Forms</Text>
        
        {forms.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No forms available at the moment</Text>
            </Card.Content>
          </Card>
        ) : (
          forms.map((form) => (
            <Card key={form.id} style={styles.formCard}>
              <Card.Content>
                <Text style={styles.formTitle}>{form.title}</Text>
                {form.description && (
                  <Text style={styles.formDescription}>{form.description}</Text>
                )}
                
                <View style={styles.formMeta}>
                  <Text style={styles.formStatus}>
                    Status: {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                  </Text>
                </View>
              </Card.Content>
              
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={() => handleStartForm(form.slug)}
                  style={styles.startButton}
                >
                  Start Form
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </View>

      <View style={styles.infoSection}>
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>About Health Forms</Text>
            <Text style={styles.infoText}>
              Your responses help us understand your health needs better and provide 
              personalized care recommendations. All information is kept confidential 
              and secure.
            </Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  formsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  formCard: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  formMeta: {
    marginBottom: 8,
  },
  formStatus: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  startButton: {
    marginLeft: 'auto',
  },
  emptyCard: {
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  infoSection: {
    padding: 16,
    paddingTop: 0,
  },
  infoCard: {
    backgroundColor: '#e8f4fd',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
});

export default HomeScreen;