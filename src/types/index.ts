// Tipos para la base de datos de Supabase

export interface Session {
  id: string;
  code: string;
  name: string;
  status: 'waiting' | 'active' | 'finished';
  current_question_index: number;
  created_by: string;
  created_at: string;
  expires_at: string;
}

export interface Question {
  id: string;
  session_id: string;
  question_text: string;
  question_order: number;
  options: QuestionOption[];
  correct_option_id: number;
  time_limit: number;
  created_at: string;
}

export interface QuestionOption {
  id: number;
  text: string;
}

export interface Participant {
  id: string;
  session_id: string;
  nickname: string;
  score: number;
  is_connected: boolean;
  joined_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  participant_id: string;
  selected_option_id: number;
  is_correct: boolean;
  response_time_ms: number;
  points_earned: number;
  answered_at: string;
}

// Tipos para el estado de la aplicación

export interface SessionState {
  session: Session | null;
  questions: Question[];
  participants: Participant[];
  currentQuestion: Question | null;
  isLoading: boolean;
  error: string | null;
}

export interface PlayerRanking {
  participant: Participant;
  rank: number;
  previousRank?: number;
  isCurrentUser?: boolean;
}

// Tipos para formularios

export interface CreateSessionForm {
  name: string;
  createdBy: string;
}

export interface CreateQuestionForm {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  timeLimit: number;
}

export interface JoinSessionForm {
  code: string;
  nickname: string;
}

// Tipos para eventos en tiempo real

export type RealtimeEvent =
  | { type: 'SESSION_UPDATED'; payload: Partial<Session> }
  | { type: 'PARTICIPANT_JOINED'; payload: Participant }
  | { type: 'PARTICIPANT_LEFT'; payload: { participantId: string } }
  | { type: 'SCORE_UPDATED'; payload: { participantId: string; newScore: number } }
  | { type: 'QUESTION_STARTED'; payload: { questionIndex: number } }
  | { type: 'ANSWER_SUBMITTED'; payload: Answer };

// Tipos de utilidad

export type SessionStatus = Session['status'];

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
