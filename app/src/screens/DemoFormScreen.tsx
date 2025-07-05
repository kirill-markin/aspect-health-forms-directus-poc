import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, ActivityIndicator } from '../components/ui';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { directusClient, Form, FormVersion, Question, BranchingRule, Response, ResponseItem } from '../api/directus';
import FormRenderer from '../components/FormRenderer';
import FormAnswerStore from '../stores/FormAnswerStore';

type RootStackParamList = {
  Home: undefined;
  DemoForm: { formSlug: string };
  Success: { exitKey?: string };
};

type DemoFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DemoForm'>;
type DemoFormScreenRouteProp = RouteProp<RootStackParamList, 'DemoForm'>;

interface DemoFormScreenProps {
  navigation: DemoFormScreenNavigationProp;
  route: DemoFormScreenRouteProp;
}

const DemoFormScreen: React.FC<DemoFormScreenProps> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [formVersion, setFormVersion] = useState<FormVersion | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [branchingRules, setBranchingRules] = useState<BranchingRule[]>([]);
  const [response, setResponse] = useState<Response | null>(null);
  const [answerStore, setAnswerStore] = useState<FormAnswerStore | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoize hiddenFields to prevent recreation
  const hiddenFields = useMemo(() => ({
    utm_source: 'demo_app',
    user_segment: 'demo_user'
  }), []);

  useEffect(() => {
    loadForm();
  }, []);

  const loadForm = async () => {
    try {
      setLoading(true);
      
      // Load form by slug from route parameters
      const formSlug = route.params.formSlug;
      const formData = await directusClient.getFormBySlug(formSlug);
      if (!formData) {
        setError(`Form '${formSlug}' not found`);
        return;
      }
      
      setForm(formData);
      
      // Load latest version
      const versionData = await directusClient.getLatestFormVersion(formData.id);
      if (versionData) {
        setFormVersion(versionData.version);
        setQuestions(versionData.questions);
        setBranchingRules(versionData.branchingRules);
        
        // Create or load response session
        await initializeResponse(versionData.version.id);
      } else {
        setError('Form has no versions available');
      }
    } catch (err) {
      console.error('Error loading form:', err);
      setError('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const initializeResponse = async (formVersionId: string) => {
    try {
      // Generate a unique user ID for this session
      let userId = await AsyncStorage.getItem('demo_user_id');
      if (!userId) {
        userId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('demo_user_id', userId);
      }

      // Create new response session
      const responseData = await directusClient.createResponse(formVersionId, userId);
      if (responseData) {
        setResponse(responseData);
        
        // Create answer store
        const store = new FormAnswerStore({
          responseId: responseData.id,
          autosaveInterval: 2000, // 2 seconds
          enableOffline: true
        });
        
        // Load existing answers from server
        const existingAnswers = await directusClient.getResponseAnswers(responseData.id);
        const serverAnswers = existingAnswers.map(answer => {
          const question = questions.find(q => q.id === answer.question_id);
          if (question) {
            // Parse JSON value back to original format
            let value = answer.value;
            if (typeof value === 'string') {
              try {
                if (value.startsWith('"') || value.startsWith('[') || value.startsWith('{')) {
                  value = JSON.parse(value);
                }
              } catch (error) {
                console.error('Error parsing answer value:', error);
              }
            }
            return {
              questionUid: question.uid,
              questionId: question.id,
              value: value
            };
          }
          return null;
        }).filter(Boolean) as Array<{ questionUid: string; questionId: string; value: any }>;
        
        store.initializeAnswers(serverAnswers);
        setAnswerStore(store);
      }
    } catch (err) {
      console.error('Error initializing response:', err);
      setError('Failed to initialize form session');
    }
  };

  // Cleanup answer store on unmount
  useEffect(() => {
    return () => {
      if (answerStore) {
        answerStore.destroy();
      }
    };
  }, [answerStore]);

  const handleComplete = useCallback(async (exitKey?: string) => {
    console.log('🏁 DemoFormScreen: handleComplete called with exitKey:', exitKey);
    if (!response || !answerStore) return;

    try {
      // Save any unsaved answers before completion
      await answerStore.saveAndDestroy();
      
      // Mark response as completed
      await directusClient.completeResponse(response.id);
      
      // Navigate to success screen
      navigation.navigate('Success', { exitKey });
    } catch (err) {
      console.error('Error completing form:', err);
      Alert.alert('Error', 'Failed to complete form');
    }
  }, [response, answerStore, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text variant="body" style={styles.loadingText}>Loading form...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="body" style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!form || !formVersion || questions.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="body" style={styles.errorText}>Form configuration error</Text>
      </View>
    );
  }

  if (!answerStore) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text variant="body" style={styles.loadingText}>Initializing form...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h3" style={styles.title}>{form.title}</Text>
        {form.description && (
          <Text variant="body" style={styles.description}>{form.description}</Text>
        )}
      </View>
      
      <FormRenderer
        questions={questions}
        branchingRules={branchingRules}
        answerStore={answerStore}
        onComplete={handleComplete}
        hiddenFields={hiddenFields}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#FF6B9D',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
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
  },
});

export default DemoFormScreen;