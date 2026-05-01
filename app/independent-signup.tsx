import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useChildSession } from '@/contexts/ChildSessionContext';
import { TERMS_OF_SERVICE_URL, PRIVACY_POLICY_URL } from '@/lib/legal';

interface Step1Data {
  email: string;
  password: string;
  confirmPassword: string;
}

interface Step2Data {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  visionCondition: string;
  wearsGlasses: boolean;
  prescriptionLeft: string;
  prescriptionRight: string;
}

interface Step3Data {
  consent: boolean;
}

export default function IndependentSignupScreen() {
  const router = useRouter();
  const { signUpIndependent } = useAuth();
  const { child, isIndependent } = useChildSession();
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (signupComplete && isIndependent && child) {
      router.replace('/(independent)/home');
    }
  }, [signupComplete, isIndependent, child]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [step1Data, setStep1Data] = useState<Step1Data>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [step2Data, setStep2Data] = useState<Step2Data>({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    visionCondition: 'unknown',
    wearsGlasses: false,
    prescriptionLeft: '',
    prescriptionRight: '',
  });

  const [step3Data, setStep3Data] = useState<Step3Data>({
    consent: false,
  });

  const validateStep1 = (): boolean => {
    if (!step1Data.email.trim()) {
      setError(t('independent_signup.validation.email_required'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(step1Data.email.trim())) {
      setError(t('independent_signup.validation.email_invalid'));
      return false;
    }
    if (!step1Data.password) {
      setError(t('independent_signup.validation.password_required'));
      return false;
    }
    if (step1Data.password.length < 6) {
      setError(t('independent_signup.validation.password_too_short'));
      return false;
    }
    if (step1Data.password !== step1Data.confirmPassword) {
      setError(t('independent_signup.validation.passwords_not_match'));
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!step2Data.firstName.trim()) {
      setError(t('independent_signup.validation.first_name_required'));
      return false;
    }
    if (!step2Data.birthDate) {
      setError(t('independent_signup.validation.birth_date_required'));
      return false;
    }
    const birthDate = new Date(step2Data.birthDate);
    if (birthDate > new Date()) {
      setError(t('independent_signup.validation.birth_date_future'));
      return false;
    }
    if (step2Data.wearsGlasses) {
      if (step2Data.prescriptionLeft) {
        const val = parseFloat(step2Data.prescriptionLeft);
        if (isNaN(val) || val < -20 || val > 20) {
          setError(t('independent_signup.validation.prescription_invalid'));
          return false;
        }
      }
      if (step2Data.prescriptionRight) {
        const val = parseFloat(step2Data.prescriptionRight);
        if (isNaN(val) || val < -20 || val > 20) {
          setError(t('independent_signup.validation.prescription_invalid'));
          return false;
        }
      }
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!step3Data.consent) {
      setError(t('independent_signup.validation.consent_required'));
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setStep2Data({ ...step2Data, birthDate: formattedDate });
    }
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSubmit = async () => {
    setError('');
    if (!validateStep3()) return;

    setLoading(true);
    try {
      let prescriptionLeft: number | null = null;
      let prescriptionRight: number | null = null;

      if (step2Data.wearsGlasses) {
        if (step2Data.prescriptionLeft) {
          prescriptionLeft = parseFloat(step2Data.prescriptionLeft);
        }
        if (step2Data.prescriptionRight) {
          prescriptionRight = parseFloat(step2Data.prescriptionRight);
        }
      }

      const { error: authError } = await signUpIndependent({
        email: step1Data.email.trim(),
        password: step1Data.password,
        firstName: step2Data.firstName.trim(),
        lastName: step2Data.lastName.trim(),
        birthDate: step2Data.birthDate,
        gender: step2Data.gender,
        visionCondition: step2Data.visionCondition,
        wearsGlasses: step2Data.wearsGlasses,
        prescriptionLeft,
        prescriptionRight,
      });

      if (authError) {
        setError(authError.message || t('independent_signup.errors.registration_failed'));
        setLoading(false);
      } else {
        setSignupComplete(true);
      }
    } catch (err) {
      setError(t('independent_signup.errors.registration_failed'));
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
              step2Data.gender === option.value && styles.pickerOptionSelected,
            ]}
            onPress={() => setStep2Data({ ...step2Data, gender: option.value })}
          >
            <Text
              style={[
                styles.pickerOptionText,
                step2Data.gender === option.value && styles.pickerOptionTextSelected,
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
                step2Data.visionCondition === option.value && styles.pickerOptionTextSelected,
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
      <Text style={styles.stepTitle}>{t('independent_signup.step1.title')}</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('independent_signup.step1.email_label')}</Text>
        <TextInput
          style={styles.input}
          value={step1Data.email}
          onChangeText={(text) => setStep1Data({ ...step1Data, email: text })}
          placeholder={t('independent_signup.step1.email_placeholder')}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('independent_signup.step1.password_label')}</Text>
        <TextInput
          style={styles.input}
          value={step1Data.password}
          onChangeText={(text) => setStep1Data({ ...step1Data, password: text })}
          placeholder={t('independent_signup.step1.password_placeholder')}
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('independent_signup.step1.confirm_password_label')}</Text>
        <TextInput
          style={styles.input}
          value={step1Data.confirmPassword}
          onChangeText={(text) => setStep1Data({ ...step1Data, confirmPassword: text })}
          placeholder={t('independent_signup.step1.confirm_password_placeholder')}
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!step1Data.email || !step1Data.password || !step1Data.confirmPassword) && styles.buttonDisabled,
        ]}
        onPress={handleNext}
        disabled={!step1Data.email || !step1Data.password || !step1Data.confirmPassword}
      >
        <Text style={styles.primaryButtonText}>{t('independent_signup.step1.next_button')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => router.replace('/independent-login')}
      >
        <Text style={styles.toggleButtonText}>
          {t('independent_signup.step1.toggle_to_login')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{t('independent_signup.step2.title')}</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('independent_signup.step2.name_section_title')}</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('independent_signup.step2.first_name_label')}</Text>
        <TextInput
          style={styles.input}
          value={step2Data.firstName}
          onChangeText={(text) => setStep2Data({ ...step2Data, firstName: text })}
          placeholder={t('independent_signup.step2.first_name_placeholder')}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('independent_signup.step2.last_name_label')}</Text>
        <TextInput
          style={styles.input}
          value={step2Data.lastName}
          onChangeText={(text) => setStep2Data({ ...step2Data, lastName: text })}
          placeholder={t('independent_signup.step2.last_name_placeholder')}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('independent_signup.step2.birth_date_label')}</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={step2Data.birthDate ? styles.dateText : styles.datePlaceholder}>
            {step2Data.birthDate
              ? formatDateForDisplay(step2Data.birthDate)
              : t('independent_signup.step2.birth_date_placeholder')}
          </Text>
          <Calendar size={20} color="#6B7280" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={step2Data.birthDate ? new Date(step2Data.birthDate) : new Date()}
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
            <Text style={styles.datePickerDoneText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('independent_signup.step2.gender_label')}</Text>
        {renderGenderPicker()}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('independent_signup.step2.vision_section_title')}</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('independent_signup.step2.vision_condition_label')}</Text>
        {renderVisionConditionPicker()}
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>{t('independent_signup.step2.wears_glasses_label')}</Text>
          <Switch
            value={step2Data.wearsGlasses}
            onValueChange={(value) => setStep2Data({ ...step2Data, wearsGlasses: value })}
            trackColor={{ false: '#D1D5DB', true: '#0369A1' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {step2Data.wearsGlasses && (
        <View style={styles.fieldGroup}>
          <Text style={styles.sectionTitle}>
            {t('independent_signup.step2.prescription_section_title')}
          </Text>
          <View style={styles.prescriptionRow}>
            <View style={styles.prescriptionField}>
              <Text style={styles.label}>
                {t('independent_signup.step2.prescription_left_label')}
              </Text>
              <TextInput
                style={styles.input}
                value={step2Data.prescriptionLeft}
                onChangeText={(text) => setStep2Data({ ...step2Data, prescriptionLeft: text })}
                placeholder={t('independent_signup.step2.prescription_left_placeholder')}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.prescriptionField}>
              <Text style={styles.label}>
                {t('independent_signup.step2.prescription_right_label')}
              </Text>
              <TextInput
                style={styles.input}
                value={step2Data.prescriptionRight}
                onChangeText={(text) => setStep2Data({ ...step2Data, prescriptionRight: text })}
                placeholder={t('independent_signup.step2.prescription_right_placeholder')}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
          <Text style={styles.secondaryButtonText}>{t('independent_signup.step2.back_button')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, styles.flexButton, !step2Data.firstName && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!step2Data.firstName}
        >
          <Text style={styles.primaryButtonText}>{t('independent_signup.step2.next_button')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{t('independent_signup.step3.title')}</Text>

      <View style={styles.consentRow}>
        <TouchableOpacity
          style={styles.checkboxTouchable}
          onPress={() => setStep3Data({ ...step3Data, consent: !step3Data.consent })}
        >
          <View style={[styles.checkbox, step3Data.consent && styles.checkboxChecked]}>
            {step3Data.consent && <View style={styles.checkboxInner} />}
          </View>
        </TouchableOpacity>
        <View style={styles.consentTextContainer}>
          <Text style={styles.consentText}>{t('independent_signup.step3.consent_text')} </Text>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>
            <Text style={styles.linkText}>{t('independent_signup.step3.terms_link')}</Text>
          </TouchableOpacity>
          <Text style={styles.consentText}> {t('independent_signup.step3.and')} </Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={styles.linkText}>{t('independent_signup.step3.privacy_link')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
          <Text style={styles.secondaryButtonText}>{t('independent_signup.step3.back_button')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, styles.flexButton, (!step3Data.consent || loading) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !step3Data.consent}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>{t('independent_signup.step3.create_button')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (currentStep === 1 ? router.back() : handleBack())}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#0369A1" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{t('independent_signup.title')}</Text>
          <Text style={styles.stepIndicator}>
            {t('independent_signup.step_indicator', { current: currentStep, total: 3 })}
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
      </View>

      <View style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
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
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0369A1',
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
    backgroundColor: '#E0F2FE',
    borderColor: '#0369A1',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerOptionTextSelected: {
    color: '#0369A1',
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
    backgroundColor: '#0369A1',
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
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
    marginTop: 8,
  },
  checkboxTouchable: {
    padding: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0369A1',
    borderColor: '#0369A1',
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
    lineHeight: 22,
  },
  linkText: {
    fontSize: 14,
    color: '#0369A1',
    textDecorationLine: 'underline',
    fontWeight: '600',
    lineHeight: 22,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#0369A1',
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
  toggleButton: {
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#0369A1',
    fontSize: 14,
    fontWeight: '500',
  },
});
