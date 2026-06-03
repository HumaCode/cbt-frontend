import { api } from '../api';
import { Assessment, AssessmentSession, SessionAnswer, ProctoringLog, Category, Question } from '../../core/types';

export const assessmentRepository = {
  async getAssessments(params?: { search?: string; active?: boolean | number }): Promise<Assessment[]> {
    const response = await api.get('/api/v1/assessments', { params });
    // Laravel paginated result usually wraps data in data.data or data
    // Let's handle both. If response.data.data has a data attribute (paginator), use that
    const resData = response.data.data;
    if (resData && Array.isArray(resData.data)) {
      return resData.data as Assessment[];
    }
    if (Array.isArray(resData)) {
      return resData as Assessment[];
    }
    return [];
  },

  async getAssessment(id: string): Promise<Assessment> {
    const response = await api.get(`/api/v1/assessments/${id}`);
    return response.data.data as Assessment;
  },

  async startSession(assessmentId: string): Promise<AssessmentSession> {
    const response = await api.post(`/api/v1/assessments/${assessmentId}/start`);
    return response.data.data as AssessmentSession;
  },

  async startTimer(sessionId: string): Promise<AssessmentSession> {
    const response = await api.post(`/api/v1/sessions/${sessionId}/start-timer`);
    return response.data.data as AssessmentSession;
  },

  async submitAnswer(
    sessionId: string, 
    questionId: string, 
    selectedOptionId: string | null, 
    answerText: string | null = null
  ): Promise<SessionAnswer> {
    const response = await api.post(`/api/v1/sessions/${sessionId}/answers`, {
      question_id: questionId,
      selected_option_id: selectedOptionId,
      answer_text: answerText,
    });
    return response.data.data as SessionAnswer;
  },

  async finishSession(sessionId: string): Promise<AssessmentSession> {
    const response = await api.post(`/api/v1/sessions/${sessionId}/finish`);
    return response.data.data as AssessmentSession;
  },

  async getCertificate(sessionId: string): Promise<any> {
    const response = await api.get(`/api/v1/sessions/${sessionId}/certificate`);
    return response.data.data;
  },

  async submitProctorLog(sessionId: string, eventType: string, eventDetails?: string): Promise<ProctoringLog> {
    const response = await api.post(`/api/v1/sessions/${sessionId}/proctor-logs`, {
      event_type: eventType,
      event_details: eventDetails || '',
    });
    return response.data.data as ProctoringLog;
  },

  async getProctorLogs(sessionId: string): Promise<ProctoringLog[]> {
    const response = await api.get(`/api/v1/sessions/${sessionId}/proctor-logs`);
    return response.data.data as ProctoringLog[];
  },

  // Categories CRUD
  async getCategories(params?: any): Promise<Category[]> {
    const response = await api.get('/api/v1/categories', { params });
    const resData = response.data.data;
    if (resData && Array.isArray(resData.data)) return resData.data;
    if (Array.isArray(resData)) return resData;
    return [];
  },
  async createCategory(data: { name: string; description?: string }): Promise<Category> {
    const response = await api.post('/api/v1/categories', data);
    return response.data.data;
  },
  async updateCategory(id: string, data: { name: string; description?: string }): Promise<Category> {
    const response = await api.put(`/api/v1/categories/${id}`, data);
    return response.data.data;
  },
  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/api/v1/categories/${id}`);
  },

  // Questions CRUD
  async getQuestions(params?: any): Promise<Question[]> {
    const response = await api.get('/api/v1/questions', { params });
    const resData = response.data.data;
    if (resData && Array.isArray(resData.data)) return resData.data;
    if (Array.isArray(resData)) return resData;
    return [];
  },
  async createQuestion(
    data: {
      category_id: string;
      type: string;
      difficulty: string;
      content_text: string;
      options?: { option_text: string; is_correct?: boolean; weight?: number }[];
    },
    attachments?: File[]
  ): Promise<Question> {
    if (attachments && attachments.length > 0) {
      const formData = new FormData();
      formData.append('category_id', data.category_id);
      formData.append('type', data.type);
      formData.append('difficulty', data.difficulty);
      formData.append('content_text', data.content_text);
      if (data.options) {
        data.options.forEach((opt, idx) => {
          formData.append(`options[${idx}][option_text]`, opt.option_text);
          formData.append(`options[${idx}][is_correct]`, opt.is_correct ? '1' : '0');
          formData.append(`options[${idx}][weight]`, (opt.weight || 0).toString());
        });
      }
      attachments.forEach((file) => {
        formData.append('attachments[]', file);
      });
      const response = await api.post('/api/v1/questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    }
    const response = await api.post('/api/v1/questions', data);
    return response.data.data;
  },
  async updateQuestion(
    id: string,
    data: {
      category_id: string;
      type: string;
      difficulty: string;
      content_text: string;
      options?: { option_text: string; is_correct?: boolean; weight?: number }[];
    },
    attachments?: File[]
  ): Promise<Question> {
    if (attachments && attachments.length > 0) {
      const formData = new FormData();
      formData.append('_method', 'PUT'); // Method spoofing for Laravel PUT requests with files
      formData.append('category_id', data.category_id);
      formData.append('type', data.type);
      formData.append('difficulty', data.difficulty);
      formData.append('content_text', data.content_text);
      if (data.options) {
        data.options.forEach((opt, idx) => {
          formData.append(`options[${idx}][option_text]`, opt.option_text);
          formData.append(`options[${idx}][is_correct]`, opt.is_correct ? '1' : '0');
          formData.append(`options[${idx}][weight]`, (opt.weight || 0).toString());
        });
      }
      attachments.forEach((file) => {
        formData.append('attachments[]', file);
      });
      const response = await api.post(`/api/v1/questions/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    }
    const response = await api.put(`/api/v1/questions/${id}`, data);
    return response.data.data;
  },
  async deleteQuestion(id: string): Promise<void> {
    await api.delete(`/api/v1/questions/${id}`);
  },

  // Assessments CRUD
  async createAssessment(data: {
    title: string;
    start_date: string;
    end_date: string;
    duration_minutes: number;
    max_attempts?: number;
    randomize_questions?: boolean;
    randomize_options?: boolean;
    passing_grade?: number;
    questions?: string[];
  }): Promise<Assessment> {
    const response = await api.post('/api/v1/assessments', data);
    return response.data.data;
  },
  async updateAssessment(id: string, data: {
    title: string;
    start_date: string;
    end_date: string;
    duration_minutes: number;
    max_attempts?: number;
    randomize_questions?: boolean;
    randomize_options?: boolean;
    passing_grade?: number;
    questions?: string[];
  }): Promise<Assessment> {
    const response = await api.put(`/api/v1/assessments/${id}`, data);
    return response.data.data;
  },
  async deleteAssessment(id: string): Promise<void> {
    await api.delete(`/api/v1/assessments/${id}`);
  },
};
