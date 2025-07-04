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
    this.rules = rules.sort((a, b) => a.order - b.order);
    this.questions = questions.sort((a, b) => a.order - b.order);
    this.hiddenFields = hiddenFields;
    
    // Convert answers array to map for easier lookup
    this.answers = new Map();
    answers.forEach(answer => {
      const question = this.questions.find(q => q.id === answer.question_id);
      if (question) {
        this.answers.set(question.uid, answer.value);
      }
    });
  }

  // Get the next question or exit action based on current state
  getNextAction(currentQuestionUid?: string): BranchingResult {
    // If no current question, start with first question
    if (!currentQuestionUid) {
      const firstQuestion = this.questions[0];
      return {
        nextQuestionId: firstQuestion?.id,
        shouldExit: !firstQuestion
      };
    }

    const currentQuestion = this.questions.find(q => q.uid === currentQuestionUid);
    if (!currentQuestion) {
      return { shouldExit: true };
    }

    const currentAnswer = this.answers.get(currentQuestionUid);

    // Find applicable branching rules for the current question
    const applicableRules = this.rules.filter(rule => {
      return rule.question_id === currentQuestion.id;
    });

    // Evaluate rules in order
    for (const rule of applicableRules) {
      const ruleResult = this.evaluateRule(rule, currentAnswer);
      if (ruleResult.matches) {
        return {
          nextQuestionId: rule.target_question_id || undefined,
          shouldExit: !rule.target_question_id
        };
      }
    }

    // Default behavior: go to next question in sequence
    const currentIndex = this.questions.findIndex(q => q.uid === currentQuestionUid);
    if (currentIndex >= 0 && currentIndex < this.questions.length - 1) {
      return {
        nextQuestionId: this.questions[currentIndex + 1].id,
        shouldExit: false
      };
    }

    // No more questions, exit
    return { shouldExit: true };
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
        return { matches: !compareValue || String(compareValue).trim() === '' };
      
      case 'is_not_empty':
        return { matches: !!(compareValue && String(compareValue).trim() !== '') };
      
      default:
        return { matches: false };
    }
  }

  // Update answers and recalculate next action
  updateAnswer(questionUid: string, value: any): void {
    this.answers.set(questionUid, value);
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
    return Array.from(this.answers.keys());
  }

  // Check if form is complete
  isComplete(): boolean {
    const requiredQuestions = this.questions.filter(q => q.required);
    return requiredQuestions.every(q => this.answers.has(q.uid));
  }
}

export default BranchingEngine;