import { api } from '../api';
import { Assessment, AssessmentSession, SessionAnswer, ProctoringLog, Category, Question } from '../../core/types';

export const assessmentRepository = {
  async getAssessments(params?: { search?: string; active?: boolean | number }): Promise<Assessment[]> {
    const response = await api.get('/assessments', { params });
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
    const response = await api.get(`/assessments/${id}`);
    return response.data.data as Assessment;
  },

  async startSession(assessmentId: string): Promise<AssessmentSession> {
    const response = await api.post(`/assessments/${assessmentId}/start`);
    return response.data.data as AssessmentSession;
  },

  async startTimer(sessionId: string): Promise<AssessmentSession> {
    const response = await api.post(`/sessions/${sessionId}/start-timer`);
    return response.data.data as AssessmentSession;
  },

  async submitAnswer(
    sessionId: string, 
    questionId: string, 
    selectedOptionId: string | null, 
    answerText: string | null = null
  ): Promise<SessionAnswer> {
    const response = await api.post(`/sessions/${sessionId}/answers`, {
      question_id: questionId,
      selected_option_id: selectedOptionId,
      answer_text: answerText,
    });
    return response.data.data as SessionAnswer;
  },

  async finishSession(sessionId: string): Promise<AssessmentSession> {
    const response = await api.post(`/sessions/${sessionId}/finish`);
    return response.data.data as AssessmentSession;
  },

  async getCertificate(sessionId: string): Promise<any> {
    const response = await api.get(`/sessions/${sessionId}/certificate`);
    return response.data.data;
  },

  async submitProctorLog(sessionId: string, eventType: string, eventDetails?: string): Promise<ProctoringLog> {
    const response = await api.post(`/sessions/${sessionId}/proctor-logs`, {
      event_type: eventType,
      event_details: eventDetails || '',
    });
    return response.data.data as ProctoringLog;
  },

  async getProctorLogs(sessionId: string): Promise<ProctoringLog[]> {
    const response = await api.get(`/sessions/${sessionId}/proctor-logs`);
    return response.data.data as ProctoringLog[];
  },

  // Categories CRUD
  async getCategories(params?: any): Promise<Category[]> {
    const response = await api.get('/categories', { params });
    const resData = response.data.data;
    if (resData && Array.isArray(resData.data)) return resData.data;
    if (Array.isArray(resData)) return resData;
    return [];
  },
  async createCategory(data: { name: string; description?: string; passing_grade?: number | null }): Promise<Category> {
    const response = await api.post('/categories', data);
    return response.data.data;
  },
  async updateCategory(id: string, data: { name: string; description?: string; passing_grade?: number | null }): Promise<Category> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.data;
  },
  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },

  // Questions CRUD
  async getQuestions(params?: any): Promise<Question[]> {
    const response = await api.get('/questions', { params });
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
      options?: { id?: string; option_text: string; is_correct?: boolean; weight?: number }[];
    },
    attachments?: File[],
    optionAttachments?: (File | null)[]
  ): Promise<Question> {
    const formData = new FormData();
    formData.append('category_id', data.category_id);
    formData.append('type', data.type);
    formData.append('difficulty', data.difficulty);
    formData.append('content_text', data.content_text);

    if (data.options) {
      data.options.forEach((opt, idx) => {
        if (opt.id) {
          formData.append(`options[${idx}][id]`, opt.id);
        }
        formData.append(`options[${idx}][option_text]`, opt.option_text);
        formData.append(`options[${idx}][is_correct]`, opt.is_correct ? '1' : '0');
        formData.append(`options[${idx}][weight]`, (opt.weight || 0).toString());
      });
    }

    if (attachments && attachments.length > 0) {
      attachments.forEach((file) => {
        formData.append('attachments[]', file);
      });
    }

    if (optionAttachments && optionAttachments.length > 0) {
      optionAttachments.forEach((file, idx) => {
        if (file) {
          formData.append(`option_attachments[${idx}]`, file);
        }
      });
    }

    const response = await api.post('/questions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
  async updateQuestion(
    id: string,
    data: {
      category_id: string;
      type: string;
      difficulty: string;
      content_text: string;
      clear_media?: boolean;
      options?: { id?: string; option_text: string; is_correct?: boolean; weight?: number; clear_image?: boolean }[];
      deleted_media_ids?: string[];
    },
    attachments?: File[],
    optionAttachments?: (File | null)[]
  ): Promise<Question> {
    const formData = new FormData();
    formData.append('_method', 'PUT'); // Method spoofing for Laravel PUT requests with files
    formData.append('category_id', data.category_id);
    formData.append('type', data.type);
    formData.append('difficulty', data.difficulty);
    formData.append('content_text', data.content_text);
    if (data.clear_media) {
      formData.append('clear_media', '1');
    }

    if (data.options) {
      data.options.forEach((opt, idx) => {
        if (opt.id) {
          formData.append(`options[${idx}][id]`, opt.id);
        }
        formData.append(`options[${idx}][option_text]`, opt.option_text);
        formData.append(`options[${idx}][is_correct]`, opt.is_correct ? '1' : '0');
        formData.append(`options[${idx}][weight]`, (opt.weight || 0).toString());
        if (opt.clear_image) {
          formData.append(`options[${idx}][clear_image]`, '1');
        }
      });
    }

    if (data.deleted_media_ids) {
      data.deleted_media_ids.forEach((mediaId) => {
        formData.append('deleted_media_ids[]', mediaId);
      });
    }

    if (attachments && attachments.length > 0) {
      attachments.forEach((file) => {
        formData.append('attachments[]', file);
      });
    }

    if (optionAttachments && optionAttachments.length > 0) {
      optionAttachments.forEach((file, idx) => {
        if (file) {
          formData.append(`option_attachments[${idx}]`, file);
        }
      });
    }

    const response = await api.post(`/questions/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
  async deleteQuestion(id: string): Promise<void> {
    await api.delete(`/questions/${id}`);
  },
  async importQuestions(categoryId: string, file: File): Promise<{ imported_count: number }> {
    const formData = new FormData();
    formData.append('category_id', categoryId);
    formData.append('file', file);

    const response = await api.post('/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
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
    passing_grade_type?: 'overall' | 'per_category';
    questions?: string[];
  }): Promise<Assessment> {
    const response = await api.post('/assessments', data);
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
    passing_grade_type?: 'overall' | 'per_category';
    questions?: string[];
  }): Promise<Assessment> {
    const response = await api.put(`/assessments/${id}`, data);
    return response.data.data;
  },
  async deleteAssessment(id: string): Promise<void> {
    await api.delete(`/assessments/${id}`);
  },
  async getAssessmentSessions(id: string): Promise<any[]> {
    const response = await api.get(`/assessments/${id}/sessions`);
    return response.data.data;
  },
  async getPublicMonitor(id: string): Promise<{ assessment: any; sessions: any[] }> {
    const response = await api.get(`/public/assessments/${id}/monitor`);
    return response.data.data;
  },
  async deleteAssessmentSession(sessionId: string): Promise<void> {
    await api.delete(`/sessions/${sessionId}`);
  },
  async bulkDeleteAssessmentSessions(sessionIds: string[]): Promise<void> {
    await api.post('/sessions/bulk-delete', { session_ids: sessionIds });
  },
  async unlockAssessmentSession(sessionId: string): Promise<void> {
    await api.post(`/sessions/${sessionId}/unlock`);
  },
  async forceSubmitAssessmentSession(sessionId: string): Promise<void> {
    await api.post(`/sessions/${sessionId}/force-submit`);
  },
  async exportAssessmentSessions(id: string): Promise<Blob> {
    const response = await api.get(`/assessments/${id}/export-sessions`, {
      responseType: 'blob',
    });
    return response.data;
  },
  async toggleCertificateRelease(sessionId: string): Promise<any> {
    const response = await api.post(`/sessions/${sessionId}/toggle-certificate`);
    return response.data.data;
  },
  async getItemAnalysis(id: string): Promise<any[]> {
    const response = await api.get(`/assessments/${id}/item-analysis`);
    return response.data.data;
  },
  async getDashboardStats(): Promise<any> {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
  },
};
