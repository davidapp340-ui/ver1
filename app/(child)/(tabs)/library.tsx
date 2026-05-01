import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getLibraryByCategories, type LibraryCategory, type LibraryItemWithExercise } from '@/lib/library';

export default function LibraryScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLibraryByCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load library:', err);
      setError('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleExercisePress = (item: LibraryItemWithExercise) => {
    router.push({
      pathname: '/exercise-player',
      params: {
        libraryItemId: item.id,
      },
    });
  };

  const getLocalizedTitle = (item: LibraryItemWithExercise) => {
    return i18n.language === 'he' ? item.exercise.title_he : item.exercise.title_en;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('child_navigation.library_screen.title')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('child_navigation.library_screen.title')}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLibrary}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('child_navigation.library_screen.title')}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No exercises available yet</Text>
          </View>
        ) : (
          categories.map((category) => (
            <View key={category.category_name} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.category_name}</Text>

              <View style={styles.exerciseGrid}>
                {category.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.exerciseCard,
                      { borderColor: category.category_color },
                    ]}
                    onPress={() => handleExercisePress(item)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.exerciseIconContainer,
                        { backgroundColor: category.category_color + '20' },
                      ]}
                    >
                      <Text style={styles.exerciseIcon}>🧘</Text>
                    </View>
                    <Text style={styles.exerciseName} numberOfLines={2}>
                      {getLocalizedTitle(item)}
                    </Text>
                    <View style={styles.exerciseMeta}>
                      {item.enable_audio && (
                        <Text style={styles.metaIcon}>🔊</Text>
                      )}
                      {item.enable_animation && (
                        <Text style={styles.metaIcon}>🎬</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    minWidth: 150,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIcon: {
    fontSize: 32,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    minHeight: 40,
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaIcon: {
    fontSize: 16,
  },
});
