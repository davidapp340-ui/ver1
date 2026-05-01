import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useChildSession } from '@/contexts/ChildSessionContext';
import { checkProfileSessionLock } from '@/lib/sessionLock';
import { supabase } from '@/lib/supabase';

export default function IndependentLoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { child, isIndependent } = useChildSession();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginComplete, setLoginComplete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loginComplete && isIndependent && child) {
      router.replace('/(independent)/home');
    }
  }, [loginComplete, isIndependent, child]);

  const handleLogin = async () => {
    setError('');

    if (!email.trim()) {
      setError(t('independent_login.validation.email_required'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(t('independent_login.validation.email_invalid'));
      return;
    }
    if (!password) {
      setError(t('independent_login.validation.password_required'));
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await signIn(email.trim(), password);

      if (authError) {
        setError(authError.message || t('independent_login.errors.login_failed'));
        setLoading(false);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const lockResult = await checkProfileSessionLock(user.id);
          if (lockResult.locked) {
            await supabase.auth.signOut();
            setError(t('session_lock.blocked_message'));
            setLoading(false);
            return;
          }
        }
        setLoginComplete(true);
      }
    } catch (err) {
      setError(t('independent_login.errors.unexpected_error'));
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#0369A1" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('independent_login.title')}</Text>
          <Text style={styles.subtitle}>{t('independent_login.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('independent_login.email_label')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('independent_login.email_placeholder')}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('independent_login.password_label')}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('independent_login.password_placeholder')}
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!email || !password || loading) && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!email || !password || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {t('independent_login.sign_in_button')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => router.replace('/independent-signup')}
            disabled={loading}
          >
            <Text style={styles.toggleButtonText}>
              {t('independent_login.toggle_to_signup')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    paddingTop: 40,
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#0369A1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  toggleButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#0369A1',
    fontSize: 14,
    fontWeight: '500',
  },
});
