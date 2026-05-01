import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList,
  I18nManager,
  Switch,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, X, Search, Map } from 'lucide-react-native';
import {
  listDailyPlans,
  listWorkoutItems,
  listExercises,
  addWorkoutItem,
  removeWorkoutItem,
  createDailyPlan,
  type DailyPlanRow,
  type ExerciseRow,
} from '@/lib/admin';
import AdminPageBanner from '@/components/admin/AdminPageBanner';

const TRACKS = ['child', 'teen', 'adult'];

export default function AdminDailyPlansScreen() {
  const { t } = useTranslation();
  const [track, setTrack] = useState('child');
  const [plans, setPlans] = useState<DailyPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, any[]>>({});

  // Add-exercise picker state
  const [addingToPlan, setAddingToPlan] = useState<DailyPlanRow | null>(null);
  const [allExercises, setAllExercises] = useState<ExerciseRow[]>([]);
  const [exerciseFilter, setExerciseFilter] = useState('');
  const [duration, setDuration] = useState('');
  const [reps, setReps] = useState('');
  const [picked, setPicked] = useState<ExerciseRow | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // Create-plan state
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [newDay, setNewDay] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIsRest, setNewIsRest] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setPlans(await listDailyPlans(track));
    } catch (e: any) {
      Alert.alert('Error', e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [track]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const refreshItems = async (planId: string) => {
    const list = await listWorkoutItems(planId);
    setItems((prev) => ({ ...prev, [planId]: list }));
  };

  const togglePlan = async (planId: string) => {
    if (openPlanId === planId) {
      setOpenPlanId(null);
      return;
    }
    setOpenPlanId(planId);
    if (!items[planId]) {
      try {
        await refreshItems(planId);
      } catch (e: any) {
        Alert.alert('Error', e?.message || String(e));
      }
    }
  };

  const openAddItem = async (plan: DailyPlanRow) => {
    setAddingToPlan(plan);
    setExerciseFilter('');
    setDuration('');
    setReps('');
    setPicked(null);
    if (allExercises.length === 0) {
      try {
        const ex = await listExercises();
        setAllExercises(ex.filter((e) => e.status === 'active'));
      } catch (e: any) {
        Alert.alert('Error', e?.message || String(e));
      }
    }
  };

  const onPickExercise = (ex: ExerciseRow) => {
    setPicked(ex);
    setDuration(String(ex.default_duration_seconds ?? ''));
    setReps(String(ex.default_reps ?? ''));
  };

  const onSaveItem = async () => {
    if (!addingToPlan || !picked) {
      Alert.alert('Missing', 'Pick an exercise first');
      return;
    }
    try {
      setSavingItem(true);
      await addWorkoutItem({
        planId: addingToPlan.id,
        exerciseId: picked.id,
        durationSeconds: duration ? parseInt(duration) : null,
        targetReps: reps ? parseInt(reps) : null,
      });
      const planId = addingToPlan.id;
      setAddingToPlan(null);
      await refreshItems(planId);
    } catch (e: any) {
      Alert.alert('Save error', e?.message || String(e));
    } finally {
      setSavingItem(false);
    }
  };

  const openCreatePlan = () => {
    const usedDays = new Set(plans.map(p => p.day_number));
    let nextDay = 1;
    while (usedDays.has(nextDay) && nextDay <= 30) nextDay++;
    setNewDay(String(Math.min(nextDay, 30)));
    setNewTitle('');
    setNewDescription('');
    setNewIsRest([7, 14, 21, 28].includes(nextDay));
    setCreatingPlan(true);
  };

  const onSavePlan = async () => {
    const dayNum = parseInt(newDay, 10);
    if (!dayNum || dayNum < 1 || dayNum > 30) {
      Alert.alert('Error', 'יום חייב להיות בין 1 ל-30');
      return;
    }
    try {
      setSavingPlan(true);
      await createDailyPlan({
        track_level: track,
        day_number: dayNum,
        title: newTitle.trim() || null,
        description: newDescription.trim() || null,
        is_rest_day: newIsRest,
      });
      setCreatingPlan(false);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || String(e));
    } finally {
      setSavingPlan(false);
    }
  };

  const onRemoveItem = (planId: string, itemId: string, label: string) => {
    Alert.alert('Remove?', `Remove "${label}" from this plan?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeWorkoutItem(itemId);
            await refreshItems(planId);
          } catch (e: any) {
            Alert.alert('Error', e?.message || String(e));
          }
        },
      },
    ]);
  };

  const filteredExercises = allExercises.filter((e) => {
    if (!exerciseFilter) return true;
    const q = exerciseFilter.toLowerCase();
    return (
      (e.title_he || '').toLowerCase().includes(q) ||
      (e.title_en || '').toLowerCase().includes(q) ||
      e.animation_id.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  return (
    <View style={styles.container}>
      <AdminPageBanner
        icon={Map}
        title={t('admin.banner.plans_title', { defaultValue: 'מסלול 30 יום (המסע)' })}
        subtitle={t('admin.banner.plans_subtitle', { defaultValue: 'תוכניות יומיות שמרכיבות את המסלול שמופיע לילד בעמוד "המסע" — יום אחר יום, יום 1 עד 30.' })}
        accentColor="#10B981"
      />
      <View style={styles.tabs}>
        {TRACKS.map((tr) => (
          <TouchableOpacity
            key={tr}
            onPress={() => setTrack(tr)}
            style={[styles.tab, track === tr && styles.tabActive]}
          >
            <Text style={[styles.tabText, track === tr && styles.tabTextActive]}>{tr}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.subToolbar}>
        <Text style={styles.subCount}>{plans.length} {t('admin.plans_total', { defaultValue: 'תוכניות' })}</Text>
        <TouchableOpacity style={styles.newPlanBtn} onPress={openCreatePlan}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.newPlanBtnText}>{t('admin.add_plan', { defaultValue: 'יום חדש' })}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {plans.map((p) => (
          <View key={p.id} style={styles.planCard}>
            <TouchableOpacity onPress={() => togglePlan(p.id)} style={styles.planHeader}>
              <Text style={styles.dayBadge}>{p.day_number}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{p.title || '(untitled)'}</Text>
                <Text style={styles.planSub}>
                  {p.is_rest_day ? '🎁 rest day' : ''} · {p.description || ''}
                </Text>
              </View>
            </TouchableOpacity>
            {openPlanId === p.id && (
              <View style={styles.itemList}>
                {(items[p.id] || []).length === 0 ? (
                  <Text style={styles.empty}>No items</Text>
                ) : (
                  (items[p.id] || []).map((wi: any) => (
                    <View key={wi.id} style={styles.itemRow}>
                      <Text style={styles.itemSeq}>{wi.sequence_order}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>
                          {wi.exercise?.title_he || wi.exercise?.animation_id}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {wi.duration_seconds ? `${wi.duration_seconds}s` : ''}
                          {wi.target_reps ? ` · ${wi.target_reps} reps` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => onRemoveItem(p.id, wi.id, wi.exercise?.title_he || wi.exercise?.animation_id || 'item')}
                        style={styles.iconBtn}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
                <TouchableOpacity style={styles.addItemBtn} onPress={() => openAddItem(p)}>
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addItemBtnText}>
                    {t('admin.add_exercise', { defaultValue: 'הוסף תרגיל' })}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={!!addingToPlan}
        animationType="slide"
        onRequestClose={() => setAddingToPlan(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t('admin.add_exercise', { defaultValue: 'הוסף תרגיל' })}
              {addingToPlan ? ` · Day ${addingToPlan.day_number}` : ''}
            </Text>
            <TouchableOpacity onPress={() => setAddingToPlan(null)} style={styles.iconBtn}>
              <X size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Search size={16} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('admin.search', { defaultValue: 'חיפוש...' })}
              value={exerciseFilter}
              onChangeText={setExerciseFilter}
            />
          </View>

          <FlatList
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12 }}
            data={filteredExercises}
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onPickExercise(item)}
                style={[styles.exRow, picked?.id === item.id && styles.exRowActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.exTitle}>{item.title_he}</Text>
                  <Text style={styles.exSub}>
                    {item.animation_id} · {item.exercise_type ?? '—'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No exercises match</Text>
            }
          />

          {picked && (
            <View style={styles.footer}>
              <Text style={styles.pickedLabel}>
                {t('admin.selected', { defaultValue: 'נבחר' })}: {picked.title_he}
              </Text>
              <View style={styles.numRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Duration (s)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Reps</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={reps}
                    onChangeText={setReps}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, savingItem && styles.saveBtnDisabled]}
                disabled={savingItem}
                onPress={onSaveItem}
              >
                <Text style={styles.saveBtnText}>{savingItem ? '...' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <Modal visible={creatingPlan} animationType="slide" transparent onRequestClose={() => setCreatingPlan(false)}>
        <View style={styles.planModalBackdrop}>
          <View style={styles.planModal}>
            <View style={styles.planModalHeader}>
              <Text style={styles.modalTitle}>
                {t('admin.add_plan', { defaultValue: 'יום חדש' })} · {track}
              </Text>
              <TouchableOpacity onPress={() => setCreatingPlan(false)} style={styles.iconBtn}>
                <X size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>{t('admin.day_number', { defaultValue: 'יום (1-30)' })}</Text>
            <TextInput style={styles.input} value={newDay} onChangeText={setNewDay} keyboardType="number-pad" />
            <Text style={styles.fieldLabel}>{t('admin.plan_title', { defaultValue: 'כותרת' })}</Text>
            <TextInput style={styles.input} value={newTitle} onChangeText={setNewTitle} placeholder="לדוגמה: יום קל" />
            <Text style={styles.fieldLabel}>{t('admin.plan_description', { defaultValue: 'תיאור' })}</Text>
            <TextInput
              style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
            />
            <View style={styles.restRow}>
              <Text style={styles.fieldLabel}>🎁 {t('admin.is_rest_day', { defaultValue: 'יום אוצר/מנוחה' })}</Text>
              <Switch value={newIsRest} onValueChange={setNewIsRest} />
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, savingPlan && styles.saveBtnDisabled, { marginTop: 16 }]}
              disabled={savingPlan}
              onPress={onSavePlan}
            >
              <Text style={styles.saveBtnText}>{savingPlan ? '...' : t('admin.save', { defaultValue: 'שמור' })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#0F172A' },
  tabText: { color: '#64748B', fontWeight: '600' },
  tabTextActive: { color: '#0F172A' },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    fontWeight: '800',
  },
  planTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  planSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  itemList: { padding: 12, paddingTop: 0, gap: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  empty: { color: '#94A3B8', fontStyle: 'italic', paddingVertical: 8 },
  itemRow: { flexDirection: 'row', gap: 12, paddingVertical: 6, alignItems: 'center' },
  itemSeq: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '700',
  },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  itemMeta: { fontSize: 12, color: '#64748B' },
  iconBtn: { padding: 8 },
  addItemBtn: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  addItemBtnText: { color: '#FFFFFF', fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  searchBar: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A' },
  exRow: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  exRowActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  exTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  exSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  pickedLabel: { fontSize: 13, color: '#475569', fontWeight: '600' },
  numRow: { flexDirection: 'row', gap: 12 },
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
  saveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  subToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subCount: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  newPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newPlanBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  planModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  planModal: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 6 },
  planModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
});
