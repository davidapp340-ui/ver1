import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Baby, UserCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('role_selection.title')}</Text>
        <Text style={styles.subtitle}>{t('role_selection.subtitle')}</Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.parentButton]}
            onPress={() => router.push('/parent-auth')}
          >
            <Users size={40} color="#FFFFFF" />
            <Text style={styles.buttonText}>{t('role_selection.parent_button')}</Text>
            <Text style={styles.buttonSubtext}>{t('role_selection.parent_subtitle')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.independentButton]}
            onPress={() => router.push('/independent-login')}
          >
            <UserCircle size={40} color="#FFFFFF" />
            <Text style={styles.buttonText}>{t('role_selection.independent_button')}</Text>
            <Text style={styles.buttonSubtext}>{t('role_selection.independent_subtitle')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.childButton]}
            onPress={() => router.push('/child-login')}
          >
            <Baby size={40} color="#FFFFFF" />
            <Text style={styles.buttonText}>{t('role_selection.child_button')}</Text>
            <Text style={styles.buttonSubtext}>{t('role_selection.child_subtitle')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
    paddingVertical: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0F766E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    color: '#6B7280',
    marginBottom: 48,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  button: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  parentButton: {
    backgroundColor: '#0F766E',
  },
  independentButton: {
    backgroundColor: '#0369A1',
  },
  childButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 4,
  },
});
