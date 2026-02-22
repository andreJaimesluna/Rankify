import { useState, useCallback } from 'react';
import {
  createSession,
  getSessionByCode,
  getSessionById,
  updateSessionStatus,
  createQuestion,
  getQuestionsBySession,
  deleteQuestion,
  joinSession,
  getParticipantsBySession,
  getParticipantById,
  updateParticipantScore,
  submitAnswer,
  calculatePoints,
  hasParticipantAnswered,
} from '@/lib/supabase';
import { storage, STORAGE_KEYS } from '@/lib/utils';
import type {
  Session,
  Question,
  Participant,
  CreateQuestionForm,
} from '@/types';

interface UseSessionReturn {
  // Estado
  session: Session | null;
  questions: Question[];
  participants: Participant[];
  currentParticipant: Participant | null;
  isLoading: boolean;
  error: string | null;

  // Acciones de sesión
  createNewSession: (name: string, createdBy: string) => Promise<Session | null>;
  joinExistingSession: (code: string, nickname: string) => Promise<Participant | null>;
  loadSession: (code: string) => Promise<Session | null>;
  loadSessionById: (id: string) => Promise<Session | null>;
  startSession: () => Promise<boolean>;
  nextQuestion: () => Promise<boolean>;
  endSession: () => Promise<boolean>;

  // Acciones de preguntas
  addQuestion: (question: CreateQuestionForm) => Promise<Question | null>;
  removeQuestion: (questionId: string) => Promise<boolean>;
  loadQuestions: () => Promise<void>;

  // Acciones de participantes
  loadParticipants: () => Promise<void>;
  loadCurrentParticipant: (id: string) => Promise<Participant | null>;

  // Acciones de respuestas
  submitQuestionAnswer: (
    questionId: string,
    selectedOptionId: number,
    responseTimeMs: number
  ) => Promise<{ isCorrect: boolean; points: number } | null>;

