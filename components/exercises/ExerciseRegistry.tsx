/**
 * Exercise Component Registry
 *
 * This file maps animation_id values from the database to their corresponding
 * React Native animation components. When fetching an exercise from the database,
 * use the animation_id to look up the correct component to render.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import PalmingExercise from './palming_exercise';
import Exercise02 from './Exercise02';
import Exercise03 from './Exercise03';
import Exercise04 from './Exercise04';
import Exercise05 from './Exercise05';
import Exercise06 from './Exercise06';
import Exercise07 from './Exercise07';
import Exercise08 from './Exercise08';
import Exercise09 from './Exercise09';
import Exercise10 from './Exercise10';
import Exercise11 from './Exercise11';
import Exercise12 from './Exercise12';
import Exercise13 from './Exercise13';
import Exercise14 from './Exercise14';
import Exercise15 from './Exercise15';
import Exercise16 from './Exercise16';
import Exercise17 from './Exercise17';
import Exercise18 from './Exercise18';
import Exercise19 from './Exercise19';
import Exercise20 from './Exercise20';
import Exercise21 from './Exercise21';
import Exercise22 from './Exercise22';
import Exercise23 from './Exercise23';
import Exercise24 from './Exercise24';
import Exercise25 from './Exercise25';
import Exercise26 from './Exercise26';
import Exercise27 from './Exercise27';
import Exercise28 from './Exercise28';
import Exercise29 from './Exercise29';
import Exercise30 from './Exercise30';

// Placeholder component for exercises not yet implemented
const PlaceholderExercise: React.FC<{ animationId: string }> = ({ animationId }) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>
      Exercise Animation: {animationId}
    </Text>
    <Text style={styles.placeholderSubtext}>
      Component not yet implemented
    </Text>
  </View>
);

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
  },
});

export const ExerciseRegistry: Record<string, React.ComponentType<any>> = {
  'palming_v1': PalmingExercise,
  'ex_02': Exercise02,
  'ex_03': Exercise03,
  'ex_04': Exercise04,
  'ex_05': Exercise05,
  'ex_06': Exercise06,
  'ex_07': Exercise07,
  'ex_08': Exercise08,
  'ex_09': Exercise09,
  'ex_10': Exercise10,
  'ex_11': Exercise11,
  'ex_12': Exercise12,
  'ex_13': Exercise13,
  'ex_14': Exercise14,
  'ex_15': Exercise15,
  'ex_16': Exercise16,
  'ex_17': Exercise17,
  'ex_18': Exercise18,
  'ex_19': Exercise19,
  'ex_20': Exercise20,
  'ex_21': Exercise21,
  'ex_22': Exercise22,
  'ex_23': Exercise23,
  'ex_24': Exercise24,
  'ex_25': Exercise25,
  'ex_26': Exercise26,
  'ex_27': Exercise27,
  'ex_28': Exercise28,
  'ex_29': Exercise29,
  'ex_30': Exercise30,
};

/**
 * Get the animation component for a given animation_id
 */
export function getExerciseComponent(animationId: string): React.ComponentType<any> {
  const Component = ExerciseRegistry[animationId];

  if (!Component) {
    return (props: any) => <PlaceholderExercise animationId={animationId} {...props} />;
  }

  return Component;
}

/**
 * Component that renders an exercise by animation_id
 */
export const ExerciseAnimationRenderer: React.FC<{
  animationId: string;
  [key: string]: any;
}> = ({ animationId, ...props }) => {
  const Component = getExerciseComponent(animationId);
  return <Component {...props} />;
};
