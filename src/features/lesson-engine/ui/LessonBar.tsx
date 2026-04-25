import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
import MultipleChoiceWidget from './exercise-widgets/MultipleChoiceWidget';
import OrderListWidget from './exercise-widgets/OrderListWidget';
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
  const objects = useVamsStore((s) => s.objects);

  const lastExecutedStepRef = useRef<string | null>(null);
  const lastStepIndexRef = useRef<number>(-1);

  const [mcAnswer, setMcAnswer] = useState<string | null>(null);
  const [orderAnswer, setOrderAnswer] = useState<string[] | null>(null);

  useEffect(() => {
    setMcAnswer(null);
    if (step?.exercise?.kind === 'ordered-list') {
      const seed = `${activeLessonId}-${currentStepIndex}`;
      const arr = [...step.exercise.items].map((i) => i.id);

      let h = 0;
      for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
      const rng = () => {
        h = (h * 1664525 + 1013904223) | 0;
        return ((h >>> 0) % 1000) / 1000;
      };

      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setOrderAnswer(arr);
    } else {
      setOrderAnswer(null);
    }
  }, [activeLessonId, currentStepIndex, step]);

  useEffect(() => {
    if (!lesson || !activeLessonId) return;
    const stepKey = `${activeLessonId}-${currentStepIndex}`;
    if (lastExecutedStepRef.current === stepKey) return;

    const sameLessonAsBefore = lastExecutedStepRef.current?.startsWith(`${activeLessonId}-`);
    const isForwardOne =
      sameLessonAsBefore && currentStepIndex === lastStepIndexRef.current + 1;

    const store = useVamsStore.getState();
    store.startBatch();

    if (isForwardOne) {
      const newStep = lesson.steps[currentStepIndex];
      if (newStep.action) newStep.action(useVamsStore.getState());
    } else {
      useVamsStore.setState({
        objects: [],
        selectedObjectId: null,
        interactionMode: 'SELECT',
      });
      for (let i = 0; i <= currentStepIndex; i++) {
        const pastStep = lesson.steps[i];
        if (pastStep.action) pastStep.action(useVamsStore.getState());
      }
    }

    store.endBatch();
    lastExecutedStepRef.current = stepKey;
    lastStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex, activeLessonId, lesson]);

  const isStepSuccess = useMemo(() => {
    if (!step) return false;
    if (step.exercise) {
      if (step.exercise.kind === 'multiple-choice') {
        if (mcAnswer !== step.exercise.correctId) return false;
      } else if (step.exercise.kind === 'ordered-list') {
        if (!orderAnswer) return false;
        const expected = step.exercise.correctOrder;
        if (orderAnswer.length !== expected.length) return false;
        for (let i = 0; i < expected.length; i++) {
          if (orderAnswer[i] !== expected[i]) return false;
        }
      }
    }
    if (step.successCheck) {
      // Safely reference 'objects' to satisfy the exhaustive-deps rule 
      // ensuring re-evaluation on scene changes while relying on getState()
      void objects; 
      return step.successCheck(useVamsStore.getState());
    }
    return true;
  }, [step, mcAnswer, orderAnswer, objects]);

  const handleNext = useCallback(() => {
    if (lesson && currentStepIndex < lesson.steps.length - 1) {
      setCurrentStep(currentStepIndex + 1);
    }
  }, [lesson, currentStepIndex, setCurrentStep]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) setCurrentStep(currentStepIndex - 1);
  }, [currentStepIndex, setCurrentStep]);

  const handleExit = useCallback(() => {
    clearLessonState();
    setAppMode('Author');
    lastExecutedStepRef.current = null;
    lastStepIndexRef.current = -1;
  }, [clearLessonState, setAppMode]);

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
  }, [appMode, lesson, step, isStepSuccess, handleNext, handleBack, handleExit]);

  if (appMode !== 'Lesson' || !lesson || !step) return null;

  const isLastStep = currentStepIndex === lesson.steps.length - 1;
  const canAdvance = !step.waitForUser || isStepSuccess;
  const progressPercent = ((currentStepIndex + 1) / lesson.steps.length) * 100;
  const lessonTypeIcon =
    lesson.type === 'exercise' ? <GraduationCap size={14} /> : <PlayCircle size={14} />;

  return (
    <div
      className={`lesson-bar ${step.exercise ? 'has-exercise' : ''}`}
      style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}
      role="region"
      aria-label="Lesson navigation"
    >
      {step.exercise && (
        <div className="lesson-exercise-area" key={`${activeLessonId}-${currentStepIndex}`}>
          {step.exercise.kind === 'multiple-choice' && (
            <MultipleChoiceWidget
              prompt={step.exercise.prompt}
              visualArtifact={step.exercise.visualArtifact}
              options={step.exercise.options}
              selectedId={mcAnswer}
              correctId={step.exercise.correctId}
              onSelect={setMcAnswer}
            />
          )}
          {step.exercise.kind === 'ordered-list' && orderAnswer && (
            <OrderListWidget
              prompt={step.exercise.prompt}
              items={step.exercise.items}
              order={orderAnswer}
              correctOrder={step.exercise.correctOrder}
              onChange={setOrderAnswer}
            />
          )}
        </div>
      )}

      <div className="lesson-bar-main">
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
    </div>
  );
}