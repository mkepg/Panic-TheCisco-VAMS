import * as PIXI from "pixi.js";
import type { SceneNode } from "@/core/types/scene";
import { toNumColor } from "../utils/color-utils";
import { pxToWorld, bboxRadii, createPaddedHitArea } from "../utils/geometry-utils";

export function drawWithGraphics(
  g: PIXI.Graphics,
  o: SceneNode,
  worldScaleX?: number,
  worldScaleY?: number
): void {
  g.clear();
  const strokeColor = 0xffffff;
  
  // Applies accurate Line Width mapping
  const strokeWidthWorld = pxToWorld(o.lineWidth ?? 1, worldScaleX);
  const defaultFill = toNumColor(o.vertices[0]?.color, 0xffffff);
  const hitPadding = worldScaleX ? 10 / Math.abs(worldScaleX) : 0.5;

  if (o.type === "POINTS") {
    renderPointSet(g, o, worldScaleX, worldScaleY, strokeColor, strokeWidthWorld, hitPadding);
    return;
  }

  if (o.type === "LINES") {
    if (o.lineStipple) renderStippledPath(g, o, strokeWidthWorld, defaultFill, hitPadding, worldScaleX, worldScaleY);
    else renderLines(g, o, strokeWidthWorld, defaultFill, hitPadding);
    return;
  }

  if (o.type === "LINE_STRIP") {
    if (o.lineStipple) renderStippledPath(g, o, strokeWidthWorld, defaultFill, hitPadding, worldScaleX, worldScaleY);
    else renderLinePath(g, o, strokeWidthWorld, defaultFill, hitPadding);
    return;
  }

  if (o.type === "LINE_LOOP") {
    if (o.lineStipple) renderStippledPath(g, o, strokeWidthWorld, defaultFill, hitPadding, worldScaleX, worldScaleY);
    else renderLineLoop(g, o, strokeWidthWorld, defaultFill, hitPadding);
    return;
  }

  if (o.type === "TRIANGLES") {
    renderTriangleList(g, o, defaultFill, hitPadding);
    return;
  }

  if (o.type === "TRIANGLE_STRIP") {
    renderTriangleStripShape(g, o, defaultFill, hitPadding);
    return;
  }

  if (o.type === "TRIANGLE_FAN") {
    renderTriangleFan(g, o, defaultFill, hitPadding);
    return;
  }

  if (o.type === "QUADS") {
    renderQuads(g, o, defaultFill, hitPadding);
    return;
  }

  if (o.type === "QUAD_STRIP") {
    renderQuadStrip(g, o, defaultFill, hitPadding);
    return;
  }

  renderGenericPolygon(g, o, strokeWidthWorld, strokeColor, defaultFill, hitPadding);
}

function renderStippledPath(
  g: PIXI.Graphics,
  o: SceneNode,
  strokeWidthWorld: number,
  defaultFill: number,
  hitPadding: number,
  worldScaleX?: number,
  worldScaleY?: number
): void {
  if (o.vertices.length < 2 || !o.lineStipple) return;

  const { factor, pattern } = o.lineStipple;

  // Emulate OpenGL's Bresenham line rasterization length logic
  const objScaleX = o.transform?.scaleX ?? 1;
  const objScaleY = o.transform?.scaleY ?? 1;
  const rotateRad = (o.transform?.rotate ?? 0) * Math.PI / 180;
  const cos = Math.cos(rotateRad);
  const sin = Math.sin(rotateRad);

  const wsX = worldScaleX || 1;
  const wsY = worldScaleY || worldScaleX || 1;

  const drawSegment = (p1: {x: number, y: number}, p2: {x: number, y: number}, state: { bit: number, dist: number }) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    // 1. Transform local delta to object's world delta
    const dxRot = dx * objScaleX * cos - dy * objScaleY * sin;
    const dyRot = dx * objScaleX * sin + dy * objScaleY * cos;

    // 2. Scale to screen pixels
    const screen_dx = dxRot * wsX;
    const screen_dy = dyRot * wsY;

    // 3. OpenGL fragment count is the maximum of the X and Y pixel differences (Major Axis length)
    const fragCount = Math.max(Math.abs(screen_dx), Math.abs(screen_dy));

    if (fragCount === 0) return;

    // 1 factor = 1 fragment (pixel along major axis)
    const bitLength = Math.max(0.0001, factor);
    let remainingFrags = fragCount;

    // Step size in local coordinates per fragment
    const ux = dx / fragCount;
    const uy = dy / fragCount;

    let currentX = p1.x;
    let currentY = p1.y;

    while (remainingFrags > 0) {
      // OpenGL stipple reads from the least significant bit (bit 0) upwards
      const bitValue = (pattern >> state.bit) & 1;
      const remainingInBit = bitLength - state.dist;
      const stepFrags = Math.min(remainingFrags, remainingInBit);

      const nextX = currentX + ux * stepFrags;
      const nextY = currentY + uy * stepFrags;

      if (bitValue === 1) {
        g.moveTo(currentX, currentY);
        g.lineTo(nextX, nextY);
      }

      currentX = nextX;
      currentY = nextY;
      remainingFrags -= stepFrags;
      state.dist += stepFrags;

      if (state.dist >= bitLength) {
        state.dist = 0;
        state.bit = (state.bit + 1) % 16;
      }
    }
  };

  if (o.type === 'LINES') {
    // For independent lines, the stipple pattern is reset at the start of each line pair
    for (let i = 0; i + 1 < o.vertices.length; i += 2) {
      const state = { bit: 0, dist: 0 };
      drawSegment(o.vertices[i], o.vertices[i + 1], state);
    }
  } else {
    // For strips and loops, the stipple pattern continues across vertices
    const state = { bit: 0, dist: 0 };
    for (let i = 0; i < o.vertices.length - 1; i++) {
      drawSegment(o.vertices[i], o.vertices[i + 1], state);
    }
    if (o.type === 'LINE_LOOP' && o.vertices.length >= 3) {
      drawSegment(o.vertices[o.vertices.length - 1], o.vertices[0], state);
    }
  }

  g.stroke({ color: defaultFill, alpha: 1, width: strokeWidthWorld, cap: 'round', join: 'round' });
  const { cx, cy, rx, ry } = bboxRadii(o);
  g.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
}

