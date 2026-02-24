import { useState } from 'react';
import { Button, Input, Card } from '@/components/ui';
import type { CreateQuestionForm } from '@/types';

interface QuestionEditorProps {
  onSave: (question: CreateQuestionForm) => void;
  onCancel: () => void;
  initialData?: Partial<CreateQuestionForm>;
}

export function QuestionEditor({ onSave, onCancel, initialData }: QuestionEditorProps) {
  const [questionText, setQuestionText] = useState(initialData?.text || '');
  const [options, setOptions] = useState<string[]>(
    initialData?.options || ['', '', '', '']
  );
  const [correctOptionIndex, setCorrectOptionIndex] = useState(
    initialData?.correctOptionIndex ?? 0
  );
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({
        text: questionText.trim(),
        options: options.map((o) => o.trim()).filter(Boolean),
        correctOptionIndex,
        timeLimitSeconds: initialData?.timeLimitSeconds || 0,
        tags: [],
      });
    }
  };

  return (
    <Card variant="elevated" className="animate-slide-up">
      <h3 className="text-lg font-bold text-white mb-4">
        {initialData?.text ? 'Editar Pregunta' : 'Nueva Pregunta'}
      </h3>

      {/* Texto de la pregunta */}
      <div className="mb-4">
        <Input
          label="Pregunta"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Escribe tu pregunta aqui..."
          error={errors.questionText}
        />
      </div>

      {/* Opciones de respuesta */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Opciones de respuesta
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Marca la respuesta correcta con el circulo verde
        </p>
        {errors.options && (
          <p className="text-sm text-error mb-2">{errors.options}</p>
        )}
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrectOptionIndex(index)}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center shrink-0
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Opcion ${index + 1}`}
                className="flex-1 px-4 py-3 bg-dark-800 border-2 border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-all"
              />

              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="p-2 text-gray-400 hover:text-error transition-colors shrink-0"
                  title="Eliminar opcion"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {options.length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="mt-3 flex items-center gap-2 text-primary hover:text-primary-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Agregar opcion
          </button>
        )}

        {errors.correctOption && (
          <p className="text-sm text-error mt-2">{errors.correctOption}</p>
        )}
      </div>

      {/* Botones de accion */}
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
