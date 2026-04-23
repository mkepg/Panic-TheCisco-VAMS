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
    }),
    {
      name: 'vams-storage',
      // v2: PrimitiveType purge + SceneNode field rename + scaleX/scaleY split.
      // Incompatible with v1 persisted objects; bump forces a clean slate.
      version: 2,
      partialize: (state) => ({
        theme: state.theme,
        learningSettings: state.learningSettings,
        axisVisibility: state.axisVisibility,
        showCoordinateTracker: state.showCoordinateTracker,
        objects: state.objects,
        viewportLimits: state.viewportLimits,
        canvasBackgroundColor: state.canvasBackgroundColor,
      }),
    }
  )
);

export type { VamsState } from '@/core/store/types';
