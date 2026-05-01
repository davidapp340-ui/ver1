import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface PlaylistProgressBarProps {
  currentIndex: number;
  totalCount: number;
  exerciseTitle: string;
}

export default function PlaylistProgressBar({
  currentIndex,
  totalCount,
  exerciseTitle,
}: PlaylistProgressBarProps) {
  const { t } = useTranslation();
  const progress = totalCount > 0 ? ((currentIndex + 1) / totalCount) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.textRow}>
        <Text style={styles.stepLabel}>
          {t('exercise_player.progress', {
            defaultValue: 'Exercise {{current}} of {{total}}',
            current: currentIndex + 1,
            total: totalCount,
          })}
        </Text>
        <Text style={styles.exerciseTitle} numberOfLines={1}>
          {exerciseTitle}
        </Text>
      </View>
      <View style={styles.trackOuter}>
        <View style={[styles.trackFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  trackOuter: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
});
