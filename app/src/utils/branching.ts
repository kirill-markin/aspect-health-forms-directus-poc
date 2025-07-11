import { BranchingRule, Question, ResponseItem } from '../api/directus';

export interface BranchingResult {
  nextQuestionId?: string;
  exitKey?: string;
  shouldExit: boolean;
}

export class BranchingEngine {
  private rules: BranchingRule[];
  private questions: Question[];
  private answers: Map<string, any>;
  private hiddenFields: Record<string, any>;

  constructor(
    rules: BranchingRule[],
    questions: Question[],
    answers: ResponseItem[] = [],
    hiddenFields: Record<string, any> = {}
  ) {
    // Parse rule values from JSON strings (if they are JSON)
    this.rules = rules.sort((a, b) => a.order - b.order).map(rule => {
      let value = rule.value;
      if (typeof value === 'string') {
        try {
          // Only parse if it looks like JSON (starts with quotes, brackets, or braces)
          if (value.startsWith('"') || value.startsWith('[') || value.startsWith('{')) {
            value = JSON.parse(value);
          }
        } catch (error) {
          console.error('Error parsing rule value:', error);
          // Keep original value if parsing fails
        }
      }
      return { ...rule, value };
    });
    
    this.questions = questions.sort((a, b) => a.order - b.order);
    this.hiddenFields = hiddenFields;
    
    // Convert answers array to map for easier lookup
    this.answers = new Map();
    answers.forEach(answer => {
      const question = this.questions.find(q => q.id === answer.question_id);
      if (question) {
        // Parse JSON value back to original format (if it's JSON)
        let value = answer.value;
        if (typeof value === 'string') {
          try {
            // Only parse if it looks like JSON (starts with quotes, brackets, or braces)
            if (value.startsWith('"') || value.startsWith('[') || value.startsWith('{')) {
              value = JSON.parse(value);
            }
          } catch (error) {
            console.error('Error parsing answer value in branching engine:', error);
            // Keep original value if parsing fails
          }
        }
        this.answers.set(question.uid, value);
      }
    });
  }

  // Get the next question or exit action based on current state
  getNextAction(currentQuestionUid?: string): BranchingResult {
    console.log('🔀 BranchingEngine.getNextAction called with:', currentQuestionUid);
    
    // If no current question, start with first question
    if (!currentQuestionUid) {
      const firstQuestion = this.questions[0];
      console.log('🔀 No current question, returning first question:', firstQuestion?.uid);
      return {
        nextQuestionId: firstQuestion?.id,
        shouldExit: !firstQuestion
      };
    }

    const currentQuestion = this.questions.find(q => q.uid === currentQuestionUid);
    if (!currentQuestion) {
      console.log('🔀 Current question not found, exiting');
      return { shouldExit: true };
    }

    const currentAnswer = this.answers.get(currentQuestionUid);
    console.log('🔀 Current question:', currentQuestion.uid, 'Answer:', currentAnswer);

    // Find applicable branching rules for the current question
    const applicableRules = this.rules.filter(rule => {
      return rule.question_id === currentQuestion.id;
    });
    
    console.log('🔀 Found', applicableRules.length, 'applicable rules for question:', currentQuestion.uid);

    // Evaluate rules in order
    for (const rule of applicableRules) {
      const ruleResult = this.evaluateRule(rule, currentAnswer);
      console.log('🔀 Rule evaluation:', {
        operator: rule.operator,
        ruleValue: rule.value,
        currentAnswer: currentAnswer,
        matches: ruleResult.matches,
        targetQuestionId: rule.target_question_id,
        exitKey: rule.exit_key
      });
      
      if (ruleResult.matches) {
        const targetQuestion = this.questions.find(q => q.id === rule.target_question_id);
        console.log('🔀 Rule matched! Transitioning to:', targetQuestion?.uid || 'EXIT');
        return {
          nextQuestionId: rule.target_question_id || undefined,
          exitKey: rule.exit_key || undefined,
          shouldExit: !rule.target_question_id
        };
      }
    }

    // Default behavior: go to next question in sequence
    const currentIndex = this.questions.findIndex(q => q.uid === currentQuestionUid);
    if (currentIndex >= 0 && currentIndex < this.questions.length - 1) {
      const nextQuestion = this.questions[currentIndex + 1];
      console.log('🔀 No rules matched, going to next question in sequence:', nextQuestion.uid);
      return {
        nextQuestionId: nextQuestion.id,
        shouldExit: false
      };
    }

    // No more questions, exit with default success
    console.log('🔀 No more questions, exiting with success');
    return { shouldExit: true, exitKey: 'success' };
  }

