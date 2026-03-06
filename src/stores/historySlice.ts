import { produce, enableMapSet } from 'immer';
import type { StateCreator } from 'zustand';
import type { VamsState, HistorySlice, HistorySnapshot } from './storeTypes';

enableMapSet();

const createSnapshot = (state: VamsState): HistorySnapshot => ({
  objects: state.objects,
  selectedObjectId: state.selectedObjectId,
  interactionMode: state.interactionMode,
  selectedVertexId: state.selectedVertexId,
  isVertexEditMode: state.isVertexEditMode,
  pendingShapeType: state.pendingShapeType,
  pendingVertices: state.pendingVertices,
  timestamp: Date.now(),
});

const restoreSnapshot = (snapshot: HistorySnapshot): Partial<VamsState> => ({
  objects: snapshot.objects,
  selectedObjectId: snapshot.selectedObjectId,
  interactionMode: snapshot.interactionMode,
  selectedVertexId: snapshot.selectedVertexId,
  isVertexEditMode: snapshot.isVertexEditMode,
  pendingShapeType: snapshot.pendingShapeType,
  pendingVertices: snapshot.pendingVertices,
});

export const createHistorySlice: StateCreator<VamsState, [], [], HistorySlice> = (set, get) => ({
  past: [],
  future: [],
  maxHistorySize: 30, // GC Optimization: Reduced from 100 to prevent OOM
  isBatchMode: false,

  startBatch: () => {
    set({ isBatchMode: true });
  },

  endBatch: () => {
    set({ isBatchMode: false });
  },

  pushToHistory: () => {
    const state = get();
    if (state.simulationState === 'PLAYING' || state.isBatchMode) {
      return;
    }

    const snapshot = createSnapshot(state);

    set(
      produce((draft: VamsState) => {
        // Anti-bloat check: Prevent pushing identical duplicate states.
        // Immer structurally shares references, so unmodified arrays retain equality.
        const lastPast = draft.past[draft.past.length - 1];
        if (
            lastPast && 
            lastPast.objects === state.objects && 
            lastPast.selectedObjectId === state.selectedObjectId &&
            lastPast.interactionMode === state.interactionMode
        ) {
            return; // Abort push: Nothing meaningful changed
        }

        draft.past.push(snapshot);
        draft.future = [];
        
        if (draft.past.length > draft.maxHistorySize) {
          draft.past.shift();
        }
      })
    );
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0 || state.simulationState === 'PLAYING') {
      return;
    }

    set(
      produce((draft: VamsState) => {
        const previousSnapshot = draft.past.pop()!;
        const currentSnapshot = createSnapshot(state);
        draft.future.push(currentSnapshot);

        const restoredState = restoreSnapshot(previousSnapshot);
        Object.assign(draft, restoredState);
      })
    );
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0 || state.simulationState === 'PLAYING') {
      return;
    }

    set(
      produce((draft: VamsState) => {
        const nextSnapshot = draft.future.pop()!;
        const currentSnapshot = createSnapshot(state);
        draft.past.push(currentSnapshot);

        const restoredState = restoreSnapshot(nextSnapshot);
        Object.assign(draft, restoredState);
      })
    );
  },

  canUndo: () => {
    const state = get();
    return state.past.length > 0 && state.simulationState !== 'PLAYING';
  },

  canRedo: () => {
    const state = get();
    return state.future.length > 0 && state.simulationState !== 'PLAYING';
  },

  clearHistory: () => {
    set(
      produce((draft: VamsState) => {
        draft.past = [];
        draft.future = [];
      })
    );
  },
});