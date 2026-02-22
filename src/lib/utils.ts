import { type ClassValue, clsx } from 'clsx';

// Función para combinar clases de Tailwind (versión simplificada sin tailwind-merge)
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// Formatear tiempo en formato mm:ss
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Formatear puntuación con separador de miles
export function formatScore(score: number): string {
  return score.toLocaleString('es-ES');
}

// Obtener el sufijo ordinal (1°, 2°, 3°, etc.)
export function getOrdinalSuffix(n: number): string {
  return `${n}°`;
}

// Obtener el color según la posición
export function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return 'text-gold';
    case 2:
      return 'text-silver';
    case 3:
      return 'text-bronze';
    default:
      return 'text-gray-400';
  }
}

// Obtener el gradiente de fondo según la posición
export function getRankGradient(rank: number): string {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-600 to-yellow-400';
    case 2:
      return 'bg-gradient-to-r from-gray-500 to-gray-300';
    case 3:
      return 'bg-gradient-to-r from-orange-700 to-orange-500';
    default:
      return 'bg-dark-700';
  }
}

// Validar código de sesión (5 caracteres alfanuméricos)
export function isValidSessionCode(code: string): boolean {
  return /^[A-Z0-9]{5}$/i.test(code);
}

// Validar nickname (2-20 caracteres, sin caracteres especiales peligrosos)
export function isValidNickname(nickname: string): boolean {
  const trimmed = nickname.trim();
  return trimmed.length >= 2 && trimmed.length <= 20 && /^[\w\sáéíóúñÁÉÍÓÚÑ-]+$/.test(trimmed);
}

// Generar color de avatar basado en el nombre
export function generateAvatarColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  // Usar el código hash del nombre para seleccionar un color consistente
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// Obtener las iniciales del nombre
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// Mezclar array (para opciones de preguntas)
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Debounce para optimizar llamadas frecuentes
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Calcular tiempo restante en segundos
export function getSecondsUntil(targetTime: Date | string): number {
  const target = typeof targetTime === 'string' ? new Date(targetTime) : targetTime;
  const now = new Date();
  const diff = Math.floor((target.getTime() - now.getTime()) / 1000);
  return Math.max(0, diff);
}

// Almacenamiento local con manejo de errores
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

// Claves de almacenamiento local
export const STORAGE_KEYS = {
  PARTICIPANT_ID: 'rankify_participant_id',
  SESSION_CODE: 'rankify_session_code',
  NICKNAME: 'rankify_nickname',
  ADMIN_SESSION_ID: 'rankify_admin_session_id',
} as const;
