import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Session, Participant, Answer } from '@/types';

type SubscriptionCallback<T> = (payload: T) => void;

interface UseRealtimeOptions {
  sessionId: string | null;
  onSessionUpdate?: SubscriptionCallback<Partial<Session>>;
  onParticipantJoin?: SubscriptionCallback<Participant>;
  onParticipantUpdate?: SubscriptionCallback<Participant>;
  onParticipantLeave?: SubscriptionCallback<{ id: string }>;
  onAnswerSubmit?: SubscriptionCallback<Answer>;
  enabled?: boolean;
}

interface UseRealtimeReturn {
  isConnected: boolean;
  reconnect: () => void;
}

export function useRealtime({
  sessionId,
  onSessionUpdate,
  onParticipantJoin,
  onParticipantUpdate,
  onParticipantLeave,
  onAnswerSubmit,
  enabled = true,
}: UseRealtimeOptions): UseRealtimeReturn {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isConnectedRef = useRef(false);

  const setupSubscriptions = useCallback(() => {
    if (!sessionId || !enabled) return;

    // Limpiar canal anterior si existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Crear nuevo canal
    const channel = supabase.channel(`session:${sessionId}`);

    // Suscribirse a cambios en la sesión
    if (onSessionUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          onSessionUpdate(payload.new as Partial<Session>);
        }
      );
    }

    // Suscribirse a nuevos participantes
    if (onParticipantJoin) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          onParticipantJoin(payload.new as Participant);
        }
      );
    }

    // Suscribirse a actualizaciones de participantes
    if (onParticipantUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          onParticipantUpdate(payload.new as Participant);
        }
      );
    }

    // Suscribirse a participantes que se van
    if (onParticipantLeave) {
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          onParticipantLeave({ id: (payload.old as { id: string }).id });
        }
      );
    }

    // Suscribirse a nuevas respuestas
    if (onAnswerSubmit) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
        },
        (payload) => {
          onAnswerSubmit(payload.new as Answer);
        }
      );
    }

    // Conectar al canal
    channel.subscribe((status) => {
      isConnectedRef.current = status === 'SUBSCRIBED';
    });

    channelRef.current = channel;
  }, [
    sessionId,
    enabled,
    onSessionUpdate,
    onParticipantJoin,
    onParticipantUpdate,
    onParticipantLeave,
    onAnswerSubmit,
  ]);

  const reconnect = useCallback(() => {
    setupSubscriptions();
  }, [setupSubscriptions]);

  // Configurar suscripciones cuando cambia el sessionId
  useEffect(() => {
    setupSubscriptions();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isConnectedRef.current = false;
      }
    };
  }, [setupSubscriptions]);

  return {
    isConnected: isConnectedRef.current,
    reconnect,
  };
}

// Hook simplificado para solo escuchar cambios de sesión
export function useSessionRealtime(
  sessionId: string | null,
  onUpdate: (session: Partial<Session>) => void
) {
  return useRealtime({
    sessionId,
    onSessionUpdate: onUpdate,
  });
}

// Hook simplificado para escuchar participantes
export function useParticipantsRealtime(
  sessionId: string | null,
  callbacks: {
    onJoin?: (participant: Participant) => void;
    onUpdate?: (participant: Participant) => void;
    onLeave?: (data: { id: string }) => void;
  }
) {
  return useRealtime({
    sessionId,
    onParticipantJoin: callbacks.onJoin,
    onParticipantUpdate: callbacks.onUpdate,
    onParticipantLeave: callbacks.onLeave,
  });
}
