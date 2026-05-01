import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChildSession } from '@/contexts/ChildSessionContext';
import { ArrowLeft } from 'lucide-react-native';
import * as Device from 'expo-device';
import { useTranslation } from 'react-i18next';
import { checkChildSessionLock } from '@/lib/sessionLock';

export default function ChildLoginScreen() {
  const router = useRouter();
  const { linkChildWithCode } = useChildSession();
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setError('');

    if (!code || code.length !== 6) {
      setError(t('child_login.errors.invalid_code'));
      return;
    }

    setLoading(true);

    try {
      const deviceId = Device.modelId || Device.osInternalBuildId || 'unknown';
      const { child, error: linkError } = await linkChildWithCode(
        code.toUpperCase(),
        deviceId
      );

      if (linkError) {
        setError(linkError.message || t('child_login.errors.code_invalid_or_expired'));
      } else if (child) {
        const lockResult = await checkChildSessionLock(child.id);
        if (lockResult.locked) {
          setError(t('session_lock.blocked_message'));
          return;
        }
        router.replace('/(child)/home');
      }
    } catch (err) {
      setError(t('child_login.errors.unexpected_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#10B981" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>{t('child_login.title')}</Text>
        <Text style={styles.subtitle}>{t('child_login.subtitle')}</Text>
        <Text style={styles.instructions}>
          {t('child_login.instructions')}
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder={t('child_login.code_placeholder')}
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={6}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.connectButton, loading && styles.connectButtonDisabled]}
          onPress={handleConnect}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.connectButtonText}>{t('child_login.connect_button')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    color: '#6B7280',
    marginBottom: 12,
  },
  instructions: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    fontSize: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#10B981',
    width: '100%',
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  connectButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
