import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';

interface ExerciseRepsPromptProps {
  targetReps: number;
  onDone: () => void;
  disabled: boolean;
}

export default function ExerciseRepsPrompt({
  targetReps,
  onDone,
  disabled,
}: ExerciseRepsPromptProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.repsText}>
        {t('exercise_player.do_reps', {
          defaultValue: 'Do {{count}} Reps',
          count: targetReps,
        })}
      </Text>
      <TouchableOpacity
        style={[styles.doneButton, disabled && styles.doneButtonDisabled]}
        onPress={onDone}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Check size={22} color="#FFFFFF" strokeWidth={3} />
        <Text style={styles.doneButtonText}>
          {t('exercise_player.im_done', { defaultValue: "I'm Done" })}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  repsText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    gap: 10,
    width: '100%',
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
