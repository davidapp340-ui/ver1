import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { HelpCircle, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type Article = Database['public']['Tables']['articles']['Row'];

export default function IndependentArticlesScreen() {
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
      setError(t('independent.articles.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleArticlePress = (articleId: string) => {
    router.push(`/(independent)/article/${articleId}`);
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
          <Text style={styles.headerTitle}>{t('independent.articles.title')}</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0369A1" />
          <Text style={styles.loadingText}>{t('independent.articles.loading')}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('independent.articles.title')}</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadArticles}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (articles.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('independent.articles.title')}</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{t('independent.articles.empty')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('independent.articles.title')}</Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.articlesContainer}>
          <TouchableOpacity
            style={styles.faqCard}
            onPress={() => router.push('/(independent)/faq')}
            activeOpacity={0.7}
          >
            <View style={styles.faqIconContainer}>
              <HelpCircle size={28} color="#0369A1" />
            </View>
            <View style={styles.faqTextContainer}>
              <Text style={styles.faqTitle}>
                {t('independent.articles.faq_card_title')}
              </Text>
              <Text style={styles.faqSubtitle}>
                {t('independent.articles.faq_card_subtitle')}
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
                <Text style={styles.articleSubtitle} numberOfLines={2}>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
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
    backgroundColor: '#0369A1',
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
  faqCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  faqIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqTextContainer: {
    flex: 1,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C4A6E',
    marginBottom: 2,
  },
  faqSubtitle: {
    fontSize: 13,
    color: '#0369A1',
    lineHeight: 18,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  articleImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  articleContent: {
    padding: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 24,
  },
  articleSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
