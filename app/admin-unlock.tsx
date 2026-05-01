import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Lock, ArrowLeft } from 'lucide-react-native';
import { useAdmin, getAdminCode } from '@/contexts/AdminContext';

export default function AdminUnlockScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { unlock } = useAdmin();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const expected = getAdminCode();
    if (code.trim() === expected) {
      await unlock();
      router.replace('/(admin)/exercises' as any);
    } else {
      setError(t('admin.invalid_code', { defaultValue: 'קוד לא נכון' }));
    }
    setSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('admin.unlock_title', { defaultValue: 'גישת מנהל' })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Lock size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.subtitle}>
          {t('admin.unlock_subtitle', { defaultValue: 'הזיני קוד מנהל בן 6 ספרות' })}
        </Text>

        <TextInput
          value={code}
          onChangeText={(v) => {
            setCode(v.replace(/[^0-9]/g, '').slice(0, 6));
            setError(null);
          }}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="------"
          placeholderTextColor="#94A3B8"
          style={[styles.input, error && styles.inputError]}
          autoFocus
          textAlign="center"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitButton, (code.length < 4 || submitting) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={code.length < 4 || submitting}
        >
          <Text style={styles.submitText}>
            {t('admin.unlock_submit', { defaultValue: 'פתחי' })}
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          {t('admin.unlock_note', {
            defaultValue:
              'גישה זו פותחת ניווט בלבד. כדי לערוך תוכן יש להיות מסומן כ-admin בבסיס הנתונים.',
          })}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  back: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  body: { flex: 1, padding: 24, alignItems: 'center', gap: 16 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  subtitle: { fontSize: 16, color: '#475569', textAlign: 'center', marginBottom: 8 },
  input: {
    width: '80%',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 14,
    color: '#0F172A',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontWeight: '600' },
  submitButton: {
    width: '80%',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  note: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 12,
  },
});
