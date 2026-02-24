import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, BottomNav } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { getSessionById, getQuestionsBySession, activateRoom, deactivateRoom } from '@/lib/supabase';
import type { Room, Question } from '@/types';
import { adminNavItems } from './navItems';

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  scheduled: 'Programada',
  active: 'En curso',
  finished: 'Finalizada',
  archived: 'Archivada',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  scheduled: 'bg-amber-500/20 text-amber-400',
  active: 'bg-success/20 text-success',
  finished: 'bg-primary/20 text-primary',
  archived: 'bg-dark-600 text-gray-500',
};

export function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/register', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!id) return;

    async function loadRoom() {
      setIsLoading(true);

      const [roomResult, questionsResult] = await Promise.all([
        getSessionById(id!),
        getQuestionsBySession(id!),
      ]);

      if (roomResult.error) {
        setError(roomResult.error);
      } else {
        setRoom(roomResult.data);
      }

      if (questionsResult.data) {
        setQuestions(questionsResult.data);
      }

      setIsLoading(false);
    }

    loadRoom();
  }, [id]);

  const handleActivate = async () => {
    if (!room) return;

    setIsActivating(true);
    setError(null);

    const result = await activateRoom(room.id);

    if (result.error) {
      setError(result.error);
      setIsActivating(false);
      setShowActivateConfirm(false);
      return;
    }

    if (result.data) {
      setRoom(result.data);
    }

    setIsActivating(false);
    setShowActivateConfirm(false);
  };

  const handleDeactivate = async () => {
    if (!room) return;

    setIsActivating(true);
    setError(null);

    const result = await deactivateRoom(room.id);

    if (result.error) {
      setError(result.error);
      setIsActivating(false);
      setShowDeactivateConfirm(false);
      return;
    }

    if (result.data) {
      setRoom(result.data);
    }

    setIsActivating(false);
    setShowDeactivateConfirm(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col">
        <Header showBack title="Sala" />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card variant="outlined">
            <div className="text-center py-6">
              <p className="text-error font-medium">{error || 'Sala no encontrada'}</p>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="mt-3 text-primary hover:underline text-sm"
              >
                Volver al Dashboard
              </button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!room) return null;

  const isDraft = room.status === 'draft';
  const isActive = room.status === 'active';
  const hasQuestions = questions.length > 0;

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col pb-24">
      <Header showBack onBack={() => navigate('/admin/dashboard')} title={room.name} />

      <main className="flex-1 p-4 space-y-4">
        {/* Estado y codigo */}
        <Card variant="elevated">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[room.status]}`}>
              {statusLabels[room.status]}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(room.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="text-center py-4">
            <p className="text-gray-400 text-sm mb-2">
              {isActive ? 'Codigo activo' : 'Codigo de la sala'}
            </p>
            <p className={`text-4xl font-bold tracking-widest font-mono ${
              isActive ? 'text-success' : 'text-white'
            }`}>
              {room.code}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              {isActive
                ? 'Los estudiantes pueden unirse con este codigo'
                : 'Activa la sala para que los estudiantes se unan'}
            </p>
          </div>
        </Card>

        {/* Configuracion */}
        <Card variant="outlined">
          <h3 className="text-sm font-bold text-white mb-3">Configuracion</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Max. participantes</span>
              <span className="text-white">{room.max_participants || 'Sin limite'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tiempo por pregunta</span>
              <span className="text-white">{room.time_limit_per_question}s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Orden de preguntas</span>
              <span className="text-white">
                {room.question_order === 'sequential' ? 'Secuencial' : 'Aleatorio'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Ranking entre preguntas</span>
              <span className="text-white">
                {room.show_ranking_between_questions ? 'Si' : 'No'}
              </span>
            </div>
          </div>
        </Card>

        {/* Preguntas */}
        <Card variant="outlined">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">
              Preguntas ({questions.length})
            </h3>
            {isDraft && (
              <button
                onClick={() => navigate(`/admin/rooms/${room.id}/questions`)}
                className="text-primary text-sm hover:underline"
              >
                Editar
              </button>
            )}
          </div>
          {hasQuestions ? (
            <div className="space-y-2">
              {questions.map((q, index) => (
                <div key={q.id} className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-primary/20 text-primary rounded flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </span>
                  <span className="text-gray-300 truncate flex-1">{q.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay preguntas aun</p>
          )}
        </Card>

        {/* Error */}
        {error && (
          <div className="p-4 bg-error/10 border border-error/30 rounded-xl text-error text-center text-sm">
            {error}
          </div>
        )}

        {/* Confirmacion activar */}
        {showActivateConfirm && (
          <Card variant="elevated">
            <div className="text-center py-2">
              <p className="text-white font-medium mb-2">¿Activar sala?</p>
              <p className="text-gray-400 text-sm mb-4">
                Los estudiantes podran unirse con el codigo. Las preguntas y configuracion no se podran editar mientras este activa.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowActivateConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleActivate}
                  isLoading={isActivating}
                >
                  Activar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Confirmacion desactivar */}
        {showDeactivateConfirm && (
          <Card variant="elevated">
            <div className="text-center py-2">
              <p className="text-white font-medium mb-2">¿Desactivar sala?</p>
              <p className="text-gray-400 text-sm mb-4">
                Los estudiantes ya no podran unirse. Podras editarla y volverla a activar.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowDeactivateConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={handleDeactivate}
                  isLoading={isActivating}
                >
                  Desactivar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Acciones */}
        <div className="space-y-3">
          {isDraft && (
            <>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => navigate(`/admin/rooms/${room.id}/questions`)}
              >
                {hasQuestions ? 'Editar Preguntas' : 'Agregar Preguntas'}
              </Button>

              {hasQuestions ? (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => setShowActivateConfirm(true)}
                >
                  Activar Sala
                </Button>
              ) : (
                <div className="text-center text-gray-500 text-sm py-2">
                  Agrega al menos una pregunta para activar la sala
                </div>
              )}
            </>
          )}

          {isActive && (
            <Button
              variant="danger"
              size="lg"
              fullWidth
              onClick={() => setShowDeactivateConfirm(true)}
            >
              Desactivar Sala
            </Button>
          )}
        </div>
      </main>

      <BottomNav items={adminNavItems} />
    </div>
  );
}
