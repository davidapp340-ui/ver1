import { View, Text, TouchableOpacity, StyleSheet, ScrollView, I18nManager, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChildSession } from '@/contexts/ChildSessionContext';
import { Globe, LogOut, MessageCircle, Globe2, Eye, Glasses } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import NotificationSettings from '@/components/NotificationSettings';

export default function IndependentSettingsScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { child } = useChildSession();
  const { t, i18n } = useTranslation();

  const getInitials = (firstName: string, lastName: string): string => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || 'U';
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    await i18n.changeLanguage(newLang);
    I18nManager.forceRTL(newLang === 'he');
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/role-selection');
  };

  const handleWhatsAppSupport = () => {
    const phoneNumber = '972501234567';
    const message = 'Hi, I need help with Zoomi Fitness';
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(t('common.error'), t('settings.errors.whatsapp_not_installed'));
    });
  };

  const handleVisitWebsite = () => {
    Linking.openURL('https://zoomi.fitness').catch(() => {
      Alert.alert(t('common.error'), t('settings.errors.website_failed'));
    });
  };

  const getVisionLabel = (condition: string | null | undefined) => {
    if (!condition) return t('medical.vision_conditions.unknown');
    const key = `medical.vision_conditions.${condition}`;
    return t(key, { defaultValue: condition });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {getInitials(profile?.first_name || '', profile?.last_name || '')}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.first_name} {profile?.last_name}
              </Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
            </View>
          </View>
        </View>

        {child && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('independent.settings.vision_info')}</Text>
            <View style={styles.settingCard}>
              <View style={styles.visionRow}>
                <View style={styles.settingInfo}>
                  <Eye size={22} color="#0369A1" />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>{t('independent.settings.vision_condition')}</Text>
                    <Text style={styles.settingDescription}>
                      {getVisionLabel(child.vision_condition)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.visionRow}>
                <View style={styles.settingInfo}>
                  <Glasses size={22} color="#0369A1" />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>{t('independent.settings.glasses')}</Text>
                    <Text style={styles.settingDescription}>
                      {child.wears_glasses
                        ? t('independent.settings.glasses_yes')
                        : t('independent.settings.glasses_no')}
                    </Text>
                  </View>
                </View>
              </View>

              {child.wears_glasses && (child.current_prescription_left || child.current_prescription_right) && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.prescriptionRow}>
                    {child.current_prescription_left !== null && (
                      <View style={styles.prescriptionItem}>
                        <Text style={styles.prescriptionLabel}>
                          {t('independent.settings.prescription_left')}
                        </Text>
                        <Text style={styles.prescriptionValue}>
                          {child.current_prescription_left}
                        </Text>
                      </View>
                    )}
                    {child.current_prescription_right !== null && (
                      <View style={styles.prescriptionItem}>
                        <Text style={styles.prescriptionLabel}>
                          {t('independent.settings.prescription_right')}
                        </Text>
                        <Text style={styles.prescriptionValue}>
                          {child.current_prescription_right}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('independent.settings.general_section')}</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Globe size={22} color="#0369A1" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>{t('settings.language.title')}</Text>
                  <Text style={styles.settingDescription}>
                    {i18n.language === 'he'
                      ? t('settings.language.current_hebrew')
                      : t('settings.language.current_english')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.languageToggleButton} onPress={toggleLanguage}>
                <Text style={styles.languageToggleButtonText}>
                  {i18n.language === 'he' ? 'EN' : 'HE'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('notifications.section_title')}</Text>
            <NotificationSettings
              profileId={profile.id}
              initialToken={profile.expo_push_token}
              initialReminderTime={profile.daily_reminder_time}
              accentColor="#0369A1"
              accentBg="#E0F2FE"
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('independent.settings.support_section')}</Text>
          <View style={styles.settingCard}>
            <TouchableOpacity style={styles.settingRow} onPress={handleWhatsAppSupport}>
              <View style={styles.settingInfo}>
                <MessageCircle size={22} color="#10B981" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>{t('settings.support.whatsapp_title')}</Text>
                  <Text style={styles.settingDescription}>{t('settings.support.whatsapp_description')}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow} onPress={handleVisitWebsite}>
              <View style={styles.settingInfo}>
                <Globe2 size={22} color="#3B82F6" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>{t('settings.support.website_title')}</Text>
                  <Text style={styles.settingDescription}>{t('settings.support.website_description')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={22} color="#FFFFFF" />
            <Text style={styles.signOutButtonText}>{t('independent.settings.sign_out')}</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>{t('independent.settings.version')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0369A1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  visionRow: {
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
  languageToggleButton: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  languageToggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
  },
  prescriptionRow: {
    flexDirection: 'row',
    gap: 24,
    paddingVertical: 8,
    paddingLeft: 34,
  },
  prescriptionItem: {
    flex: 1,
  },
  prescriptionLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  prescriptionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
