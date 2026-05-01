import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Switch, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Bell, BellOff, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { usePushNotifications, scheduleDailyReminder, cancelDailyReminder } from '@/hooks/usePushNotifications';
import { supabase } from '@/lib/supabase';

interface NotificationSettingsProps {
  profileId: string;
  initialToken: string | null;
  initialReminderTime: string | null;
  accentColor?: string;
  accentBg?: string;
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
  date.setHours(9, 0, 0, 0);
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

export default function NotificationSettings({
  profileId,
  initialToken,
  initialReminderTime,
  accentColor = '#4F46E5',
  accentBg = '#EEF2FF',
}: NotificationSettingsProps) {
  const { t } = useTranslation();
  const { expoPushToken, permissionGranted } = usePushNotifications();
  const [enabled, setEnabled] = useState(!!initialToken);
  const [reminderDate, setReminderDate] = useState(() => parseTimeString(initialReminderTime));
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expoPushToken && initialToken && expoPushToken !== initialToken) {
      saveToken(expoPushToken);
    }
  }, [expoPushToken, initialToken]);

  const saveToken = async (token: string | null) => {
    try {
      await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', profileId);
    } catch {
      // silent
    }
  };

  const saveReminderTime = async (time: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ daily_reminder_time: time })
        .eq('id', profileId);
    } catch {
      // silent
    }
  };

  const handleToggle = useCallback(async (value: boolean) => {
    if (Platform.OS === 'web') {
      setError(t('notifications.not_available'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (value) {
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

        await saveToken(token);

        const timeStr = formatTime(reminderDate);
        await saveReminderTime(timeStr);
        await scheduleDailyReminder(
          reminderDate,
          t('notifications.reminder_title'),
          t('notifications.reminder_body')
        );

        setEnabled(true);
      } else {
        await saveToken(null);
        await cancelDailyReminder();
        setEnabled(false);
      }
    } catch {
      setError(t('notifications.save_error'));
    } finally {
      setSaving(false);
    }
  }, [expoPushToken, permissionGranted, reminderDate, profileId, t]);

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
        await saveReminderTime(timeStr);
        await scheduleDailyReminder(
          selectedDate,
          t('notifications.reminder_title'),
          t('notifications.reminder_body')
        );
      } catch {
        setError(t('notifications.save_error'));
      } finally {
        setSaving(false);
      }
    }
  }, [enabled, profileId, t]);

  return (
    <View style={styles.settingCard}>
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          {enabled ? (
            <Bell size={22} color={accentColor} />
          ) : (
            <BellOff size={22} color="#9CA3AF" />
          )}
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>{t('notifications.enable_label')}</Text>
            <Text style={styles.settingDescription}>{t('notifications.enable_description')}</Text>
          </View>
        </View>
        {saving ? (
          <ActivityIndicator size="small" color={accentColor} />
        ) : (
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#D1D5DB', true: accentColor }}
            thumbColor="#FFFFFF"
          />
        )}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {enabled && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <Clock size={22} color={accentColor} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>{t('notifications.reminder_time_label')}</Text>
                <Text style={styles.settingDescription}>{t('notifications.reminder_time_description')}</Text>
              </View>
            </View>
            <View style={[styles.timeBadge, { backgroundColor: accentBg }]}>
              <Text style={[styles.timeBadgeText, { color: accentColor }]}>
                {formatDisplayTime(reminderDate)}
              </Text>
            </View>
          </TouchableOpacity>

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
                  style={[styles.doneButton, { backgroundColor: accentColor }]}
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={styles.doneButtonText}>{t('common.ok')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  timeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeBadgeText: {
    fontSize: 15,
    fontWeight: '700',
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
    paddingLeft: 34,
  },
});
