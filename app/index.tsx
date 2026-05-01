import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChildSession } from '@/contexts/ChildSessionContext';

export default function SplashScreen() {
  const router = useRouter();
  const { loading: authLoading, profile } = useAuth();
  const { loading: childLoading, child, isIndependent } = useChildSession();
  const [isSplashReady, setIsSplashReady] = useState(false);

  const loading = authLoading || childLoading;
  const isParent = !!profile && profile.role === 'parent';
  const isChild = !!child;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashReady(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && isSplashReady) {
      if (isIndependent && isChild) {
        router.replace('/(independent)/home');
      } else if (isParent) {
        router.replace('/(parent)/home');
      } else if (isChild) {
        router.replace('/(child)/home');
      } else {
        router.replace('/role-selection');
      }
    }
  }, [loading, isSplashReady, isParent, isChild, isIndependent, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zoomi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
  },
  title: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
