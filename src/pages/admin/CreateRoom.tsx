import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { createRoom } from '@/lib/supabase';
import type { QuestionOrderType } from '@/types';

export function CreateRoom() {
  const navigate = useNavigate();
  const { admin, isAuthenticated, isLoading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('50');
  const [timeLimitPerQuestion, setTimeLimitPerQuestion] = useState('30');
  const [questionOrder, setQuestionOrder] = useState<QuestionOrderType>('sequential');
  const [showRanking, setShowRanking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/register', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('El nombre de la sala es requerido');
      return;
    }

    const maxPart = parseInt(maxParticipants);
    if (isNaN(maxPart) || maxPart < 2 || maxPart > 100) {
      setError('El maximo de participantes debe ser entre 2 y 100');
      return;
    }

    const timeLimit = parseInt(timeLimitPerQuestion);
    if (isNaN(timeLimit) || timeLimit < 10 || timeLimit > 60) {
      setError('El tiempo limite debe ser entre 10 y 60 segundos');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await createRoom(
      {
        name: name.trim(),
        maxParticipants: maxPart,
        timeLimitPerQuestion: timeLimit,
        questionOrder,
        showRankingBetweenQuestions: showRanking,
      },
      admin?.id
    );

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if (result.data) {
      navigate(`/admin/rooms/${result.data.id}`, { replace: true });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header showBack title="Crear Sala" />

      <main className="flex-1 flex flex-col p-4">
        <Card variant="elevated" className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Configuracion de la Sala
          </h2>

          <div className="space-y-5">
            <Input
              label="Nombre de la sala"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Quiz de Matematicas"
              maxLength={100}
            />

            <Input
              label="Maximo de participantes"
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              placeholder="50"
            />

            <Input
              label="Tiempo por pregunta (segundos)"
              type="number"
              value={timeLimitPerQuestion}
              onChange={(e) => setTimeLimitPerQuestion(e.target.value)}
              placeholder="30"
            />

            {/* Orden de preguntas */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Orden de preguntas
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setQuestionOrder('sequential')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    questionOrder === 'sequential'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-dark-600 bg-dark-800 text-gray-400 hover:border-dark-500'
                  }`}
                >
                  Secuencial
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionOrder('random')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    questionOrder === 'random'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-dark-600 bg-dark-800 text-gray-400 hover:border-dark-500'
                  }`}
                >
                  Aleatorio
                </button>
              </div>
            </div>

            {/* Mostrar ranking entre preguntas */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Mostrar ranking entre preguntas</p>
                <p className="text-xs text-gray-500 mt-0.5">Los jugadores veran su posicion</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRanking(!showRanking)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  showRanking ? 'bg-primary' : 'bg-dark-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    showRanking ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {admin && (
            <p className="mt-4 text-sm text-gray-500">
              Creando como: <span className="text-gray-300">{admin.display_name}</span>
            </p>
          )}
        </Card>

        {error && (
          <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-center text-sm">
            {error}
          </div>
        )}

        <div className="flex-1" />

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleCreate}
          isLoading={isLoading}
          disabled={!name.trim()}
        >
          Crear Sala
        </Button>
      </main>
    </div>
  );
}
