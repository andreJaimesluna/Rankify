import type { QuestionOption } from '@/types';

interface AnswerOptionProps {
  option: QuestionOption;
  index: number;
  status?: 'default' | 'selected' | 'correct' | 'incorrect';
  onClick: () => void;
  disabled?: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function AnswerOption({
  option,
  index,
  status = 'default',
  onClick,
  disabled = false,
}: AnswerOptionProps) {
  const statusStyles = {
    default: 'bg-dark-700 border-dark-600 hover:border-primary hover:bg-dark-600',
    selected: 'bg-primary/20 border-primary',
    correct: 'bg-success/20 border-success',
    incorrect: 'bg-error/20 border-error',
  };

  const labelStyles = {
    default: 'bg-dark-600 text-gray-300',
    selected: 'bg-primary text-white',
    correct: 'bg-success text-white',
    incorrect: 'bg-error text-white',
  };

  const iconStyles = {
    default: null,
    selected: null,
    correct: (
      <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    incorrect: (
      <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-4 p-4
        border-2 rounded-xl
        transition-all duration-200
        ${statusStyles[status]}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
      `}
    >
      {/* Etiqueta de opción (A, B, C, etc.) */}
      <span
        className={`
          w-10 h-10 flex items-center justify-center
          rounded-lg font-bold text-lg
          transition-all duration-200
          ${labelStyles[status]}
        `}
      >
        {OPTION_LABELS[index]}
      </span>

      {/* Texto de la opción */}
      <span className="flex-1 text-left text-white font-medium">
        {option.text}
      </span>

      {/* Icono de resultado */}
      {iconStyles[status] && (
        <span className="flex-shrink-0">{iconStyles[status]}</span>
      )}
    </button>
  );
}
