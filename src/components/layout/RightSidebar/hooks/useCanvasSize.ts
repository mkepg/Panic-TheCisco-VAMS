import { useState, useEffect, useRef } from 'react';

interface CanvasSize {
  width: number;
  height: number;
}

// Bug 15 fix (partial): The original hook used two mechanisms to watch the same
// element — a `ResizeObserver` AND a `window.addEventListener('resize')` listener,
// both calling `updateSize`. This caused `updateSize` to fire twice on every window
// resize event. The `ResizeObserver` already handles all resize events including
// window resizes (it observes the element directly, not the window), so the
// `window.resize` listener is entirely redundant and has been removed.
//
// Note: the other part of Bug 15 (coupling via `.canvas-wrapper` class string) is
// addressed by the CanvasSizeContext approach described in the analysis. That
// architectural change is a larger refactor requiring changes across CanvasWorkspace
// and the RightSidebar component tree. The duplicate-listener fix is applied here
// as a safe, self-contained improvement in the interim.
export function useCanvasSize(): CanvasSize {
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 800, height: 600 });
  // Keep a stable ref to the observed element so the cleanup can disconnect
  // the correct observer even if the element changes between renders.
  const observedElementRef = useRef<Element | null>(null);

  useEffect(() => {
    const updateSize = (el: Element) => {
      setCanvasSize({
        width: Math.floor(el.clientWidth),
        height: Math.floor(el.clientHeight),
      });
    };

    const el = document.querySelector('.canvas-wrapper');
    if (!el) return;

    observedElementRef.current = el;

    // Measure immediately on mount.
    updateSize(el);

    // ResizeObserver fires on any size change — window resize included.
    // No separate window.addEventListener('resize') is needed.
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateSize(entry.target);
      }
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      observedElementRef.current = null;
    };
  }, []);

  return canvasSize;
}
