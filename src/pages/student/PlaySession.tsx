import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import { Card } from '@/components/ui';
import { QuestionCard } from '@/components/session';
import { useSession, useRealtime } from '@/hooks';
import { storage, STORAGE_KEYS, formatScore } from '@/lib/utils';
import type { Session, Question } from '@/types';

export function PlaySession() {
  const navigate = useNavigate();
  const {
    loadSession,
    loadQuestions,
    loadCurrentParticipant,
    submitQuestionAnswer,
    session,
    questions,
    currentParticipant,
    error,
  } = useSession();

  const [localSession, setLocalSession] = useState<Session | null>(session);
  const [localQuestions, setLocalQuestions] = useState<Question[]>(questions);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    points: number;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  // Cargar sesión, participante y preguntas al montar
  useEffect(() => {
    const code = storage.get(STORAGE_KEYS.SESSION_CODE, '');
    const participantId = storage.get(STORAGE_KEYS.PARTICIPANT_ID, '');

    if (!code || !participantId) {
      navigate('/', { replace: true });
      return;
    }

    // Cargar participante
    loadCurrentParticipant(participantId);

    // Cargar sesión
    loadSession(code).then((s) => {
      if (s) {
        setLocalSession(s);
        if (s.status === 'waiting') {
          navigate('/student/waiting', { replace: true });
        } else if (s.status === 'finished') {
          navigate('/student/results', { replace: true });
        }
      }
    });
  }, [loadSession, loadCurrentParticipant, navigate]);

  useEffect(() => {
    if (localSession) {
      loadQuestions();
    }
  }, [localSession, loadQuestions]);

  useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  useEffect(() => {
    if (currentParticipant) {
      setScore(currentParticipant.score);
    }
  }, [currentParticipant]);

  // Handler para actualización de sesión en tiempo real
  const handleSessionUpdate = useCallback(
    (updatedSession: Partial<Session>) => {
      setLocalSession((prev) => {
        if (!prev) return null;
        const newSession = { ...prev, ...updatedSession };

        // Resetear estado de resultado cuando cambia la pregunta
        if (
          updatedSession.current_question_index !== undefined &&
          updatedSession.current_question_index !== prev.current_question_index
        ) {
          setShowResult(false);
          setLastResult(null);
        }

        return newSession;
      });

      if (updatedSession.status === 'finished') {
        navigate('/student/results', { replace: true });
      }
    },
    [navigate]
  );

  useRealtime({
    sessionId: localSession?.id || null,
    onSessionUpdate: handleSessionUpdate,
  });

  // Obtener pregunta actual
  const currentQuestion =
    localSession && localQuestions.length > 0
      ? localQuestions[localSession.current_question_index]
      : null;

  // Manejar respuesta
  const handleAnswer = async (optionId: number, responseTimeMs: number) => {
    if (!currentQuestion) return;

    // Marcar como respondida localmente
    setAnsweredQuestions((prev) => new Set(prev).add(currentQuestion.id));

    // Enviar respuesta
    const result = await submitQuestionAnswer(
      currentQuestion.id,
      optionId,
      responseTimeMs
    );

    if (result) {
      setLastResult(result);
      setScore((prev) => prev + result.points);
      setShowResult(true);
    }
  };

  const isAnswered = currentQuestion
    ? answeredQuestions.has(currentQuestion.id)
    : false;

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4">
        <Card variant="elevated" className="text-center max-w-sm">
          <div className="text-error text-5xl mb-4">!</div>
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline"
          >
            Volver al inicio
          </button>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando pregunta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header
        title={localSession?.name || 'Jugando'}
        rightContent={
          <div className="bg-primary/20 px-4 py-2 rounded-xl">
            <span className="text-primary font-bold">{formatScore(score)} pts</span>
          </div>
        }
      />

      <main className="flex-1 flex flex-col p-4">
        <QuestionCard
          question={currentQuestion}
          questionNumber={(localSession?.current_question_index || 0) + 1}
          totalQuestions={localQuestions.length}
          onAnswer={handleAnswer}
          isAnswered={isAnswered}
          showResult={showResult}
          disabled={isAnswered}
        />

        {/* Feedback de puntos */}
        {showResult && lastResult && (
          <div
            className={`
              mt-4 p-4 rounded-xl text-center animate-scale-in
              ${lastResult.isCorrect ? 'bg-success/10' : 'bg-dark-700'}
            `}
          >
            {lastResult.isCorrect ? (
              <div>
                <p className="text-success text-2xl font-bold">
                  +{lastResult.points} puntos
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Respuesta correcta
                </p>
              </div>
            ) : (
              <p className="text-gray-400">
                Esperando siguiente pregunta...
              </p>
            )}
          </div>
        )}

        {/* Indicador de espera entre preguntas */}
        {isAnswered && !showResult && (
          <div className="mt-4 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Procesando respuesta...</p>
          </div>
        )}
      </main>
    </div>
  );
}
