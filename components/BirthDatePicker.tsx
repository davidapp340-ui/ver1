import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface BirthDatePickerProps {
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
}

type Field = 'day' | 'month' | 'year';

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function daysInMonth(year: number, month: number): number {
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

export default function BirthDatePicker({
  value,
  onChange,
  minYear = 1900,
  maxYear,
}: BirthDatePickerProps) {
  const { i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';
  const monthNames = isHebrew ? HEBREW_MONTHS : ENGLISH_MONTHS;

  const today = new Date();
  const effectiveMaxYear = maxYear ?? today.getFullYear();

  const [parsedYear, parsedMonth, parsedDay] = useMemo(() => {
    if (!value) return [null, null, null] as [number | null, number | null, number | null];
    const parts = value.split('-').map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some(isNaN)) return [null, null, null];
    return [parts[0], parts[1], parts[2]] as [number, number, number];
  }, [value]);

  const [openField, setOpenField] = useState<Field | null>(null);

  const updateValue = (next: { year?: number | null; month?: number | null; day?: number | null }) => {
    const y = next.year !== undefined ? next.year : parsedYear;
    const m = next.month !== undefined ? next.month : parsedMonth;
    let d = next.day !== undefined ? next.day : parsedDay;

    if (y && m && d) {
      const maxDay = daysInMonth(y, m);
      if (d > maxDay) d = maxDay;
      onChange(`${y}-${pad(m)}-${pad(d)}`);
    } else {
      const yStr = y ? String(y) : '';
      const mStr = m ? pad(m) : '';
      const dStr = d ? pad(d) : '';
      onChange(`${yStr}-${mStr}-${dStr}`);
    }
  };

  const yearOptions: number[] = [];
  for (let y = effectiveMaxYear; y >= minYear; y--) yearOptions.push(y);

  const monthOptions = monthNames.map((label, idx) => ({ value: idx + 1, label }));

  const dayCount = parsedYear && parsedMonth ? daysInMonth(parsedYear, parsedMonth) : 31;
  const dayOptions: number[] = [];
  for (let d = 1; d <= dayCount; d++) dayOptions.push(d);

  const dayLabel = isHebrew ? 'יום' : 'Day';
  const monthLabel = isHebrew ? 'חודש' : 'Month';
  const yearLabel = isHebrew ? 'שנה' : 'Year';

  const dayDisplay = parsedDay ? String(parsedDay) : dayLabel;
  const monthDisplay = parsedMonth ? monthNames[parsedMonth - 1] : monthLabel;
  const yearDisplay = parsedYear ? String(parsedYear) : yearLabel;

  const toggleField = (field: Field) => {
    setOpenField((prev) => (prev === field ? null : field));
  };

  const renderField = (field: Field, displayValue: string, isPlaceholder: boolean) => {
    const isOpen = openField === field;
    return (
      <TouchableOpacity
        style={[styles.fieldButton, isOpen && styles.fieldButtonOpen]}
        onPress={() => toggleField(field)}
        activeOpacity={0.7}
      >
        <Text
          style={isPlaceholder ? styles.fieldPlaceholder : styles.fieldText}
          numberOfLines={1}
        >
          {displayValue}
        </Text>
      </TouchableOpacity>
    );
  };

  let activeOptions: { value: number; label: string }[] = [];
  let activeCurrentValue: number | null = null;
  if (openField === 'day') {
    activeOptions = dayOptions.map((d) => ({ value: d, label: String(d) }));
    activeCurrentValue = parsedDay;
  } else if (openField === 'month') {
    activeOptions = monthOptions;
    activeCurrentValue = parsedMonth;
  } else if (openField === 'year') {
    activeOptions = yearOptions.map((y) => ({ value: y, label: String(y) }));
    activeCurrentValue = parsedYear;
  }

  const handlePickOption = (val: number) => {
    if (openField === 'day') updateValue({ day: val });
    else if (openField === 'month') updateValue({ month: val });
    else if (openField === 'year') updateValue({ year: val });
    setOpenField(null);
  };

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.fieldGroupDay}>
          {renderField('day', dayDisplay, !parsedDay)}
        </View>
        <View style={styles.fieldGroupMonth}>
          {renderField('month', monthDisplay, !parsedMonth)}
        </View>
        <View style={styles.fieldGroupYear}>
          {renderField('year', yearDisplay, !parsedYear)}
        </View>
        <View style={styles.iconWrapper}>
          <Calendar size={20} color="#6B7280" />
        </View>
      </View>

      {openField !== null && (
        <View style={styles.dropdown}>
          <ScrollView
            style={styles.dropdownScroll}
            nestedScrollEnabled
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator
          >
            {activeOptions.map((opt) => {
              const isSelected = activeCurrentValue === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => handlePickOption(opt.value)}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldGroupDay: {
    flex: 1,
  },
  fieldGroupMonth: {
    flex: 2,
  },
  fieldGroupYear: {
    flex: 1.4,
  },
  fieldButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fieldButtonOpen: {
    borderColor: '#0369A1',
    backgroundColor: '#F0F9FF',
  },
  fieldText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  fieldPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  iconWrapper: {
    paddingHorizontal: 4,
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  optionSelected: {
    backgroundColor: '#E0F2FE',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#0369A1',
    fontWeight: '700',
  },
});
