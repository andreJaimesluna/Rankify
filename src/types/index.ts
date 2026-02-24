// =============================================
// Tipos para la base de datos de Supabase — v1.1
// =============================================

// --- Modelos de base de datos ---

export interface Admin {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  institution: string | null;
  bio: string | null;
  default_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// --- Tipos de autenticación ---

export interface RegisterFormStep1 {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterFormStep2 {
  displayName: string;
  avatarUrl: string;
}

export interface AuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Question {
  id: string;
  admin_id: string;
  text: string;
  options: QuestionOption[];
  correct_option_index: number;
  time_limit_seconds: number;
  tags: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: number;
  text: string;
}

export type RoomStatus = 'draft' | 'scheduled' | 'active' | 'finished' | 'archived';
export type QuestionOrderType = 'sequential' | 'random';

export interface Room {
  id: string;
  admin_id: string;
  name: string;
  code: string;
  status: RoomStatus;
  scheduled_at: string | null;
  max_participants: number | null;
  time_limit_per_question: number;
  question_order: QuestionOrderType;
  show_ranking_between_questions: boolean;
  current_question_index: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoomQuestion {
  room_id: string;
  question_id: string;
  order_index: number;
}

export interface Participant {
  id: string;
  room_id: string;
  nickname: string;
  connected: boolean;
  joined_at: string;
  total_score: number;
}

export interface Answer {
  id: string;
  participant_id: string;
  room_question_id: string;
  selected_option_index: number;
  is_correct: boolean;
  response_time_ms: number;
  score_awarded: number;
  answered_at: string;
}

// --- Tipos para el estado de la aplicación ---

export interface RoomState {
  room: Room | null;
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

// --- Tipos para formularios ---

export interface CreateRoomForm {
  name: string;
  maxParticipants?: number;
  timeLimitPerQuestion: number;
  questionOrder: QuestionOrderType;
  showRankingBetweenQuestions: boolean;
}

export interface CreateQuestionForm {
  text: string;
  options: string[];
  correctOptionIndex: number;
  timeLimitSeconds: number;
  tags: string[];
}

export interface JoinRoomForm {
  code: string;
  nickname: string;
}

// --- Tipos para eventos en tiempo real ---

export type RealtimeEvent =
  | { type: 'ROOM_UPDATED'; payload: Partial<Room> }
  | { type: 'PARTICIPANT_JOINED'; payload: Participant }
  | { type: 'PARTICIPANT_LEFT'; payload: { participantId: string } }
  | { type: 'SCORE_UPDATED'; payload: { participantId: string; newScore: number } }
  | { type: 'QUESTION_STARTED'; payload: { questionIndex: number } }
  | { type: 'ANSWER_SUBMITTED'; payload: Answer };

// --- Tipos de utilidad ---

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Backward compatibility aliases (v1.0 → v1.1 transition)
/** @deprecated Use Room instead */
export type Session = Room;
/** @deprecated Use RoomStatus instead */
export type SessionStatus = RoomStatus;
