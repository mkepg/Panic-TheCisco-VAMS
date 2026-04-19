import { produce, enableMapSet } from 'immer';
import type { StateCreator } from 'zustand';
import type { VamsState, HistorySlice, HistorySnapshot } from './storeTypes';

// enableMapSet still called here because produce() in this module drafts
// VamsState which contains `initialObjectStates: Map`. The canonical global
// registration is in stores/index.ts (Bug 17 fix); this call is harmless
// redundancy that guards against this module being used in isolation.
enableMapSet();

/** Minimum ms between two consecutive snapshots — prevents false-negative dedup. */
const HISTORY_THROTTLE_MS = 50;

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
  maxHistorySize: 30,
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

    // Capture timestamp before entering produce() so it is a stable closure value.
    const snapshotTimestamp = Date.now();
    const snapshot: HistorySnapshot = {
      objects: state.objects,
      selectedObjectId: state.selectedObjectId,
      interactionMode: state.interactionMode,
      selectedVertexId: state.selectedVertexId,
      isVertexEditMode: state.isVertexEditMode,
      pendingShapeType: state.pendingShapeType,
      pendingVertices: state.pendingVertices,
      timestamp: snapshotTimestamp,
    };

    set(
      produce((draft: VamsState) => {
        const lastPast = draft.past[draft.past.length - 1];

        // Bug 2 fix: the original dedup check was:
        //   lastPast.objects === state.objects
        // Zustand produces a new array reference on every mutation, so this
        // reference equality was permanently false — every pushToHistory call
        // created a snapshot unconditionally, including rapid successive calls.
        //
        // Fixed with a timestamp throttle: if the last snapshot was taken less
        // than HISTORY_THROTTLE_MS ago, skip this push. This correctly collapses
        // rapid fire calls (e.g., drag move events) into a single history entry
        // while still allowing all genuinely distinct user actions to be recorded.
        if (lastPast && snapshotTimestamp - lastPast.timestamp < HISTORY_THROTTLE_MS) {
          return;
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
