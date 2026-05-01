import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Bell, BellRing, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { usePushNotifications, scheduleDailyReminder, cancelDailyReminder } from '@/hooks/usePushNotifications';
import { supabase } from '@/lib/supabase';

interface ChildReminderSectionProps {
  childId: string;
  initialToken: string | null;
  initialReminderTime: string | null;
}

function parseTimeString(timeStr: string | null): Date {
  const date = new Date();
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
  }
  date.setHours(17, 0, 0, 0);
  return date;
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatDisplayTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

export default function ChildReminderSection({
  childId,
  initialToken,
  initialReminderTime,
}: ChildReminderSectionProps) {
  const { t } = useTranslation();
  const { expoPushToken, permissionGranted } = usePushNotifications();
  const [enabled, setEnabled] = useState(!!initialToken);
  const [reminderDate, setReminderDate] = useState(() => parseTimeString(initialReminderTime));
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnable = useCallback(async () => {
    if (Platform.OS === 'web') {
      setError(t('notifications.not_available'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (!permissionGranted) {
        setError(t('notifications.permission_denied'));
        setSaving(false);
        return;
      }

      const token = expoPushToken;
      if (!token) {
        setError(t('notifications.not_available'));
        setSaving(false);
        return;
      }

      await supabase.rpc('update_child_push_token', {
        p_child_id: childId,
        p_token: token,
      });

      const timeStr = formatTime(reminderDate);
      await supabase.rpc('update_child_reminder_time', {
        p_child_id: childId,
        p_time: timeStr,
      });

      await scheduleDailyReminder(
        reminderDate,
        t('notifications.reminder_title'),
        t('notifications.child.reminder_body')
      );

      setEnabled(true);
    } catch {
      setError(t('notifications.save_error'));
    } finally {
      setSaving(false);
    }
  }, [expoPushToken, permissionGranted, reminderDate, childId, t]);

  const handleDisable = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      await supabase.rpc('update_child_push_token', {
        p_child_id: childId,
        p_token: '',
      });

      await cancelDailyReminder();
      setEnabled(false);
    } catch {
      setError(t('notifications.save_error'));
    } finally {
      setSaving(false);
    }
  }, [childId, t]);

  const handleTimeChange = useCallback(async (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (!selectedDate) return;

    setReminderDate(selectedDate);

    if (enabled) {
      setSaving(true);
      try {
        const timeStr = formatTime(selectedDate);
        await supabase.rpc('update_child_reminder_time', {
          p_child_id: childId,
          p_time: timeStr,
        });

        await scheduleDailyReminder(
          selectedDate,
          t('notifications.reminder_title'),
          t('notifications.child.reminder_body')
        );
      } catch {
        setError(t('notifications.save_error'));
      } finally {
        setSaving(false);
      }
    }
  }, [enabled, childId, t]);

  if (!enabled) {
    return (
      <View style={styles.card}>
        <View style={styles.disabledContent}>
          <View style={styles.bellCircle}>
            <Bell size={28} color="#F59E0B" />
          </View>
          <Text style={styles.promptTitle}>{t('notifications.child.section_title')}</Text>
          <Text style={styles.promptDescription}>{t('notifications.child.enabled_description')}</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={styles.enableButton}
            onPress={handleEnable}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Bell size={18} color="#FFFFFF" />
                <Text style={styles.enableButtonText}>
                  {t('notifications.child.enable_button')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.enabledHeader}>
        <View style={styles.activeIndicator}>
          <BellRing size={20} color="#F59E0B" />
          <Text style={styles.activeLabel}>{t('notifications.child.enabled_label')}</Text>
        </View>
        <TouchableOpacity
          style={styles.disableButton}
          onPress={handleDisable}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Text style={styles.disableButtonText}>{t('notifications.child.disable_button')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.timeRow}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <View style={styles.timeInfo}>
          <Clock size={20} color="#10B981" />
          <Text style={styles.timeLabel}>{t('notifications.child.reminder_time_label')}</Text>
        </View>
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>{formatDisplayTime(reminderDate)}</Text>
        </View>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={reminderDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            is24Hour={false}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.doneButtonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  bellCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  promptDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  enabledHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  disableButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  disableButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  timeBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  pickerContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  doneButton: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 8,
    textAlign: 'center',
  },
});
