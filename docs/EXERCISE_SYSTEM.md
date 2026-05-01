# Exercise System Architecture

## Overview

The exercise system consists of two main parts:
1. **Exercise Warehouse** (Database) - Stores metadata about exercises
2. **Animation Components** (Code) - Renders the actual exercise animations

## Database Structure

Each exercise in the `exercises` table contains:

- `id` - Unique identifier
- `animation_id` - **Key field** that links to the animation component
- `icon_id` - Links to the icon component
- `audio_path_en` / `audio_path_he` - Paths to audio files in Storage
- `title_en` / `title_he` - Localized titles
- `description_en` / `description_he` - Localized descriptions
- `status` - 'active' or 'hidden'

## Animation Component Registry

The `ExerciseRegistry` (in `components/exercises/ExerciseRegistry.tsx`) maps `animation_id` values to React Native components.

### How It Works

1. **Fetch exercise from database:**
```typescript
import { getActiveExercises } from '@/lib/exercises';

const exercises = await getActiveExercises();
// Returns exercises with animation_id, titles, descriptions, etc.
```

2. **Render the animation component:**
```typescript
import { ExerciseAnimationRenderer } from '@/components/exercises/ExerciseRegistry';

// Use the animation_id to render the correct component
<ExerciseAnimationRenderer animationId={exercise.animation_id} />
```

3. **The registry looks up the component:**
```typescript
// In ExerciseRegistry.tsx
export const ExerciseRegistry: Record<string, React.ComponentType<any>> = {
  'palming_v1': PalmingAnimation,
  'ball_tracking_v1': BallTrackingAnimation,
  // Add more as created
};
```

## Current Status

### Implemented
- Database table with `palming_v1` exercise
- TypeScript types for type-safe access
- Service functions in `lib/exercises.ts`
- Component registry infrastructure
- Storage bucket for audio files

### Pending
- **React Native animation components** - The `palming_preview.tsx` file is web-specific code (uses `div`, `className`, CSS `style` tags) and won't work in React Native
- Audio file uploads to Storage
- Icon components

## Next Steps

### To Add New Exercises

1. **Create the React Native animation component:**
```typescript
// components/exercises/PalmingAnimation.tsx
import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

export default function PalmingAnimation() {
  // Use react-native-reanimated for animations
  // Use View, Animated.View instead of div
  // Use SVG from react-native-svg
  return <View>{/* Animation */}</View>;
}
```

2. **Register the component:**
```typescript
// In ExerciseRegistry.tsx
import PalmingAnimation from './PalmingAnimation';

export const ExerciseRegistry = {
  'palming_v1': PalmingAnimation,
};
```

3. **Add exercise to database:**
```typescript
import { createExercise } from '@/lib/exercises';

await createExercise({
  animation_id: 'palming_v1',
  icon_id: 'palming_icon_v1',
  title_en: 'Palming Exercise',
  title_he: 'תרגיל כפות ידיים',
  description_en: 'Description here',
  description_he: 'תיאור כאן',
  status: 'active',
});
```

## Web Preview vs Mobile Implementation

The `palming_preview.tsx` file is a **web preview** for visualization purposes. To use it in the React Native app, you need to:

1. Convert HTML elements to React Native components:
   - `div` → `View`
   - `className` → `style` (with StyleSheet)
   - CSS animations → `react-native-reanimated`
   - `<style>` tags → Animated.timing/spring/etc.

2. Use `react-native-svg` for SVG graphics
3. Use `react-native-reanimated` for smooth animations

## Architecture Benefits

- **Separation of Concerns**: Exercise metadata is separate from runtime config (timers, colors, categories will be in different tables)
- **Type Safety**: Full TypeScript support for database queries
- **Flexibility**: Can update exercise content without code changes
- **i18n Support**: Built-in bilingual support for Hebrew and English
- **Warehouse Management**: Soft delete with 'hidden' status
