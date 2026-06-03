import { create } from 'zustand';
import { assessmentRepository } from '../infrastructure/repositories/assessmentRepository';
import { AssessmentSession, Question, SessionAnswer } from '../core/types';

interface ExamState {
  currentSession: AssessmentSession | null;
  questions: Question[];
  currentQuestionIndex: number;
  localAnswers: Record<string, string | null>; // questionId -> selectedOptionId
  warningCount: number;
  isLoading: boolean;
  error: string | null;
  
  startExamSession: (assessmentId: string) => Promise<AssessmentSession>;
  startExamTimer: (sessionId: string) => Promise<AssessmentSession>;
  resumeExamSession: (session: AssessmentSession) => void;
  selectQuestion: (index: number) => void;
  saveAnswerLocally: (questionId: string, optionId: string | null) => void;
  syncAnswerWithApi: (questionId: string, optionId: string | null) => Promise<void>;
  incrementWarning: (eventType: string, details?: string) => Promise<void>;
  finishExamSession: () => Promise<AssessmentSession>;
  clearSession: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  currentSession: null,
  questions: [],
  currentQuestionIndex: 0,
  localAnswers: {},
  warningCount: 0,
  isLoading: false,
  error: null,

  startExamSession: async (assessmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await assessmentRepository.startSession(assessmentId);
      
      // Load questions
      const questions = session.assessment?.questions || [];
      
      // Sort questions by pivot order_no if available
      const sortedQuestions = [...questions].sort((a, b) => {
        const orderA = a.pivot?.order_no ?? 0;
        const orderB = b.pivot?.order_no ?? 0;
        return orderA - orderB;
      });

      // Populate localAnswers from session's answers
      const initialAnswers: Record<string, string | null> = {};
      if (session.answers) {
        session.answers.forEach((ans) => {
          initialAnswers[ans.question_id] = ans.selected_option_id;
        });
      }

      // Check localStorage backup
      const localBackupKey = `cbt_answers_${session.id}`;
      if (typeof window !== 'undefined') {
        const backup = localStorage.getItem(localBackupKey);
        if (backup) {
          try {
            const parsedBackup = JSON.parse(backup);
            Object.assign(initialAnswers, parsedBackup);
          } catch (e) {
            console.error('Failed to parse localStorage backup', e);
          }
        }
      }

      set({
        currentSession: session,
        questions: sortedQuestions,
        currentQuestionIndex: 0,
        localAnswers: initialAnswers,
        warningCount: 0,
        isLoading: false,
      });

      return session;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Gagal memulai ujian.';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  startExamTimer: async (sessionId: string) => {
    try {
      const session = await assessmentRepository.startTimer(sessionId);
      set({ currentSession: session });
      return session;
    } catch (err: any) {
      console.error('Failed to start exam timer:', err);
      throw err;
    }
  },

  resumeExamSession: (session: AssessmentSession) => {
    const questions = session.assessment?.questions || [];
    const sortedQuestions = [...questions].sort((a, b) => {
      const orderA = a.pivot?.order_no ?? 0;
      const orderB = b.pivot?.order_no ?? 0;
      return orderA - orderB;
    });

    const initialAnswers: Record<string, string | null> = {};
    if (session.answers) {
      session.answers.forEach((ans) => {
        initialAnswers[ans.question_id] = ans.selected_option_id;
      });
    }

    const localBackupKey = `cbt_answers_${session.id}`;
    if (typeof window !== 'undefined') {
      const backup = localStorage.getItem(localBackupKey);
      if (backup) {
        try {
          const parsedBackup = JSON.parse(backup);
          Object.assign(initialAnswers, parsedBackup);
        } catch (e) {
          console.error(e);
        }
      }
    }

    set({
      currentSession: session,
      questions: sortedQuestions,
      currentQuestionIndex: 0,
      localAnswers: initialAnswers,
      warningCount: 0,
    });
  },

  selectQuestion: (index: number) => {
    set({ currentQuestionIndex: index });
  },

  saveAnswerLocally: (questionId: string, optionId: string | null) => {
    const session = get().currentSession;
    if (!session) return;

    const newAnswers = {
      ...get().localAnswers,
      [questionId]: optionId,
    };

    set({ localAnswers: newAnswers });

    // Sync to localStorage as an instant emergency backup
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cbt_answers_${session.id}`, JSON.stringify(newAnswers));
    }
  },

  syncAnswerWithApi: async (questionId: string, value: string | null) => {
    const session = get().currentSession;
    if (!session) return;

    const question = get().questions.find((q) => q.id === questionId);
    const isEssay = question?.type === 'essay';

    try {
      if (isEssay) {
        await assessmentRepository.submitAnswer(session.id, questionId, null, value);
      } else {
        await assessmentRepository.submitAnswer(session.id, questionId, value, null);
      }
    } catch (e) {
      console.error('Failed to sync answer to API', e);
    }
  },

  incrementWarning: async (eventType: string, details?: string) => {
    const session = get().currentSession;
    if (!session) return;

    const nextCount = get().warningCount + 1;
    set({ warningCount: nextCount });

    try {
      await assessmentRepository.submitProctorLog(
        session.id,
        eventType,
        details || `Peringatan #${nextCount}: ${eventType}`
      );
    } catch (e) {
      console.error('Failed to submit proctoring log', e);
    }
  },

  finishExamSession: async () => {
    const session = get().currentSession;
    if (!session) throw new Error('No active session.');

    set({ isLoading: true });
    try {
      const updatedSession = await assessmentRepository.finishSession(session.id);
      
      // Clear local backup
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`cbt_answers_${session.id}`);
      }

      set({
        currentSession: null,
        questions: [],
        currentQuestionIndex: 0,
        localAnswers: {},
        isLoading: false,
      });

      return updatedSession;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Gagal menyelesaikan ujian.';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  clearSession: () => {
    set({
      currentSession: null,
      questions: [],
      currentQuestionIndex: 0,
      localAnswers: {},
      warningCount: 0,
      error: null,
    });
  },
}));
