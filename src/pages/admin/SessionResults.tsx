import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { Podium, RankingList } from '@/components/ranking';
import { useSession, useRankingStats } from '@/hooks';
import { storage, STORAGE_KEYS, formatScore } from '@/lib/utils';
import { exportResultsToCSV } from '@/lib/supabase';

export function SessionResults() {
  const navigate = useNavigate();
  const { session, participants, questions, loadSessionById, loadParticipants, loadQuestions } = useSession();
  const [isLoaded, setIsLoaded] = useState(false);

  const stats = useRankingStats(participants);

  // Cargar sesión al montar
  useEffect(() => {
    const sessionId = storage.get(STORAGE_KEYS.ADMIN_SESSION_ID, '');
    if (!sessionId) {
      navigate('/admin/create', { replace: true });
      return;
    }
    loadSessionById(sessionId);
  }, [navigate, loadSessionById]);

  useEffect(() => {
    if (session) {
      Promise.all([loadParticipants(), loadQuestions()]).then(() => {
        setIsLoaded(true);
      });
    }
  }, [session, loadParticipants, loadQuestions]);

  const handleExportCSV = () => {
    if (session) {
      exportResultsToCSV(session.name, participants);
    }
  };

  const handleNewSession = () => {
    storage.remove(STORAGE_KEYS.ADMIN_SESSION_ID);
    navigate('/admin/create', { replace: true });
  };

  const handleGoHome = () => {
    storage.remove(STORAGE_KEYS.ADMIN_SESSION_ID);
    navigate('/', { replace: true });
  };

  if (!session || !isLoaded) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-gray-400">Cargando resultados...</p>
      </div>
    );
  }

  // Obtener el ganador
  const sortedParticipants = [...participants].sort((a, b) => b.total_score - a.total_score);
  const winner = sortedParticipants[0];

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header title="Resultados Finales" />

      <main className="flex-1 flex flex-col p-4 pb-32">
        {/* Cabecera de celebración */}
        <div className="text-center py-4">
          <h2 className="text-2xl font-bold text-white mb-2">
            ¡Sesión Completada!
          </h2>
          <p className="text-gray-400">{session.name}</p>
        </div>

        {/* Podio */}
        <Card variant="elevated" className="mb-6">
          <Podium participants={participants} />
        </Card>

        {/* Ganador destacado */}
        {winner && (
          <Card variant="elevated" className="mb-6 border-2 border-gold/30 bg-gold/5">
            <div className="text-center">
              <p className="text-gold text-sm font-medium mb-1">Ganador</p>
              <p className="text-2xl font-bold text-white mb-1">{winner.nickname}</p>
              <p className="text-gold text-3xl font-bold">
                {formatScore(winner.total_score)} puntos
              </p>
            </div>
          </Card>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card variant="outlined" padding="sm">
            <div className="text-center">
              <p className="text-xl font-bold text-primary">
                {participants.length}
              </p>
              <p className="text-gray-500 text-xs">Participantes</p>
            </div>
          </Card>
          <Card variant="outlined" padding="sm">
            <div className="text-center">
              <p className="text-xl font-bold text-success">{questions.length}</p>
              <p className="text-gray-500 text-xs">Preguntas</p>
            </div>
          </Card>
          <Card variant="outlined" padding="sm">
            <div className="text-center">
              <p className="text-xl font-bold text-warning">
                {formatScore(stats.averageScore)}
              </p>
              <p className="text-gray-500 text-xs">Promedio</p>
            </div>
          </Card>
        </div>

        {/* Ranking completo */}
        <Card variant="outlined" className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Ranking Completo</h3>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary-400 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Exportar CSV
            </button>
          </div>
          <RankingList participants={participants} compact />
        </Card>
      </main>

      {/* Botones de acción */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-900/95 backdrop-blur-sm border-t border-dark-700">
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" onClick={handleGoHome} className="flex-1">
            Inicio
          </Button>
          <Button variant="primary" size="lg" onClick={handleNewSession} className="flex-1">
            Nueva Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
