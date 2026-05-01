import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Switch,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { PRIVACY_POLICY_URL } from '@/lib/legal';

interface AddChildWizardProps {
  visible: boolean;
  onClose: () => void;
  familyId: string;
  onSuccess: () => void;
}

interface Step1Data {
  name: string;
  birthDate: string;
  gender: string;
}

interface Step2Data {
  visionCondition: string;
  wearsGlasses: boolean;
  prescriptionLeft: string;
  prescriptionRight: string;
  consent: boolean;
}

export default function AddChildWizard({
  visible,
  onClose,
  familyId,
  onSuccess,
}: AddChildWizardProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [step1Data, setStep1Data] = useState<Step1Data>({
    name: '',
    birthDate: '',
    gender: '',
  });

  const [step2Data, setStep2Data] = useState<Step2Data>({
    visionCondition: 'unknown',
    wearsGlasses: false,
    prescriptionLeft: '',
    prescriptionRight: '',
    consent: false,
  });

  const resetForm = () => {
    setCurrentStep(1);
    setStep1Data({ name: '', birthDate: '', gender: '' });
    setStep2Data({
      visionCondition: 'unknown',
      wearsGlasses: false,
      prescriptionLeft: '',
      prescriptionRight: '',
      consent: false,
    });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateStep1 = (): boolean => {
    if (!step1Data.name.trim()) {
      setError(t('parent_home.add_child_wizard.step1.validation.name_required'));
      return false;
    }
    if (!step1Data.birthDate) {
      setError(t('parent_home.add_child_wizard.step1.validation.birth_date_required'));
      return false;
    }
    const birthDate = new Date(step1Data.birthDate);
    if (birthDate > new Date()) {
      setError(t('parent_home.add_child_wizard.step1.validation.birth_date_future'));
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(1);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setStep1Data({ ...step1Data, birthDate: formattedDate });
    }
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const validateStep2 = (): boolean => {
    if (!step2Data.consent) {
      setError(t('parent_home.add_child_wizard.step2.validation.consent_required'));
      return false;
    }

    if (step2Data.wearsGlasses) {
      const leftVal = parseFloat(step2Data.prescriptionLeft);
      const rightVal = parseFloat(step2Data.prescriptionRight);

      if (
        step2Data.prescriptionLeft &&
        (isNaN(leftVal) || leftVal < -20 || leftVal > 20)
      ) {
        setError(t('parent_home.add_child_wizard.step2.validation.prescription_invalid'));
        return false;
      }

      if (
        step2Data.prescriptionRight &&
        (isNaN(rightVal) || rightVal < -20 || rightVal > 20)
      ) {
        setError(t('parent_home.add_child_wizard.step2.validation.prescription_invalid'));
        return false;
      }
    }

    return true;
  };

  const handleCreate = async () => {
    setError('');

    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      let prescriptionLeft = null;
      let prescriptionRight = null;

      if (step2Data.wearsGlasses) {
        if (step2Data.prescriptionLeft) {
          const leftVal = parseFloat(step2Data.prescriptionLeft);
          if (isNaN(leftVal)) {
            setError(t('parent_home.add_child_wizard.step2.validation.prescription_invalid'));
            setLoading(false);
            return;
          }
          prescriptionLeft = leftVal;
        }

        if (step2Data.prescriptionRight) {
          const rightVal = parseFloat(step2Data.prescriptionRight);
          if (isNaN(rightVal)) {
            setError(t('parent_home.add_child_wizard.step2.validation.prescription_invalid'));
            setLoading(false);
            return;
          }
          prescriptionRight = rightVal;
        }
      }

      const { data, error } = await supabase.rpc('create_child_profile', {
        p_family_id: familyId,
        p_name: step1Data.name.trim(),
        p_birth_date: step1Data.birthDate,
        p_gender: step1Data.gender || null,
        p_vision_condition: step2Data.visionCondition,
        p_wears_glasses: step2Data.wearsGlasses,
        p_prescription_left: prescriptionLeft,
        p_prescription_right: prescriptionRight,
        p_data_consent_at: new Date().toISOString(),
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating child:', err);
      setError(t('parent_home.add_child_wizard.errors.creation_failed'));
    } finally {
      setLoading(false);
    }
  };

  const renderGenderPicker = () => {
    const genderOptions = [
      { value: '', label: t('parent_home.add_child_wizard.step1.gender_placeholder') },
      { value: 'male', label: t('medical.gender.male') },
      { value: 'female', label: t('medical.gender.female') },
      { value: 'other', label: t('medical.gender.other') },
    ];

    return (
      <View style={styles.pickerContainer}>
        {genderOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              step1Data.gender === option.value && styles.pickerOptionSelected,
            ]}
            onPress={() => setStep1Data({ ...step1Data, gender: option.value })}
          >
            <Text
              style={[
                styles.pickerOptionText,
                step1Data.gender === option.value && styles.pickerOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderVisionConditionPicker = () => {
    const visionOptions = [
      { value: 'unknown', label: t('medical.vision_conditions.unknown') },
      { value: 'myopia', label: t('medical.vision_conditions.myopia') },
      { value: 'hyperopia', label: t('medical.vision_conditions.hyperopia') },
      { value: 'amblyopia', label: t('medical.vision_conditions.amblyopia') },
      { value: 'strabismus', label: t('medical.vision_conditions.strabismus') },
      { value: 'other', label: t('medical.vision_conditions.other') },
    ];

    return (
      <View style={styles.pickerContainer}>
        {visionOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              step2Data.visionCondition === option.value && styles.pickerOptionSelected,
            ]}
            onPress={() => setStep2Data({ ...step2Data, visionCondition: option.value })}
          >
            <Text
              style={[
                styles.pickerOptionText,
                step2Data.visionCondition === option.value &&
                  styles.pickerOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{t('parent_home.add_child_wizard.step1.title')}</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('parent_home.add_child_wizard.step1.name_label')}</Text>
        <TextInput
          style={styles.input}
          value={step1Data.name}
          onChangeText={(text) => setStep1Data({ ...step1Data, name: text })}
          placeholder={t('parent_home.add_child_wizard.step1.name_placeholder')}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {t('parent_home.add_child_wizard.step1.birth_date_label')}
        </Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={step1Data.birthDate ? styles.dateText : styles.datePlaceholder}>
            {step1Data.birthDate
              ? formatDateForDisplay(step1Data.birthDate)
              : t('parent_home.add_child_wizard.step1.birth_date_placeholder')}
          </Text>
          <Calendar size={20} color="#6B7280" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={step1Data.birthDate ? new Date(step1Data.birthDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}
        {Platform.OS === 'ios' && showDatePicker && (
          <TouchableOpacity
            style={styles.datePickerDoneButton}
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={styles.datePickerDoneText}>{t('common.done') || 'Done'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('parent_home.add_child_wizard.step1.gender_label')}</Text>
        {renderGenderPicker()}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, (!step1Data.name || !step1Data.birthDate) && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!step1Data.name || !step1Data.birthDate}
      >
        <Text style={styles.primaryButtonText}>
          {t('parent_home.add_child_wizard.step1.next_button')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{t('parent_home.add_child_wizard.step2.title')}</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {t('parent_home.add_child_wizard.step2.vision_section_title')}
        </Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {t('parent_home.add_child_wizard.step2.vision_condition_label')}
        </Text>
        {renderVisionConditionPicker()}
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>
            {t('parent_home.add_child_wizard.step2.wears_glasses_label')}
          </Text>
          <Switch
            value={step2Data.wearsGlasses}
            onValueChange={(value) => setStep2Data({ ...step2Data, wearsGlasses: value })}
            trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {step2Data.wearsGlasses && (
        <View style={styles.fieldGroup}>
          <Text style={styles.sectionTitle}>
            {t('parent_home.add_child_wizard.step2.prescription_section_title')}
          </Text>
          <View style={styles.prescriptionRow}>
            <View style={styles.prescriptionField}>
              <Text style={styles.label}>
                {t('parent_home.add_child_wizard.step2.prescription_left_label')}
              </Text>
              <TextInput
                style={styles.input}
                value={step2Data.prescriptionLeft}
                onChangeText={(text) =>
                  setStep2Data({ ...step2Data, prescriptionLeft: text })
                }
                placeholder={t('parent_home.add_child_wizard.step2.prescription_left_placeholder')}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.prescriptionField}>
              <Text style={styles.label}>
                {t('parent_home.add_child_wizard.step2.prescription_right_label')}
              </Text>
              <TextInput
                style={styles.input}
                value={step2Data.prescriptionRight}
                onChangeText={(text) =>
                  setStep2Data({ ...step2Data, prescriptionRight: text })
                }
                placeholder={t('parent_home.add_child_wizard.step2.prescription_right_placeholder')}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {t('parent_home.add_child_wizard.step2.consent_section_title')}
        </Text>
      </View>

      <View style={styles.consentRow}>
        <TouchableOpacity
          style={styles.checkboxTouchable}
          onPress={() => setStep2Data({ ...step2Data, consent: !step2Data.consent })}
        >
          <View style={[styles.checkbox, step2Data.consent && styles.checkboxChecked]}>
            {step2Data.consent && <View style={styles.checkboxInner} />}
          </View>
        </TouchableOpacity>
        <View style={styles.consentTextContainer}>
          <Text style={styles.consentText}>
            {t('parent_home.add_child_wizard.step2.consent_text')}{' '}
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={styles.linkText}>
              {t('parent_home.add_child_wizard.policy_modal.view_policy')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
          <Text style={styles.secondaryButtonText}>
            {t('parent_home.add_child_wizard.step2.back_button')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, styles.flexButton, !step2Data.consent && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading || !step2Data.consent}
        >
          <Text style={styles.primaryButtonText}>
            {loading
              ? t('common.loading')
              : t('parent_home.add_child_wizard.step2.create_button')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('parent_home.add_child_wizard.title')}</Text>
            <Text style={styles.stepIndicator}>
              {t('parent_home.add_child_wizard.step_indicator', {
                current: currentStep,
                total: 2,
              })}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {currentStep === 1 ? renderStep1() : renderStep2()}
        </View>
      </View>

    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  pickerContainer: {
    gap: 8,
  },
  pickerOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
  },
  pickerOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerOptionTextSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prescriptionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  prescriptionField: {
    flex: 1,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  checkboxTouchable: {
    padding: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  consentTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  consentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#6366F1',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  flexButton: {
    flex: 2,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  datePickerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  datePickerDoneButton: {
    backgroundColor: '#6366F1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  datePickerDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
