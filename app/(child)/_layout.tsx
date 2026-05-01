import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useChildSession } from '@/contexts/ChildSessionContext';
import { useSessionHeartbeat } from '@/hooks/useSessionHeartbeat';
import { getOrCreateDeviceId } from '@/lib/deviceId';

export default function ChildLayout() {
  const { t } = useTranslation();
  const { child, loading, isIndependent } = useChildSession();
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
  }, []);

  const heartbeatConfig = useMemo(() => {
    if (!child || !deviceId) return null;
    return { type: 'child' as const, childId: child.id, deviceId };
  }, [child, deviceId]);

  useSessionHeartbeat(heartbeatConfig);

  useEffect(() => {
    if (!loading && !child) {
      router.replace(isIndependent ? '/role-selection' : '/child-login');
    }
  }, [loading, child, isIndependent, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!child) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
});
