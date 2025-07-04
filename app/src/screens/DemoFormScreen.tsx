import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { directusClient, Form, FormVersion, Question, BranchingRule, Response, ResponseItem } from '../api/directus';
import FormRenderer from '../components/FormRenderer';

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
  const [answers, setAnswers] = useState<ResponseItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadForm();
  }, []);

  const loadForm = async () => {
    try {
      setLoading(true);
      
      // Load demo form by slug
      const formData = await directusClient.getFormBySlug('demo-health-survey');
      if (!formData) {
        setError('Demo form not found');
        return;
      }
      
      setForm(formData);
      
      // Load active version
      if (formData.active_version_id) {
        const versionData = await directusClient.getFormVersion(formData.active_version_id);
        if (versionData) {
          setFormVersion(versionData.version);
          setQuestions(versionData.questions);
          setBranchingRules(versionData.branchingRules);
          
          // Create or load response session
          await initializeResponse(versionData.version.id);
        }
      } else {
        setError('Form has no active version');
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
        setAnswers([]); // Start with empty answers
      }
    } catch (err) {
      console.error('Error initializing response:', err);
      setError('Failed to initialize form session');
    }
  };

  const handleAnswerChange = async (questionUid: string, value: any) => {
    if (!response) return;

    try {
      // Find the question by UID to get its ID
      const question = questions.find(q => q.uid === questionUid);
      if (!question) return;

      // Save answer to backend
      const success = await directusClient.saveAnswer(response.id, question.id, value);
      if (success) {
        // Update local answers
        const updatedAnswers = [...answers];
        const existingIndex = updatedAnswers.findIndex(a => a.question_id === question.id);
        
        const answerItem: ResponseItem = {
          id: `temp_${Date.now()}`,
          response_id: response.id,
          question_id: question.id,
          value: value
        };
        
        if (existingIndex >= 0) {
          updatedAnswers[existingIndex] = answerItem;
        } else {
          updatedAnswers.push(answerItem);
        }
        
        setAnswers(updatedAnswers);
        
        // Update progress
        const progress = Math.round((updatedAnswers.length / questions.length) * 100);
        await directusClient.updateResponse(response.id, { progress_pct: progress });
      }
    } catch (err) {
      console.error('Error saving answer:', err);
      Alert.alert('Error', 'Failed to save answer');
    }
  };

  const handleComplete = async (exitKey?: string) => {
    if (!response) return;

    try {
      // Mark response as completed
      await directusClient.completeResponse(response.id);
      
      // Navigate to success screen
      navigation.navigate('Success', { exitKey });
    } catch (err) {
      console.error('Error completing form:', err);
      Alert.alert('Error', 'Failed to complete form');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading form...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!form || !formVersion || questions.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Form configuration error</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{form.title}</Text>
        {form.description && (
          <Text style={styles.description}>{form.description}</Text>
        )}
      </View>
      
      <FormRenderer
        questions={questions}
        branchingRules={branchingRules}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        onComplete={handleComplete}
        hiddenFields={{
          utm_source: 'demo_app',
          user_segment: 'demo_user'
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  },
});

export default DemoFormScreen;