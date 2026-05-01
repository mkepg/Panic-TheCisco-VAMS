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
import { useCanvasSize } from '@/features/code-generation/model/useCanvasSize';
import { generateCodeFromState } from '@/features/code-generation/model/generate-from-state';
import { resolveChangedLines } from '@/features/code-generation/model/code-diff';
import './lesson-bar.scss';

const DEFAULT_LESSON_VIEWPORT = { minX: -1, maxX: 1, minY: -1, maxY: 1 };

export default function LessonBar() {
  const {
    appMode,
    activeLessonId,
    currentStepIndex,
    setCurrentStep,
    setAppMode,
    clearLessonState,
  } = useVamsStore();

  const [sessionSeed, setSessionSeed] = useState(0);
  const objects = useVamsStore((s) => s.objects);
  const callbacks = useVamsStore((s) => s.callbacks); // listen for callback changes
  const viewportLimits = useVamsStore((s) => s.viewportLimits); // ortho changes affect successChecks too

  const lastExecutedStepRef = useRef<string | null>(null);
  const lastStepIndexRef = useRef<number>(-1);

  const [mcAnswer, setMcAnswer] = useState<string | null>(null);
  const [orderAnswer, setOrderAnswer] = useState<string[] | null>(null);

  /* ------------------------------------------------------------------ */
  /*  Canvas size — kept in a ref so the step-execution effect always   */
  /*  reads the latest value without needing it in its dependency array */
  /*  (which would re-fire the action on every window resize).          */
  /* ------------------------------------------------------------------ */
  const canvasSize = useCanvasSize();
  const canvasSizeRef = useRef(canvasSize);
  useEffect(() => {
    canvasSizeRef.current = canvasSize;
  }, [canvasSize]);

  useEffect(() => {
    if (activeLessonId) {
      setSessionSeed(Math.random());
    }
  }, [activeLessonId]);

  const lesson = useMemo(() => {
    if (!activeLessonId) return null;
    const baseLesson = LESSON_REGISTRY[activeLessonId];
    if (!baseLesson) return null;

    if (baseLesson.shuffleRange) {
      const [start, end] = baseLesson.shuffleRange;
      const cloned = { ...baseLesson, steps: [...baseLesson.steps] };
      const range = cloned.steps.slice(start, end + 1);

      let h = Math.floor(sessionSeed * 1000000);
      const rng = () => {
        h = (h * 1664525 + 1013904223) | 0;
        return ((h >>> 0) % 1000) / 1000;
      };

      for (let i = range.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [range[i], range[j]] = [range[j], range[i]];
      }
      cloned.steps.splice(start, range.length, ...range);
      return cloned;
    }

    return baseLesson;
  }, [activeLessonId, sessionSeed]);

  const step = lesson?.steps[currentStepIndex];

  useEffect(() => {
    setMcAnswer(null);
    if (step?.exercise?.kind === 'ordered-list') {
      const expected = step.exercise.correctOrder;
      const arr = [...step.exercise.items].map((i) => i.id);
      let hasAnyCorrect = true;
      while (hasAnyCorrect) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        hasAnyCorrect = arr.some((val, index) => val === expected[index]);
      }
      setOrderAnswer(arr);
    } else {
      setOrderAnswer(null);
    }
  }, [activeLessonId, currentStepIndex, step]);

  /* ------------------------------------------------------------------ */
  /*  Step execution + change-highlight diff.                            */
  /*                                                                    */
  /*  We snapshot the generated code immediately before and after the   */
  /*  step's action mutates state, run a line-level diff, and write the */
  /*  result into `changedCodeLines`. SceneCodePanel reads that and     */
  /*  passes it to CodeViewer, which renders the amber highlight + auto-*/
  /*  scrolls vertically to the topmost change.                         */
  /*                                                                    */
  /*  Both snapshots use the SAME canvas size, so window-size-only      */
  /*  differences (the `glutInitWindowSize` line) never show up as a    */
  /*  spurious change.                                                  */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!lesson || !activeLessonId) return;

    const stepKey = `${activeLessonId}-${currentStepIndex}`;
    if (lastExecutedStepRef.current === stepKey) return;

    const sameLessonAsBefore = lastExecutedStepRef.current?.startsWith(`${activeLessonId}-`);
    const isForwardOne =
      sameLessonAsBefore && currentStepIndex === lastStepIndexRef.current + 1;

    const store = useVamsStore.getState();
    store.startBatch();

    const cs = canvasSizeRef.current;
    const currentStep = lesson.steps[currentStepIndex];

    const snapshotCode = () => {
      const s = useVamsStore.getState();
      return generateCodeFromState(
        {
          objects: s.objects,
          canvasBackgroundColor: s.canvasBackgroundColor,
          callbacks: s.callbacks,
          viewportLimits: s.viewportLimits,
        },
        cs,
      );
    };

    let preCode = '';
    let postCode = '';

    if (isForwardOne) {
      preCode = snapshotCode();

      if (currentStep.action) currentStep.action(useVamsStore.getState());

      postCode = snapshotCode();

      store.setLessonFocusPanel(currentStep.focusPanel || null);
      store.setDmaDriverStep(currentStep.dmaStep ?? null);
    } else {
      // Non-linear navigation (Back, lesson-start, jump): rebuild from scratch.
      // Reset every piece of pedagogically-relevant state so step replay starts
      // from a clean baseline — including viewportLimits, which Stage 4 lessons
      // mutate.
      useVamsStore.setState({
        objects: [],
        callbacks: { keyboard: '', mouse: '', reshape: '', motion: '', idle: '' },
        canvasBackgroundColor: '#000000',
        viewportLimits: { ...DEFAULT_LESSON_VIEWPORT },
        selectedObjectId: null,
        interactionMode: 'SELECT',
      });

      // Replay every step BEFORE the current one to recreate the pre-state.
      for (let i = 0; i < currentStepIndex; i++) {
        const pastStep = lesson.steps[i];
        if (pastStep.action) pastStep.action(useVamsStore.getState());
      }

      // Snapshot pre-state (= state at the end of step N-1, or empty if N=0).
      preCode = snapshotCode();

      // Now run step N's action and snapshot post-state.
      if (currentStep.action) currentStep.action(useVamsStore.getState());
      postCode = snapshotCode();

      store.setLessonFocusPanel(currentStep.focusPanel || null);
      store.setDmaDriverStep(currentStep.dmaStep ?? null);
    }

    const changed = resolveChangedLines(preCode, postCode, currentStep.codeChangeFocus);
    store.setChangedCodeLines(changed);

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
      void objects;
      void callbacks;
      void viewportLimits;
      return step.successCheck(useVamsStore.getState());
    }

    return true;
  }, [step, mcAnswer, orderAnswer, objects, callbacks, viewportLimits]);

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