function renderPointSet(
  g: PIXI.Graphics,
  o: SceneNode,
  worldScaleX: number | undefined,
  worldScaleY: number | undefined,
  _strokeColor: number,
  _strokeWidthWorld: number,
  hitPadding: number
): void {
  const desiredPx = 8.8;
  const sizeWorldX = Math.abs(pxToWorld(desiredPx, worldScaleX));
  const sizeWorldY = Math.abs(pxToWorld(desiredPx, worldScaleY || worldScaleX));
  const halfX = sizeWorldX / 2;
  const halfY = sizeWorldY / 2;

  o.vertices.forEach((v) => {
    const color = toNumColor(v.color, 0xffffff);
    g.rect(v.x - halfX, v.y - halfY, sizeWorldX, sizeWorldY);
    g.fill({ color: color, alpha: 1 });
  });

  if (o.vertices.length > 0) {
    const { cx, cy, rx, ry } = bboxRadii(o);
    const boundsX = (cx - rx) - halfX;
    const boundsY = (cy - ry) - halfY;
    const boundsW = (rx * 2) + sizeWorldX;
    const boundsH = (ry * 2) + sizeWorldY;
    g.hitArea = createPaddedHitArea(boundsX, boundsY, boundsW, boundsH, hitPadding);
  }
}

function renderLines(
  g: PIXI.Graphics,
  o: SceneNode,
  strokeWidthWorld: number,
  defaultFill: number,
  hitPadding: number
): void {
  if (o.vertices.length < 2) return;

  for (let i = 0; i + 1 < o.vertices.length; i += 2) {
    g.moveTo(o.vertices[i].x, o.vertices[i].y);
    g.lineTo(o.vertices[i + 1].x, o.vertices[i + 1].y);
  }
  g.stroke({ color: defaultFill, alpha: 1, width: strokeWidthWorld, cap: 'round' });

  const { cx, cy, rx, ry } = bboxRadii(o);
  g.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
}

function renderLinePath(
  g: PIXI.Graphics,
  o: SceneNode,
  strokeWidthWorld: number,
  defaultFill: number,
  hitPadding: number
): void {
  if (o.vertices.length < 2) return;

  g.moveTo(o.vertices[0].x, o.vertices[0].y);
  for (let i = 1; i < o.vertices.length; i++) {
    g.lineTo(o.vertices[i].x, o.vertices[i].y);
  }
  g.stroke({ color: defaultFill, alpha: 1, width: strokeWidthWorld, join: 'round', cap: 'round' });

  const { cx, cy, rx, ry } = bboxRadii(o);
  g.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
}

function renderLineLoop(
  g: PIXI.Graphics,
  o: SceneNode,
  strokeWidthWorld: number,
  defaultFill: number,
  hitPadding: number
): void {
  if (o.vertices.length < 2) return;

  g.moveTo(o.vertices[0].x, o.vertices[0].y);
  for (let i = 1; i < o.vertices.length; i++) {
    g.lineTo(o.vertices[i].x, o.vertices[i].y);
  }
  g.lineTo(o.vertices[0].x, o.vertices[0].y);
  g.stroke({ color: defaultFill, alpha: 1, width: strokeWidthWorld, join: 'round', cap: 'round' });

  const { cx, cy, rx, ry } = bboxRadii(o);
  g.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
}

