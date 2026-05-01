import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { checkProfileSessionLock } from '@/lib/sessionLock';
import { supabase } from '@/lib/supabase';

export default function ParentAuthScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (isSignUp && (!firstName.trim() || !lastName.trim())) {
      setError(t('auth.errors.fill_all_fields'));
      return;
    }

    if (!email || !password) {
      setError(t('auth.errors.fill_all_fields'));
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError(t('auth.errors.passwords_not_match'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.errors.password_too_short'));
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = isSignUp
        ? await signUp(email, password, firstName.trim(), lastName.trim())
        : await signIn(email, password);

      if (authError) {
        setError(authError.message || t('auth.errors.auth_failed'));
      } else if (!isSignUp) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const lockResult = await checkProfileSessionLock(user.id);
          if (lockResult.locked) {
            await supabase.auth.signOut();
            setError(t('session_lock.blocked_message'));
            return;
          }
        }
        router.replace('/(parent)/home');
      } else {
        router.replace('/(parent)/home');
      }
    } catch (err) {
      setError(t('auth.errors.unexpected_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#4F46E5" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{t('auth.parent_login_title')}</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? t('auth.parent_signup_subtitle') : t('auth.parent_login_subtitle')}
          </Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isSignUp && (
            <>
              <TextInput
                style={styles.input}
                placeholder={t('auth.first_name_placeholder')}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder={t('auth.last_name_placeholder')}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                editable={!loading}
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder={t('auth.email_placeholder')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder={t('auth.password_placeholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder={t('auth.confirm_password_placeholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isSignUp ? t('auth.sign_up_button') : t('auth.sign_in_button')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setFirstName('');
              setLastName('');
              setConfirmPassword('');
            }}
            disabled={loading}
          >
            <Text style={styles.toggleButtonText}>
              {isSignUp ? t('auth.toggle_to_signin') : t('auth.toggle_to_signup')}
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#6B7280',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#4F46E5',
    fontSize: 14,
  },
});
