import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useChildSession } from '@/contexts/ChildSessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionHeartbeat } from '@/hooks/useSessionHeartbeat';
import { getOrCreateDeviceId } from '@/lib/deviceId';

export default function IndependentLayout() {
  const { t } = useTranslation();
  const { child, loading, isIndependent } = useChildSession();
  const { profile } = useAuth();
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
  }, []);

  const heartbeatConfig = useMemo(() => {
    if (!profile || !deviceId) return null;
    return { type: 'profile' as const, deviceId };
  }, [profile, deviceId]);

  useSessionHeartbeat(heartbeatConfig);

  useEffect(() => {
    if (!loading && (!child || !isIndependent)) {
      router.replace('/role-selection');
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
      <Stack.Screen
        name="article/[id]"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="faq"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
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
