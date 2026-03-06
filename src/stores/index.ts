import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VamsState } from './storeTypes';

import { createSceneSlice } from './sceneSlice';
import { createInteractionSlice } from './interactionSlice';
import { createViewportSlice } from './viewportSlice';
import { createSimulationSlice } from './simulationSlice';
import { createSettingsSlice } from './settingsSlice';
import { createCustomShapeBuilderSlice } from './customShapeBuilderSlice.ts';
import { createHistorySlice } from './historySlice';


export const useVamsStore = create<VamsState>()(
  persist(
    (...a) => ({
      ...createSceneSlice(...a),
      ...createInteractionSlice(...a),
      ...createViewportSlice(...a),
      ...createSimulationSlice(...a),
      ...createSettingsSlice(...a),
      ...createCustomShapeBuilderSlice(...a),
      ...createHistorySlice(...a),
    }),
    {
      name: 'vams-storage',
      partialize: (state) => ({
        theme: state.theme,
        learningSettings: state.learningSettings,
        axisVisibility: state.axisVisibility,
        showCoordinateTracker: state.showCoordinateTracker,
        objects: state.objects,
        viewportLimits: state.viewportLimits,
        canvasBackgroundColor: state.canvasBackgroundColor,
        // Note: We don't persist history (past/future) as it's session-specific
      }),
    }
  )
);