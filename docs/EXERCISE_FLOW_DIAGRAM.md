# Exercise System Flow Diagram

## Complete Data Flow: Database → Component

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                 │
│  Table: exercises                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ id: fc51f0b7-d912-4ae9-b12c-f50b8c4fc932                 │  │
│  │ animation_id: "palming_v1"  ◄─── KEY LINKING FIELD       │  │
│  │ icon_id: "ball_icon_v1"                                   │  │
│  │ title_en: "Palming Exercise"                              │  │
│  │ title_he: "תרגיל כפות ידיים"                             │  │
│  │ description_en: "Rub your hands..."                       │  │
│  │ description_he: "שפשפו את כפות..."                        │  │
│  │ audio_path_en: "exercise-audio/palming_en.mp3"           │  │
│  │ audio_path_he: "exercise-audio/palming_he.mp3"           │  │
│  │ status: "active"                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Query via Supabase
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                                 │
│  File: lib/exercises.ts                                          │
│                                                                   │
│  const exercise = await getExerciseById(id);                    │
│  // Returns typed Exercise object with animation_id             │
│                                                                   │
│  const localized = getLocalizedExercise(exercise, 'en');       │
│  // Returns: { title, description, audioUrl }                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Pass exercise.animation_id
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   COMPONENT REGISTRY                             │
│  File: components/exercises/ExerciseRegistry.tsx                 │
│                                                                   │
│  ExerciseRegistry = {                                           │
│    "palming_v1": PalmingAnimationComponent,  ◄─── MAPPED HERE   │
│    "ball_tracking_v1": BallTrackingComponent,                   │
│    // ... more exercises                                         │
│  }                                                               │
│                                                                   │
│  function getExerciseComponent(animationId: string) {           │
│    return ExerciseRegistry[animationId] || PlaceholderComponent;│
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Returns Component
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RENDERER                                      │
│  <ExerciseAnimationRenderer animationId="palming_v1" />         │
│                                                                   │
│  Renders the actual animation component                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Displays
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ANIMATION COMPONENT                             │
│  File: components/exercises/PalmingAnimation.tsx (TO BE CREATED)│
│                                                                   │
│  function PalmingAnimation() {                                  │
│    // Animated hands rubbing and covering eyes                  │
│    return <View>...</View>                                      │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Usage Example

```typescript
// 1. Fetch exercise from database
import { getExerciseById } from '@/lib/exercises';
const exercise = await getExerciseById('fc51f0b7-...');

// exercise.animation_id === "palming_v1"

// 2. Render animation using animation_id
import { ExerciseAnimationRenderer } from '@/components/exercises/ExerciseRegistry';

<ExerciseAnimationRenderer
  animationId={exercise.animation_id}
  onComplete={() => console.log('Done!')}
/>
```

## Key Linking Mechanism

The `animation_id` field is the **bridge** between database and code:

1. **Database stores**: `animation_id: "palming_v1"` (string)
2. **Registry maps**: `"palming_v1"` → `PalmingAnimationComponent` (React component)
3. **Renderer uses**: The animation_id to look up and render the correct component

## Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Table | ✅ Complete | exercises table with palming_v1 record |
| TypeScript Types | ✅ Complete | Full type safety in database.types.ts |
| Service Layer | ✅ Complete | lib/exercises.ts with all CRUD functions |
| Component Registry | ✅ Complete | Maps animation_id to components |
| Renderer Component | ✅ Complete | ExerciseAnimationRenderer ready to use |
| Palming Animation (RN) | ✅ Complete | components/exercises/palming_exercise.ts |
| Animation Registered | ✅ Complete | 'palming_v1' → PalmingExercise |
| Web Preview | ✅ Provided | palming_preview.tsx (reference only) |

## ✅ SYSTEM FULLY OPERATIONAL

The complete end-to-end flow is now operational:

```typescript
// 1. Fetch from database
const exercise = await getExerciseById('fc51f0b7-...');
// Returns: { animation_id: 'palming_v1', title_en: 'Palming Exercise', ... }

// 2. Render animation
<ExerciseAnimationRenderer animationId={exercise.animation_id} />
// Automatically renders PalmingExercise component with smooth animations

// 3. Animation plays
// 0-3s: Hand rubbing vibration
// 3-5s: Hands move to eyes
// 5-10s: Palming with breathing
```

## Ready for Production

The palming exercise is now:
- ✅ Stored in database with full metadata
- ✅ Linked via animation_id field
- ✅ Registered in component system
- ✅ Animated with react-native-reanimated
- ✅ Ready to render in any screen

To add more exercises, simply:
1. Create the animation component
2. Register it in ExerciseRegistry
3. Add database record with matching animation_id
