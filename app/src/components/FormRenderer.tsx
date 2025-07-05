import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card } from './ui';
import { Question, ResponseItem, BranchingRule } from '../api/directus';
import BranchingEngine from '../utils/branching';
import FormAnswerStore from '../stores/FormAnswerStore';
import ShortTextField from './fields/ShortTextField';
import LongTextField from './fields/LongTextField';
import SingleChoiceField from './fields/SingleChoiceField';
import MultipleChoiceField from './fields/MultipleChoiceField';
import NPSField from './fields/NPSField';

interface FormRendererProps {
  questions: Question[];
  branchingRules: BranchingRule[];
  answerStore: FormAnswerStore;
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
  answerStore,
  onComplete,
  hiddenFields = {}
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [branchingEngine, setBranchingEngine] = useState<BranchingEngine | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [canProceed, setCanProceed] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState<Map<string, any>>(new Map());

  // Initialize branching engine and answer store listeners
  useEffect(() => {
    console.log('🔄 FormRenderer: Initializing branching engine');
    
    // Get current answers from store
    const currentAnswers = answerStore.getAllAnswers();
    
    // Convert to ResponseItem format for branching engine
    const responseItems: ResponseItem[] = [];
    currentAnswers.forEach((value, questionUid) => {
      const question = questions.find(q => q.uid === questionUid);
      if (question) {
        responseItems.push({
          id: `temp_${question.id}`,
          response_id: 'temp',
          question_id: question.id,
          value: value
        });
      }
    });
    
    const engine = new BranchingEngine(branchingRules, questions, responseItems, hiddenFields);
    setBranchingEngine(engine);
    
    // Setup answer store listeners
    answerStore.onSaveStateChange((saving: boolean, hasUnsaved: boolean) => {
      // Console logging only - no UI state updates
      console.log('💾 FormRenderer: Save state changed - saving:', saving, 'hasUnsaved:', hasUnsaved);
    });
    
    // Setup answer change listener to update React state
    answerStore.onAnswerChange((questionUid: string, value: any) => {
      console.log('📝 FormRenderer: Answer changed in store - updating React state');
      setCurrentAnswers(new Map(answerStore.getAllAnswers()));
    });
    
    // Initialize currentAnswers with current store state
    setCurrentAnswers(new Map(answerStore.getAllAnswers()));
    
    // Get first question ONLY during initial load
    console.log('🔄 FormRenderer: Getting first question...');
    const firstAction = engine.getNextAction();
    if (firstAction.shouldExit) {
      console.log('🔄 FormRenderer: Form should exit immediately');
      onComplete(firstAction.exitKey);
      return;
    }
    
    const firstQuestion = questions.find(q => q.id === firstAction.nextQuestionId);
    if (firstQuestion) {
      console.log('🔄 FormRenderer: Setting first question:', firstQuestion.uid);
      setCurrentQuestion(firstQuestion);
      setCurrentQuestionIndex(0);
      checkCanProceed(firstQuestion);
    }
  }, [questions, branchingRules, hiddenFields, answerStore]);

  // Check if user can proceed (required questions answered)
  const checkCanProceed = useCallback((question: Question) => {
    if (!question.required) {
      setCanProceed(true);
      return;
    }
    
    // Check current answers for current question
    const answer = currentAnswers.get(question.uid);
    const hasAnswer = answer !== null && answer !== undefined && 
                     (Array.isArray(answer) ? answer.length > 0 : String(answer).trim() !== '');
    setCanProceed(hasAnswer);
  }, [currentAnswers]);

  // Handle answer changes (update answer store)
  const handleAnswerChange = (value: any) => {
    if (!currentQuestion) return;
    
    // Update answer store (will trigger autosave)
    answerStore.updateAnswer(currentQuestion.uid, currentQuestion.id, value);
    
    // Update canProceed based on current answer
    checkCanProceed(currentQuestion);
    
    // Auto-advance for single choice questions - simulate Next button click
    if (currentQuestion.type === 'single_choice' && value) {
      // Add small delay to show selection feedback, then proceed exactly like Next button
      setTimeout(() => {
        console.log('📻 FormRenderer: Auto-advancing single choice - simulating Next button click');
        handleNext();
      }, 300);
    }
  };

