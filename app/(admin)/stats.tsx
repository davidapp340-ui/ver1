import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { adminStats } from '@/lib/admin';

export default function AdminStatsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setStats(await adminStats());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading || !stats) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card label="Total exercises" value={stats.totalExercises} />
      <Card label="Active exercises" value={stats.activeExercises} />
      <Card label="Total daily plans" value={stats.totalPlans} />
      <Card label="Completions (last 30d)" value={stats.completionsLast30Days} />

      <Text style={styles.section}>Plans by track</Text>
      {Object.entries(stats.plansByTrack).map(([k, v]) => (
        <Card key={k} label={k} value={v as number} />
      ))}
    </ScrollView>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: { fontSize: 14, color: '#475569', fontWeight: '600' },
  cardValue: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
});
