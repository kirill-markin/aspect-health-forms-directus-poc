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
      this.answers.set(answer.question_uid, answer.value_jsonb);
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

    // Find applicable branching rules
    const applicableRules = this.rules.filter(rule => {
      // Rules that apply to the current question
      if (rule.when_question_id === currentQuestion.id) {
        return true;
      }
      
      // Rules that apply to hidden fields
      if (rule.when_hidden_field && this.hiddenFields[rule.when_hidden_field] !== undefined) {
        return true;
      }
      
      // Fallback rules
      if (rule.is_fallback) {
        return true;
      }
      
      return false;
    });

    // Evaluate rules in order
    for (const rule of applicableRules) {
      if (rule.is_fallback) {
        continue; // Process fallback rules last
      }

      const ruleResult = this.evaluateRule(rule, currentAnswer);
      if (ruleResult.matches) {
        return {
          nextQuestionId: rule.goto_question_id || undefined,
          exitKey: rule.goto_exit_key || undefined,
          shouldExit: !!rule.goto_exit_key
        };
      }
    }

    // Check fallback rules
    const fallbackRule = applicableRules.find(rule => rule.is_fallback);
    if (fallbackRule) {
      return {
        nextQuestionId: fallbackRule.goto_question_id || undefined,
        exitKey: fallbackRule.goto_exit_key || undefined,
        shouldExit: !!fallbackRule.goto_exit_key
      };
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
    let compareValue: any;
    
    // Get the value to compare against
    if (rule.when_hidden_field) {
      compareValue = this.hiddenFields[rule.when_hidden_field];
    } else {
      compareValue = currentAnswer;
    }

    // Handle null/undefined values
    if (compareValue === null || compareValue === undefined) {
      return { matches: rule.operator === 'is_empty' };
    }

    // Convert to string for comparison if needed
    const valueStr = String(compareValue);
    const ruleValueStr = rule.value ? String(rule.value) : '';

    switch (rule.operator) {
      case 'eq':
        return { matches: valueStr === ruleValueStr };
      
      case 'neq':
        return { matches: valueStr !== ruleValueStr };
      
      case 'in':
        return { matches: rule.value_array ? rule.value_array.includes(valueStr) : false };
      
      case 'not_in':
        return { matches: rule.value_array ? !rule.value_array.includes(valueStr) : true };
      
      case 'gt':
        const gtValue = parseFloat(valueStr);
        const gtCompare = parseFloat(ruleValueStr);
        return { matches: !isNaN(gtValue) && !isNaN(gtCompare) && gtValue > gtCompare };
      
      case 'lt':
        const ltValue = parseFloat(valueStr);
        const ltCompare = parseFloat(ruleValueStr);
        return { matches: !isNaN(ltValue) && !isNaN(ltCompare) && ltValue < ltCompare };
      
      case 'gte':
        const gteValue = parseFloat(valueStr);
        const gteCompare = parseFloat(ruleValueStr);
        return { matches: !isNaN(gteValue) && !isNaN(gteCompare) && gteValue >= gteCompare };
      
      case 'lte':
        const lteValue = parseFloat(valueStr);
        const lteCompare = parseFloat(ruleValueStr);
        return { matches: !isNaN(lteValue) && !isNaN(lteCompare) && lteValue <= lteCompare };
      
      case 'between':
        const betweenValue = parseFloat(valueStr);
        const betweenMin = parseFloat(ruleValueStr);
        const betweenMax = rule.value_max ? parseFloat(rule.value_max) : NaN;
        return { 
          matches: !isNaN(betweenValue) && !isNaN(betweenMin) && !isNaN(betweenMax) && 
                   betweenValue >= betweenMin && betweenValue <= betweenMax 
        };
      
      case 'is_empty':
        return { matches: !valueStr || valueStr.trim() === '' };
      
      case 'is_not_empty':
        return { matches: !!(valueStr && valueStr.trim() !== '') };
      
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