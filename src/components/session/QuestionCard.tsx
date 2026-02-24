import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { AnswerOption } from './AnswerOption';
import type { Question, QuestionOption } from '@/types';
import { formatTime } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (optionId: number, responseTimeMs: number) => void;
  isAnswered?: boolean;
  selectedOptionId?: number;
  showResult?: boolean;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  isAnswered = false,
  selectedOptionId,
  showResult = false,
  disabled = false,
}: QuestionCardProps) {
  const [timeLeft, setTimeLeft] = useState(question.time_limit_seconds);
  const [startTime] = useState(Date.now());
  const [selectedId, setSelectedId] = useState<number | null>(selectedOptionId ?? null);

  // Temporizador
  useEffect(() => {
    if (isAnswered || disabled) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Si se acaba el tiempo y no ha respondido, enviar respuesta incorrecta
          if (!isAnswered && selectedId === null) {
            onAnswer(-1, question.time_limit_seconds * 1000);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswered, disabled, question.time_limit_seconds, onAnswer, selectedId]);

  const handleSelect = (option: QuestionOption) => {
    if (isAnswered || disabled || selectedId !== null) return;

    const responseTime = Date.now() - startTime;
    setSelectedId(option.id);
    onAnswer(option.id, responseTime);
  };

  const getTimeColor = () => {
    const percentage = timeLeft / question.time_limit_seconds;
    if (percentage > 0.5) return 'text-success';
    if (percentage > 0.25) return 'text-warning';
    return 'text-error';
  };

  const getProgressWidth = () => {
    return `${(timeLeft / question.time_limit_seconds) * 100}%`;
  };

  return (
    <Card variant="elevated" className="animate-fade-in">
      {/* Barra de progreso del tiempo */}
      <div className="h-1 bg-dark-700 rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            timeLeft > question.time_limit_seconds * 0.5
              ? 'bg-success'
              : timeLeft > question.time_limit_seconds * 0.25
              ? 'bg-warning'
              : 'bg-error'
          }`}
          style={{ width: getProgressWidth() }}
        />
      </div>

      {/* Header con número de pregunta y tiempo */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-400">
          Pregunta {questionNumber} de {totalQuestions}
        </span>
        <div className={`flex items-center gap-2 ${getTimeColor()}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-lg font-bold tabular-nums">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Texto de la pregunta */}
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
        {question.text}
      </h2>

      {/* Opciones de respuesta */}
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedId === option.id;
          const isCorrect = option.id === question.correct_option_index;

          let status: 'default' | 'selected' | 'correct' | 'incorrect' = 'default';
          if (showResult) {
            if (isCorrect) status = 'correct';
            else if (isSelected && !isCorrect) status = 'incorrect';
          } else if (isSelected) {
            status = 'selected';
          }

          return (
            <AnswerOption
              key={option.id}
              option={option}
              index={index}
              status={status}
              onClick={() => handleSelect(option)}
              disabled={disabled || isAnswered || selectedId !== null}
            />
          );
        })}
      </div>

      {/* Mensaje después de responder */}
      {isAnswered && showResult && (
        <div
          className={`mt-6 p-4 rounded-xl text-center ${
            selectedId === question.correct_option_index
              ? 'bg-success/10 text-success'
              : 'bg-error/10 text-error'
          }`}
        >
          {selectedId === question.correct_option_index ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-semibold">¡Correcto!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-semibold">Incorrecto</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
