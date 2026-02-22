import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';
import { QuestionEditor } from '@/components/session';
import { useSession } from '@/hooks';
import type { CreateQuestionForm, Question } from '@/types';

export function CreateSession() {
  const navigate = useNavigate();
  const { createNewSession, addQuestion, session, questions, isLoading, error, clearError } =
    useSession();

  const [step, setStep] = useState<'info' | 'questions'>('info');
  const [sessionName, setSessionName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [localQuestions, setLocalQuestions] = useState<
    Array<CreateQuestionForm & { tempId: string }>
  >([]);

  const handleCreateSession = async () => {
    if (!sessionName.trim() || !adminName.trim()) return;

    clearError();
    const newSession = await createNewSession(sessionName.trim(), adminName.trim());

    if (newSession) {
      setStep('questions');
    }
  };

  const handleAddQuestion = (question: CreateQuestionForm) => {
    if (session) {
      // Si ya tenemos sesión, agregar directamente a la BD
      addQuestion(question);
    } else {
      // Si no, guardar localmente
      setLocalQuestions([
        ...localQuestions,
        { ...question, tempId: Date.now().toString() },
      ]);
    }
    setShowEditor(false);
  };

  const handleRemoveLocalQuestion = (tempId: string) => {
    setLocalQuestions(localQuestions.filter((q) => q.tempId !== tempId));
  };

  const handleFinish = async () => {
    // Agregar preguntas locales si hay
    for (const q of localQuestions) {
      await addQuestion(q);
    }

    // Navegar al lobby
    navigate('/admin/lobby', { replace: true });
  };

  const allQuestions = session ? questions : localQuestions;
  const canFinish = allQuestions.length >= 1;

  if (step === 'info') {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col">
        <Header showBack title="Crear Sesión" />

        <main className="flex-1 flex flex-col p-4">
          <Card variant="elevated" className="mb-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Información de la Sesión
            </h2>

            <div className="space-y-4">
              <Input
                label="Nombre de la sesión"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Ej: Quiz de Matemáticas"
                maxLength={100}
              />

              <Input
                label="Tu nombre (como administrador)"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Ej: Profesor García"
                maxLength={50}
              />
            </div>
          </Card>

          {error && (
            <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-center">
              {error}
            </div>
          )}

          <div className="flex-1" />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleCreateSession}
            isLoading={isLoading}
            disabled={!sessionName.trim() || !adminName.trim()}
          >
            Continuar
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header
        showBack
        onBack={() => setStep('info')}
        title="Agregar Preguntas"
        subtitle={session ? `Código: ${session.code}` : ''}
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
            {allQuestions.length > 0 ? (
              <div className="space-y-3 mb-6">
                {allQuestions.map((q, index) => (
                  <Card key={'tempId' in q ? q.tempId : (q as Question).id} variant="outlined">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 bg-primary/20 text-primary rounded-lg flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {'tempId' in q ? q.questionText : q.question_text}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {q.options.length} opciones • {'tempId' in q ? q.timeLimit : q.time_limit}s
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          'tempId' in q
                            ? handleRemoveLocalQuestion(q.tempId)
                            : null // TODO: removeQuestion para preguntas de BD
                        }
                        className="p-2 text-gray-400 hover:text-error transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card variant="outlined" className="mb-6">
                <div className="text-center py-8">
                  <svg
                    className="w-16 h-16 text-gray-600 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-gray-400">No hay preguntas aún</p>
                  <p className="text-gray-500 text-sm">
                    Agrega al menos una pregunta para continuar
                  </p>
                </div>
              </Card>
            )}

            {/* Botón agregar pregunta */}
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowEditor(true)}
              className="mb-6"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Agregar Pregunta
            </Button>

            {error && (
              <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-center">
                {error}
              </div>
            )}
          </>
        )}
      </main>

      {/* Botón de finalizar */}
      {!showEditor && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-900/95 backdrop-blur-sm border-t border-dark-700">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleFinish}
            disabled={!canFinish}
            isLoading={isLoading}
          >
            Continuar al Lobby ({allQuestions.length}{' '}
            {allQuestions.length === 1 ? 'pregunta' : 'preguntas'})
          </Button>
        </div>
      )}
    </div>
  );
}
