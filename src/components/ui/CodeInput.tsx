import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';

interface CodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function CodeInput({
  length = 5,
  value,
  onChange,
  error,
  disabled = false,
}: CodeInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Convertir el valor a un array de caracteres
  const chars = value.toUpperCase().split('').slice(0, length);
  while (chars.length < length) {
    chars.push('');
  }

  const handleChange = (index: number, char: string) => {
    // Solo permitir caracteres alfanuméricos
    const sanitized = char.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!sanitized && char !== '') return;

    const newChars = [...chars];
    newChars[index] = sanitized;

    const newValue = newChars.join('');
    onChange(newValue);

    // Mover al siguiente input si hay un caracter
    if (sanitized && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (chars[index]) {
        // Si hay un caracter, borrarlo
        handleChange(index, '');
      } else if (index > 0) {
        // Si está vacío, ir al anterior y borrarlo
        inputRefs.current[index - 1]?.focus();
        handleChange(index - 1, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData
      .getData('text')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, length);

    if (pastedText) {
      onChange(pastedText);
      // Enfocar el último caracter pegado o el último input
      const targetIndex = Math.min(pastedText.length, length) - 1;
      inputRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center gap-2 sm:gap-3">
        {chars.map((char, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="text"
            maxLength={1}
            value={char}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            disabled={disabled}
            className={`
              w-12 h-14 sm:w-14 sm:h-16
              text-center text-2xl font-bold
              bg-dark-800 border-2
              ${error ? 'border-error' : focusedIndex === index ? 'border-primary' : 'border-dark-600'}
              rounded-xl
              text-white uppercase
              focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label={`Caracter ${index + 1} del código`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-3 text-sm text-error text-center flex items-center justify-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
