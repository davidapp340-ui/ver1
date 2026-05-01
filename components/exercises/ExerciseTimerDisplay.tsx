import { View, Text, StyleSheet } from 'react-native';

interface ExerciseTimerDisplayProps {
  secondsRemaining: number;
  totalSeconds: number;
  isRunning: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ExerciseTimerDisplay({
  secondsRemaining,
  totalSeconds,
  isRunning,
}: ExerciseTimerDisplayProps) {
  const progress = totalSeconds > 0 ? (1 - secondsRemaining / totalSeconds) * 100 : 0;

  return (
    <View style={styles.container}>
      <Text style={[styles.timeText, !isRunning && styles.timeTextPaused]}>
        {formatTime(secondsRemaining)}
      </Text>
      <View style={styles.barOuter}>
        <View style={[styles.barFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  timeText: {
    fontSize: 56,
    fontWeight: '800',
    color: '#111827',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timeTextPaused: {
    color: '#9CA3AF',
  },
  barOuter: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
});
