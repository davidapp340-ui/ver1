import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Switch,
  I18nManager,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Plus, Edit3, Trash2, X, Play, Dumbbell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  listExercises,
  upsertExercise,
  deleteExercise,
  type ExerciseRow,
} from '@/lib/admin';
import { ExerciseRegistry, ExerciseAnimationRenderer } from '@/components/exercises/ExerciseRegistry';
import AdminPageBanner from '@/components/admin/AdminPageBanner';

const TYPES = ['eye_muscle', 'near_far', 'relaxation', 'blinking', 'tracking'];
const ANIMATION_IDS = Object.keys(ExerciseRegistry);
const CUSTOM_SVG_ID = 'custom_svg';
const CUSTOM_SVG_PLACEHOLDER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="#10B981" />
</svg>`;

type Draft = Partial<ExerciseRow> & {
  id?: string;
  exercise_type?: string | null;
  default_duration_seconds?: number | null;
  default_reps?: number | null;
  instructions_he?: any;
  instructions_en?: any;
  svg_content?: string | null;
};

export default function AdminExercisesScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState<ExerciseRow | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setItems(await listExercises());
    } catch (e: any) {
      Alert.alert('Error', e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onSave = async () => {
    if (!draft) return;
    if (!draft.animation_id || !draft.title_he || !draft.title_en) {
      Alert.alert('Missing', 'animation_id, title_he, title_en required');
      return;
    }
    try {
      setSaving(true);
      await upsertExercise({
        ...draft,
        icon_id: draft.icon_id ?? null,
        status: draft.status ?? 'active',
      } as Draft);
      setDraft(null);
      await load();
    } catch (e: any) {
      Alert.alert('Save error', e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (row: ExerciseRow) => {
    Alert.alert('Delete?', `Delete "${row.title_he}" (${row.animation_id})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExercise(row.id);
            await load();
          } catch (e: any) {
            Alert.alert('Error', e?.message || String(e));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminPageBanner
        icon={Dumbbell}
        title={t('admin.banner.exercises_title', { defaultValue: 'תרגילים — הספרייה הראשית' })}
        subtitle={t('admin.banner.exercises_subtitle', { defaultValue: 'כל התרגילים במערכת. כל תרגיל יכול להופיע גם בגלריה (לצפייה חופשית) וגם במסלול 30 יום (כחלק מתוכנית יומית).' })}
        accentColor="#0F172A"
      />
      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {items.length} {t('admin.exercises_total', { defaultValue: 'תרגילים' })}
        </Text>
        <View style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.addBtn, styles.addBtnSecondary]}
            onPress={() =>
              setDraft({
                status: 'active',
                animation_id: CUSTOM_SVG_ID,
                icon_id: null,
                svg_content: CUSTOM_SVG_PLACEHOLDER,
              })
            }
          >
            <Plus size={18} color="#0F172A" />
            <Text style={[styles.addBtnText, { color: '#0F172A' }]}>
              {t('admin.add_svg', { defaultValue: 'אנימציית וקטור חדשה' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setDraft({ status: 'active', animation_id: '', icon_id: null })}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>{t('admin.add', { defaultValue: 'הוספה' })}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.title_he}</Text>
              <Text style={styles.rowSub}>
                {item.animation_id} · {item.exercise_type ?? '—'} · {item.status}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setPreviewing(item)} style={styles.iconBtn}>
              <Play size={18} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDraft(item)} style={styles.iconBtn}>
              <Edit3 size={18} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item)} style={styles.iconBtn}>
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={!!previewing} animationType="fade" transparent onRequestClose={() => setPreviewing(null)}>
        <View style={styles.previewBackdrop}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {previewing?.title_he || previewing?.animation_id}
                </Text>
                <Text style={styles.previewSub}>{previewing?.animation_id}</Text>
              </View>
              <TouchableOpacity onPress={() => setPreviewing(null)} style={styles.iconBtn}>
                <X size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <View style={styles.previewStage}>
              {previewing && (
                <ExerciseAnimationRenderer
                  animationId={previewing.animation_id}
                  svgContent={(previewing as any).svg_content ?? null}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!draft} animationType="slide" onRequestClose={() => setDraft(null)}>
        <ScrollView style={styles.editor} contentContainerStyle={{ padding: 20 }}>
          <View style={styles.editorHeader}>
            <Text style={styles.editorTitle}>
              {draft?.id ? t('admin.edit', { defaultValue: 'עריכה' }) : t('admin.add', { defaultValue: 'הוספה' })}
            </Text>
            <TouchableOpacity onPress={() => setDraft(null)} style={styles.iconBtn}>
              <X size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <Field label="Animation ID">
            <PickerLite
              value={draft?.animation_id ?? ''}
              options={ANIMATION_IDS}
              onChange={(v) => setDraft({ ...draft!, animation_id: v })}
            />
          </Field>

          <Field label="Title (HE)">
            <TextInput
              style={styles.input}
              value={draft?.title_he ?? ''}
              onChangeText={(v) => setDraft({ ...draft!, title_he: v })}
            />
          </Field>
          <Field label="Title (EN)">
            <TextInput
              style={styles.input}
              value={draft?.title_en ?? ''}
              onChangeText={(v) => setDraft({ ...draft!, title_en: v })}
            />
          </Field>

          <Field label="Description (HE)">
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              value={draft?.description_he ?? ''}
              onChangeText={(v) => setDraft({ ...draft!, description_he: v })}
            />
          </Field>
          <Field label="Description (EN)">
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              value={draft?.description_en ?? ''}
              onChangeText={(v) => setDraft({ ...draft!, description_en: v })}
            />
          </Field>

          <Field label="Type">
            <PickerLite
              value={draft?.exercise_type ?? ''}
              options={['', ...TYPES]}
              onChange={(v) => setDraft({ ...draft!, exercise_type: v || null })}
            />
          </Field>

          <Field label="Default duration (s)">
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={String(draft?.default_duration_seconds ?? '')}
              onChangeText={(v) =>
                setDraft({ ...draft!, default_duration_seconds: v ? parseInt(v) : null })
              }
            />
          </Field>

          <Field label="Default reps">
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={String(draft?.default_reps ?? '')}
              onChangeText={(v) =>
                setDraft({ ...draft!, default_reps: v ? parseInt(v) : null })
              }
            />
          </Field>

          <Field label="Audio path (HE)">
            <TextInput
              style={styles.input}
              value={draft?.audio_path_he ?? ''}
              onChangeText={(v) => setDraft({ ...draft!, audio_path_he: v || null })}
            />
          </Field>
          <Field label="Audio path (EN)">
            <TextInput
              style={styles.input}
              value={draft?.audio_path_en ?? ''}
              onChangeText={(v) => setDraft({ ...draft!, audio_path_en: v || null })}
            />
          </Field>

          {draft?.animation_id === CUSTOM_SVG_ID && (
            <Field label="SVG XML">
              <TextInput
                style={[styles.input, styles.code, { minHeight: 180 }]}
                multiline
                placeholder={CUSTOM_SVG_PLACEHOLDER}
                value={draft?.svg_content ?? ''}
                onChangeText={(v) => setDraft({ ...draft!, svg_content: v })}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>
          )}

          <Field label="Active">
            <Switch
              value={draft?.status === 'active'}
              onValueChange={(b) => setDraft({ ...draft!, status: b ? 'active' : 'hidden' })}
            />
          </Field>

          <Field label="Instructions (HE) — JSON array">
            <TextInput
              style={[styles.input, styles.code]}
              multiline
              placeholder='[{"step":1,"text":"..."}]'
              value={JSON.stringify(draft?.instructions_he ?? [], null, 2)}
              onChangeText={(v) => {
                try {
                  const parsed = JSON.parse(v);
                  setDraft({ ...draft!, instructions_he: parsed });
                } catch {
                  // Allow invalid intermediate state
                }
              }}
            />
          </Field>
          <Field label="Instructions (EN) — JSON array">
            <TextInput
              style={[styles.input, styles.code]}
              multiline
              placeholder='[{"step":1,"text":"..."}]'
              value={JSON.stringify(draft?.instructions_en ?? [], null, 2)}
              onChangeText={(v) => {
                try {
                  const parsed = JSON.parse(v);
                  setDraft({ ...draft!, instructions_en: parsed });
                } catch {
                  // Allow invalid intermediate state
                }
              }}
            />
          </Field>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            disabled={saving}
            onPress={onSave}
          >
            <Text style={styles.saveBtnText}>{saving ? '...' : 'Save'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function PickerLite({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt || '_empty'}
          onPress={() => onChange(opt)}
          style={[styles.chip, value === opt && styles.chipActive]}
        >
          <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>
            {opt || '(none)'}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toolbar: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  count: { fontSize: 14, color: '#475569' },
  addBtn: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700' },
  addBtnSecondary: {
    backgroundColor: '#E2E8F0',
  },
  row: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  rowSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  iconBtn: { padding: 8 },
  editor: { flex: 1, backgroundColor: '#F8FAFC' },
  editorHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  editorTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 4 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  code: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, minHeight: 100, textAlignVertical: 'top' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#0F172A' },
  chipText: { color: '#475569', fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  saveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewCard: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  previewHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  previewTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  previewSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  previewStage: { height: 480, backgroundColor: '#F8FAFC' },
});
