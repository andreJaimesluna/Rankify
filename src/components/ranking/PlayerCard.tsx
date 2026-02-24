import { generateAvatarColor, getInitials, formatScore, getOrdinalSuffix } from '@/lib/utils';
import type { Participant } from '@/types';

interface PlayerCardProps {
  participant: Participant;
  rank: number;
  isCurrentUser?: boolean;
  showScore?: boolean;
  compact?: boolean;
}

export function PlayerCard({
  participant,
  rank,
  isCurrentUser = false,
  showScore = true,
  compact = false,
}: PlayerCardProps) {
  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 2:
        return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
      case 3:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-dark-700 text-gray-400 border-dark-600';
    }
  };

  if (compact) {
    return (
      <div
        className={`
          flex items-center gap-3 p-3 rounded-xl
          ${isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'bg-dark-800'}
          transition-all duration-200
        `}
      >
        {/* Posición */}
        <span
          className={`
            w-8 h-8 flex items-center justify-center
            rounded-lg text-sm font-bold
            ${getRankStyle()}
          `}
        >
          {rank}
        </span>

        {/* Avatar */}
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
            text-sm font-bold text-white
            ${generateAvatarColor(participant.nickname)}
          `}
        >
          {getInitials(participant.nickname)}
        </div>

        {/* Nombre */}
        <span
          className={`flex-1 font-medium truncate ${
            isCurrentUser ? 'text-primary' : 'text-white'
          }`}
        >
          {participant.nickname}
          {isCurrentUser && ' (Tú)'}
        </span>

        {/* Puntuación */}
        {showScore && (
          <span className="text-sm font-semibold text-gray-400">
            {formatScore(participant.total_score)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        flex items-center gap-4 p-4 rounded-2xl
        ${isCurrentUser ? 'bg-primary/10 border-2 border-primary/30' : 'bg-dark-800 border-2 border-transparent'}
        transition-all duration-200 hover:bg-dark-700
      `}
    >
      {/* Posición */}
      <div
        className={`
          w-12 h-12 flex items-center justify-center
          rounded-xl text-lg font-bold border
          ${getRankStyle()}
        `}
      >
        {getOrdinalSuffix(rank)}
      </div>

      {/* Avatar */}
      <div
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          text-lg font-bold text-white
          ${generateAvatarColor(participant.nickname)}
          ${isCurrentUser ? 'ring-2 ring-primary ring-offset-2 ring-offset-dark-900' : ''}
        `}
      >
        {getInitials(participant.nickname)}
      </div>

      {/* Info del jugador */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold truncate ${
            isCurrentUser ? 'text-primary' : 'text-white'
          }`}
        >
          {participant.nickname}
          {isCurrentUser && ' (Tú)'}
        </p>
        {!participant.connected && (
          <p className="text-xs text-gray-500">Desconectado</p>
        )}
      </div>

      {/* Puntuación */}
      {showScore && (
        <div className="text-right">
          <p className="text-lg font-bold text-white">
            {formatScore(participant.total_score)}
          </p>
          <p className="text-xs text-gray-500">puntos</p>
        </div>
      )}
    </div>
  );
}
