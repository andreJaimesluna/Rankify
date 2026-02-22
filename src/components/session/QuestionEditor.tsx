import { useState } from 'react';
import { Button, Input, Card } from '@/components/ui';
import type { CreateQuestionForm } from '@/types';

interface QuestionEditorProps {
  onSave: (question: CreateQuestionForm) => void;
  onCancel: () => void;
  initialData?: Partial<CreateQuestionForm>;
}

export function QuestionEditor({ onSave, onCancel, initialData }: QuestionEditorProps) {
  const [questionText, setQuestionText] = useState(initialData?.questionText || '');
  const [options, setOptions] = useState<string[]>(
    initialData?.options || ['', '', '', '']
  );
  const [correctOptionIndex, setCorrectOptionIndex] = useState(
    initialData?.correctOptionIndex ?? 0
  );
  const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 30);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      // Ajustar el índice de la respuesta correcta si es necesario
      if (correctOptionIndex >= newOptions.length) {
        setCorrectOptionIndex(newOptions.length - 1);
      } else if (correctOptionIndex > index) {
        setCorrectOptionIndex(correctOptionIndex - 1);
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!questionText.trim()) {
      newErrors.questionText = 'La pregunta es requerida';
    }

    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      newErrors.options = 'Se requieren al menos 2 opciones';
    }

    if (!options[correctOptionIndex]?.trim()) {
      newErrors.correctOption = 'La respuesta correcta debe tener contenido';
    }

    if (timeLimit < 5 || timeLimit > 120) {
      newErrors.timeLimit = 'El tiempo debe estar entre 5 y 120 segundos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({
        questionText: questionText.trim(),
        options: options.map((o) => o.trim()).filter(Boolean),
        correctOptionIndex,
        timeLimit,
      });
    }
  };

  return (
    <Card variant="elevated" className="animate-slide-up">
      <h3 className="text-lg font-bold text-white mb-4">
        {initialData ? 'Editar Pregunta' : 'Nueva Pregunta'}
      </h3>

      {/* Texto de la pregunta */}
      <div className="mb-4">
        <Input
          label="Pregunta"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Escribe tu pregunta aquí..."
          error={errors.questionText}
        />
      </div>

      {/* Opciones de respuesta */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Opciones de respuesta
        </label>
        {errors.options && (
          <p className="text-sm text-error mb-2">{errors.options}</p>
        )}
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              {/* Radio para seleccionar respuesta correcta */}
              <button
                type="button"
                onClick={() => setCorrectOptionIndex(index)}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  border-2 transition-all
                  ${
                    correctOptionIndex === index
                      ? 'border-success bg-success text-white'
                      : 'border-dark-500 bg-dark-700 text-gray-400 hover:border-gray-400'
                  }
                `}
                title="Marcar como respuesta correcta"
              >
                {correctOptionIndex === index && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>

              {/* Input de la opción */}
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Opción ${index + 1}`}
                className={`
                  flex-1 px-4 py-3
                  bg-dark-800 border-2 border-dark-600
                  rounded-xl text-white placeholder-gray-500
                  focus:outline-none focus:border-primary
                  transition-all
                `}
              />

              {/* Botón eliminar opción */}
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="p-2 text-gray-400 hover:text-error transition-colors"
                  title="Eliminar opción"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Botón agregar opción */}
        {options.length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="mt-3 flex items-center gap-2 text-primary hover:text-primary-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Agregar opción
          </button>
        )}

        {errors.correctOption && (
          <p className="text-sm text-error mt-2">{errors.correctOption}</p>
        )}
      </div>

      {/* Límite de tiempo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tiempo límite (segundos)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={5}
            max={120}
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            className="flex-1 h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <span className="w-16 text-center text-lg font-bold text-white bg-dark-700 px-3 py-1 rounded-lg">
            {timeLimit}s
          </span>
        </div>
        {errors.timeLimit && (
          <p className="text-sm text-error mt-2">{errors.timeLimit}</p>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onCancel} fullWidth>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} fullWidth>
          Guardar
        </Button>
      </div>
    </Card>
  );
}
