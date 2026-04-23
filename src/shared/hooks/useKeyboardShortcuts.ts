import { useEffect } from 'react';
import { useVamsStore } from '@/core/store';

export function useKeyboardShortcuts() {
  const { 
    selectedObjectId, 
    duplicateObject, 
    deleteObject, 
    undo, 
    redo 
  } = useVamsStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      // Duplicate: Ctrl + V
      if (isCtrl && e.key.toLowerCase() === 'v') {
        if (selectedObjectId) {
          e.preventDefault();
          duplicateObject(selectedObjectId);
        }
      }

      // Undo: Ctrl + Z
      if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl + Y or Ctrl + Shift + Z
      if ((isCtrl && e.key.toLowerCase() === 'y') || (isCtrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        redo();
      }

      // Delete: Delete or Backspace (if not in an input)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
        if (!isInput && selectedObjectId) {
          e.preventDefault();
          deleteObject(selectedObjectId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, duplicateObject, deleteObject, undo, redo]);
}