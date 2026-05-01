import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Plus, X, Search } from 'lucide-react-native';
import { getAllLibraryItems, createLibraryItem, type LibraryItemWithExercise } from '@/lib/library';
import { listExercises, listCategories, type ExerciseRow } from '@/lib/admin';
import AdminPageBanner from '@/components/admin/AdminPageBanner';

export default function AdminLibraryScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<LibraryItemWithExercise[]>([]);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState('');
  const [pickedExercise, setPickedExercise] = useState<ExerciseRow | null>(null);
  const [pickedCategory, setPickedCategory] = useState<any | null>(null);
  const [sortOrder, setSortOrder] = useState('');
  const [enableAudio, setEnableAudio] = useState(true);
  const [enableAnimation, setEnableAnimation] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [libs, ex, cats] = await Promise.all([
      getAllLibraryItems(),
      listExercises(),
      listCategories(),
    ]);
    setItems(libs);
    setExercises(ex.filter(e => e.status === 'active'));
    setCategories(cats);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredExercises = useMemo(() => {
    if (!filter) return exercises;
    const q = filter.toLowerCase();
    return exercises.filter(e =>
      (e.title_he || '').toLowerCase().includes(q) ||
      (e.title_en || '').toLowerCase().includes(q) ||
      e.animation_id.toLowerCase().includes(q)
    );
  }, [exercises, filter]);

  const openCreate = () => {
    setFilter('');
    setPickedExercise(null);
    setPickedCategory(categories[0] || null);
    setSortOrder(String(items.length + 1));
    setEnableAudio(true);
    setEnableAnimation(true);
    setCreating(true);
  };

  const onSave = async () => {
    if (!pickedExercise || !pickedCategory) {
      Alert.alert(t('common.error', { defaultValue: 'שגיאה' }), t('admin.library_pick_required', { defaultValue: 'בחר תרגיל וקטגוריה' }));
      return;
    }
    try {
      setSaving(true);
      await createLibraryItem({
        exercise_id: pickedExercise.id,
        category_name: pickedCategory.name_he || pickedCategory.name_en,
        category_color: pickedCategory.color,
        sort_order: sortOrder ? parseInt(sortOrder, 10) : 0,
        enable_audio: enableAudio,
        enable_animation: enableAnimation,
      } as any);
      setCreating(false);
      await load();
    } catch (e: any) {
      Alert.alert(t('common.error', { defaultValue: 'שגיאה' }), e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const banner = (
    <AdminPageBanner
      icon={LayoutGrid}
      title={t('admin.banner.library_title', { defaultValue: 'גלריה — קטגוריות תרגילים' })}
      subtitle={t('admin.banner.library_subtitle', { defaultValue: 'תרגילים לצפייה חופשית של הילד, מקובצים לקטגוריות. לא משפיע על המסע / מסלול 30 יום.' })}
      accentColor="#6366F1"
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {banner}
        <View style={styles.center}><ActivityIndicator /></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {banner}
      <View style={styles.toolbar}>
        <Text style={styles.count}>{items.length} {t('admin.items_total', { defaultValue: 'פריטים' })}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{t('admin.add_library_item', { defaultValue: 'הוסף לגלריה' })}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.colorDot, { backgroundColor: item.category_color || '#94A3B8' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.exercise.title_he}</Text>
              <Text style={styles.sub}>
                {item.category_name} · sort {item.sort_order} ·{' '}
                {item.enable_audio ? '🔊' : '🔇'} {item.enable_animation ? '🎞️' : '—'}
              </Text>
            </View>
          </View>
        )}
      />

      <Modal visible={creating} animationType="slide" onRequestClose={() => setCreating(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('admin.add_library_item', { defaultValue: 'הוסף לגלריה' })}</Text>
            <TouchableOpacity onPress={() => setCreating(false)} style={styles.iconBtn}>
              <X size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={styles.label}>{t('admin.exercise', { defaultValue: 'תרגיל' })}</Text>
            <View style={styles.searchBar}>
              <Search size={16} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder={t('admin.search', { defaultValue: 'חיפוש...' })}
                value={filter}
                onChangeText={setFilter}
              />
            </View>
            <View style={{ gap: 6 }}>
              {filteredExercises.slice(0, 30).map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  onPress={() => setPickedExercise(ex)}
                  style={[styles.exRow, pickedExercise?.id === ex.id && styles.exRowActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exTitle}>{ex.title_he}</Text>
                    <Text style={styles.exSub}>{ex.animation_id} · {ex.exercise_type ?? '—'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('admin.category', { defaultValue: 'קטגוריה' })}</Text>
            <View style={styles.catRow}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setPickedCategory(c)}
                  style={[styles.catChip, pickedCategory?.id === c.id && { borderColor: c.color, backgroundColor: '#F8FAFC' }]}
                >
                  <View style={[styles.catDot, { backgroundColor: c.color }]} />
                  <Text style={styles.catName}>{c.name_he}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('admin.sort_order', { defaultValue: 'סדר תצוגה' })}</Text>
            <TextInput style={styles.input} value={sortOrder} onChangeText={setSortOrder} keyboardType="number-pad" />

            <View style={styles.toggleRow}>
              <Text style={styles.label}>{t('admin.enable_audio', { defaultValue: 'שמע' })}</Text>
              <Switch value={enableAudio} onValueChange={setEnableAudio} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>{t('admin.enable_animation', { defaultValue: 'אנימציה' })}</Text>
              <Switch value={enableAnimation} onValueChange={setEnableAnimation} />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} disabled={saving} onPress={onSave}>
              <Text style={styles.saveBtnText}>{saving ? '...' : t('admin.save', { defaultValue: 'שמור' })}</Text>
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
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  count: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  title: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  iconBtn: { padding: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A' },
  exRow: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  exRowActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  exTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  exSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  catDot: { width: 12, height: 12, borderRadius: 6 },
  catName: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