  // Proceed to next question using branching engine
  const proceedToNext = () => {
    console.log('➡️ FormRenderer: proceedToNext called');
    if (!currentQuestion || !branchingEngine) return;
    
    // Get current answer directly from answer store (most up-to-date)
    const currentAnswer = answerStore.getAnswer(currentQuestion.uid);
    console.log('➡️ FormRenderer: Using answer value:', currentAnswer, 'for question:', currentQuestion.uid);
    
    // Update branching engine with current answer
    if (currentAnswer !== undefined) {
      branchingEngine.updateAnswer(currentQuestion.uid, currentAnswer);
    }
    
    // Get next action
    const nextAction = branchingEngine.getNextAction(currentQuestion.uid);
    
    if (nextAction.shouldExit) {
      console.log('➡️ FormRenderer: Form should exit with key:', nextAction.exitKey);
      onComplete(nextAction.exitKey);
      return;
    }
    
    if (nextAction.nextQuestionId) {
      const nextQuestion = questions.find(q => q.id === nextAction.nextQuestionId);
      if (nextQuestion) {
        console.log('➡️ FormRenderer: Transitioning to question:', nextQuestion.uid);
        setCurrentQuestion(nextQuestion);
        const nextIndex = questions.findIndex(q => q.id === nextAction.nextQuestionId);
        setCurrentQuestionIndex(nextIndex);
        checkCanProceed(nextQuestion);
      }
    }
  };

  // Handle next button (public interface)
  const handleNext = () => {
    console.log('➡️ FormRenderer: handleNext called (public interface)');
    proceedToNext();
  };

  // Handle back button
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      const prevQuestion = questions[currentQuestionIndex - 1];
      setCurrentQuestion(prevQuestion);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      checkCanProceed(prevQuestion);
    }
  };

  // Get current answer from React state (synchronized with answer store)
  const getCurrentAnswer = () => {
    if (!currentQuestion) return null;
    return currentAnswers.get(currentQuestion.uid);
  };

  // Calculate progress
  const getProgress = () => {
    if (!branchingEngine || !currentQuestion) return 0;
    return branchingEngine.calculateProgress(currentQuestion.uid) / 100;
  };

  // Check if current question should show Next button
  const shouldShowNextButton = () => {
    if (!currentQuestion) return false;
    
    // Hide Next button for single choice questions since they auto-advance
    if (currentQuestion.type === 'single_choice') {
      return false;
    }
    
    return true;
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
      
      case 'single_choice':
        return (
          <SingleChoiceField
            question={currentQuestion}
            value={currentAnswer}
            onChange={handleAnswerChange}
          />
        );
      
      case 'multiple_choice':
        // Ensure we always pass an array for multiple choice
        const multipleChoiceValue = Array.isArray(currentAnswer) ? currentAnswer : (currentAnswer ? [currentAnswer] : []);
        return (
          <MultipleChoiceField
            question={currentQuestion}
            value={multipleChoiceValue}
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
          <Text variant="body" color="#E53E3E" style={styles.errorText}>
            Unsupported question type: {currentQuestion.type}
          </Text>
        );
    }
  };

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text variant="body" color="#718096" style={styles.loadingText}>Loading form...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomProgressBar progress={getProgress()} />
      
      <Card style={styles.questionCard}>
        <View style={styles.questionContent}>
          <Text variant="small" color="#718096" style={styles.questionNumber}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          
          <Text variant="h3" color="#1A202C" style={styles.questionText}>
            {currentQuestion.label}
            {currentQuestion.required && <Text variant="h3" color="#E53E3E"> *</Text>}
          </Text>
          
          <View style={styles.fieldContainer}>
            {renderQuestionField()}
          </View>

          {/* Next button positioned under the form values */}
          {shouldShowNextButton() && (
            <View style={styles.nextButtonContainer}>
              <Button
                variant="primary"
                title={currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
                onPress={handleNext}
                disabled={!canProceed}
                style={styles.nextButton}
              />
            </View>
          )}
        </View>
      </Card>
      
      {/* Back button at the bottom */}
      {currentQuestionIndex > 0 && (
        <View style={styles.backButtonContainer}>
          <Button
            variant="text"
            title="← Back"
            onPress={handleBack}
            style={styles.backButton}
          />
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