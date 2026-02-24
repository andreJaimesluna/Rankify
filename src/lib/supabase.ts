import { createClient } from '@supabase/supabase-js';
import type { Room, Question, Participant, Answer, CreateRoomForm } from '@/types';

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

// Funciones de utilidad para rooms (antes sessions)

export async function createSession(name: string, adminId?: string): Promise<{ data: Room | null; error: string | null }> {
  return createRoom({ name, timeLimitPerQuestion: 30, questionOrder: 'sequential', showRankingBetweenQuestions: true }, adminId);
}

export async function createRoom(form: CreateRoomForm, adminId?: string): Promise<{ data: Room | null; error: string | null }> {
  const code = generateSessionCode();

  // Obtener el admin_id del usuario autenticado si no se pasa explícitamente
  let resolvedAdminId = adminId;
  if (!resolvedAdminId) {
    const { data: { user } } = await supabase.auth.getUser();
    resolvedAdminId = user?.id;
  }

  if (!resolvedAdminId) {
    return { data: null, error: 'Debes iniciar sesión para crear una sala' };
  }

  try {
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        code,
        name: form.name,
        admin_id: resolvedAdminId,
        status: 'draft',
        current_question_index: 0,
        max_participants: form.maxParticipants || null,
        time_limit_per_question: form.timeLimitPerQuestion,
        question_order: form.questionOrder,
        show_ranking_between_questions: form.showRankingBetweenQuestions,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Room, error: null };
  } catch {
    return { data: null, error: 'Error de conexión con el servidor' };
  }
}

export async function getSessionByCode(code: string): Promise<{ data: Room | null; error: string | null }> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error) {
    return { data: null, error: 'Sesión no encontrada' };
  }

  return { data: data as Room, error: null };
}

export async function getSessionById(id: string): Promise<{ data: Room | null; error: string | null }> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: 'Sesión no encontrada' };
  }

  return { data: data as Room, error: null };
}

export async function updateSessionStatus(
  sessionId: string,
  status: Room['status'],
  currentQuestionIndex?: number
): Promise<{ error: string | null }> {
  const updateData: Partial<Room> = { status };
  if (currentQuestionIndex !== undefined) {
    updateData.current_question_index = currentQuestionIndex;
  }

  const { error } = await supabase
    .from('rooms')
    .update(updateData)
    .eq('id', sessionId);

  return { error: error?.message || null };
}

// Funciones de utilidad para preguntas

export async function createQuestion(
  roomId: string,
  questionText: string,
  options: { id: number; text: string }[],
  correctOptionId: number,
  questionOrder: number,
  timeLimit: number = 30
): Promise<{ data: Question | null; error: string | null }> {
  // Obtener el admin_id del usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Debes iniciar sesion para crear preguntas' };
  }

  // Crear la pregunta con el admin_id correcto
  const { data, error } = await supabase
    .from('questions')
    .insert({
      admin_id: user.id,
      text: questionText,
      options,
      correct_option_index: correctOptionId,
      time_limit_seconds: timeLimit,
      tags: [],
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  // Vincular la pregunta con la sala via room_questions
  if (data) {
    await supabase
      .from('room_questions')
      .insert({
        room_id: roomId,
        question_id: data.id,
        order_index: questionOrder,
      });
  }

  return { data: data as Question, error: null };
}

export async function getQuestionsBySession(sessionId: string): Promise<{ data: Question[]; error: string | null }> {
  // Obtener questions vinculadas a la sala via room_questions
  const { data: roomQuestions, error: rqError } = await supabase
    .from('room_questions')
    .select('question_id, order_index')
    .eq('room_id', sessionId)
    .order('order_index', { ascending: true });

  if (rqError || !roomQuestions || roomQuestions.length === 0) {
    return { data: [], error: rqError?.message || null };
  }

  const questionIds = roomQuestions.map((rq) => rq.question_id);

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('id', questionIds);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as Question[], error: null };
}

export async function updateQuestion(
  questionId: string,
  questionText: string,
  options: { id: number; text: string }[],
  correctOptionId: number,
  timeLimit?: number
): Promise<{ data: Question | null; error: string | null }> {
  const updateData: Record<string, unknown> = {
    text: questionText,
    options,
    correct_option_index: correctOptionId,
  };
  if (timeLimit !== undefined) {
    updateData.time_limit_seconds = timeLimit;
  }

  const { data, error } = await supabase
    .from('questions')
    .update(updateData)
    .eq('id', questionId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Question, error: null };
}

export async function deleteQuestion(questionId: string): Promise<{ error: string | null }> {
  // Primero eliminar de room_questions
  await supabase
    .from('room_questions')
    .delete()
    .eq('question_id', questionId);

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  return { error: error?.message || null };
}

