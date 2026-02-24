import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { QuestionEditor } from '@/components/session';
import { useAuth } from '@/hooks/useAuth';
import {
  getSessionById,
  getQuestionsBySession,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from '@/lib/supabase';
import type { Room, Question, CreateQuestionForm } from '@/types';

export function RoomQuestions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editorMode, setEditorMode] = useState<'hidden' | 'create' | 'edit'>('hidden');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/register', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

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
      room.time_limit_per_question
    );

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    if (result.data) {
      setQuestions([...questions, result.data]);
    }

    setEditorMode('hidden');
    setIsSaving(false);
  };

  const handleEditQuestion = async (questionForm: CreateQuestionForm) => {
    if (!editingQuestion) return;

    setIsSaving(true);
    setError(null);

    const options = questionForm.options.map((text, index) => ({
      id: index + 1,
      text,
    }));

    const result = await updateQuestion(
      editingQuestion.id,
      questionForm.text,
      options,
      questionForm.correctOptionIndex + 1
    );

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    if (result.data) {
      setQuestions(questions.map((q) => (q.id === editingQuestion.id ? result.data! : q)));
    }

    setEditorMode('hidden');
    setEditingQuestion(null);
    setIsSaving(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    setError(null);
    const result = await deleteQuestion(questionId);

    if (result.error) {
      setError(result.error);
      return;
    }

    setQuestions(questions.filter((q) => q.id !== questionId));
    setDeleteConfirm(null);
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (!room) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);

    // Guardar nuevo orden en BD
    const questionIds = newQuestions.map((q) => q.id);
    await reorderQuestions(room.id, questionIds);
  };

  const openEditMode = (question: Question) => {
    setEditingQuestion(question);
    setEditorMode('edit');
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

  // Preparar datos para edicion
  const editorInitialData = editingQuestion
    ? {
        text: editingQuestion.text,
        options: editingQuestion.options.map((o) => o.text),
        correctOptionIndex: editingQuestion.correct_option_index - 1,
        timeLimitSeconds: editingQuestion.time_limit_seconds,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header
        showBack
        onBack={() => navigate(`/admin/rooms/${room.id}`)}
        title="Preguntas"
        subtitle={`${room.name} • Tiempo: ${room.time_limit_per_question}s`}
      />

      <main className="flex-1 flex flex-col p-4 pb-24">
        {/* Editor de pregunta */}
        {editorMode !== 'hidden' ? (
          <QuestionEditor
            key={editingQuestion?.id || 'new'}
            onSave={editorMode === 'edit' ? handleEditQuestion : handleAddQuestion}
            onCancel={() => {
              setEditorMode('hidden');
              setEditingQuestion(null);
            }}
            initialData={editorInitialData}
          />
        ) : (
          <>
            {/* Lista de preguntas */}
            {questions.length > 0 ? (
              <div className="space-y-3 mb-6">
                {questions.map((q, index) => (
                  <Card key={q.id} variant="outlined">
                    {/* Confirmacion de eliminar */}
                    {deleteConfirm === q.id ? (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-300 mb-3">
                          ¿Eliminar esta pregunta? Esta accion no se puede deshacer.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            fullWidth
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            fullWidth
                            onClick={() => handleDeleteQuestion(q.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        {/* Flechas reordenar */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveQuestion(index, 'up')}
                            disabled={index === 0}
                            className={`p-1 rounded transition-colors ${
                              index === 0
                                ? 'text-dark-600 cursor-not-allowed'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <span className="w-6 h-6 bg-primary/20 text-primary rounded flex items-center justify-center font-bold text-xs">
                            {index + 1}
                          </span>
                          <button
                            onClick={() => handleMoveQuestion(index, 'down')}
                            disabled={index === questions.length - 1}
                            className={`p-1 rounded transition-colors ${
                              index === questions.length - 1
                                ? 'text-dark-600 cursor-not-allowed'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {/* Contenido pregunta */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium">{q.text}</p>
                          <div className="mt-1 space-y-0.5">
                            {q.options.map((opt, optIdx) => (
                              <p key={opt.id} className="text-xs text-gray-500">
                                {q.correct_option_index === opt.id ? (
                                  <span className="text-success">✓ {opt.text}</span>
                                ) : (
                                  <span>{String.fromCharCode(65 + optIdx)}. {opt.text}</span>
                                )}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => openEditMode(q)}
                            className="p-2 text-gray-400 hover:text-primary transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(q.id)}
                            className="p-2 text-gray-400 hover:text-error transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
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
                    Agrega al menos una pregunta para poder activar la sala
                  </p>
                </div>
              </Card>
            )}

            {/* Boton agregar pregunta */}
            <Button
              variant="outline"
              fullWidth
              onClick={() => setEditorMode('create')}
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
      {editorMode === 'hidden' && (
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
