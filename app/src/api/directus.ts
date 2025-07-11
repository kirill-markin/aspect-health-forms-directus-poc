import { 
  createDirectus, 
  rest, 
  authentication, 
  readItems, 
  readItem, 
  createItem, 
  updateItem 
} from '@directus/sdk';

const DIRECTUS_URL = process.env.EXPO_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

// Development credentials from environment variables
const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.EXPO_PUBLIC_ADMIN_PASSWORD || 'password123';

// Debug environment variables
console.log('Environment variables:');
console.log('DIRECTUS_URL:', DIRECTUS_URL);
console.log('ADMIN_EMAIL:', ADMIN_EMAIL);
console.log('Environment check:', {
  EXPO_PUBLIC_DIRECTUS_URL: process.env.EXPO_PUBLIC_DIRECTUS_URL,
  EXPO_PUBLIC_ADMIN_EMAIL: process.env.EXPO_PUBLIC_ADMIN_EMAIL,
  EXPO_PUBLIC_ADMIN_PASSWORD: process.env.EXPO_PUBLIC_ADMIN_PASSWORD ? '[SET]' : '[NOT SET]'
});

// Create Directus client (modern SDK v20+ pattern)
const directus = createDirectus(DIRECTUS_URL)
  .with(authentication('json', { autoRefresh: true }))
  .with(rest());

// Authentication state
let isAuthenticated = false;

// Helper function to ensure authentication (modern SDK pattern)
const ensureAuthentication = async (): Promise<void> => {
  if (!isAuthenticated) {
    try {
      console.log('Authenticating with Directus at:', DIRECTUS_URL);
      console.log('Using credentials:', ADMIN_EMAIL, '/ [password hidden]');
      
      await directus.login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
      
      isAuthenticated = true;
      console.log('Authentication successful');
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error('Failed to authenticate with Directus');
    }
  }
};

