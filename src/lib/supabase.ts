import { createClient } from '@supabase/supabase-js';
import type { Session, Question, Participant, Answer } from '@/types';

// Configuración del cliente de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Funciones de utilidad para sesiones

export async function createSession(name: string, createdBy: string): Promise<{ data: Session | null; error: string | null }> {
  const code = generateSessionCode();

  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        code,
        name,
        created_by: createdBy,
        status: 'waiting',
        current_question_index: 0,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Session, error: null };
  } catch {
    return { data: null, error: 'Error de conexión con el servidor' };
  }
}

export async function getSessionByCode(code: string): Promise<{ data: Session | null; error: string | null }> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error) {
    return { data: null, error: 'Sesión no encontrada' };
  }

  return { data: data as Session, error: null };
}

export async function getSessionById(id: string): Promise<{ data: Session | null; error: string | null }> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: 'Sesión no encontrada' };
  }

  return { data: data as Session, error: null };
}

export async function updateSessionStatus(
  sessionId: string,
  status: Session['status'],
  currentQuestionIndex?: number
): Promise<{ error: string | null }> {
  const updateData: Partial<Session> = { status };
  if (currentQuestionIndex !== undefined) {
    updateData.current_question_index = currentQuestionIndex;
  }

  const { error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId);

  return { error: error?.message || null };
}

// Funciones de utilidad para preguntas

export async function createQuestion(
  sessionId: string,
  questionText: string,
  options: { id: number; text: string }[],
  correctOptionId: number,
  questionOrder: number,
  timeLimit: number = 30
): Promise<{ data: Question | null; error: string | null }> {
  const { data, error } = await supabase
    .from('questions')
    .insert({
      session_id: sessionId,
      question_text: questionText,
      options,
      correct_option_id: correctOptionId,
      question_order: questionOrder,
      time_limit: timeLimit,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Question, error: null };
}

export async function getQuestionsBySession(sessionId: string): Promise<{ data: Question[]; error: string | null }> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', sessionId)
    .order('question_order', { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as Question[], error: null };
}

export async function deleteQuestion(questionId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  return { error: error?.message || null };
}

// Funciones de utilidad para participantes

export async function joinSession(
  sessionId: string,
  nickname: string
): Promise<{ data: Participant | null; error: string | null }> {
  // Verificar si el nickname ya existe en la sesión
  const { data: existing } = await supabase
    .from('participants')
    .select('id')
    .eq('session_id', sessionId)
    .eq('nickname', nickname)
    .single();

  if (existing) {
    return { data: null, error: 'Este nombre ya está en uso en esta sesión' };
  }

  const { data, error } = await supabase
    .from('participants')
    .insert({
      session_id: sessionId,
      nickname,
      score: 0,
      is_connected: true,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Participant, error: null };
}

export async function getParticipantsBySession(sessionId: string): Promise<{ data: Participant[]; error: string | null }> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('score', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as Participant[], error: null };
}

export async function getParticipantById(id: string): Promise<{ data: Participant | null; error: string | null }> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: 'Participante no encontrado' };
  }

  return { data: data as Participant, error: null };
}

export async function updateParticipantScore(
  participantId: string,
  newScore: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('participants')
    .update({ score: newScore })
    .eq('id', participantId);

  return { error: error?.message || null };
}

export async function updateParticipantConnection(
  participantId: string,
  isConnected: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('participants')
    .update({ is_connected: isConnected })
    .eq('id', participantId);

  return { error: error?.message || null };
}

// Funciones de utilidad para respuestas

export async function submitAnswer(
  questionId: string,
  participantId: string,
  selectedOptionId: number,
  isCorrect: boolean,
  responseTimeMs: number,
  pointsEarned: number
): Promise<{ data: Answer | null; error: string | null }> {
  const { data, error } = await supabase
    .from('answers')
    .insert({
      question_id: questionId,
      participant_id: participantId,
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
      response_time_ms: responseTimeMs,
      points_earned: pointsEarned,
    })
    .select()
    .single();

  if (error) {
    // Si el error es por duplicado, el usuario ya respondió
    if (error.code === '23505') {
      return { data: null, error: 'Ya has respondido esta pregunta' };
    }
    return { data: null, error: error.message };
  }

  return { data: data as Answer, error: null };
}

export async function getAnswersByQuestion(questionId: string): Promise<{ data: Answer[]; error: string | null }> {
  const { data, error } = await supabase
    .from('answers')
    .select('*')
    .eq('question_id', questionId);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as Answer[], error: null };
}

export async function hasParticipantAnswered(
  questionId: string,
  participantId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('answers')
    .select('id')
    .eq('question_id', questionId)
    .eq('participant_id', participantId)
    .single();

  return !!data;
}

// Funciones de utilidad generales

import { GAME_CONFIG, SESSION_CODE_CHARS } from './constants';

function generateSessionCode(): string {
  return Array.from({ length: GAME_CONFIG.SESSION_CODE_LENGTH }, () =>
    SESSION_CODE_CHARS[Math.floor(Math.random() * SESSION_CODE_CHARS.length)]
  ).join('');
}

// Sistema de puntuación (re-exportar para compatibilidad)
export const SCORING = {
  BASE_POINTS: GAME_CONFIG.BASE_POINTS,
  TIME_BONUS_MAX: GAME_CONFIG.TIME_BONUS_MAX,
};

export function calculatePoints(
  isCorrect: boolean,
  responseTimeMs: number,
  timeLimitMs: number
): number {
  if (!isCorrect) return 0;

  const timeRatio = 1 - responseTimeMs / timeLimitMs;
  const timeBonus = Math.floor(GAME_CONFIG.TIME_BONUS_MAX * Math.max(0, timeRatio));

  return GAME_CONFIG.BASE_POINTS + timeBonus;
}

// Exportar resultados a CSV
export function exportResultsToCSV(
  sessionName: string,
  participants: Participant[]
): void {
  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);

  const csvContent = [
    ['Posición', 'Nombre', 'Puntuación'].join(','),
    ...sortedParticipants.map((p, index) =>
      [index + 1, p.nickname, p.score].join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `rankify-${sessionName}-resultados.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
