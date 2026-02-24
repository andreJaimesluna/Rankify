import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { RankingList } from '@/components/ranking';
import { useSession, useRealtime } from '@/hooks';
import { storage, STORAGE_KEYS } from '@/lib/utils';
import type { Participant } from '@/types';

export function SessionLobby() {
  const navigate = useNavigate();
  const {
    loadSessionById,
    loadParticipants,
    loadQuestions,
    startSession,
    session,
    participants,
    questions,
    isLoading,
    error,
  } = useSession();

  const [localParticipants, setLocalParticipants] = useState<Participant[]>(participants);
  const [copied, setCopied] = useState(false);

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
      loadParticipants();
      loadQuestions();
    }
  }, [session, loadParticipants, loadQuestions]);

  useEffect(() => {
    setLocalParticipants(participants);
  }, [participants]);

  // Handlers para realtime
  const handleParticipantJoin = useCallback((participant: Participant) => {
    setLocalParticipants((prev) => {
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

  useRealtime({
    sessionId: session?.id || null,
    onParticipantJoin: handleParticipantJoin,
    onParticipantUpdate: handleParticipantUpdate,
    onParticipantLeave: handleParticipantLeave,
  });

  const handleCopyCode = async () => {
    if (!session) return;

    try {
      await navigator.clipboard.writeText(session.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para navegadores que no soportan clipboard
      const input = document.createElement('input');
      input.value = session.code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartSession = async () => {
    const success = await startSession();
    if (success) {
      navigate('/admin/live', { replace: true });
    }
  };

  const canStart = localParticipants.length >= 1 && questions.length >= 1;

  if (!session) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-gray-400">Cargando sesión...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header title={session.name} subtitle="Sala de espera" />

      <main className="flex-1 flex flex-col p-4 pb-24">
        {/* Código de sesión */}
        <Card variant="elevated" className="mb-6">
          <p className="text-gray-400 text-sm text-center mb-2">
            Código de la sesión
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-bold text-white tracking-widest">
              {session.code}
            </span>
            <button
              onClick={handleCopyCode}
              className={`
                p-3 rounded-xl transition-all
                ${copied ? 'bg-success text-white' : 'bg-dark-700 text-gray-300 hover:bg-dark-600'}
              `}
            >
              {copied ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>
          <p className="text-gray-500 text-sm text-center mt-3">
            Comparte este código con los participantes
          </p>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card variant="outlined">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {localParticipants.length}
              </p>
              <p className="text-gray-400 text-sm">Participantes</p>
            </div>
          </Card>
          <Card variant="outlined">
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{questions.length}</p>
              <p className="text-gray-400 text-sm">Preguntas</p>
            </div>
          </Card>
        </div>

        {/* Lista de participantes */}
        <Card variant="outlined" className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Participantes</h3>
            {localParticipants.length > 0 && (
              <span className="text-sm text-gray-400 bg-dark-700 px-3 py-1 rounded-full">
                {localParticipants.filter((p) => p.connected).length} conectados
              </span>
            )}
          </div>

          {localParticipants.length > 0 ? (
            <RankingList participants={localParticipants} showScore={false} compact />
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Esperando participantes...</p>
              <p className="text-gray-500 text-sm mt-1">
                Comparte el código para que se unan
              </p>
            </div>
          )}
        </Card>

        {error && (
          <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-center">
            {error}
          </div>
        )}
      </main>

      {/* Botón de iniciar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-900/95 backdrop-blur-sm border-t border-dark-700">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleStartSession}
          isLoading={isLoading}
          disabled={!canStart}
        >
          {canStart
            ? `Iniciar Sesión (${localParticipants.length} participantes)`
            : localParticipants.length < 1
            ? 'Esperando participantes...'
            : 'Agrega al menos una pregunta'}
        </Button>
      </div>
    </div>
  );
}
