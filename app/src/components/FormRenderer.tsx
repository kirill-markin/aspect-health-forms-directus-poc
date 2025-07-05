import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card } from './ui';
import { Question, ResponseItem, BranchingRule } from '../api/directus';
import BranchingEngine from '../utils/branching';
import ShortTextField from './fields/ShortTextField';
import LongTextField from './fields/LongTextField';
import SingleChoiceField from './fields/SingleChoiceField';
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
  // Local state for current answers (UI only, not saved to server)
  const [localAnswers, setLocalAnswers] = useState<Map<string, any>>(new Map());

  // Initialize branching engine ONLY once
  useEffect(() => {
    console.log('🔄 FormRenderer: Initializing branching engine with answers:', answers.length);
    const engine = new BranchingEngine(branchingRules, questions, answers, hiddenFields);
    setBranchingEngine(engine);
    
    // Initialize local answers from server answers
    const initialLocalAnswers = new Map<string, any>();
    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.question_id);
      if (question) {
        // Parse JSON value back to original format (if it's JSON)
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
        initialLocalAnswers.set(question.uid, value);
      }
    });
    setLocalAnswers(initialLocalAnswers);
    
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
  }, [questions, branchingRules, hiddenFields]); // Remove 'answers' from dependencies

  // Check if user can proceed (required questions answered)
  const checkCanProceed = useCallback((question: Question) => {
    if (!question.required) {
      setCanProceed(true);
      return;
    }
    
    // Check local answers for current question
    const localAnswer = localAnswers.get(question.uid);
    const hasAnswer = localAnswer !== null && localAnswer !== undefined && 
                     (Array.isArray(localAnswer) ? localAnswer.length > 0 : String(localAnswer).trim() !== '');
    setCanProceed(hasAnswer);
  }, [localAnswers]);

  // Handle answer changes (local only, not saved to server)
  const handleAnswerChange = (value: any) => {
    if (!currentQuestion) return;
    
    // Update local state only
    const newLocalAnswers = new Map(localAnswers);
    newLocalAnswers.set(currentQuestion.uid, value);
    setLocalAnswers(newLocalAnswers);
    
    // Update canProceed based on local state
    checkCanProceed(currentQuestion);
    
    // Auto-advance for single choice questions
    if (currentQuestion.type === 'single_choice' && value) {
      // Add small delay to show selection feedback, then save and proceed
      setTimeout(() => {
        saveCurrentAnswerAndProceed(value);
      }, 300);
    }
  };

  // Save current answer to server and proceed to next question
  const saveCurrentAnswerAndProceed = async (value?: any) => {
    console.log('💾 FormRenderer: saveCurrentAnswerAndProceed called with value:', value);
    if (!currentQuestion || !branchingEngine) return;
    
    // Get value from parameter or local state
    const answerValue = value !== undefined ? value : localAnswers.get(currentQuestion.uid);
    console.log('💾 FormRenderer: Answer value to save:', answerValue, 'for question:', currentQuestion.uid);
    
    if (answerValue !== undefined) {
      // Update local answers FIRST (synchronously in the new Map)
      const newLocalAnswers = new Map(localAnswers);
      newLocalAnswers.set(currentQuestion.uid, answerValue);
      setLocalAnswers(newLocalAnswers);
      console.log('💾 FormRenderer: Updated local answers with value:', answerValue);
      
      // Save to server
      console.log('💾 FormRenderer: Saving to server...');
      onAnswerChange(currentQuestion.uid, answerValue);
      
      // IMPORTANT: Update branching engine with current answer BEFORE applying rules
      console.log('💾 FormRenderer: Updating branching engine...');
      branchingEngine.updateAnswer(currentQuestion.uid, answerValue);
      
      // Wait a bit for save to complete, then proceed with the updated local answers
      console.log('💾 FormRenderer: Scheduling handleNext with updated answers...');
      setTimeout(() => {
        handleNextWithUpdatedAnswers(newLocalAnswers);
      }, 100);
    }
  };

  // Handle next button with specific local answers (to avoid stale state)
  const handleNextWithUpdatedAnswers = (updatedLocalAnswers?: Map<string, any>) => {
    console.log('➡️ FormRenderer: handleNextWithUpdatedAnswers called');
    if (!currentQuestion || !branchingEngine) return;
    
    // Use provided updated answers or current local answers
    const currentLocalAnswers = updatedLocalAnswers || localAnswers;
    
    // Save current answer to server if not already saved (for manual Next button clicks)
    const localAnswer = currentLocalAnswers.get(currentQuestion.uid);
    if (localAnswer !== undefined) {
      console.log('➡️ FormRenderer: Local answer found:', localAnswer, 'for question:', currentQuestion.uid);
      // Check if branching engine already has this answer
      const engineAnswer = branchingEngine.getAnswer(currentQuestion.uid);
      console.log('➡️ FormRenderer: Engine answer:', engineAnswer, 'vs local answer:', localAnswer);
      
      if (engineAnswer !== localAnswer) {
        console.log('➡️ FormRenderer: Answer differs in engine, updating both server and engine');
        // Save to server
        onAnswerChange(currentQuestion.uid, localAnswer);
        // Update branching engine with current answer
        branchingEngine.updateAnswer(currentQuestion.uid, localAnswer);
      } else {
        console.log('➡️ FormRenderer: Answer already matches in engine, skipping save');
      }
    }
    
    console.log('➡️ FormRenderer: Getting next action for question:', currentQuestion.uid);
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
    handleNextWithUpdatedAnswers();
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

  // Get current answer (check local first, then server)
  const getCurrentAnswer = () => {
    if (!currentQuestion) return null;
    
    // First check local answers
    const localAnswer = localAnswers.get(currentQuestion.uid);
    if (localAnswer !== undefined) {
      return localAnswer;
    }
    
    // Fallback to server answers
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