import { api } from '../api';
import { Assessment, AssessmentSession, SessionAnswer, ProctoringLog } from '../../core/types';

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
};
