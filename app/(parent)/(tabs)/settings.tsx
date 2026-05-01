import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, I18nManager, Alert, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, LogOut, Settings as SettingsIcon, MessageCircle, Globe2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import NotificationSettings from '@/components/NotificationSettings';

type Child = Database['public']['Tables']['children']['Row'];

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      loadChildren();
    }
  }, [profile]);

  const loadChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('family_id', profile?.family_id!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string): string => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  const getChildInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`;
    }
    return name.charAt(0).toUpperCase();
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

  const handleChildActions = (child: Child) => {
    const isActive = child.subscription_status === 'active';

    Alert.alert(
      t('settings.manage_child.title', { childName: child.name }),
      t('settings.manage_child.message'),
      [
        {
          text: isActive ? t('settings.manage_child.freeze_subscription') : t('settings.manage_child.activate_subscription'),
          onPress: () => handleToggleSubscription(child),
        },
        {
          text: t('settings.manage_child.delete_profile'),
          style: 'destructive',
          onPress: () => handleDeleteConfirmation(child),
        },
        {
          text: t('settings.manage_child.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const handleToggleSubscription = async (child: Child) => {
    const newStatus = child.subscription_status === 'active' ? 'inactive' : 'active';
    setActionLoading(child.id);

    try {
      const { error } = await supabase
        .from('children')
        .update({ subscription_status: newStatus })
        .eq('id', child.id);

      if (error) throw error;

      setChildren(prevChildren =>
        prevChildren.map(c =>
          c.id === child.id ? { ...c, subscription_status: newStatus } : c
        )
      );

      const messageKey = newStatus === 'active'
        ? 'settings.toggle_subscription.success_message_activated'
        : 'settings.toggle_subscription.success_message_frozen';

      Alert.alert(
        t('settings.toggle_subscription.success_title'),
        t(messageKey, { childName: child.name })
      );
    } catch (error) {
      console.error('Error toggling subscription:', error);
      Alert.alert(
        t('settings.toggle_subscription.error_title'),
        t('settings.toggle_subscription.error_message')
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConfirmation = (child: Child) => {
    Alert.alert(
      t('settings.delete_child.confirm_title'),
      t('settings.delete_child.confirm_message', { childName: child.name }),
      [
        {
          text: t('settings.delete_child.cancel_button'),
          style: 'cancel',
        },
        {
          text: t('settings.delete_child.confirm_button'),
          style: 'destructive',
          onPress: () => handleDeleteChild(child),
        },
      ]
    );
  };

  const handleDeleteChild = async (child: Child) => {
    setActionLoading(child.id);

    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', child.id);

      if (error) throw error;

      setChildren(prevChildren => prevChildren.filter(c => c.id !== child.id));
      Alert.alert(
        t('settings.delete_child.success_title'),
        t('settings.delete_child.success_message', { childName: child.name })
      );
    } catch (error) {
      console.error('Error deleting child:', error);
      Alert.alert(
        t('settings.delete_child.error_title'),
        t('settings.delete_child.error_message')
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleWhatsAppSupport = () => {
    const phoneNumber = '972501234567';
    const message = 'Hi, I need help with Zoomi Fitness';
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        t('settings.toggle_subscription.error_title'),
        t('settings.errors.whatsapp_not_installed')
      );
    });
  };

  const handleVisitWebsite = () => {
    const websiteUrl = 'https://zoomi.fitness';
    Linking.openURL(websiteUrl).catch(() => {
      Alert.alert(
        t('settings.toggle_subscription.error_title'),
        t('settings.errors.website_failed')
      );
    });
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.sections.family_management')}</Text>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          ) : children.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t('settings.family.empty_title')}</Text>
              <Text style={styles.emptySubtext}>{t('settings.family.empty_subtitle')}</Text>
            </View>
          ) : (
            <View style={styles.settingCard}>
              {children.map((child, index) => (
                <View key={child.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.childRow}>
                    <View style={styles.childInfo}>
                      <View style={styles.childAvatar}>
                        <Text style={styles.childAvatarText}>
                          {getChildInitials(child.name)}
                        </Text>
                      </View>
                      <View style={styles.childDetails}>
                        <Text style={styles.childName}>{child.name}</Text>
                        <View style={styles.statusBadge}>
                          <View
                            style={[
                              styles.statusDot,
                              child.subscription_status === 'active'
                                ? styles.statusDotActive
                                : styles.statusDotInactive,
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusText,
                              child.subscription_status === 'active'
                                ? styles.statusTextActive
                                : styles.statusTextInactive,
                            ]}
                          >
                            {child.subscription_status === 'active'
                              ? t('settings.family.status_active')
                              : t('settings.family.status_frozen')}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.manageButton}
                      onPress={() => handleChildActions(child)}
                      disabled={actionLoading === child.id}
                    >
                      {actionLoading === child.id ? (
                        <ActivityIndicator size="small" color="#4F46E5" />
                      ) : (
                        <SettingsIcon size={20} color="#4F46E5" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.sections.general_settings')}</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Globe size={24} color="#4F46E5" />
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
              accentColor="#4F46E5"
              accentBg="#EEF2FF"
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.sections.support_info')}</Text>

          <View style={styles.settingCard}>
            <TouchableOpacity style={styles.settingRow} onPress={handleWhatsAppSupport}>
              <View style={styles.settingInfo}>
                <MessageCircle size={24} color="#10B981" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>{t('settings.support.whatsapp_title')}</Text>
                  <Text style={styles.settingDescription}>{t('settings.support.whatsapp_description')}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow} onPress={handleVisitWebsite}>
              <View style={styles.settingInfo}>
                <Globe2 size={24} color="#3B82F6" />
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
            <LogOut size={24} color="#FFFFFF" />
            <Text style={styles.signOutButtonText}>{t('settings.footer.sign_out')}</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>{t('settings.footer.version')}</Text>
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
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
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  languageToggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  childRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  childDetails: {
    flex: 1,
    gap: 4,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusDotInactive: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#10B981',
  },
  statusTextInactive: {
    color: '#EF4444',
  },
  manageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
