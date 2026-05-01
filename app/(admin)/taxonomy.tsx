import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Palette, Plus, X } from 'lucide-react-native';
import { listCategories, listMonthlyThemes, createCategory } from '@/lib/admin';
import AdminPageBanner from '@/components/admin/AdminPageBanner';

const COLOR_PRESETS = ['#10B981', '#6366F1', '#EC4899', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#84CC16'];

export default function AdminTaxonomyScreen() {
  const { t: tr } = useTranslation();
  const [cats, setCats] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [nameHe, setNameHe] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [sortOrder, setSortOrder] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, t] = await Promise.all([listCategories(), listMonthlyThemes()]);
    setCats(c);
    setThemes(t);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCreate = () => {
    setNameHe('');
    setNameEn('');
    setColor(COLOR_PRESETS[0]);
    setSortOrder(String((cats[cats.length - 1]?.sort_order ?? cats.length) + 1));
    setCreating(true);
  };

  const onSave = async () => {
    if (!nameHe.trim() || !nameEn.trim()) {
      Alert.alert(tr('common.error', { defaultValue: 'שגיאה' }), tr('admin.fill_required', { defaultValue: 'נא למלא שם בעברית ובאנגלית' }));
      return;
    }
    try {
      setSaving(true);
      await createCategory({
        name_he: nameHe.trim(),
        name_en: nameEn.trim(),
        color,
        sort_order: sortOrder ? parseInt(sortOrder, 10) : null,
      });
      setCreating(false);
      await load();
    } catch (e: any) {
      Alert.alert(tr('common.error', { defaultValue: 'שגיאה' }), e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const banner = (
    <AdminPageBanner
      icon={Palette}
      title={tr('admin.banner.taxonomy_title', { defaultValue: 'קטגוריות גלריה ונושאי החודש' })}
      subtitle={tr('admin.banner.taxonomy_subtitle', { defaultValue: 'הקטגוריות שלפיהן מסודרים תרגילי הגלריה, וכן ערכות הנושא הוויזואליות של המסלול לפי חודש.' })}
      accentColor="#EC4899"
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
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View>
          <View style={styles.sectionRow}>
            <Text style={styles.section}>{tr('admin.categories', { defaultValue: 'קטגוריות גלריה' })}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>{tr('admin.add_category', { defaultValue: 'קטגוריה חדשה' })}</Text>
            </TouchableOpacity>
          </View>
          {cats.map((c) => (
            <View key={c.id} style={styles.row}>
              <View style={[styles.colorDot, { backgroundColor: c.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{c.name_he} / {c.name_en}</Text>
                <Text style={styles.sub}>id: {c.id} · sort {c.sort_order}</Text>
              </View>
            </View>
          ))}
        </View>

        <View>
          <Text style={styles.section}>{tr('admin.monthly_themes', { defaultValue: 'ערכות נושא חודשיות' })}</Text>
          {themes.map((t) => (
            <View key={t.id} style={styles.row}>
              <View style={[styles.colorDot, { backgroundColor: t.current_glow }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t.name_he} / {t.name_en}</Text>
                <Text style={styles.sub}>cycle position: {t.cycle_position}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={creating} animationType="slide" transparent onRequestClose={() => setCreating(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{tr('admin.add_category', { defaultValue: 'קטגוריה חדשה' })}</Text>
              <TouchableOpacity onPress={() => setCreating(false)} style={styles.iconBtn}>
                <X size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>{tr('admin.name_he', { defaultValue: 'שם (עברית)' })}</Text>
            <TextInput style={styles.input} value={nameHe} onChangeText={setNameHe} placeholder="לדוגמה: ריכוז" />
            <Text style={styles.label}>{tr('admin.name_en', { defaultValue: 'שם (אנגלית)' })}</Text>
            <TextInput style={styles.input} value={nameEn} onChangeText={setNameEn} placeholder="e.g. Focus" />
            <Text style={styles.label}>{tr('admin.color', { defaultValue: 'צבע' })}</Text>
            <View style={styles.colorRow}>
              {COLOR_PRESETS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorChip, { backgroundColor: c }, color === c && styles.colorChipActive]}
                />
              ))}
            </View>
            <Text style={styles.label}>{tr('admin.sort_order', { defaultValue: 'סדר תצוגה' })}</Text>
            <TextInput style={styles.input} value={sortOrder} onChangeText={setSortOrder} keyboardType="number-pad" />

            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} disabled={saving} onPress={onSave}>
              <Text style={styles.saveBtnText}>{saving ? '...' : tr('admin.save', { defaultValue: 'שמור' })}</Text>
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
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  section: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
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
    marginBottom: 6,
    gap: 12,
  },
  colorDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  title: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', padding: 16 },
  modal: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  iconBtn: { padding: 4 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 8 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  colorChip: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorChipActive: { borderColor: '#0F172A' },
  saveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
