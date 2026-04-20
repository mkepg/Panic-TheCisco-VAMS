import * as PIXI from "pixi.js";
import type { SceneNode } from "@/core/types/scene";
import { toNumColor } from "../utils/color-utils";
import { pxToWorld, bboxRadii, buildEllipsePoints, createPaddedHitArea } from "../utils/geometry-utils";
export function drawWithGraphics(
  g: PIXI.Graphics,
  o: SceneNode,
  worldScaleX?: number,
  worldScaleY?: number
): void {
  g.clear();
  const strokeColor = 0xffffff;
  const strokeWidthWorld = pxToWorld(1, worldScaleX);
  const defaultFill = toNumColor(o.vertices[0]?.color, 0xffffff);
  const hitPadding = worldScaleX ? 10 / Math.abs(worldScaleX) : 0.5;
  if (o.type === "POINT" || o.type === "POINTS") {
    renderPointSet(g, o, worldScaleX, worldScaleY, strokeColor, strokeWidthWorld, hitPadding);
    return;
  }
  if (o.type === "LINE") {
    renderLine(g, o, strokeWidthWorld, defaultFill, hitPadding);
    return;
  }
  if (o.type === "LINE_STRIP") {
    renderLinePath(g, o, strokeWidthWorld, defaultFill, hitPadding);
    return;
  }
  if (o.type === "CIRCLE" || o.type === "ELLIPSE") {
    renderCircleOrEllipse(g, o, strokeWidthWorld, strokeColor, defaultFill, hitPadding);
    return;
  }
  renderGenericPolygon(g, o, strokeWidthWorld, strokeColor, defaultFill, hitPadding);
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
function renderLine(
  g: PIXI.Graphics,
  o: SceneNode,
  strokeWidthWorld: number,
  defaultFill: number,
  hitPadding: number
): void {
  const a = o.vertices[0];
  const b = o.vertices[1];
  if (!a || !b) return;
  g.moveTo(a.x, a.y);
  g.lineTo(b.x, b.y);
  g.stroke({ color: defaultFill, alpha: 1, width: strokeWidthWorld });
  const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y);
  g.hitArea = createPaddedHitArea(minX, minY, maxX - minX, maxY - minY, hitPadding);
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
function renderCircleOrEllipse(
  g: PIXI.Graphics,
  o: SceneNode,
  _strokeWidthWorld: number,
  _strokeColor: number,
  defaultFill: number,
  hitPadding: number
): void {
  const { cx, cy, rx, ry } = bboxRadii(o);
  const R = o.type === "CIRCLE" ? (rx + ry) / 2 : undefined;
  const pts = o.type === "CIRCLE"
    ? buildEllipsePoints(cx, cy, R!, R!, 128)
    : buildEllipsePoints(cx, cy, rx, ry, 128);
  g.poly(pts);
  g.fill({ color: defaultFill, alpha: 1 });
  g.hitArea = createPaddedHitArea(
    cx - (o.type === "CIRCLE" ? R! : rx),
    cy - (o.type === "CIRCLE" ? R! : ry),
    2 * (o.type === "CIRCLE" ? R! : rx),
    2 * (o.type === "CIRCLE" ? R! : ry),
    hitPadding
  );
}
function renderGenericPolygon(
  g: PIXI.Graphics,
  o: SceneNode,
  _strokeWidthWorld: number,
  _strokeColor: number,
  defaultFill: number,
  hitPadding: number
): void {
  const pts: number[] = [];
  for (const v of o.vertices) pts.push(v.x, v.y);
  if (pts.length >= 6) {
    g.poly(pts);
    g.fill({ color: defaultFill, alpha: 1 });
    const { cx, cy, rx, ry } = bboxRadii(o);
    g.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
  }
}