import { directusClient } from '../api/directus';

export interface FormAnswer {
  questionUid: string;
  questionId: string;
  value: any;
  isDirty: boolean;  // изменен локально, но не сохранен на сервере
  isSaving: boolean; // в процессе сохранения
  lastSaved: Date | null;
  error: string | null;
}

export interface FormAnswerStoreConfig {
  responseId: string;
  autosaveInterval: number; // milliseconds
  enableOffline: boolean;
}

export class FormAnswerStore {
  private answers: Map<string, FormAnswer> = new Map();
  private config: FormAnswerStoreConfig;
  private autosaveTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  // Event callbacks
  private onAnswerChangeCallback: ((questionUid: string, value: any) => void) | null = null;
  private onSaveStateChangeCallback: ((isSaving: boolean, hasUnsaved: boolean) => void) | null = null;

  constructor(config: FormAnswerStoreConfig) {
    this.config = config;
    this.startAutosave();
  }

  // Initialize store with existing answers from server
  initializeAnswers(serverAnswers: Array<{ questionUid: string; questionId: string; value: any }>): void {
    console.log('📦 FormAnswerStore: Initializing with', serverAnswers.length, 'server answers');
    
    serverAnswers.forEach(answer => {
      this.answers.set(answer.questionUid, {
        questionUid: answer.questionUid,
        questionId: answer.questionId,
        value: answer.value,
        isDirty: false,
        isSaving: false,
        lastSaved: new Date(),
        error: null
      });
    });
    
    this.notifyStateChange();
  }

  // Update answer (local only, will be saved by autosave)
  updateAnswer(questionUid: string, questionId: string, value: any): void {
    console.log('📝 FormAnswerStore: Updating answer', questionUid, '=', value);
    
    const existing = this.answers.get(questionUid);
    const newAnswer: FormAnswer = {
      questionUid,
      questionId,
      value,
      isDirty: true,
      isSaving: existing?.isSaving || false,
      lastSaved: existing?.lastSaved || null,
      error: null
    };
    
    this.answers.set(questionUid, newAnswer);
    
    // Notify listeners
    this.onAnswerChangeCallback?.(questionUid, value);
    this.notifyStateChange();
  }

  // Get answer for a question
  getAnswer(questionUid: string): any {
    return this.answers.get(questionUid)?.value;
  }

  // Get all answers as a map
  getAllAnswers(): Map<string, any> {
    const result = new Map<string, any>();
    this.answers.forEach((answer, questionUid) => {
      result.set(questionUid, answer.value);
    });
    return result;
  }

  // Get unsaved answers
  getUnsavedAnswers(): FormAnswer[] {
    return Array.from(this.answers.values()).filter(answer => answer.isDirty);
  }

  // Check if there are unsaved changes
  hasUnsavedChanges(): boolean {
    return this.getUnsavedAnswers().length > 0;
  }

  // Check if currently saving
  isSaving(): boolean {
    return Array.from(this.answers.values()).some(answer => answer.isSaving);
  }

  // Manual save all dirty answers
  async saveAll(): Promise<boolean> {
    const unsavedAnswers = this.getUnsavedAnswers();
    if (unsavedAnswers.length === 0) {
      console.log('📦 FormAnswerStore: No unsaved answers to save');
      return true;
    }

    console.log('💾 FormAnswerStore: Saving', unsavedAnswers.length, 'answers');
    
    // Mark all as saving
    unsavedAnswers.forEach(answer => {
      answer.isSaving = true;
      answer.error = null;
    });
    this.notifyStateChange();

    try {
      // Prepare batch data
      const batchData = unsavedAnswers.map(answer => ({
        questionId: answer.questionId,
        value: answer.value
      }));
      
      // Save all answers in batch
      const success = await directusClient.saveAnswersBatch(this.config.responseId, batchData);
      
      if (success) {
        // Mark all as saved
        unsavedAnswers.forEach(answer => {
          answer.isSaving = false;
          answer.isDirty = false;
          answer.lastSaved = new Date();
          answer.error = null;
        });
        console.log('✅ FormAnswerStore: Batch save successful');
        this.notifyStateChange();
        return true;
      } else {
        // Mark all as failed
        unsavedAnswers.forEach(answer => {
          answer.isSaving = false;
          answer.error = 'Batch save failed';
        });
        console.error('❌ FormAnswerStore: Batch save failed');
        this.notifyStateChange();
        return false;
      }
      
    } catch (error) {
      console.error('❌ FormAnswerStore: Batch save failed:', error);
      
      // Mark all as not saving and add error
      unsavedAnswers.forEach(answer => {
        answer.isSaving = false;
        answer.error = error instanceof Error ? error.message : 'Batch save failed';
      });
      this.notifyStateChange();
      
      return false;
    }
  }



  // Start autosave timer
  private startAutosave(): void {
    if (this.config.autosaveInterval <= 0) return;
    
    this.autosaveTimer = setInterval(() => {
      if (!this.isDestroyed && this.hasUnsavedChanges() && !this.isSaving()) {
        console.log('⏰ FormAnswerStore: Auto-saving...');
        this.saveAll();
      }
    }, this.config.autosaveInterval);
  }

  // Stop autosave timer
  private stopAutosave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  // Event listeners
  onAnswerChange(callback: (questionUid: string, value: any) => void): void {
    this.onAnswerChangeCallback = callback;
  }

  onSaveStateChange(callback: (isSaving: boolean, hasUnsaved: boolean) => void): void {
    this.onSaveStateChangeCallback = callback;
  }

  // Notify state change
  private notifyStateChange(): void {
    this.onSaveStateChangeCallback?.(this.isSaving(), this.hasUnsavedChanges());
  }

  // Cleanup
  destroy(): void {
    console.log('🗑️ FormAnswerStore: Destroying...');
    this.isDestroyed = true;
    this.stopAutosave();
    this.answers.clear();
    this.onAnswerChangeCallback = null;
    this.onSaveStateChangeCallback = null;
  }

  // Force save before destruction (useful for form completion)
  async saveAndDestroy(): Promise<boolean> {
    const success = await this.saveAll();
    this.destroy();
    return success;
  }
}

export default FormAnswerStore; 