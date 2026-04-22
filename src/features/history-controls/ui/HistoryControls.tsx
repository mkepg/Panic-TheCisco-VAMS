import { useEffect } from 'react';
import { Undo, Redo } from 'lucide-react';
import { toast } from 'sonner';
import { useVamsStore } from '@/core/store';

export default function HistoryControls() {
  const undo = useVamsStore((state) => state.undo);
  const redo = useVamsStore((state) => state.redo);
  const canUndo = useVamsStore((state) => state.canUndo);
  const canRedo = useVamsStore((state) => state.canRedo);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo()) {
          undo();
          toast.info('Undo');
        }
      }
      if (
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') ||
        (event.ctrlKey && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo()) {
          redo();
          toast.info('Redo');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const handleUndo = () => {
    if (!canUndo()) return;
    undo();
    toast.info('Undo');
  };

  const handleRedo = () => {
    if (!canRedo()) return;
    redo();
    toast.info('Redo');
  };

  return (
    <>
      <button
        className="icon-btn"
        onClick={handleUndo}
        disabled={!canUndo()}
        title="Undo (Ctrl+Z)"
        style={{ opacity: canUndo() ? 1 : 0.5 }}
      >
        <Undo size={16} />
      </button>
      <button
        className="icon-btn"
        onClick={handleRedo}
        disabled={!canRedo()}
        title="Redo (Ctrl+Shift+Z)"
        style={{ opacity: canRedo() ? 1 : 0.5 }}
      >
        <Redo size={16} />
      </button>
    </>
  );
}