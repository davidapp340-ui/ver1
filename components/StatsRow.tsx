import { View, Text, StyleSheet } from 'react-native';
import { Coins, Flame, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface StatsRowProps {
  totalPoints: number;
  currentStreak: number;
  pathDay: number;
}

export default function StatsRow({ totalPoints, currentStreak, pathDay }: StatsRowProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.statCard}>
        <View style={[styles.iconContainer, styles.coinsIcon]}>
          <Coins size={28} color="#F59E0B" strokeWidth={2.5} />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{totalPoints.toLocaleString()}</Text>
          <Text style={styles.statLabel}>{t('child_home.stats.points')}</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.iconContainer, styles.streakIcon]}>
          <Flame size={28} color="#EF4444" strokeWidth={2.5} />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>{t('child_home.stats.streak')}</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.iconContainer, styles.dayIcon]}>
          <MapPin size={28} color="#10B981" strokeWidth={2.5} />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{t('child_home.stats.day_value', { day: pathDay })}</Text>
          <Text style={styles.statLabel}>{t('child_home.stats.day_label')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinsIcon: {
    backgroundColor: '#FEF3C7',
  },
  streakIcon: {
    backgroundColor: '#FEE2E2',
  },
  dayIcon: {
    backgroundColor: '#D1FAE5',
  },
  statContent: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
