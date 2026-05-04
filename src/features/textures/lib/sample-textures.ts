import type { TextureAsset } from '@/core/types/textures';

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

// 1. Texture Atlas / Sprite Sheet (UV Coordinates Demo)
// A 2x2 grid of distinct items. Demonstrates how manipulating UV coordinates
// from [0, 1] down to [0, 0.5] isolates specific sprites from a single sheet.
function drawTextureAtlas(ctx: CanvasRenderingContext2D, size: number) {
  const half = size / 2;

  // Subtle background distinctions for each quadrant
  ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, half, half);       // Top-Left
  ctx.fillStyle = '#334155'; ctx.fillRect(half, 0, half, half);    // Top-Right
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, half, half, half);    // Bottom-Left
  ctx.fillStyle = '#1e293b'; ctx.fillRect(half, half, half, half); // Bottom-Right

  const drawItem = (x: number, y: number, drawFn: () => void) => {
    ctx.save();
    ctx.translate(x * half + half / 2, y * half + half / 2);
    drawFn();
    ctx.restore();
  };

  // Top-Left: Red Heart
  drawItem(0, 0, () => {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-15, -10, 15, 0, Math.PI * 2);
    ctx.arc(15, -10, 15, 0, Math.PI * 2);
    ctx.moveTo(-30, -10);
    ctx.lineTo(0, 25);
    ctx.lineTo(30, -10);
    ctx.fill();
  });

  // Top-Right: Gold Coin
  drawItem(1, 0, () => {
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
  });

  // Bottom-Left: Blue Diamond
  drawItem(0, 1, () => {
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(25, 0);
    ctx.lineTo(0, 25);
    ctx.lineTo(-25, 0);
    ctx.fill();
  });

  // Bottom-Right: Green Crate
  drawItem(1, 1, () => {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-22, -22, 44, 44);
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 4;
    ctx.strokeRect(-20, -20, 40, 40);
    ctx.beginPath();
    ctx.moveTo(-20, -20); ctx.lineTo(20, 20);
    ctx.moveTo(20, -20); ctx.lineTo(-20, 20);
    ctx.stroke();
  });

  // Dashed crosshair dividing the quadrants at exactly 0.5 UV marks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(half, 0); ctx.lineTo(half, size);
  ctx.moveTo(0, half); ctx.lineTo(size, half);
  ctx.stroke();
}

// 2. Pixel Art (Filtering Demo)
// Rendered at a tiny 64x64 size. When applied to a large shape, it vividly
// shows the difference between GL_NEAREST (blocky pixels) and GL_LINEAR (blurred gradient).
function drawPixelSprite(ctx: CanvasRenderingContext2D, size: number) {
  const grid = [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,2,2,2,2,1,0,0],
    [0,1,2,2,2,2,2,2,1,0],
    [1,2,1,1,2,2,1,1,2,1],
    [1,2,1,1,2,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,1],
    [1,2,2,1,1,1,1,2,2,1],
    [0,1,2,2,1,1,2,2,1,0],
    [0,0,1,2,2,2,2,1,0,0],
    [0,0,0,1,1,1,1,0,0,0],
  ];
  const colors = ['#0f172a', '#1e293b', '#38bdf8']; // 0: BG, 1: Outline, 2: Fill
  const cols = grid[0].length;
  const rows = grid.length;
  const cellW = size / cols;
  const cellH = size / rows;

  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = grid[y][x];
      if (c > 0) {
        ctx.fillStyle = colors[c];
        // Math.ceil guards against floating-point edge bleeding in the canvas
        ctx.fillRect(Math.floor(x * cellW), Math.floor(y * cellH), Math.ceil(cellW), Math.ceil(cellH));
      }
    }
  }
}

// 3. Tiling Bricks (Wrapping Demo)
// A seamless pattern that naturally implies repetition for testing GL_REPEAT vs GL_CLAMP_TO_EDGE.
function drawBricks(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#cbd5e1'; // Mortar
  ctx.fillRect(0, 0, size, size);

  const rows = 4;
  const cols = 2;
  const brickH = size / rows;
  const brickW = size / cols;
  const mortar = 8;

  ctx.fillStyle = '#b91c1c'; // Brick red

  for (let r = 0; r < rows; r++) {
    // Offset alternating rows to create the interlocking brick pattern
    const offset = (r % 2 === 0) ? 0 : brickW / 2;
    for (let c = -1; c <= cols; c++) {
      const x = c * brickW + offset;
      const y = r * brickH;
      ctx.fillRect(x + mortar / 2, y + mortar / 2, brickW - mortar, brickH - mortar);
    }
  }
}

let cached: TextureAsset[] | null = null;

export function getSampleTextures(): TextureAsset[] {
  if (cached) return cached;

  const atlas = buildCanvas(256, drawTextureAtlas);
  const pixelSprite = buildCanvas(64, drawPixelSprite); 
  const bricks = buildCanvas(256, drawBricks);

  cached = [
    { id: 'sample-atlas',  name: 'Texture Atlas', isSample: true, ...atlas },
    { id: 'sample-pixel',  name: 'Pixel Art',     isSample: true, ...pixelSprite },
    { id: 'sample-bricks', name: 'Tiling Bricks', isSample: true, ...bricks },
  ];

  return cached;
}