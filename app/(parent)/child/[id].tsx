import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Smartphone,
  Copy,
  X,
  Flame,
  Clock,
  CalendarDays,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useLinkingCode } from '@/hooks/useLinkingCode';

type Child = Database['public']['Tables']['children']['Row'];

export default function ChildProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { generateCode, loading: generatingCode } = useLinkingCode();

  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);

  const loadChild = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setChild(data);
    } catch (err) {
      console.error('Error loading child:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadChild();
  }, [loadChild]);

  const handleGenerateCode = async () => {
    if (!child) return;
    const result = await generateCode(child);

    if (!result.success || !result.child) {
      Alert.alert(
        t('common.error'),
        result.error || t('parent_home.code_generation_errors.generic_error')
      );
      return;
    }

    setChild(result.child);
    setShowCode(true);
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert(t('common.success'), t('parent_home.linking_code_modal.copy_success'));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!child) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{t('parent_home.code_generation_errors.child_not_found')}</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>{t('common.close')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{child.name}</Text>
          {child.device_id && (
            <Text style={styles.linkedBadge}>{t('parent_home.device_linked')}</Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {showCode && child.linking_code ? (
          <View style={styles.codeCard}>
            <View style={styles.codeCardHeader}>
              <Text style={styles.codeCardTitle}>
                {t('parent_home.linking_code_modal.title')}
              </Text>
              <TouchableOpacity onPress={() => setShowCode(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.codeInstructions}>
              {t('parent_home.linking_code_modal.instructions', { childName: child.name })}
            </Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{child.linking_code}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(child.linking_code!)}
              >
                <Copy size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.connectCard}
            onPress={handleGenerateCode}
            disabled={generatingCode}
            activeOpacity={0.7}
          >
            {generatingCode ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.connectIconContainer}>
                  <Smartphone size={28} color="#FFFFFF" />
                </View>
                <View style={styles.connectTextContainer}>
                  <Text style={styles.connectTitle}>
                    {t('child_profile_screen.connect_device')}
                  </Text>
                  <Text style={styles.connectSubtitle}>
                    {t('child_profile_screen.connect_device_subtitle')}
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>{t('child_profile_screen.stats_title')}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Flame size={24} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>{t('child_profile_screen.stat_streak')}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Clock size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>{t('child_profile_screen.stat_practice_time')}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
              <CalendarDays size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>{t('child_profile_screen.stat_last_activity')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  backLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backLinkText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  headerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  linkedBadge: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  connectCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  connectIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectTextContainer: {
    flex: 1,
    gap: 4,
  },
  connectTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  connectSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#4F46E5',
    gap: 12,
  },
  codeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  codeInstructions: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 8,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F46E5',
    letterSpacing: 6,
  },
  copyButton: {
    backgroundColor: '#4F46E5',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 28,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
});
