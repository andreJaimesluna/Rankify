// Configuración del juego
export const GAME_CONFIG = {
  // Puntuación
  BASE_POINTS: 100,
  TIME_BONUS_MAX: 50,

  // Tiempo
  DEFAULT_TIME_LIMIT: 30,
  MIN_TIME_LIMIT: 5,
  MAX_TIME_LIMIT: 120,

  // Sesión
  SESSION_CODE_LENGTH: 5,
  SESSION_EXPIRY_MINUTES: 30,

  // Participantes
  MIN_NICKNAME_LENGTH: 2,
  MAX_NICKNAME_LENGTH: 20,

  // Opciones de pregunta
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 6,
} as const;

// Caracteres para generar códigos de sesión (sin caracteres confusos)
export const SESSION_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Colores para avatares
export const AVATAR_COLORS = [
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
] as const;

// Mensajes de error
export const ERROR_MESSAGES = {
  SESSION_NOT_FOUND: 'Sesión no encontrada',
  SESSION_EXPIRED: 'Esta sesión ha expirado',
  SESSION_FINISHED: 'Esta sesión ya ha terminado',
  NICKNAME_IN_USE: 'Este nombre ya está en uso en esta sesión',
  NOT_REGISTERED: 'No estás registrado como participante',
  ALREADY_ANSWERED: 'Ya has respondido esta pregunta',
  CONNECTION_ERROR: 'Error de conexión con el servidor',
  INVALID_CODE: 'El código debe tener 5 caracteres',
  INVALID_NICKNAME: 'El nombre debe tener entre 2 y 20 caracteres',
  // Auth
  EMAIL_REQUIRED: 'El email es requerido',
  EMAIL_INVALID: 'El formato del email no es válido',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
  PASSWORD_NO_NUMBER: 'La contraseña debe contener al menos un número',
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
  EMAIL_ALREADY_REGISTERED: 'Este email ya está registrado',
  RATE_LIMITED: 'Demasiados intentos. Espera unos minutos.',
} as const;

// Rutas de la aplicación
export const ROUTES = {
  HOME: '/',
  // Estudiante
  STUDENT_JOIN: '/student/join',
  STUDENT_WAITING: '/student/waiting',
  STUDENT_PLAY: '/student/play',
  STUDENT_RESULTS: '/student/results',
  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_CREATE: '/admin/create',
  ADMIN_CREATE_ROOM: '/admin/rooms/new',
  ADMIN_ROOM_DETAIL: '/admin/rooms/:id',
  ADMIN_LOBBY: '/admin/lobby',
  ADMIN_LIVE: '/admin/live',
  ADMIN_RESULTS: '/admin/results',
  // Admin placeholders
  ADMIN_QUESTIONS: '/admin/questions',
  ADMIN_ROOMS: '/admin/rooms',
  ADMIN_HISTORY: '/admin/history',
  ADMIN_PROFILE: '/admin/profile',
  // Auth
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
} as const;
