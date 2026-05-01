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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type Article = Database['public']['Tables']['articles']['Row'];

export default function IndependentArticleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadArticle(id);
    }
  }, [id]);

  const loadArticle = async (articleId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError(t('science.article_detail.error'));
        return;
      }

      setArticle(data);
    } catch (err) {
      console.error('Error loading article:', err);
      setError(t('science.article_detail.error'));
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedField = (field: 'title' | 'category' | 'content') => {
    if (!article) return '';
    const lang = i18n.language;
    const fieldName = `${field}_${lang === 'he' ? 'he' : 'en'}` as keyof Article;
    return article[fieldName] as string;
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0369A1" />
          <Text style={styles.loadingText}>{t('science.article_detail.loading')}</Text>
        </View>
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error || t('science.article_detail.error')}</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={20} color="#FFFFFF" />
            <Text style={styles.backButtonText}>{t('science.article_detail.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: article.image_url }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <TouchableOpacity style={styles.backButtonOverlay} onPress={handleBack}>
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <View style={styles.categoryBadgeOverlay}>
                <Text style={styles.categoryTextOverlay}>
                  {getLocalizedField('category')}
                </Text>
              </View>
              <Text style={styles.headerTitle}>{getLocalizedField('title')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Markdown style={markdownStyles}>
            {getLocalizedField('content')}
          </Markdown>
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
  backButton: {
    backgroundColor: '#0369A1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 360,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButtonOverlay: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    paddingBottom: 20,
  },
  categoryBadgeOverlay: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(3, 105, 161, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  categoryTextOverlay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 34,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 32,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  heading1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 36,
  },
  heading2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
    lineHeight: 32,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 10,
    lineHeight: 28,
  },
  paragraph: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  strong: {
    fontWeight: 'bold',
    color: '#111827',
  },
  em: {
    fontStyle: 'italic',
  },
  link: {
    color: '#0369A1',
    textDecorationLine: 'underline',
  },
  list_item: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 8,
  },
  bullet_list: {
    marginBottom: 16,
  },
  ordered_list: {
    marginBottom: 16,
  },
  blockquote: {
    backgroundColor: '#F3F4F6',
    borderLeftWidth: 4,
    borderLeftColor: '#0369A1',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 16,
  },
});
