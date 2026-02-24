import { PlayerCard } from './PlayerCard';
import type { Participant } from '@/types';

interface RankingListProps {
  participants: Participant[];
  currentUserId?: string;
  showScore?: boolean;
  compact?: boolean;
  startFromRank?: number;
  maxItems?: number;
}

export function RankingList({
  participants,
  currentUserId,
  showScore = true,
  compact = false,
  startFromRank = 1,
  maxItems,
}: RankingListProps) {
  // Ordenar por puntuación descendente
  const sortedParticipants = [...participants].sort((a, b) => b.total_score - a.total_score);

  // Aplicar límite si se especifica
  const displayParticipants = maxItems
    ? sortedParticipants.slice(startFromRank - 1, startFromRank - 1 + maxItems)
    : sortedParticipants.slice(startFromRank - 1);

  if (displayParticipants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No hay participantes para mostrar
      </div>
    );
  }

  return (
    <div className={`space-y-${compact ? '2' : '3'}`}>
      {displayParticipants.map((participant, index) => {
        const rank = startFromRank + index;
        const isCurrentUser = participant.id === currentUserId;

        return (
          <div
            key={participant.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <PlayerCard
              participant={participant}
              rank={rank}
              isCurrentUser={isCurrentUser}
              showScore={showScore}
              compact={compact}
            />
          </div>
        );
      })}
    </div>
  );
}
