import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, ProgressBar, Card } from 'react-native-paper';
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
    const answerItem = answers.find(a => a.question_uid === currentQuestion.uid);
    return answerItem?.value_jsonb;
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
      <ProgressBar progress={getProgress()} style={styles.progressBar} />
      
      <Card style={styles.questionCard}>
        <Card.Content>
          <Text style={styles.questionNumber}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          
          <Text style={styles.questionText}>
            {currentQuestion.label}
            {currentQuestion.required && <Text style={styles.required}> *</Text>}
          </Text>
          
          {renderQuestionField()}
        </Card.Content>
      </Card>
      
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleBack}
          disabled={currentQuestionIndex === 0}
          style={styles.button}
        >
          Back
        </Button>
        
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={!canProceed}
          style={styles.button}
        >
          {currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  progressBar: {
    height: 4,
    marginBottom: 20,
  },
  questionCard: {
    flex: 1,
    marginBottom: 20,
  },
  questionNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    lineHeight: 24,
  },
  required: {
    color: '#e74c3c',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default FormRenderer;