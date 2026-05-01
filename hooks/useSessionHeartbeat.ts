import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

const HEARTBEAT_INTERVAL_MS = 30_000;

interface HeartbeatConfig {
  type: 'profile' | 'child';
  childId?: string;
  deviceId: string;
}

export function useSessionHeartbeat(config: HeartbeatConfig | null) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const sendHeartbeat = useCallback(async () => {
    if (!config) return;

    try {
      if (config.type === 'profile') {
        await supabase.rpc('heartbeat_profile', {
          p_device_id: config.deviceId,
        });
      } else if (config.type === 'child' && config.childId) {
        await supabase.rpc('heartbeat_child', {
          p_child_id: config.childId,
          p_device_id: config.deviceId,
        });
      }
    } catch (err) {
      // Silent fail - heartbeat is best-effort
    }
  }, [config]);

  const releaseSession = useCallback(async () => {
    if (!config) return;

    try {
      if (config.type === 'profile') {
        await supabase.rpc('release_session_profile');
      } else if (config.type === 'child' && config.childId) {
        await supabase.rpc('release_session_child', {
          p_child_id: config.childId,
        });
      }
    } catch (err) {
      // Silent fail
    }
  }, [config]);

  const startHeartbeat = useCallback(() => {
    if (intervalRef.current) return;
    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  }, [sendHeartbeat]);

  const stopHeartbeat = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!config) return;

    startHeartbeat();

    const handleAppStateChange = (nextState: AppStateStatus) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active' && prevState !== 'active') {
        startHeartbeat();
      } else if (nextState !== 'active' && prevState === 'active') {
        stopHeartbeat();
        releaseSession();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (Platform.OS === 'web') {
      const handleBeforeUnload = () => {
        releaseSession();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        stopHeartbeat();
        releaseSession();
        subscription.remove();
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }

    return () => {
      stopHeartbeat();
      releaseSession();
      subscription.remove();
    };
  }, [config, startHeartbeat, stopHeartbeat, releaseSession]);
}
