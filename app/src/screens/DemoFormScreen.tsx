import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { directusClient, Form, FormVersion, Question, BranchingRule, Response, ResponseItem } from '../api/directus';
import FormRenderer from '../components/FormRenderer';
import { LinearGradient } from 'expo-linear-gradient';

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
        <ActivityIndicator size="large" color="#0066CC" />
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#0066CC', '#4A90E2']}
        style={styles.header}
      >
        <Text style={styles.title}>{form.title}</Text>
        {form.description && (
          <Text style={styles.description}>{form.description}</Text>
        )}
      </LinearGradient>
      
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    color: '#E6F3FF',
    textAlign: 'center',
    lineHeight: 20,
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
  },
});

export default DemoFormScreen;