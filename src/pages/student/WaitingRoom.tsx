import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import { Card } from '@/components/ui';
import { RankingList } from '@/components/ranking';
import { useSession, useRealtime } from '@/hooks';
import { storage, STORAGE_KEYS, generateAvatarColor, getInitials } from '@/lib/utils';
import type { Session, Participant } from '@/types';

export function WaitingRoom() {
  const navigate = useNavigate();
  const { loadSession, loadParticipants, session, participants, error } =
    useSession();

  const [localSession, setLocalSession] = useState<Session | null>(session);
  const [localParticipants, setLocalParticipants] = useState<Participant[]>(participants);

  // Cargar sesión al montar
  useEffect(() => {
    const code = storage.get(STORAGE_KEYS.SESSION_CODE, '');
    if (!code) {
      navigate('/', { replace: true });
      return;
    }

    loadSession(code).then((s) => {
      if (s) {
        setLocalSession(s);
        // Si la sesión ya está activa, ir al juego
        if (s.status === 'active') {
          navigate('/student/play', { replace: true });
        } else if (s.status === 'finished') {
          navigate('/student/results', { replace: true });
        }
      }
    });
  }, [loadSession, navigate]);

  // Cargar participantes
  useEffect(() => {
    if (localSession) {
      loadParticipants();
    }
  }, [localSession, loadParticipants]);

  // Actualizar participantes locales cuando cambian
  useEffect(() => {
    setLocalParticipants(participants);
  }, [participants]);

  // Handlers para realtime
  const handleSessionUpdate = useCallback(
    (updatedSession: Partial<Session>) => {
      setLocalSession((prev) => (prev ? { ...prev, ...updatedSession } : null));

      // Navegar según el estado
      if (updatedSession.status === 'active') {
        navigate('/student/play', { replace: true });
      } else if (updatedSession.status === 'finished') {
        navigate('/student/results', { replace: true });
      }
    },
    [navigate]
  );

  const handleParticipantJoin = useCallback((participant: Participant) => {
    setLocalParticipants((prev) => {
      // Evitar duplicados
      if (prev.some((p) => p.id === participant.id)) return prev;
      return [...prev, participant];
    });
  }, []);

  const handleParticipantUpdate = useCallback((participant: Participant) => {
    setLocalParticipants((prev) =>
      prev.map((p) => (p.id === participant.id ? participant : p))
    );
  }, []);

  const handleParticipantLeave = useCallback((data: { id: string }) => {
    setLocalParticipants((prev) => prev.filter((p) => p.id !== data.id));
  }, []);

  // Suscribirse a cambios en tiempo real
  useRealtime({
    sessionId: localSession?.id || null,
    onSessionUpdate: handleSessionUpdate,
    onParticipantJoin: handleParticipantJoin,
    onParticipantUpdate: handleParticipantUpdate,
    onParticipantLeave: handleParticipantLeave,
  });

  const participantId = storage.get(STORAGE_KEYS.PARTICIPANT_ID, '');
  const nickname = storage.get(STORAGE_KEYS.NICKNAME, '');

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

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header
        title={localSession?.name || 'Sala de Espera'}
        subtitle={localSession ? `Código: ${localSession.code}` : ''}
      />

      <main className="flex-1 flex flex-col p-4">
        {/* Info del usuario actual */}
        <Card variant="elevated" className="mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`
                w-14 h-14 rounded-full flex items-center justify-center
                text-xl font-bold text-white
                ${generateAvatarColor(nickname)}
              `}
            >
              {getInitials(nickname)}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{nickname}</p>
              <p className="text-sm text-gray-400">Esperando que inicie la sesión...</p>
            </div>
          </div>
        </Card>

        {/* Animación de espera */}
        <div className="flex flex-col items-center py-8">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/30 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-gray-400 text-center">
            Esperando a que el administrador<br />inicie la sesión...
          </p>
        </div>

        {/* Lista de participantes */}
        <Card variant="outlined" className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Participantes</h3>
            <span className="text-sm text-gray-400 bg-dark-700 px-3 py-1 rounded-full">
              {localParticipants.length}
            </span>
          </div>

          {localParticipants.length > 0 ? (
            <RankingList
              participants={localParticipants}
              currentUserId={participantId}
              showScore={false}
              compact
            />
          ) : (
            <p className="text-center text-gray-500 py-4">
              Cargando participantes...
            </p>
          )}
        </Card>
      </main>
    </div>
  );
}
