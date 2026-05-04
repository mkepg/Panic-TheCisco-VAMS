import type { TextureAsset } from '@/core/types/textures';

/** Build a procedural canvas, return its data URL + dimensions. */
function buildCanvas(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
): { dataUrl: string; width: number; height: number } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);
  return { dataUrl: canvas.toDataURL('image/png'), width: size, height: size };
}

function drawChecker(ctx: CanvasRenderingContext2D, size: number) {
  const cells = 8;
  const cell = size / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#1f2937' : '#f3f4f6';
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
}

function drawUVTest(ctx: CanvasRenderingContext2D, size: number) {
  // Red along U, green along V, with a faint grid + corner markers.
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      img.data[i + 0] = Math.round((x / (size - 1)) * 255);
      img.data[i + 1] = Math.round(((size - 1 - y) / (size - 1)) * 255);
      img.data[i + 2] = 60;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  const lines = 8;
  for (let i = 1; i < lines; i++) {
    const p = (i / lines) * size;
    ctx.beginPath();
    ctx.moveTo(p, 0); ctx.lineTo(p, size);
    ctx.moveTo(0, p); ctx.lineTo(size, p);
    ctx.stroke();
  }

  ctx.fillStyle = '#000';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('(0,1)', 6, 22);
  ctx.fillText('(1,1)', size - 60, 22);
  ctx.fillText('(0,0)', 6, size - 8);
  ctx.fillText('(1,0)', size - 60, size - 8);
}

function drawSeamless(ctx: CanvasRenderingContext2D, size: number) {
  // A seamless dotted weave that tiles cleanly under GL_REPEAT.
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#1e3a8a');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = 'rgba(96, 165, 250, 0.35)';
  const step = size / 8;
  for (let y = 0; y <= 8; y++) {
    for (let x = 0; x <= 8; x++) {
      ctx.beginPath();
      ctx.arc(x * step, y * step, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = 'rgba(125, 211, 252, 0.18)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * step); ctx.lineTo(size, i * step);
    ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size);
    ctx.stroke();
  }
}

/** Lazily-built sample textures. Cached after first call. */
let cached: TextureAsset[] | null = null;

export function getSampleTextures(): TextureAsset[] {
  if (cached) return cached;
  const checker = buildCanvas(256, drawChecker);
  const uv = buildCanvas(256, drawUVTest);
  const seamless = buildCanvas(256, drawSeamless);
  cached = [
    { id: 'sample-checker',  name: 'Checker',  isSample: true, ...checker },
    { id: 'sample-uvtest',   name: 'UV Test',  isSample: true, ...uv },
    { id: 'sample-seamless', name: 'Seamless', isSample: true, ...seamless },
  ];
  return cached;
}
