import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { RankingList } from '@/components/ranking';
import { useSession, useRealtime } from '@/hooks';
import { storage, STORAGE_KEYS } from '@/lib/utils';
import type { Participant, Answer } from '@/types';

export function LiveSession() {
  const navigate = useNavigate();
  const {
    session,
    questions,
    participants,
    loadSessionById,
    loadParticipants,
    loadQuestions,
    nextQuestion,
    endSession,
    isLoading,
    error,
  } = useSession();

  const [localParticipants, setLocalParticipants] = useState<Participant[]>(participants);
  const [answersCount, setAnswersCount] = useState(0);

  // Cargar sesión al montar
  useEffect(() => {
    const sessionId = storage.get(STORAGE_KEYS.ADMIN_SESSION_ID, '');
    if (!sessionId) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    loadSessionById(sessionId);
  }, [navigate, loadSessionById]);

  useEffect(() => {
    if (session) {
      loadParticipants();
      loadQuestions();
    }
  }, [session, loadParticipants, loadQuestions]);

  useEffect(() => {
    setLocalParticipants(participants);
  }, [participants]);

  // Resetear contador de respuestas cuando cambia la pregunta
  useEffect(() => {
    setAnswersCount(0);
  }, [session?.current_question_index]);

  // Handlers para realtime
  const handleParticipantUpdate = useCallback((participant: Participant) => {
    setLocalParticipants((prev) =>
      prev.map((p) => (p.id === participant.id ? participant : p))
    );
  }, []);

  const handleAnswerSubmit = useCallback((_answer: Answer) => {
    setAnswersCount((prev) => prev + 1);
  }, []);

  useRealtime({
    sessionId: session?.id || null,
    onParticipantUpdate: handleParticipantUpdate,
    onAnswerSubmit: handleAnswerSubmit,
  });

  const handleNextQuestion = async () => {
    const success = await nextQuestion();
    if (success && session && session.current_question_index + 1 >= questions.length) {
      navigate('/admin/results', { replace: true });
    }
  };

  const handleEndSession = async () => {
    const success = await endSession();
    if (success) {
      navigate('/admin/results', { replace: true });
    }
  };

  if (!session || questions.length === 0) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-gray-400">Cargando sesión...</p>
      </div>
    );
  }

  const currentQuestion = questions[session.current_question_index];
  const isLastQuestion = session.current_question_index >= questions.length - 1;
  const allAnswered = answersCount >= localParticipants.length;

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header
        title={session.name}
        subtitle={`Pregunta ${session.current_question_index + 1} de ${questions.length}`}
      />

      <main className="flex-1 flex flex-col p-4 pb-24">
        {/* Pregunta actual */}
        <Card variant="elevated" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              Pregunta {session.current_question_index + 1}
            </span>
            <span className="text-sm text-gray-400">
              {currentQuestion.time_limit_seconds}s
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-4">
            {currentQuestion.text}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {currentQuestion.options.map((option, index) => (
              <div
                key={option.id}
                className={`
                  p-3 rounded-lg text-sm
                  ${
                    option.id === currentQuestion.correct_option_index
                      ? 'bg-success/20 text-success border border-success/30'
                      : 'bg-dark-700 text-gray-400'
                  }
                `}
              >
                <span className="font-bold mr-2">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option.text}
              </div>
            ))}
          </div>
        </Card>

        {/* Estadísticas en vivo */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card variant="outlined">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {answersCount}/{localParticipants.length}
              </p>
              <p className="text-gray-400 text-sm">Respuestas</p>
            </div>
          </Card>
          <Card variant="outlined">
            <div className="text-center">
              <p
                className={`text-3xl font-bold ${
                  allAnswered ? 'text-success' : 'text-warning'
                }`}
              >
                {allAnswered ? 'Listo' : 'Esperando'}
              </p>
              <p className="text-gray-400 text-sm">Estado</p>
            </div>
          </Card>
        </div>

        {/* Ranking en vivo */}
        <Card variant="outlined" className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Ranking en Vivo</h3>
            <span className="text-sm text-gray-400">
              {localParticipants.filter((p) => p.connected).length} conectados
            </span>
          </div>
          <RankingList participants={localParticipants} compact />
        </Card>

        {error && (
          <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-center">
            {error}
          </div>
        )}
      </main>

      {/* Controles */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-900/95 backdrop-blur-sm border-t border-dark-700">
        <div className="flex gap-3">
          <Button
            variant="danger"
            size="lg"
            onClick={handleEndSession}
            isLoading={isLoading}
            className="flex-shrink-0"
          >
            Terminar
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleNextQuestion}
            isLoading={isLoading}
          >
            {isLastQuestion ? 'Ver Resultados' : 'Siguiente Pregunta'}
          </Button>
        </div>
      </div>
    </div>
  );
}
