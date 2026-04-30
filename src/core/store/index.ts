import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { enableMapSet } from 'immer';
import type { VamsState } from '@/core/store/types';

import { createSceneSlice } from '@/entities/scene/model/scene-slice';
import { createInteractionSlice } from '@/entities/scene/model/interaction-slice';
import { createViewportSlice } from '@/entities/scene/model/viewport-slice';
import { createSettingsSlice } from '@/core/store/settings-slice';
import { createCustomShapeBuilderSlice } from '@/features/custom-shapes/model/custom-shape-builder-slice';
import { createHistorySlice } from '@/core/store/history-slice';
import { createRuntimeSlice } from '@/core/store/runtime-slice';
import { createLessonSlice } from '@/core/store/lesson-slice';
import { createCallbacksSlice } from '@/core/store/callbacks-slice';

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
      ...createCallbacksSlice(...a),

      resetProject: () => {
        localStorage.removeItem('vams-storage');
        window.location.reload();
      }
    }),
    {
      name: 'vams-storage',
      // Bumped to 6 — Stage 3 follow-up adds per-object `updateMethod` driving
      // glBufferSubData vs glMapBuffer for VBO+DYNAMIC objects, plus a real
      // update_buffers() emission. No migration function: zustand will discard
      // older state, which is safe — the user's project file is the source of
      // truth and that has its own schema versioning.
      version: 6,

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
        callbacks: state.callbacks,
      }),
    }
  )
);

export type { VamsState } from '@/core/store/types';
