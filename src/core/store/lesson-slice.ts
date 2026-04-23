import type { StateCreator } from 'zustand';
import type { VamsState, LessonSlice } from '@/core/store/types';

export const createLessonSlice: StateCreator<VamsState, [], [], LessonSlice> = (set, get) => ({
  activeLessonId: null,
  currentStepIndex: 0,
  exerciseAnswers: {},
  isSuccess: false,
  sceneBackup: null,

  setActiveLesson: (lessonId) => {
    const state = get();
    // If starting a fresh lesson, backup and clear the scene
    if (lessonId && !state.activeLessonId) {
      set({ 
        activeLessonId: lessonId, 
        currentStepIndex: 0,
        exerciseAnswers: {},
        isSuccess: false,
        sceneBackup: state.objects,
        objects: [], // Clear the canvas for the lesson
        selectedObjectId: null,
        interactionMode: 'SELECT'
      });
    } else {
      set({ activeLessonId: lessonId });
    }
  },
  
  setCurrentStep: (index) => set({ currentStepIndex: index }),
  
  setExerciseAnswer: (stepId, answer) => set((state) => ({
    exerciseAnswers: {
      ...state.exerciseAnswers,
      [stepId]: answer
    }
  })),
  
  setSuccessState: (success) => set({ isSuccess: success }),
  
  clearLessonState: () => {
    const state = get();
    set({
      activeLessonId: null,
      currentStepIndex: 0,
      exerciseAnswers: {},
      isSuccess: false,
      objects: state.sceneBackup || [], // Restore the user's canvas
      sceneBackup: null,
      selectedObjectId: null
    });
  },
});