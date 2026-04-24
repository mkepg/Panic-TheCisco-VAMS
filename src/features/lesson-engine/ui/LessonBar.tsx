import { useEffect, useMemo, useRef } from 'react';
import {
  Square,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
} from 'lucide-react';
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

  const lastExecutedStepRef = useRef<string | null>(null);

  const isStepSuccess = useMemo(() => {
    if (!step) return false;
    if (!step.successCheck) return true;
    return step.successCheck(useVamsStore.getState());
  }, [step]);

  useEffect(() => {
    if (!lesson || !activeLessonId) return;
    const stepKey = `${activeLessonId}-${currentStepIndex}`;
    if (lastExecutedStepRef.current !== stepKey) {
      lastExecutedStepRef.current = stepKey;
      const store = useVamsStore.getState();
      store.startBatch();
      useVamsStore.setState({
        objects: [],
        selectedObjectId: null,
        interactionMode: 'SELECT',
      });
      for (let i = 0; i <= currentStepIndex; i++) {
        const pastStep = lesson.steps[i];
        if (pastStep.action) pastStep.action(useVamsStore.getState());
      }
      store.endBatch();
    }
  }, [currentStepIndex, activeLessonId, lesson]);

  const handleNext = () => {
    if (lesson && currentStepIndex < lesson.steps.length - 1) {
      setCurrentStep(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) setCurrentStep(currentStepIndex - 1);
  };

  const handleExit = () => {
    clearLessonState();
    setAppMode('Author');
    lastExecutedStepRef.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    if (appMode !== 'Lesson' || !lesson || !step) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') {
        const canAdvance = !step.waitForUser || isStepSuccess;
        if (canAdvance) handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      } else if (e.key === 'Escape') {
        handleExit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appMode, lesson, step, isStepSuccess, currentStepIndex]);

  if (appMode !== 'Lesson' || !lesson || !step) return null;

  const isLastStep = currentStepIndex === lesson.steps.length - 1;
  const canAdvance = !step.waitForUser || isStepSuccess;
  const progressPercent = ((currentStepIndex + 1) / lesson.steps.length) * 100;

  const lessonTypeIcon =
    lesson.type === 'exercise' ? (
      <GraduationCap size={14} />
    ) : (
      <PlayCircle size={14} />
    );

  return (
    <div
      className="lesson-bar"
      style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}
      role="region"
      aria-label="Lesson navigation"
    >
      <div className="lesson-info">
        <span className="lesson-type-chip">
          {lessonTypeIcon}
          <span>{lesson.type === 'exercise' ? 'Exercise' : 'Demo'}</span>
        </span>
        <span className="lesson-title" title={lesson.title}>
          {lesson.title}
        </span>
      </div>

      <div className="lesson-narration">
        <p key={`${activeLessonId}-${currentStepIndex}`}>{step.narration}</p>
        <span className="step-counter">
          Step <strong>{currentStepIndex + 1}</strong> of {lesson.steps.length}
        </span>
      </div>

      <div className="lesson-controls">
        <button className="control-btn exit" onClick={handleExit} title="Exit lesson (Esc)">
          <Square size={13} />
          <span>Exit</span>
        </button>
        <button
          className="control-btn"
          onClick={handleBack}
          disabled={currentStepIndex === 0}
          title="Previous step (←)"
        >
          <ChevronLeft size={15} />
          <span>Back</span>
        </button>
        <button
          className={`control-btn primary ${canAdvance ? 'ready' : ''}`}
          onClick={isLastStep ? handleExit : handleNext}
          disabled={!canAdvance}
          title={isLastStep ? 'Finish lesson' : 'Next step (→)'}
        >
          {isLastStep ? <CheckCircle2 size={15} /> : <ChevronRight size={15} />}
          <span>{isLastStep ? 'Finish' : 'Next'}</span>
        </button>
      </div>
    </div>
  );
}
