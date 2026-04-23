import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { enableMapSet } from 'immer';
import type { VamsState } from '@/core/store/types';

// Existing imports
import { createSceneSlice } from '@/entities/scene/model/scene-slice';
import { createInteractionSlice } from '@/entities/scene/model/interaction-slice';
import { createViewportSlice } from '@/entities/scene/model/viewport-slice';
import { createSettingsSlice } from '@/core/store/settings-slice';
import { createCustomShapeBuilderSlice } from '@/features/custom-shapes/model/custom-shape-builder-slice';
import { createHistorySlice } from '@/core/store/history-slice';

// --- NEW IMPORTS (You were likely missing these) ---
import { createRuntimeSlice } from '@/core/store/runtime-slice';
import { createLessonSlice } from '@/core/store/lesson-slice';

enableMapSet();

export const useVamsStore = create<VamsState>()(
  persist(
    (...a) => ({
      ...createSceneSlice(...a),
      ...createInteractionSlice(...a),
      ...createViewportSlice(...a),
      ...createSettingsSlice(...a),
      ...createCustomShapeBuilderSlice(...a),
      ...createHistorySlice(...a),
      ...createRuntimeSlice(...a), 
      ...createLessonSlice(...a),
      
      // We keep the reset logic here as a utility, but we hide it from the UI
      resetProject: () => {
        localStorage.removeItem('vams-storage');
        window.location.reload();
      }
    }),
    {
      name: 'vams-storage',
      version: 3, // Increment this whenever you make breaking changes to types
      
      // AUTOMATIC RECOVERY
      onRehydrateStorage: () => {
        return (_rehydratedState, error) => {
          if (error) {
            console.error('Storage hydration failed. State may be corrupt. Triggering automatic reset.', error);
            localStorage.removeItem('vams-storage');
            window.location.reload();
          }
        };
      },
      
      partialize: (state) => ({
        theme: state.theme,
        learningSettings: state.learningSettings,
        axisVisibility: state.axisVisibility,
        showCoordinateTracker: state.showCoordinateTracker,
        objects: state.objects,
        viewportLimits: state.viewportLimits,
        canvasBackgroundColor: state.canvasBackgroundColor,
        activeSection: state.activeSection,
      }),
    }
  )
);

export type { VamsState } from '@/core/store/types';