function renderTriangleList(
  g: PIXI.Graphics,
  o: SceneNode,
  defaultFill: number,
  hitPadding: number
): void {
  const n = o.vertices.length;
  if (n < 3) return;

  for (let i = 0; i + 2 < n; i += 3) {
    const v0 = o.vertices[i];
    const v1 = o.vertices[i + 1];
    const v2 = o.vertices[i + 2];
    g.poly([v0.x, v0.y, v1.x, v1.y, v2.x, v2.y]);
    g.fill({ color: defaultFill, alpha: 1 });
  }

  const { cx, cy, rx, ry } = bboxRadii(o);
  g.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
}

function renderTriangleStripShape(
  g: PIXI.Graphics,
  o: SceneNode,
  defaultFill: number,
  hitPadding: number
): void {
  const n = o.vertices.length;
  if (n < 3) return;

  for (let i = 0; i + 2 < n; i++) {
    const v0 = o.vertices[i];
    const v1 = o.vertices[i + 1];
    const v2 = o.vertices[i + 2];
    g.poly([v0.x, v0.y, v1.x, v1.y, v2.x, v2.y]);
    g.fill({ color: defaultFill, alpha: 1 });
  }

  const { cx, cy, rx, ry } = bboxRadii(o);
  g.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
}

function renderTriangleFan(
  g: PIXI.Graphics,
  o: SceneNode,
  defaultFill: number,
  hitPadding: number
): void {
  const n = o.vertices.length;
  if (n < 3) return;

  const v0 = o.vertices[0];
  for (let i = 1; i < n - 1; i++) {
    const v1 = o.vertices[i];
    const v2 = o.vertices[i + 1];
    g.poly([v0.x, v0.y, v1.x, v1.y, v2.x, v2.y]);
    g.fill({ color: defaultFill, alpha: 1 });
  }

  const { cx, cy, rx, ry } = bboxRadii(o);
  g.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
}

function renderQuads(
  g: PIXI.Graphics,
  o: SceneNode,
  defaultFill: number,
  hitPadding: number
): void {
  const n = o.vertices.length;
  if (n < 4) return;

  for (let i = 0; i + 3 < n; i += 4) {
    const v0 = o.vertices[i];
    const v1 = o.vertices[i + 1];
    const v2 = o.vertices[i + 2];
    const v3 = o.vertices[i + 3];

    g.poly([v0.x, v0.y, v1.x, v1.y, v3.x, v3.y]);
    g.fill({ color: defaultFill, alpha: 1 });
    g.poly([v1.x, v1.y, v2.x, v2.y, v3.x, v3.y]);
    g.fill({ color: defaultFill, alpha: 1 });
  }

  const { cx, cy, rx, ry } = bboxRadii(o);
  g.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
}

function renderQuadStrip(
  g: PIXI.Graphics,
  o: SceneNode,
  defaultFill: number,
  hitPadding: number
): void {
  const n = o.vertices.length;
  if (n < 4) return;

  for (let i = 0; i + 3 < n; i += 2) {
    const v0 = o.vertices[i];
    const v1 = o.vertices[i + 1];
    const v2 = o.vertices[i + 2];
    const v3 = o.vertices[i + 3];

    g.poly([v0.x, v0.y, v1.x, v1.y, v3.x, v3.y]);
    g.fill({ color: defaultFill, alpha: 1 });
    g.poly([v0.x, v0.y, v3.x, v3.y, v2.x, v2.y]);
    g.fill({ color: defaultFill, alpha: 1 });
  }

  const { cx, cy, rx, ry } = bboxRadii(o);
  g.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
}

function renderGenericPolygon(
  g: PIXI.Graphics,
  o: SceneNode,
  _strokeWidthWorld: number,
  _strokeColor: number,
  defaultFill: number,
  hitPadding: number
): void {
  if (o.vertices.length >= 3) {
    const v0 = o.vertices[0];
    for (let i = 1; i < o.vertices.length - 1; i++) {
      const v1 = o.vertices[i];
      const v2 = o.vertices[i + 1];
      g.poly([v0.x, v0.y, v1.x, v1.y, v2.x, v2.y]);
      g.fill({ color: defaultFill, alpha: 1 });
    }

    const { cx, cy, rx, ry } = bboxRadii(o);
    g.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
  }
}