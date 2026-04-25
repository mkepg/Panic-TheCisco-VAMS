import { useEffect, useRef, useState } from 'react';
import { GraduationCap, PlayCircle, ChevronDown } from 'lucide-react';
import { useVamsStore } from '@/core/store';
import { LESSON_REGISTRY } from '../model/lesson-registry';
import './lesson-launcher.scss';

export default function LessonLauncher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeSection = useVamsStore((s) => s.activeSection);
  const appMode = useVamsStore((s) => s.appMode);
  const setActiveLesson = useVamsStore((s) => s.setActiveLesson);
  const setAppMode = useVamsStore((s) => s.setAppMode);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (appMode === 'Lesson') return null;

  const sectionLessons = Object.values(LESSON_REGISTRY).filter(
    (l) => l.section === activeSection
  );
  const demos = sectionLessons.filter((l) => l.type === 'demo');
  const exercises = sectionLessons.filter((l) => l.type === 'exercise');

  const launch = (id: string) => {
    setActiveLesson(id);
    setAppMode('Lesson');
    setOpen(false);
  };

  return (
    <div className="lesson-launcher" ref={ref}>
      <button
        type="button"
        className={`launcher-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title="Browse lessons for this section"
      >
        <GraduationCap size={14} />
        <span>Lessons</span>
        <ChevronDown size={12} className={`chev ${open ? 'rot' : ''}`} />
      </button>

      {open && (
        <div className="launcher-menu">
          <div className="menu-section-label">
            <span>{activeSection}</span>
            <span className="dot" />
            <span>Demos</span>
          </div>
          {demos.length === 0 ? (
            <div className="menu-empty">No demos available yet.</div>
          ) : (
            demos.map((l) => (
              <button
                key={l.id}
                type="button"
                className="menu-lesson"
                onClick={() => launch(l.id)}
              >
                <span className="lesson-icon demo">
                  <PlayCircle size={13} />
                </span>
                <span className="lesson-title">{l.title}</span>
                <span className="lesson-meta">{l.steps.length} steps</span>
              </button>
            ))
          )}

          <div className="menu-section-label">
            <span>{activeSection}</span>
            <span className="dot" />
            <span>Exercises</span>
          </div>
          {exercises.length === 0 ? (
            <div className="menu-empty">No exercises available yet.</div>
          ) : (
            exercises.map((l) => (
              <button
                key={l.id}
                type="button"
                className="menu-lesson exercise"
                onClick={() => launch(l.id)}
              >
                <span className="lesson-icon exercise">
                  <GraduationCap size={13} />
                </span>
                <span className="lesson-title">{l.title}</span>
                <span className="lesson-meta">{l.steps.length} steps</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
