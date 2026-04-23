import { useEffect, useMemo, useRef } from 'react';
import { Square, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useVamsStore } from '@/core/store';
import { LESSON_REGISTRY } from '../model/lesson-registry';
import './lesson-bar.scss';

export default function LessonBar() {
  const { 
    appMode, 
    activeLessonId, 
    currentStepIndex, 
    setCurrentStep, 
    setAppMode, 
    clearLessonState,
  } = useVamsStore();

  const lesson = activeLessonId ? LESSON_REGISTRY[activeLessonId] : null;
  const step = lesson?.steps[currentStepIndex];

  // Tracks the last executed step to prevent React Strict Mode double-firing
  const lastExecutedStepRef = useRef<string | null>(null);

  const isStepSuccess = useMemo(() => {
    if (!step) return false;
    if (!step.successCheck) return true;
    return step.successCheck(useVamsStore.getState());
  }, [step]);

  // DETERMINISTIC SCENE REBUILDER
  // Executes whenever the step changes (Next or Back)
  useEffect(() => {
    if (!lesson || !activeLessonId) return;

    const stepKey = `${activeLessonId}-${currentStepIndex}`;
    
    if (lastExecutedStepRef.current !== stepKey) {
      lastExecutedStepRef.current = stepKey;
      
      const store = useVamsStore.getState();

      // Pause history tracking so our rapid rebuild doesn't flood the Undo stack
      store.startBatch();

      // 1. Fully clear the canvas to ensure a clean slate
      useVamsStore.setState({ 
        objects: [], 
        selectedObjectId: null,
        interactionMode: 'SELECT' 
      });

      // 2. Replay all actions from the initial state up to the current step.
      // This guarantees absolute consistency even if the user manually destroyed the scene.
      for (let i = 0; i <= currentStepIndex; i++) {
        const pastStep = lesson.steps[i];
        if (pastStep.action) {
          // Pass a fresh getState() so each action sees the results of the previous one
          pastStep.action(useVamsStore.getState());
        }
      }

      // Resume history tracking
      store.endBatch();
    }
  }, [currentStepIndex, activeLessonId, lesson]);

  if (appMode !== 'Lesson' || !lesson || !step) return null;

  const handleNext = () => {
    if (currentStepIndex < lesson.steps.length - 1) {
      setCurrentStep(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(currentStepIndex - 1);
    }
  };

  const handleExit = () => {
    clearLessonState();
    setAppMode('Author');
    lastExecutedStepRef.current = null; // Clear execution tracking on exit
  };

  const isLastStep = currentStepIndex === lesson.steps.length - 1;
  const canAdvance = !step.waitForUser || isStepSuccess;
  
  const progressPercent = ((currentStepIndex + 1) / lesson.steps.length) * 100;

  return (
    <div 
      className="lesson-bar" 
      style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}
    >
      <div className="lesson-info">
        <span className="lesson-title">{lesson.title}</span>
        <span className="step-counter">Step {currentStepIndex + 1} of {lesson.steps.length}</span>
      </div>
      
      <div className="lesson-narration">
        <p>{step.narration}</p>
      </div>

      <div className="lesson-controls">
        <button className="control-btn exit" onClick={handleExit}>
          <Square size={14} /> Exit
        </button>
        <button 
          className="control-btn" 
          onClick={handleBack} 
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button 
          className={`control-btn primary ${canAdvance ? 'ready' : ''}`} 
          onClick={isLastStep ? handleExit : handleNext}
          disabled={!canAdvance}
        >
          {isLastStep ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />}
          {isLastStep ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}