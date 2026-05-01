import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react-native';

export type InstructionStep = { step: number; text: string };

const TYPE_BENEFIT_KEY: Record<string, string> = {
  eye_muscle: 'instructions.benefit.eye_muscle',
  near_far: 'instructions.benefit.near_far',
  relaxation: 'instructions.benefit.relaxation',
  blinking: 'instructions.benefit.blinking',
  tracking: 'instructions.benefit.tracking',
};

const TYPE_BENEFIT_FALLBACK: Record<string, string> = {
  eye_muscle: 'מחזק את שרירי העיניים',
  near_far: 'משפר מעבר מיקוד קרוב/רחוק',
  relaxation: 'מרגיע את העיניים',
  blinking: 'משמן את העיניים',
  tracking: 'משפר מעקב חזותי',
};

interface Props {
  title: string;
  steps: InstructionStep[];
  exerciseType?: string | null;
  categoryColor?: string;
  durationSeconds?: number | null;
  onStart: () => void;
  startLabel?: string;
}

const ExerciseInstructions: React.FC<Props> = ({
  title,
  steps,
  exerciseType,
  categoryColor = '#10B981',
  durationSeconds,
  onStart,
  startLabel,
}) => {
  const { t } = useTranslation();

  const benefit = exerciseType
    ? t(TYPE_BENEFIT_KEY[exerciseType] || '', {
        defaultValue: TYPE_BENEFIT_FALLBACK[exerciseType] || '',
      })
    : null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.colorChip, { backgroundColor: categoryColor }]} />
        <Text style={styles.title}>{title}</Text>

        {benefit ? (
          <View style={[styles.benefitBox, { borderColor: categoryColor }]}>
            <Text style={[styles.benefitLabel, { color: categoryColor }]}>
              {t('instructions.helps_with', { defaultValue: 'מסייע ל' })}
            </Text>
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ) : null}

        {durationSeconds ? (
          <Text style={styles.duration}>
            {t('instructions.duration', { defaultValue: 'משך' })}: {durationSeconds}{' '}
            {t('instructions.seconds', { defaultValue: 'שניות' })}
          </Text>
        ) : null}

        <View style={styles.stepsHeader}>
          <Text style={styles.stepsTitle}>
            {t('instructions.how_to', { defaultValue: 'איך מבצעים' })}
          </Text>
        </View>

        <View style={styles.steps}>
          {steps.map((s) => (
            <View key={s.step} style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: categoryColor }]}>
                <Text style={styles.stepBadgeText}>{s.step}</Text>
              </View>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: categoryColor }]}
        onPress={onStart}
        activeOpacity={0.85}
      >
        <Play size={22} color="#FFFFFF" />
        <Text style={styles.startButtonText}>
          {startLabel || t('instructions.ready', { defaultValue: 'הבנתי, התחל' })}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 16 },
  colorChip: {
    alignSelf: I18nManager.isRTL ? 'flex-end' : 'flex-start',
    width: 48,
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  benefitBox: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  benefitLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  benefitText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  duration: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 20,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  stepsHeader: { marginBottom: 12 },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  steps: { gap: 14 },
  stepRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  startButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  startButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});

export default ExerciseInstructions;
