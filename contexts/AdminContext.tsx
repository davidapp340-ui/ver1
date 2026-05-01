import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@admin_unlock_v1';
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface AdminContextValue {
  isUnlocked: boolean;
  unlock: () => Promise<void>;
  lock: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue>({
  isUnlocked: false,
  unlock: async () => {},
  lock: async () => {},
});

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const { ts } = JSON.parse(raw) as { ts: number };
        if (Date.now() - ts < TTL_MS) {
          setIsUnlocked(true);
        } else {
          AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        AsyncStorage.removeItem(STORAGE_KEY);
      }
    });
  }, []);

  const unlock = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() }));
    setIsUnlocked(true);
  }, []);

  const lock = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setIsUnlocked(false);
  }, []);

  return (
    <AdminContext.Provider value={{ isUnlocked, unlock, lock }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);

export function getAdminCode(): string {
  // Read from EXPO_PUBLIC_ADMIN_CODE; fallback to a default for dev only
  return process.env.EXPO_PUBLIC_ADMIN_CODE || '424242';
}
