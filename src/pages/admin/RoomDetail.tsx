import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, BottomNav } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { getSessionById, getQuestionsBySession } from '@/lib/supabase';
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !room) {
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
            <p className="text-gray-400 text-sm mb-2">Codigo de la sala</p>
            <p className="text-4xl font-bold text-white tracking-widest font-mono">
              {room.code}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Comparte este codigo con tus participantes
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
            {room.status === 'draft' && (
              <button
                onClick={() => navigate(`/admin/rooms/${room.id}/questions`)}
                className="text-primary text-sm hover:underline"
              >
                Editar
              </button>
            )}
          </div>
          {questions.length > 0 ? (
            <div className="space-y-2">
              {questions.map((q, index) => (
                <div key={q.id} className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-primary/20 text-primary rounded flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </span>
                  <span className="text-gray-300 truncate flex-1">{q.text}</span>
                  <span className="text-gray-500 text-xs">{q.time_limit_seconds}s</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay preguntas aun</p>
          )}
        </Card>

        {/* Acciones */}
        {room.status === 'draft' && (
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate(`/admin/rooms/${room.id}/questions`)}
            >
              {questions.length > 0 ? 'Editar Preguntas' : 'Agregar Preguntas'}
            </Button>
          </div>
        )}
      </main>

      <BottomNav items={adminNavItems} />
    </div>
  );
}
