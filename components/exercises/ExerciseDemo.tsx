/**
 * Exercise Demo Component
 *
 * This is a working example showing how to use the exercise system
 * in your app screens. Copy this pattern to implement exercises anywhere.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getActiveExercises, type Exercise } from '@/lib/exercises';
import { ExerciseAnimationRenderer } from './ExerciseRegistry';

export default function ExerciseDemo() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const data = await getActiveExercises();
      setExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (selectedExercise) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedExercise(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.exerciseTitle}>{selectedExercise.title_en}</Text>
        </View>

        <View style={styles.animationContainer}>
          <ExerciseAnimationRenderer
            animationId={selectedExercise.animation_id}
            onComplete={() => console.log('Exercise complete!')}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Animation ID: {selectedExercise.animation_id}</Text>
          <Text style={styles.descriptionText}>{selectedExercise.description_en}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Exercises</Text>
      </View>

      <View style={styles.listContainer}>
        {exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={styles.exerciseCard}
            onPress={() => setSelectedExercise(exercise)}
          >
            <Text style={styles.cardTitle}>{exercise.title_en}</Text>
            <Text style={styles.cardSubtitle}>{exercise.title_he}</Text>
            <Text style={styles.cardAnimationId}>ID: {exercise.animation_id}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {exercises.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No exercises available</Text>
        </View>
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
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4A90E2',
  },
  listContainer: {
    padding: 16,
  },
  exerciseCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  cardAnimationId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  animationContainer: {
    flex: 1,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