  // Utilidades
  clearError: () => void;
  getCurrentQuestion: () => Question | null;
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Crear nueva sesión (admin)
  const createNewSession = useCallback(async (name: string, createdBy: string) => {
    setIsLoading(true);
    setError(null);

    const result = await createSession(name, createdBy);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return null;
    }

    if (result.data) {
      setSession(result.data);
      storage.set(STORAGE_KEYS.ADMIN_SESSION_ID, result.data.id);
    }

    setIsLoading(false);
    return result.data;
  }, []);

  // Unirse a sesión existente (estudiante)
  const joinExistingSession = useCallback(async (code: string, nickname: string) => {
    setIsLoading(true);
    setError(null);

    // Primero obtener la sesión
    const sessionResult = await getSessionByCode(code);

    if (sessionResult.error) {
      setError(sessionResult.error);
      setIsLoading(false);
      return null;
    }

    if (!sessionResult.data) {
      setError('Sesión no encontrada');
      setIsLoading(false);
      return null;
    }

    if (sessionResult.data.status === 'finished') {
      setError('Esta sesión ya ha terminado');
      setIsLoading(false);
      return null;
    }

    // Unirse a la sesión
    const participantResult = await joinSession(sessionResult.data.id, nickname);

    if (participantResult.error) {
      setError(participantResult.error);
      setIsLoading(false);
      return null;
    }

    setSession(sessionResult.data);
    setCurrentParticipant(participantResult.data);

    // Guardar en localStorage
    if (participantResult.data) {
      storage.set(STORAGE_KEYS.PARTICIPANT_ID, participantResult.data.id);
      storage.set(STORAGE_KEYS.SESSION_CODE, code);
      storage.set(STORAGE_KEYS.NICKNAME, nickname);
    }

    setIsLoading(false);
    return participantResult.data;
  }, []);

  // Cargar sesión por código
  const loadSession = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);

    const result = await getSessionByCode(code);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return null;
    }

    setSession(result.data);
    setIsLoading(false);
    return result.data;
  }, []);

  // Cargar sesión por ID
  const loadSessionById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    const result = await getSessionById(id);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return null;
    }

    setSession(result.data);
    setIsLoading(false);
    return result.data;
  }, []);

  // Iniciar sesión (admin)
  const startSession = useCallback(async () => {
    if (!session) {
      setError('No hay sesión activa');
      return false;
    }

    setIsLoading(true);
    const result = await updateSessionStatus(session.id, 'active', 0);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return false;
    }

    setSession({ ...session, status: 'active', current_question_index: 0 });
    setIsLoading(false);
    return true;
  }, [session]);

  // Siguiente pregunta (admin)
  const nextQuestion = useCallback(async () => {
    if (!session) {
      setError('No hay sesión activa');
      return false;
    }

    const nextIndex = session.current_question_index + 1;

    if (nextIndex >= questions.length) {
      // No hay más preguntas, terminar sesión
      return endSession();
    }

    setIsLoading(true);
    const result = await updateSessionStatus(session.id, 'active', nextIndex);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return false;
    }

    setSession({ ...session, current_question_index: nextIndex });
    setIsLoading(false);
    return true;
  }, [session, questions.length]);

  // Terminar sesión (admin)
  const endSession = useCallback(async () => {
    if (!session) {
      setError('No hay sesión activa');
      return false;
    }

    setIsLoading(true);
    const result = await updateSessionStatus(session.id, 'finished');

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return false;
    }

    setSession({ ...session, status: 'finished' });
    setIsLoading(false);
    return true;
  }, [session]);

  // Agregar pregunta
  const addQuestion = useCallback(async (questionForm: CreateQuestionForm) => {
    if (!session) {
      setError('No hay sesión activa');
      return null;
    }

    setIsLoading(true);
    setError(null);

    const options = questionForm.options.map((text, index) => ({
      id: index + 1,
      text,
    }));

    const result = await createQuestion(
      session.id,
      questionForm.questionText,
      options,
      questionForm.correctOptionIndex + 1, // Convertir de índice 0 a índice 1
      questions.length + 1,
      questionForm.timeLimit
    );

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return null;
    }

    if (result.data) {
      setQuestions([...questions, result.data]);
    }

    setIsLoading(false);
    return result.data;
  }, [session, questions]);

  // Eliminar pregunta
  const removeQuestion = useCallback(async (questionId: string) => {
    setIsLoading(true);
    setError(null);

    const result = await deleteQuestion(questionId);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return false;
    }

    setQuestions(questions.filter((q) => q.id !== questionId));
    setIsLoading(false);
    return true;
  }, [questions]);

  // Cargar preguntas
  const loadQuestions = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    const result = await getQuestionsBySession(session.id);

    if (result.error) {
      setError(result.error);
    } else {
      setQuestions(result.data);
    }

    setIsLoading(false);
  }, [session]);

  // Cargar participantes
  const loadParticipants = useCallback(async () => {
    if (!session) return;

    const result = await getParticipantsBySession(session.id);

    if (result.error) {
      setError(result.error);
    } else {
      setParticipants(result.data);
    }
  }, [session]);

  // Cargar participante actual por ID
  const loadCurrentParticipant = useCallback(async (id: string) => {
    const result = await getParticipantById(id);

    if (result.error) {
      setError(result.error);
      return null;
    }

    setCurrentParticipant(result.data);
    return result.data;
  }, []);

  // Enviar respuesta
  const submitQuestionAnswer = useCallback(async (
    questionId: string,
    selectedOptionId: number,
    responseTimeMs: number
  ) => {
    if (!currentParticipant) {
      setError('No estás registrado como participante');
      return null;
    }

    // Verificar si ya respondió
    const alreadyAnswered = await hasParticipantAnswered(questionId, currentParticipant.id);
    if (alreadyAnswered) {
      setError('Ya respondiste esta pregunta');
      return null;
    }

    // Encontrar la pregunta para verificar la respuesta
    const question = questions.find((q) => q.id === questionId);
    if (!question) {
      setError('Pregunta no encontrada');
      return null;
    }

    const isCorrect = selectedOptionId === question.correct_option_id;
    const points = calculatePoints(isCorrect, responseTimeMs, question.time_limit * 1000);

    setIsLoading(true);
    setError(null);

    // Guardar la respuesta
    const answerResult = await submitAnswer(
      questionId,
      currentParticipant.id,
      selectedOptionId,
      isCorrect,
      responseTimeMs,
      points
    );

    if (answerResult.error) {
      setError(answerResult.error);
      setIsLoading(false);
      return null;
    }

    // Actualizar puntuación del participante
    const newScore = currentParticipant.score + points;
    await updateParticipantScore(currentParticipant.id, newScore);

    setCurrentParticipant({ ...currentParticipant, score: newScore });
    setIsLoading(false);

    return { isCorrect, points };
  }, [currentParticipant, questions]);

  // Obtener pregunta actual
  const getCurrentQuestion = useCallback(() => {
    if (!session || questions.length === 0) return null;
    return questions[session.current_question_index] || null;
  }, [session, questions]);

  return {
    // Estado
    session,
    questions,
    participants,
    currentParticipant,
    isLoading,
    error,

    // Acciones de sesión
    createNewSession,
    joinExistingSession,
    loadSession,
    loadSessionById,
    startSession,
    nextQuestion,
    endSession,

    // Acciones de preguntas
    addQuestion,
    removeQuestion,
    loadQuestions,

    // Acciones de participantes
    loadParticipants,
    loadCurrentParticipant,

    // Acciones de respuestas
    submitQuestionAnswer,

    // Utilidades
    clearError,
    getCurrentQuestion,
  };
}
