# AudioStudio - Refactored Architecture

The AudioStudio component has been refactored into a modular, maintainable structure. This document explains the new architecture and how the pieces fit together.

## Directory Structure

```
AudioStudio/
├── index.tsx                    # Main component - orchestrates everything
├── types.ts                     # Shared TypeScript types and constants
├── utils.ts                     # Utility functions
├── components/                  # UI Components
│   ├── AudioRoutineItem.tsx       # Individual audio routine renderer
│   ├── ControlBar.tsx          # Control buttons (play, split, merge, etc.)
│   ├── DisplayArea.tsx         # Main display with transcript overlay
│   └── Track.tsx            # Track with routines and time markers
└── hooks/                       # Custom React hooks
    ├── useAudioRoutines.ts        # Audio routines state management
    ├── useVoiceCommands.ts     # Speech recognition & Groq integration
    └── useWakeWordDetection.ts # Wake word detection logic
```

## Architecture Overview

### 1. **Main Component** (`index.tsx`)

- **Role**: Orchestrator
- **Responsibilities**:
  - Manages audio player state
  - Coordinates between hooks
  - Handles scroll and track interactions
  - Renders UI components
- **Size**: ~230 lines (down from 974!)

### 2. **Custom Hooks**

#### `useAudioRoutines(duration)`

- Manages the array of audio routines
- Handles split, merge, and selection operations
- Returns: `routines`, `toggleRoutineSelection`, `handleSplit`, `handleMerge`, `selectRoutinesByIndices`

#### `useWakeWordDetection(enabled, audioSource)`

- Manages wake word detection using ExecutorchModule
- Handles audio recording and ML model inference
- Returns: `wakeTriggerAt`, `startWakeWordRecorder`, `stopWakeWordRecorder`

#### `useVoiceCommands({ player, onAudioAction, ... })`

- Integrates speech recognition with Groq SDK
- Manages audio ducking during recognition
- Parses voice commands and triggers actions
- Returns: `recognizing`, `transcript`, `startSpeechRecognition`

### 3. **UI Components**

#### `DisplayArea`

- Shows main content area
- Displays transcript overlay when listening

#### `ControlBar`

- Renders control buttons
- Props-based, fully controlled component

#### `Track`

- Scrollable track view
- Renders time markers and audio routines
- Handles scroll events

#### `AudioRoutineItem`

- Individual audio routine visualization
- Shows routine ID number
- Handles selection

### 4. **Shared Code**

#### `types.ts`

- `AudioRoutine`: Interface for audio routines
- `AudioPlayerAction`: Groq response type
- Constants: `DUCKING_VOLUME`, `PIXELS_PER_SECOND`

#### `utils.ts`

- `formatTime()`: Convert seconds to MM:SS
- `mapUserIdsToIndices()`: Convert 1-based user IDs to 0-based array indices
- `mergeConsecutiveRoutines()`: Combine consecutive audio routines into continuous routines to eliminate playback glitches
- `addPaddingToMergedRoutines()`: Add padding only before the first routine and after the last routine for smoother transitions and context

## Key Improvements

### ✅ **Modularity**

- Each file has a single, clear responsibility
- Easy to locate and modify specific features

### ✅ **Reusability**

- Hooks can be used in other components
- UI components are prop-based and portable

### ✅ **Testability**

- Pure functions in `utils.ts` are easy to unit test
- Hooks can be tested independently
- Components can be tested in isolation

### ✅ **Maintainability**

- Smaller files are easier to understand
- Clear separation of concerns
- Well-documented structure

### ✅ **Type Safety**

- Centralized types prevent inconsistencies
- Props are fully typed

### ✅ **Smooth Playback**

- Consecutive audio routines are automatically merged during playback
- Eliminates glitches at transitions between consecutive routines
- Only seeks when jumping to non-consecutive routines
- Adds padding (2 seconds) before the first routine and after the last routine only for smoother transitions and context

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     AudioStudio (Main)                       │
│  - Audio player state                                        │
│  - Track scroll state                                     │
└────────┬────────────────────────────────┬───────────────────┘
         │                                 │
         ├─────────────────┐              ├──────────────┐
         │                 │              │              │
    ┌────▼─────┐    ┌─────▼──────┐  ┌───▼──────┐  ┌───▼──────┐
    │ useAudio │    │ useWakeWord│  │useVoice  │  │   UI     │
    │  Routines   │    │ Detection  │  │Commands  │  │Components│
    └────┬─────┘    └─────┬──────┘  └───┬──────┘  └───┬──────┘
         │                 │              │             │
         └─────────────────┴──────────────┴─────────────┘
                            │
                    Data flows back up
                    via callbacks/returns
```

## Migration Notes

The old `AudioStudio.tsx` now simply re-exports the new modular version, ensuring backward compatibility. All existing imports will continue to work:

```typescript
import AudioStudio from "@/components/AudioStudio";
// ✅ Still works! Points to new refactored version
```

## Future Enhancements

With this modular structure, new features can be easily added:

- **New UI Components**: Just add to `components/`
- **New Hooks**: Add to `hooks/` for new functionality
- **Alternative Implementations**: Swap hooks without changing UI
- **Unit Tests**: Add tests alongside each module

## Contributing

When adding new features:

1. **Keep components small**: Aim for < 200 lines
2. **Extract reusable logic**: Create hooks for state/effects
3. **Type everything**: Use TypeScript strictly
4. **Document as you go**: Update this README

---

**Refactored**: October 2025  
**Original Size**: 974 lines  
**New Main Component**: 230 lines  
**Total Modules**: 11 files (avg ~100 lines each)
