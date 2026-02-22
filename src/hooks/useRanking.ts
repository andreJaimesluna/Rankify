import { useMemo, useCallback } from 'react';
import type { Participant, PlayerRanking } from '@/types';

interface UseRankingOptions {
  participants: Participant[];
  currentUserId?: string;
}

interface UseRankingReturn {
  rankings: PlayerRanking[];
  topThree: PlayerRanking[];
  restOfRankings: PlayerRanking[];
  currentUserRanking: PlayerRanking | null;
  totalParticipants: number;
  getParticipantRank: (participantId: string) => number;
}

export function useRanking({ participants, currentUserId }: UseRankingOptions): UseRankingReturn {
  // Calcular rankings ordenados por puntuación
  const rankings = useMemo<PlayerRanking[]>(() => {
    const sorted = [...participants].sort((a, b) => {
      // Ordenar por puntuación descendente
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // En caso de empate, ordenar por tiempo de unión (quien llegó primero)
      return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    });

    return sorted.map((participant, index) => ({
      participant,
      rank: index + 1,
      isCurrentUser: participant.id === currentUserId,
    }));
  }, [participants, currentUserId]);

  // Top 3 para el podio
  const topThree = useMemo(() => rankings.slice(0, 3), [rankings]);

  // Resto de rankings (del 4° en adelante)
  const restOfRankings = useMemo(() => rankings.slice(3), [rankings]);

  // Ranking del usuario actual
  const currentUserRanking = useMemo(
    () => rankings.find((r) => r.isCurrentUser) || null,
    [rankings]
  );

  // Obtener el rank de un participante específico
  const getParticipantRank = useCallback(
    (participantId: string) => {
      const ranking = rankings.find((r) => r.participant.id === participantId);
      return ranking?.rank || 0;
    },
    [rankings]
  );

  return {
    rankings,
    topThree,
    restOfRankings,
    currentUserRanking,
    totalParticipants: participants.length,
    getParticipantRank,
  };
}

// Hook para calcular estadísticas adicionales
export function useRankingStats(participants: Participant[]) {
  return useMemo(() => {
    if (participants.length === 0) {
      return {
        totalScore: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        connectedCount: 0,
      };
    }

    const scores = participants.map((p) => p.score);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);

    return {
      totalScore,
      averageScore: Math.round(totalScore / participants.length),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      connectedCount: participants.filter((p) => p.is_connected).length,
    };
  }, [participants]);
}

// Hook para detectar cambios de posición (animaciones)
export function useRankingChanges(
  currentRankings: PlayerRanking[],
  previousRankings: PlayerRanking[] | null
): Map<string, { from: number; to: number; direction: 'up' | 'down' | 'same' }> {
  return useMemo(() => {
    const changes = new Map<string, { from: number; to: number; direction: 'up' | 'down' | 'same' }>();

    if (!previousRankings) return changes;

    currentRankings.forEach((current) => {
      const previous = previousRankings.find(
        (p) => p.participant.id === current.participant.id
      );

      if (previous) {
        const from = previous.rank;
        const to = current.rank;
        let direction: 'up' | 'down' | 'same' = 'same';

        if (to < from) direction = 'up';
        else if (to > from) direction = 'down';

        changes.set(current.participant.id, { from, to, direction });
      }
    });

    return changes;
  }, [currentRankings, previousRankings]);
}