// Types for the form data structures
export interface Form {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  exit_map?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface FormVersion {
  id: string;
  form_id: string;
  version: number;
  label: string;
  created_at: string;
}

export interface Question {
  id: string;
  form_version_id: string;
  uid: string;
  label: string;
  type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'nps';
  required: boolean;
  order: number;
  settings_json: Record<string, any>;
  archived: boolean;
  choices?: QuestionChoice[];
}

export interface QuestionChoice {
  id: string;
  question_id: string;
  label: string;
  value: string;
  order: number;
  is_default: boolean;
}

export interface BranchingRule {
  id: string;
  form_version_id: string;
  question_id: string;
  operator: 'eq' | 'neq' | 'in' | 'not_in' | 'gt' | 'lt' | 'is_empty' | 'is_not_empty';
  value: any;
  target_question_id?: string;
  exit_key?: string;
  order: number;
}

export interface Response {
  id: string;
  form_version_id: string;
  user_id: string;
  status: 'draft' | 'completed' | 'abandoned';
  started_at: string;
  completed_at?: string;
  progress_pct: number;
  utm_json?: Record<string, any>;
  hidden_json?: Record<string, any>;
}

export interface ResponseItem {
  id: string;
  response_id: string;
  question_id: string;
  value: any;
}

// API Functions (modern SDK pattern)
export const directusClient = {
  // Get all published forms
  async getAllPublishedForms(): Promise<Form[]> {
    try {
      await ensureAuthentication();
      
      console.log('Getting all published forms');
      const response = await directus.request(
        readItems('forms', {
          filter: {
            status: { _eq: 'published' }
          },
          sort: ['created_at']
        })
      );
      
      console.log('All forms API response:', response);
      const forms = (response as Form[]) || [];
      console.log('Forms found:', forms.length);
      return forms;
    } catch (error) {
      console.error('Error fetching forms:', error);
      return [];
    }
  },

  // Get published form by slug
  async getFormBySlug(slug: string): Promise<Form | null> {
    try {
      await ensureAuthentication();
      
      console.log('Getting form by slug:', slug);
      const response = await directus.request(
        readItems('forms', {
          filter: {
            slug: { _eq: slug },
            status: { _eq: 'published' }
          },
          limit: 1
        })
      );
      
      console.log('Form API response:', response);
      const form = (response?.[0] as Form) || null;
      console.log('Form found:', form);
      return form;
    } catch (error) {
      console.error('Error fetching form:', error);
      return null;
    }
  },

  // Get form version with questions and branching rules
  async getFormVersion(versionId: string): Promise<{
    version: FormVersion;
    questions: Question[];
    branchingRules: BranchingRule[];
  } | null> {
    try {
      await ensureAuthentication();
      
      console.log('Getting form version:', versionId);
      
      // Get form version
      const versionResponse = await directus.request(readItem('form_versions', versionId)) as FormVersion;
      console.log('Form version response:', versionResponse);
      
      // Get questions for this form version
      const questionsResponse = await directus.request(
        readItems('questions', {
          filter: { form_version_id: { _eq: versionId } },
          sort: ['order']
        })
      ) as Question[];
      console.log('Questions response:', questionsResponse);
      
      // Get branching rules for this form version
      const rulesResponse = await directus.request(
        readItems('branching_rules', {
          filter: { form_version_id: { _eq: versionId } },
          sort: ['order']
        })
      ) as BranchingRule[];
      console.log('Branching rules response:', rulesResponse);

      // Get question choices for multiple choice questions
      const questionIds = questionsResponse?.map((q: Question) => q.id) || [];
      let choices: QuestionChoice[] = [];
      
      if (questionIds.length > 0) {
        const choicesResponse = await directus.request(
          readItems('question_choices', {
            filter: { question_id: { _in: questionIds } },
            sort: ['order']
          })
        ) as QuestionChoice[];
        choices = choicesResponse || [];
        console.log('Question choices response:', choicesResponse);
      }

      // Attach choices to their respective questions
      const questionsWithChoices = (questionsResponse || []).map((question: Question) => ({
        ...question,
        choices: choices.filter(choice => choice.question_id === question.id)
      }));

      return {
        version: versionResponse,
        questions: questionsWithChoices,
        branchingRules: rulesResponse || []
      };
    } catch (error) {
      console.error('Error fetching form version:', error);
      return null;
    }
  },

  // Get the latest version for a form
  async getLatestFormVersion(formId: string): Promise<{
    version: FormVersion;
    questions: Question[];
    branchingRules: BranchingRule[];
  } | null> {
    try {
      await ensureAuthentication();
      
      console.log('Getting latest form version for form:', formId);
      
      // Get the latest version for this form
      const versionsResponse = await directus.request(
        readItems('form_versions', {
          filter: { form_id: { _eq: formId } },
          sort: ['-version'], // Sort by version descending to get the latest
          limit: 1
        })
      ) as FormVersion[];
      
      if (!versionsResponse || versionsResponse.length === 0) {
        console.log('No versions found for form:', formId);
        return null;
      }
      
      const latestVersion = versionsResponse[0];
      console.log('Latest version found:', latestVersion);
      
      // Use the existing getFormVersion function to get full version data
      return await this.getFormVersion(latestVersion.id);
    } catch (error) {
      console.error('Error fetching latest form version:', error);
      return null;
    }
  },

  // Create a new response session
  async createResponse(formVersionId: string, userId: string, utmParams?: Record<string, any>): Promise<Response | null> {
    try {
      await ensureAuthentication();
      
      console.log('Creating response for form version:', formVersionId);
      const response = await directus.request(
        createItem('responses', {
          form_version_id: formVersionId,
          user_id: userId,
          status: 'draft',
          started_at: new Date().toISOString(),
          progress_pct: 0,
          utm_json: utmParams || {},
          hidden_json: {}
        })
      ) as Response;
      
      console.log('Response created:', response);
      return response;
    } catch (error) {
      console.error('Error creating response:', error);
      return null;
    }
  },

  // Save answer to a question (upsert: update if exists, create if not)
  async saveAnswer(responseId: string, questionId: string, value: any): Promise<boolean> {
    try {
      await ensureAuthentication();
      
      console.log('Saving answer:', { responseId, questionId, value });
      
      // Check if answer already exists
      const existingAnswers = await directus.request(
        readItems('response_items', {
          filter: {
            response_id: { _eq: responseId },
            question_id: { _eq: questionId }
          },
          limit: 1
        })
      ) as ResponseItem[];
      
      if (existingAnswers && existingAnswers.length > 0) {
        // Update existing answer
        await directus.request(
          updateItem('response_items', existingAnswers[0].id, {
            value: JSON.stringify(value)
          })
        );
        console.log('Answer updated successfully');
      } else {
        // Create new answer
        await directus.request(
          createItem('response_items', {
            response_id: responseId,
            question_id: questionId,
            value: JSON.stringify(value)
          })
        );
        console.log('Answer created successfully');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving answer:', error);
      return false;
    }
  },

  // Batch save multiple answers
  async saveAnswersBatch(responseId: string, answers: Array<{ questionId: string; value: any }>): Promise<boolean> {
    try {
      await ensureAuthentication();
      
      console.log('Batch saving answers:', answers.length);
      
      // Get existing answers for this response
      const existingAnswers = await directus.request(
        readItems('response_items', {
          filter: {
            response_id: { _eq: responseId }
          }
        })
      ) as ResponseItem[];
      
      // Process each answer
      const operations = answers.map(async (answer) => {
        const existing = existingAnswers.find(a => a.question_id === answer.questionId);
        
        if (existing) {
          // Update existing
          return directus.request(
            updateItem('response_items', existing.id, {
              value: JSON.stringify(answer.value)
            })
          );
        } else {
          // Create new
          return directus.request(
            createItem('response_items', {
              response_id: responseId,
              question_id: answer.questionId,
              value: JSON.stringify(answer.value)
            })
          );
        }
      });
      
      // Execute all operations
      await Promise.all(operations);
      
      console.log('Batch save completed successfully');
      return true;
    } catch (error) {
      console.error('Error batch saving answers:', error);
      return false;
    }
  },

  // Get existing answers for a response
  async getResponseAnswers(responseId: string): Promise<ResponseItem[]> {
    try {
      await ensureAuthentication();
      
      const answers = await directus.request(
        readItems('response_items', {
          filter: {
            response_id: { _eq: responseId }
          }
        })
      ) as ResponseItem[];
      
      return answers || [];
    } catch (error) {
      console.error('Error fetching response answers:', error);
      return [];
    }
  },

  // Update response status and progress
  async updateResponse(responseId: string, updates: Partial<Response>): Promise<boolean> {
    try {
      await ensureAuthentication();
      
      console.log('Updating response:', { responseId, updates });
      await directus.request(updateItem('responses', responseId, updates));
      
      console.log('Response updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating response:', error);
      return false;
    }
  },

  // Complete response
  async completeResponse(responseId: string): Promise<boolean> {
    try {
      await ensureAuthentication();
      
      console.log('Completing response:', responseId);
      await directus.request(
        updateItem('responses', responseId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress_pct: 100
        })
      );
      
      console.log('Response completed successfully');
      return true;
    } catch (error) {
      console.error('Error completing response:', error);
      return false;
    }
  }
};

export default directusClient;