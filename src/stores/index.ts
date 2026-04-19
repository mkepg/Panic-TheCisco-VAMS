import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { enableMapSet } from 'immer';
import type { VamsState } from './storeTypes';
import { createSceneSlice } from './sceneSlice';
import { createInteractionSlice } from './interactionSlice';
import { createViewportSlice } from './viewportSlice';
import { createSimulationSlice } from './simulationSlice';
import { createSettingsSlice } from './settingsSlice';
// Bug 16 fix: removed the explicit `.ts` extension — it was the only import in
// the entire codebase that had one, violating consistency with all other imports.
import { createCustomShapeBuilderSlice } from './customShapeBuilderSlice';
import { createHistorySlice } from './historySlice';

// Bug 17 fix: enableMapSet() belongs here at the store entry point so it is
// unambiguously applied globally before any slice is initialized. Previously it
// was only called inside historySlice.ts, which made it appear scoped to that
// file even though `produce()` anywhere on VamsState (which contains
// `initialObjectStates: Map`) requires it to be registered first.
enableMapSet();

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
      }),
    }
  )
);
