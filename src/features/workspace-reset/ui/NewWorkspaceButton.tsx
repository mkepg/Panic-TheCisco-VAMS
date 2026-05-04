import { FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useVamsStore } from '@/core/store';

export default function NewWorkspaceButton() {
  const setCanvasBackgroundColor = useVamsStore(
    (state) => state.setCanvasBackgroundColor
  );
  const clearHistory = useVamsStore((state) => state.clearHistory);

  const handleNewWorkspace = () => {
    const state = useVamsStore.getState();
    const hasObjects = state.objects.length > 0;
    const hasCustomBackground = state.canvasBackgroundColor !== '#000000';
    const isBuildingShape = state.pendingShapeType !== null;
    const hasCallbacks = Object.values(state.callbacks).some(cb => cb.trim() !== '');
    
    // Check if the viewport has been modified from the default orthographic bounds
    const hasViewportChanges = 
      state.viewportLimits.minX !== -1 ||
      state.viewportLimits.maxX !== 1 ||
      state.viewportLimits.minY !== -1 ||
      state.viewportLimits.maxY !== 1;

    // Prevent action if the workspace is already a completely blank slate
    if (!hasObjects && !hasCustomBackground && !isBuildingShape && !hasCallbacks && !hasViewportChanges) {
      return;
    }

    if (window.confirm('Start a new workspace? Unsaved changes will be lost.')) {
      useVamsStore.setState({
        objects: [],
        selectedObjectId: null,
        pendingShapeType: null,
        pendingVertices: [],
        interactionMode: 'SELECT',
        selectedVertexId: null,
        callbacks: { keyboard: '', mouse: '', reshape: '', motion: '', idle: '' },
        // Explicitly reset the viewport limits back to default
        viewportLimits: { minX: -1, maxX: 1, minY: -1, maxY: 1 }
      });
      setCanvasBackgroundColor('#000000');
      clearHistory();
      toast.success('New workspace created');
    }
  };

  return (
    <button className="icon-btn" onClick={handleNewWorkspace} title="New Workspace">
      <FilePlus size={16} />
    </button>
  );
}