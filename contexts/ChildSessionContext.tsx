import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useAuth } from '@/contexts/AuthContext';

type Child = Database['public']['Tables']['children']['Row'];

interface ChildSessionContextType {
  child: Child | null;
  loading: boolean;
  isIndependent: boolean;
  linkChildWithCode: (code: string, deviceId: string) => Promise<{ child?: Child; error?: any }>;
  clearChildSession: () => Promise<void>;
  refreshChild: () => Promise<void>;
}

const ChildSessionContext = createContext<ChildSessionContextType | undefined>(undefined);

const DEVICE_ID_KEY = '@zoomi_device_id';

export function ChildSessionProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading: authLoading } = useAuth();
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  const isIndependent = profile?.role === 'independent';

  useEffect(() => {
    setLoading(true);
    if (authLoading) return;

    if (isIndependent) {
      loadIndependentChild();
    } else {
      checkChildSession();
    }
  }, [authLoading, isIndependent, profile?.id]);

  const loadIndependentChild = async () => {
    try {
      const { data, error } = await supabase.rpc('get_independent_child');

      if (error) throw error;

      if (data && data.success && data.child) {
        setChild(data.child);
      }
    } catch (error) {
      console.error('Error loading independent child:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkChildSession = async () => {
    try {
      const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (deviceId) {
        const { data, error } = await supabase.rpc('get_child_session', {
          p_device_id: deviceId,
        });

        if (error) throw error;

        if (data && data.success && data.child) {
          setChild(data.child);
        } else {
          await AsyncStorage.removeItem(DEVICE_ID_KEY);
        }
      }
    } catch (error) {
      console.error('Error checking child session:', error);
      await AsyncStorage.removeItem(DEVICE_ID_KEY);
    } finally {
      setLoading(false);
    }
  };

  const linkChildWithCode = async (code: string, deviceId: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_and_link_child', {
        p_linking_code: code,
        p_device_id: deviceId,
      });

      if (error) throw error;

      if (!data.success) {
        return { error: { message: data.error } };
      }

      const childData = data.child;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      setChild(childData);

      return { child: childData };
    } catch (error) {
      return { error };
    }
  };

  const clearChildSession = async () => {
    if (child) {
      try {
        await supabase.rpc('release_session_child', { p_child_id: child.id });
      } catch (err) {
        // Best-effort release
      }
    }
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
    setChild(null);
  };

  const refreshChild = async () => {
    if (isIndependent) {
      await loadIndependentChild();
    } else {
      await checkChildSession();
    }
  };

  const value: ChildSessionContextType = {
    child,
    loading,
    isIndependent,
    linkChildWithCode,
    clearChildSession,
    refreshChild,
  };

  return (
    <ChildSessionContext.Provider value={value}>
      {children}
    </ChildSessionContext.Provider>
  );
}

export function useChildSession() {
  const context = useContext(ChildSessionContext);
  if (context === undefined) {
    throw new Error('useChildSession must be used within a ChildSessionProvider');
  }
  return context;
}
