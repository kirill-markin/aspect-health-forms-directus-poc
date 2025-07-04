import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { Question, ResponseItem, BranchingRule } from '../api/directus';
import BranchingEngine from '../utils/branching';
import ShortTextField from './fields/ShortTextField';
import LongTextField from './fields/LongTextField';
import MultipleChoiceField from './fields/MultipleChoiceField';
import NPSField from './fields/NPSField';

interface FormRendererProps {
  questions: Question[];
  branchingRules: BranchingRule[];
  answers: ResponseItem[];
  onAnswerChange: (questionUid: string, value: any) => void;
  onComplete: (exitKey?: string) => void;
  hiddenFields?: Record<string, any>;
}

// Custom Progress Bar Component
const CustomProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View 
          style={[
            styles.progressFill,
            { width: `${Math.max(0, Math.min(100, progress * 100))}%` }
          ]} 
        />
      </View>
    </View>
  );
};

const FormRenderer: React.FC<FormRendererProps> = ({
  questions,
  branchingRules,
  answers,
  onAnswerChange,
  onComplete,
  hiddenFields = {}
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [branchingEngine, setBranchingEngine] = useState<BranchingEngine | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [canProceed, setCanProceed] = useState(false);

  // Initialize branching engine
  useEffect(() => {
    const engine = new BranchingEngine(branchingRules, questions, answers, hiddenFields);
    setBranchingEngine(engine);
    
    // Get first question
    const firstAction = engine.getNextAction();
    if (firstAction.shouldExit) {
      onComplete(firstAction.exitKey);
      return;
    }
    
    const firstQuestion = questions.find(q => q.id === firstAction.nextQuestionId);
    if (firstQuestion) {
      setCurrentQuestion(firstQuestion);
      setCurrentQuestionIndex(0);
      checkCanProceed(firstQuestion, engine);
    }
  }, [questions, branchingRules, answers, hiddenFields]);

  // Check if user can proceed (required questions answered)
  const checkCanProceed = (question: Question, engine: BranchingEngine) => {
    if (!question.required) {
      setCanProceed(true);
      return;
    }
    
    const answeredQuestions = engine.getAnsweredQuestions();
    setCanProceed(answeredQuestions.includes(question.uid));
  };

  // Handle answer changes
  const handleAnswerChange = (value: any) => {
    if (!currentQuestion || !branchingEngine) return;
    
    branchingEngine.updateAnswer(currentQuestion.uid, value);
    onAnswerChange(currentQuestion.uid, value);
    checkCanProceed(currentQuestion, branchingEngine);
  };

  // Handle next button
  const handleNext = () => {
    if (!currentQuestion || !branchingEngine) return;
    
    const nextAction = branchingEngine.getNextAction(currentQuestion.uid);
    
    if (nextAction.shouldExit) {
      onComplete(nextAction.exitKey);
      return;
    }
    
    if (nextAction.nextQuestionId) {
      const nextQuestion = questions.find(q => q.id === nextAction.nextQuestionId);
      if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        const nextIndex = questions.findIndex(q => q.id === nextAction.nextQuestionId);
        setCurrentQuestionIndex(nextIndex);
        checkCanProceed(nextQuestion, branchingEngine);
      }
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      const prevQuestion = questions[currentQuestionIndex - 1];
      setCurrentQuestion(prevQuestion);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      checkCanProceed(prevQuestion, branchingEngine!);
    }
  };

  // Get current answer
  const getCurrentAnswer = () => {
    if (!currentQuestion) return null;
    const answerItem = answers.find(a => a.question_id === currentQuestion.id);
    if (!answerItem?.value) return null;
    
    // Parse JSON value back to original format (if it's JSON)
    if (typeof answerItem.value === 'string') {
      try {
        // Only parse if it looks like JSON (starts with quotes, brackets, or braces)
        if (answerItem.value.startsWith('"') || answerItem.value.startsWith('[') || answerItem.value.startsWith('{')) {
          return JSON.parse(answerItem.value);
        }
      } catch (error) {
        console.error('Error parsing answer value:', error);
        // Fall through to return original value
      }
    }
    
    return answerItem.value;
  };

  // Calculate progress
  const getProgress = () => {
    if (!branchingEngine || !currentQuestion) return 0;
    return branchingEngine.calculateProgress(currentQuestion.uid) / 100;
  };

  // Render question field based on type
  const renderQuestionField = () => {
    if (!currentQuestion) return null;
    
    const currentAnswer = getCurrentAnswer();
    
    switch (currentQuestion.type) {
      case 'short_text':
        return (
          <ShortTextField
            question={currentQuestion}
            value={currentAnswer}
            onChange={handleAnswerChange}
          />
        );
      
      case 'long_text':
        return (
          <LongTextField
            question={currentQuestion}
            value={currentAnswer}
            onChange={handleAnswerChange}
          />
        );
      
      case 'multiple_choice':
        return (
          <MultipleChoiceField
            question={currentQuestion}
            value={currentAnswer}
            onChange={handleAnswerChange}
          />
        );
      
      case 'nps':
        return (
          <NPSField
            question={currentQuestion}
            value={currentAnswer}
            onChange={handleAnswerChange}
          />
        );
      
      default:
        return (
          <Text style={styles.errorText}>
            Unsupported question type: {currentQuestion.type}
          </Text>
        );
    }
  };

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading form...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomProgressBar progress={getProgress()} />
      
      <Card style={styles.questionCard}>
        <Card.Content style={styles.questionContent}>
          <Text style={styles.questionNumber}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          
          <Text style={styles.questionText}>
            {currentQuestion.label}
            {currentQuestion.required && <Text style={styles.required}> *</Text>}
          </Text>
          
          <View style={styles.fieldContainer}>
            {renderQuestionField()}
          </View>

          {/* Next button positioned under the form values */}
          <View style={styles.nextButtonContainer}>
            <Button
              mode="contained"
              onPress={handleNext}
              disabled={!canProceed}
              style={styles.nextButton}
              labelStyle={styles.nextButtonLabel}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </View>
        </Card.Content>
      </Card>
      
      {/* Back button at the bottom */}
      {currentQuestionIndex > 0 && (
        <View style={styles.backButtonContainer}>
          <Button
            mode="text"
            onPress={handleBack}
            style={styles.backButton}
            labelStyle={styles.backButtonLabel}
          >
            ← Back
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066CC',
    borderRadius: 3,
  },
  questionCard: {
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  questionContent: {
    padding: 20,
  },
  questionNumber: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    fontWeight: '500',
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    lineHeight: 28,
    color: '#1A202C',
  },
  required: {
    color: '#E53E3E',
  },
  fieldContainer: {
    marginBottom: 24,
  },
  nextButtonContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  nextButton: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 32,
    minWidth: 120,
  },
  nextButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButtonContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButton: {
    borderRadius: 8,
  },
  backButtonLabel: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
    color: '#718096',
  },
  errorText: {
    fontSize: 16,
    color: '#E53E3E',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default FormRenderer;