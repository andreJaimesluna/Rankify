import { generateAvatarColor, getInitials, formatScore } from '@/lib/utils';
import type { Participant } from '@/types';

interface PodiumProps {
  participants: Participant[];
  currentUserId?: string;
}

export function Podium({ participants, currentUserId }: PodiumProps) {
  // Ordenar por puntuación descendente y tomar los 3 primeros
  const topThree = [...participants]
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 3);

  // Reordenar para visualización: [2°, 1°, 3°]
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);

  const getPodiumHeight = (position: number) => {
    switch (position) {
      case 0: // 2° lugar (izquierda)
        return 'h-24';
      case 1: // 1° lugar (centro)
        return 'h-32';
      case 2: // 3° lugar (derecha)
        return 'h-20';
      default:
        return 'h-16';
    }
  };

  const getPodiumColor = (originalPosition: number) => {
    switch (originalPosition) {
      case 1: // 1° lugar
        return 'bg-gradient-to-t from-yellow-600 to-yellow-400';
      case 2: // 2° lugar
        return 'bg-gradient-to-t from-gray-500 to-gray-300';
      case 3: // 3° lugar
        return 'bg-gradient-to-t from-orange-700 to-orange-500';
      default:
        return 'bg-dark-600';
    }
  };

  const getMedalIcon = (position: number) => {
    const icons = {
      1: (
        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-dark-900 font-bold shadow-lg">
          1
        </div>
      ),
      2: (
        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-dark-900 font-bold shadow-lg">
          2
        </div>
      ),
      3: (
        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold shadow-lg">
          3
        </div>
      ),
    };
    return icons[position as keyof typeof icons] || null;
  };

  if (topThree.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No hay participantes aún
      </div>
    );
  }

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4 py-4">
      {podiumOrder.map((participant, displayIndex) => {
        if (!participant) return null;

        // Determinar la posición real (1°, 2°, 3°)
        const actualPosition = displayIndex === 1 ? 1 : displayIndex === 0 ? 2 : 3;
        const isCurrentUser = participant.id === currentUserId;

        return (
          <div
            key={participant.id}
            className={`flex flex-col items-center animate-slide-up ${
              displayIndex === 1 ? 'order-2' : displayIndex === 0 ? 'order-1' : 'order-3'
            }`}
            style={{ animationDelay: `${displayIndex * 100}ms` }}
          >
            {/* Avatar y medalla */}
            <div className="relative mb-2">
              <div
                className={`
                  w-14 h-14 sm:w-16 sm:h-16 rounded-full
                  flex items-center justify-center
                  text-lg sm:text-xl font-bold text-white
                  ${generateAvatarColor(participant.nickname)}
                  ${isCurrentUser ? 'ring-2 ring-primary ring-offset-2 ring-offset-dark-900' : ''}
                `}
              >
                {getInitials(participant.nickname)}
              </div>
              <div className="absolute -bottom-1 -right-1">
                {getMedalIcon(actualPosition)}
              </div>
            </div>

            {/* Nombre */}
            <p
              className={`
                text-sm font-semibold text-center truncate max-w-[80px] sm:max-w-[100px]
                ${isCurrentUser ? 'text-primary' : 'text-white'}
              `}
            >
              {participant.nickname}
              {isCurrentUser && ' (Tú)'}
            </p>

            {/* Puntuación */}
            <p className="text-xs text-gray-400 mb-2">
              {formatScore(participant.total_score)} pts
            </p>

            {/* Podio */}
            <div
              className={`
                w-20 sm:w-24 rounded-t-lg
                ${getPodiumHeight(displayIndex)}
                ${getPodiumColor(actualPosition)}
                flex items-center justify-center
              `}
            >
              <span className="text-2xl sm:text-3xl font-bold text-white/90">
                {actualPosition}°
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
