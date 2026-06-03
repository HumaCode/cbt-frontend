export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  roles?: string[];
  groups?: Group[];
  telp?: string;
  gender?: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  passing_grade?: number | null;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  weight?: string | number;
  is_correct?: boolean; // might be omitted on exam view to prevent cheating
  media?: any[];
}

export interface Question {
  id: string;
  category_id: string;
  type: string; // 'multiple_choice', etc.
  difficulty: string; // 'easy', 'medium', 'hard'
  content_text: string;
  options: QuestionOption[];
  media?: any[];
  pivot?: {
    order_no: number;
  };
}

export interface Assessment {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  duration_minutes: number;
  max_attempts: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  passing_grade: string | number;
  passing_grade_type?: 'overall' | 'per_category';
  certificate_release_mode?: 'auto' | 'manual';
  questions?: Question[];
  groups?: Group[];
  sessions?: AssessmentSession[];
}

export interface SessionAnswer {
  id: string;
  session_id: string;
  question_id: string;
  selected_option_id: string | null;
  answer_text: string | null;
  is_correct?: boolean;
  score_earned?: string | number;
}

export interface AssessmentSession {
  id: string;
  assessment_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: 'in_progress' | 'completed' | 'force_submitted';
  total_score: string | number;
  is_certificate_released?: boolean;
  assessment?: Assessment;
  answers?: SessionAnswer[];
}

export interface ProctoringLog {
  id: string;
  session_id: string;
  event_type: 'fullscreen_exit' | 'tab_switch' | 'right_click' | 'unauthorized_action';
  details: string;
  created_at?: string;
}