export async function reorderQuestions(
  roomId: string,
  questionIds: string[]
): Promise<{ error: string | null }> {
  // Eliminar el orden actual
  const { error: deleteError } = await supabase
    .from('room_questions')
    .delete()
    .eq('room_id', roomId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // Insertar nuevo orden
  const rows = questionIds.map((questionId, index) => ({
    room_id: roomId,
    question_id: questionId,
    order_index: index + 1,
  }));

  const { error } = await supabase
    .from('room_questions')
    .insert(rows);

  return { error: error?.message || null };
}

export async function activateRoom(roomId: string): Promise<{ data: Room | null; error: string | null }> {
  // Verificar que tiene preguntas
  const { data: rq } = await supabase
    .from('room_questions')
    .select('question_id')
    .eq('room_id', roomId);

  if (!rq || rq.length === 0) {
    return { data: null, error: 'Agrega al menos una pregunta para activar la sala' };
  }

  // Generar nuevo codigo unico
  let code = generateSessionCode();
  let attempts = 0;
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('code', code)
      .eq('status', 'active')
      .single();

    if (!existing) break;
    code = generateSessionCode();
    attempts++;
  }

  const { data, error } = await supabase
    .from('rooms')
    .update({
      status: 'active',
      code,
      started_at: new Date().toISOString(),
      current_question_index: 0,
    })
    .eq('id', roomId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Room, error: null };
}

export async function deactivateRoom(roomId: string): Promise<{ data: Room | null; error: string | null }> {
  const { data, error } = await supabase
    .from('rooms')
    .update({
      status: 'draft',
      started_at: null,
    })
    .eq('id', roomId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Room, error: null };
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
    .eq('room_id', sessionId)
    .eq('nickname', nickname)
    .single();

  if (existing) {
    return { data: null, error: 'Este nombre ya está en uso en esta sesión' };
  }

  const { data, error } = await supabase
    .from('participants')
    .insert({
      room_id: sessionId,
      nickname,
      total_score: 0,
      connected: true,
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
    .eq('room_id', sessionId)
    .order('total_score', { ascending: false });

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
    .update({ total_score: newScore })
    .eq('id', participantId);

  return { error: error?.message || null };
}

export async function updateParticipantConnection(
  participantId: string,
  isConnected: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('participants')
    .update({ connected: isConnected })
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
      room_question_id: questionId,
      participant_id: participantId,
      selected_option_index: selectedOptionId,
      is_correct: isCorrect,
      response_time_ms: responseTimeMs,
      score_awarded: pointsEarned,
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
    .eq('room_question_id', questionId);

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
    .eq('room_question_id', questionId)
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

// Funciones para el Dashboard del admin

export async function getAdminRooms(adminId: string): Promise<{ data: Room[]; error: string | null }> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as Room[], error: null };
}

export interface AdminStats {
  totalRooms: number;
  totalParticipants: number;
  avgParticipantsPerRoom: number;
  lastActiveRoom: Room | null;
}

export async function getAdminStats(adminId: string): Promise<{ data: AdminStats; error: string | null }> {
  // Obtener todas las salas del admin
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('*')
    .eq('admin_id', adminId)
    .order('updated_at', { ascending: false });

  if (roomsError) {
    return {
      data: { totalRooms: 0, totalParticipants: 0, avgParticipantsPerRoom: 0, lastActiveRoom: null },
      error: roomsError.message,
    };
  }

  const totalRooms = rooms?.length || 0;

  // Obtener total de participantes de todas las salas
  let totalParticipants = 0;
  if (totalRooms > 0) {
    const roomIds = rooms!.map((r) => r.id);
    const { count } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .in('room_id', roomIds);

    totalParticipants = count || 0;
  }

  const avgParticipantsPerRoom = totalRooms > 0 ? Math.round(totalParticipants / totalRooms) : 0;

  // La sala más recientemente activa o actualizada
  const lastActiveRoom = rooms && rooms.length > 0 ? (rooms[0] as Room) : null;

  return {
    data: {
      totalRooms,
      totalParticipants,
      avgParticipantsPerRoom,
      lastActiveRoom,
    },
    error: null,
  };
}

// Exportar resultados a CSV
export function exportResultsToCSV(
  sessionName: string,
  participants: Participant[]
): void {
  const sortedParticipants = [...participants].sort((a, b) => b.total_score - a.total_score);

  const csvContent = [
    ['Posición', 'Nombre', 'Puntuación'].join(','),
    ...sortedParticipants.map((p, index) =>
      [index + 1, p.nickname, p.total_score].join(',')
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