  private evaluateRule(rule: BranchingRule, currentAnswer: any): { matches: boolean } {
    const compareValue = currentAnswer;

    // Handle null/undefined values
    if (compareValue === null || compareValue === undefined) {
      return { matches: rule.operator === 'is_empty' };
    }

    switch (rule.operator) {
      case 'eq':
        return { matches: compareValue === rule.value };
      
      case 'neq':
        return { matches: compareValue !== rule.value };
      
      case 'in':
        return { matches: Array.isArray(rule.value) && rule.value.includes(compareValue) };
      
      case 'not_in':
        return { matches: Array.isArray(rule.value) && !rule.value.includes(compareValue) };
      
      case 'gt':
        const gtValue = parseFloat(String(compareValue));
        const gtCompare = parseFloat(String(rule.value));
        return { matches: !isNaN(gtValue) && !isNaN(gtCompare) && gtValue > gtCompare };
      
      case 'lt':
        const ltValue = parseFloat(String(compareValue));
        const ltCompare = parseFloat(String(rule.value));
        return { matches: !isNaN(ltValue) && !isNaN(ltCompare) && ltValue < ltCompare };
      
      case 'is_empty':
        // Handle arrays (multiple choice)
        if (Array.isArray(compareValue)) {
          return { matches: compareValue.length === 0 };
        }
        // Handle strings and other values
        return { matches: !compareValue || String(compareValue).trim() === '' };
      
      case 'is_not_empty':
        // Handle arrays (multiple choice)
        if (Array.isArray(compareValue)) {
          return { matches: compareValue.length > 0 };
        }
        // Handle strings and other values
        return { matches: !!(compareValue && String(compareValue).trim() !== '') };
      
      default:
        return { matches: false };
    }
  }

  // Update answers and recalculate next action
  updateAnswer(questionUid: string, value: any): void {
    console.log('📝 BranchingEngine.updateAnswer:', questionUid, '=', value);
    this.answers.set(questionUid, value);
  }

  // Get answer for a specific question
  getAnswer(questionUid: string): any {
    return this.answers.get(questionUid);
  }

  // Calculate progress percentage
  calculateProgress(currentQuestionUid?: string): number {
    if (!currentQuestionUid) return 0;
    
    const currentIndex = this.questions.findIndex(q => q.uid === currentQuestionUid);
    if (currentIndex === -1) return 0;
    
    return Math.round(((currentIndex + 1) / this.questions.length) * 100);
  }

  // Get all questions that have been answered
  getAnsweredQuestions(): string[] {
    const answeredQuestions: string[] = [];
    
    for (const [questionUid, value] of this.answers.entries()) {
      // Check if the question is actually answered (not empty)
      if (Array.isArray(value)) {
        // For arrays (multiple choice), must have at least one selection
        if (value.length > 0) {
          answeredQuestions.push(questionUid);
        }
      } else {
        // For other types, check if value is not empty
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          answeredQuestions.push(questionUid);
        }
      }
    }
    
    return answeredQuestions;
  }

  // Check if form is complete
  isComplete(): boolean {
    const requiredQuestions = this.questions.filter(q => q.required);
    return requiredQuestions.every(q => this.answers.has(q.uid));
  }
}

export default BranchingEngine;