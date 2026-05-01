import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChildSessionProvider } from '@/contexts/ChildSessionContext';
import '@/lib/i18n';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <ChildSessionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="role-selection" />
          <Stack.Screen name="parent-auth" />
          <Stack.Screen name="independent-signup" />
          <Stack.Screen name="child-login" />
          <Stack.Screen name="(parent)" />
          <Stack.Screen name="(child)" />
          <Stack.Screen name="(independent)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ChildSessionProvider>
    </AuthProvider>
  );
}
