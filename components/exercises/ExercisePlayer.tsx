/**
 * ExercisePlayer Component
 *
 * This component demonstrates how to fetch an exercise from the database
 * and render its animation using the ExerciseRegistry.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { getExerciseById, getLocalizedExercise, type Exercise } from '@/lib/exercises';
import { ExerciseAnimationRenderer } from './ExerciseRegistry';
import { useTranslation } from 'react-i18next';

interface ExercisePlayerProps {
  exerciseId: string;
  onComplete?: () => void;
}

/**
 * Example component showing how to use the exercise system
 */
export default function ExercisePlayer({ exerciseId, onComplete }: ExercisePlayerProps) {
  const { i18n } = useTranslation();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  const loadExercise = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getExerciseById(exerciseId);

      if (!data) {
        setError('Exercise not found');
        return;
      }

      if (data.status !== 'active') {
        setError('This exercise is not currently available');
        return;
      }

      setExercise(data);
    } catch (err) {
      setError('Failed to load exercise');
      console.error('Error loading exercise:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading exercise...</Text>
      </View>
    );
  }

  if (error || !exercise) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Exercise not available'}</Text>
      </View>
    );
  }

  // Get localized content based on current language
  const locale = i18n.language === 'he' ? 'he' : 'en';
  const localizedContent = getLocalizedExercise(exercise, locale);

  return (
    <View style={styles.container}>
      {/* Exercise Title */}
      <View style={styles.header}>
        <Text style={styles.title}>{localizedContent.title}</Text>
        {localizedContent.description && (
          <Text style={styles.description}>{localizedContent.description}</Text>
        )}
      </View>

      {/* Animation Component */}
      <View style={styles.animationContainer}>
        <ExerciseAnimationRenderer
          animationId={exercise.animation_id}
          onComplete={onComplete}
        />
      </View>

      {/* Audio would be played here if audioUrl exists */}
      {localizedContent.audioUrl && (
        <Text style={styles.debugText}>
          Audio: {localizedContent.audioUrl}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  animationContainer: {
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    padding: 8,
    textAlign: 'center',
  },
});
