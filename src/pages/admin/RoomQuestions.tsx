import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { QuestionEditor } from '@/components/session';
import { useAuth } from '@/hooks/useAuth';
import { getSessionById, getQuestionsBySession, createQuestion, deleteQuestion } from '@/lib/supabase';
import type { Room, Question, CreateQuestionForm } from '@/types';

export function RoomQuestions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/register', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Cargar sala y preguntas
  const loadData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    const [roomResult, questionsResult] = await Promise.all([
      getSessionById(id),
      getQuestionsBySession(id),
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
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddQuestion = async (questionForm: CreateQuestionForm) => {
    if (!room) return;

    setIsSaving(true);
    setError(null);

    const options = questionForm.options.map((text, index) => ({
      id: index + 1,
      text,
    }));

    const result = await createQuestion(
      room.id,
      questionForm.text,
      options,
      questionForm.correctOptionIndex + 1,
      questions.length + 1,
      questionForm.timeLimitSeconds
    );

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    if (result.data) {
      setQuestions([...questions, result.data]);
    }

    setShowEditor(false);
    setIsSaving(false);
  };

  const handleRemoveQuestion = async (questionId: string) => {
    setError(null);
    const result = await deleteQuestion(questionId);

    if (result.error) {
      setError(result.error);
      return;
    }

    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col">
        <Header showBack title="Preguntas" />
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
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header
        showBack
        onBack={() => navigate(`/admin/rooms/${room.id}`)}
        title="Agregar Preguntas"
        subtitle={`${room.name} • ${room.code}`}
      />

      <main className="flex-1 flex flex-col p-4 pb-24">
        {/* Editor de pregunta */}
        {showEditor ? (
          <QuestionEditor
            onSave={handleAddQuestion}
            onCancel={() => setShowEditor(false)}
          />
        ) : (
          <>
            {/* Lista de preguntas */}
            {questions.length > 0 ? (
              <div className="space-y-3 mb-6">
                {questions.map((q, index) => (
                  <Card key={q.id} variant="outlined">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 bg-primary/20 text-primary rounded-lg flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{q.text}</p>
                        <p className="text-gray-500 text-sm">
                          {q.options.length} opciones • {q.time_limit_seconds}s
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="p-2 text-gray-400 hover:text-error transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card variant="outlined" className="mb-6">
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-400">No hay preguntas aun</p>
                  <p className="text-gray-500 text-sm">
                    Agrega al menos una pregunta para continuar
                  </p>
                </div>
              </Card>
            )}

            {/* Boton agregar pregunta */}
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowEditor(true)}
              className="mb-6"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar Pregunta
            </Button>

            {error && (
              <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-center text-sm">
                {error}
              </div>
            )}
          </>
        )}
      </main>

      {/* Boton volver a la sala */}
      {!showEditor && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-900/95 backdrop-blur-sm border-t border-dark-700">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate(`/admin/rooms/${room.id}`)}
            disabled={isSaving}
          >
            Volver a la Sala ({questions.length}{' '}
            {questions.length === 1 ? 'pregunta' : 'preguntas'})
          </Button>
        </div>
      )}
    </div>
  );
}
