import { useState, useEffect } from 'react';

interface CanvasSize {
  width: number;
  height: number;
}

export function useCanvasSize(): CanvasSize {
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      const el = document.querySelector('.canvas-wrapper');
      if (el) {
        setCanvasSize({
          width: Math.floor(el.clientWidth),
          height: Math.floor(el.clientHeight),
        });
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    const el = document.querySelector('.canvas-wrapper');
    if (el) {
      observer.observe(el);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      observer.disconnect();
    };
  }, []);

  return canvasSize;
}