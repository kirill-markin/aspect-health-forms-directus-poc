import axios from 'axios';

const DIRECTUS_URL = process.env.EXPO_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

// Create axios instance with base configuration
const directusApi = axios.create({
  baseURL: DIRECTUS_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for the form data structures
export interface Form {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  exit_map?: Record<string, string>;
  active_version_id?: string;
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
  type: 'short_text' | 'long_text' | 'multiple_choice' | 'nps';
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

// API Functions
export const directusClient = {
  // Get published form by slug
  async getFormBySlug(slug: string): Promise<Form | null> {
    try {
      const response = await directusApi.get(`/items/forms`, {
        params: {
          filter: {
            slug: { _eq: slug },
            status: { _eq: 'published' }
          }
        }
      });
      return response.data.data[0] || null;
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
      const [versionResponse, questionsResponse, rulesResponse] = await Promise.all([
        directusApi.get(`/items/form_versions/${versionId}`),
        directusApi.get(`/items/questions`, {
          params: {
            filter: { form_version_id: { _eq: versionId } },
            sort: ['order']
          }
        }),
        directusApi.get(`/items/branching_rules`, {
          params: {
            filter: { form_version_id: { _eq: versionId } },
            sort: ['order']
          }
        })
      ]);

      // Get question choices for multiple choice questions
      const questionIds = questionsResponse.data.data.map((q: Question) => q.id);
      let choices: QuestionChoice[] = [];
      
      if (questionIds.length > 0) {
        const choicesResponse = await directusApi.get(`/items/question_choices`, {
          params: {
            filter: { question_id: { _in: questionIds } },
            sort: ['order']
          }
        });
        choices = choicesResponse.data.data;
      }

      // Attach choices to their respective questions
      const questionsWithChoices = questionsResponse.data.data.map((question: Question) => ({
        ...question,
        choices: choices.filter(choice => choice.question_id === question.id)
      }));

      return {
        version: versionResponse.data.data,
        questions: questionsWithChoices,
        branchingRules: rulesResponse.data.data
      };
    } catch (error) {
      console.error('Error fetching form version:', error);
      return null;
    }
  },

  // Create a new response session
  async createResponse(formVersionId: string, userId: string, utmParams?: Record<string, any>): Promise<Response | null> {
    try {
      const response = await directusApi.post(`/items/responses`, {
        form_version_id: formVersionId,
        user_id: userId,
        status: 'draft',
        started_at: new Date().toISOString(),
        progress_pct: 0,
        utm_json: utmParams || {},
        hidden_json: {}
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating response:', error);
      return null;
    }
  },

  // Save answer to a question
  async saveAnswer(responseId: string, questionId: string, value: any): Promise<boolean> {
    try {
      await directusApi.post(`/items/response_items`, {
        response_id: responseId,
        question_id: questionId,
        value: value
      });
      return true;
    } catch (error) {
      console.error('Error saving answer:', error);
      return false;
    }
  },

  // Update response status and progress
  async updateResponse(responseId: string, updates: Partial<Response>): Promise<boolean> {
    try {
      await directusApi.patch(`/items/responses/${responseId}`, updates);
      return true;
    } catch (error) {
      console.error('Error updating response:', error);
      return false;
    }
  },

  // Complete response
  async completeResponse(responseId: string): Promise<boolean> {
    try {
      await directusApi.patch(`/items/responses/${responseId}`, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress_pct: 100
      });
      return true;
    } catch (error) {
      console.error('Error completing response:', error);
      return false;
    }
  }
};

export default directusClient;