import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { HelpCircle, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type Article = Database['public']['Tables']['articles']['Row'];

export default function ScienceScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('articles')
        .select('id, created_at, image_url, category_he, category_en, title_he, title_en, subtitle_he, subtitle_en')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setArticles(data || []);
    } catch (err) {
      console.error('Error loading articles:', err);
      setError(t('science.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleArticlePress = (articleId: string) => {
    router.push(`/(parent)/article/${articleId}`);
  };

  const getLocalizedField = (article: Article, field: 'title' | 'subtitle' | 'category') => {
    const lang = i18n.language;
    const fieldName = `${field}_${lang === 'he' ? 'he' : 'en'}` as keyof Article;
    return article[fieldName] as string;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('science.title')}</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>{t('science.loading')}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('science.title')}</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadArticles}>
            <Text style={styles.retryButtonText}>{t('science.error')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (articles.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('science.title')}</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{t('science.empty')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('science.title')}</Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.articlesContainer}>
          <TouchableOpacity
            style={styles.faqCard}
            onPress={() => router.push('/(parent)/faq')}
            activeOpacity={0.7}
          >
            <View style={styles.faqIconContainer}>
              <HelpCircle size={28} color="#4F46E5" />
            </View>
            <View style={styles.faqTextContainer}>
              <Text style={styles.faqTitle}>
                {t('science.faq_card_title')}
              </Text>
              <Text style={styles.faqSubtitle}>
                {t('science.faq_card_subtitle')}
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {articles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => handleArticlePress(article.id)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: article.image_url }}
                style={styles.articleImage}
                resizeMode="cover"
              />
              <View style={styles.articleContent}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {getLocalizedField(article, 'category')}
                  </Text>
                </View>
                <Text style={styles.articleTitle}>
                  {getLocalizedField(article, 'title')}
                </Text>
                <Text style={styles.articleSubtitle}>
                  {getLocalizedField(article, 'subtitle')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  articlesContainer: {
    padding: 20,
    gap: 20,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  articleImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  articleContent: {
    padding: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  articleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 28,
  },
  articleSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  faqCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  faqIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqTextContainer: {
    flex: 1,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#312E81',
    marginBottom: 2,
  },
  faqSubtitle: {
    fontSize: 13,
    color: '#4F46E5',
    lineHeight: 18,
  },
});
