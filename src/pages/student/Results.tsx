import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { Podium, RankingList } from '@/components/ranking';
import { useSession, useRanking } from '@/hooks';
import { storage, STORAGE_KEYS, formatScore } from '@/lib/utils';

export function Results() {
  const navigate = useNavigate();
  const { loadSession, loadParticipants, session, participants } = useSession();
  const [isLoaded, setIsLoaded] = useState(false);

  const participantId = storage.get(STORAGE_KEYS.PARTICIPANT_ID, '');

  // Cargar datos
  useEffect(() => {
    const code = storage.get(STORAGE_KEYS.SESSION_CODE, '');
    if (!code) {
      navigate('/', { replace: true });
      return;
    }

    loadSession(code).then(() => {
      loadParticipants().then(() => {
        setIsLoaded(true);
      });
    });
  }, [loadSession, loadParticipants, navigate]);

  const { currentUserRanking, totalParticipants } = useRanking({
    participants,
    currentUserId: participantId,
  });

  const handleGoHome = () => {
    // Limpiar localStorage
    storage.remove(STORAGE_KEYS.PARTICIPANT_ID);
    storage.remove(STORAGE_KEYS.SESSION_CODE);
    storage.remove(STORAGE_KEYS.NICKNAME);
    navigate('/', { replace: true });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-gray-400">Cargando resultados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header title="Resultados Finales" />

      <main className="flex-1 flex flex-col p-4 pb-24">
        {/* Celebración */}
        <div className="text-center py-4">
          <h2 className="text-2xl font-bold text-white mb-2">
            ¡Sesión Terminada!
          </h2>
          <p className="text-gray-400">
            {session?.name}
          </p>
        </div>

        {/* Podio */}
        <Card variant="elevated" className="mb-6">
          <Podium participants={participants} currentUserId={participantId} />
        </Card>

        {/* Resultado del usuario */}
        {currentUserRanking && (
          <Card
            variant="elevated"
            className="mb-6 border-2 border-primary/30 bg-primary/5"
          >
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Tu posición final</p>
              <p className="text-4xl font-bold text-primary mb-2">
                #{currentUserRanking.rank}
              </p>
              <p className="text-2xl font-semibold text-white">
                {formatScore(currentUserRanking.participant.score)} puntos
              </p>
              <p className="text-gray-500 text-sm mt-2">
                de {totalParticipants} participantes
              </p>
            </div>
          </Card>
        )}

        {/* Lista completa de rankings */}
        <Card variant="outlined">
          <h3 className="text-lg font-semibold text-white mb-4">
            Ranking Completo
          </h3>
          <RankingList
            participants={participants}
            currentUserId={participantId}
            compact
          />
        </Card>
      </main>

      {/* Botón de volver */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-900/95 backdrop-blur-sm border-t border-dark-700">
        <Button variant="primary" size="lg" fullWidth onClick={handleGoHome}>
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
}
