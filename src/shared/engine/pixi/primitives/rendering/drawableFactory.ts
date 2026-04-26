import * as PIXI from "pixi.js";
import type { SceneNode } from "@/core/types/scene";
import { toNumColor } from "../utils/color-utils";
import {
  pxToWorld,
  bboxRadii,
  hasUniformColor,
  createPaddedHitArea,
  getGroupLocalBounds
} from "../utils/geometry-utils";
import { drawWithGraphics } from "./graphicsRenderer";
import { createMesh } from "./meshRenderer";

export interface CreateDrawableOptions {
  groupChildren?: SceneNode[];
  isSelected?: boolean;
  worldScaleY?: number;
}

export function createDrawable(
  o: SceneNode,
  worldScaleX?: number,
  options?: CreateDrawableOptions
): PIXI.Container {
  const container = new PIXI.Container();
  container.label = o.id;
  container.sortableChildren = true;

  const hitPadding = worldScaleX ? 10 / Math.abs(worldScaleX) : 0.5;
  const worldScaleY = options?.worldScaleY;

  if (o.type === 'GROUP') {
    return createGroupDrawable(o, worldScaleX, options, container);
  }

  if (o.type === 'TEXT') {
    return createTextDrawable(o, hitPadding, container);
  }

  // Force stippled lines to use the graphics renderer because the mesh renderer 
  // doesn't support custom stippling fragment shaders out of the box.
  const shouldUseGraphics = o.type === 'POINTS' || hasUniformColor(o) || !!o.lineStipple;

  if (shouldUseGraphics) {
    return createGraphicsDrawable(o, worldScaleX, worldScaleY, hitPadding, container);
  }

  return createMeshDrawable(o, worldScaleX, hitPadding, container);
}

function createGroupDrawable(
  o: SceneNode,
  worldScaleX: number | undefined,
  options: CreateDrawableOptions | undefined,
  container: PIXI.Container
): PIXI.Container {
  container.position.set(o.transform.translateX, o.transform.translateY);
  container.rotation = (o.transform.rotate * Math.PI) / 180;
  container.scale.set(o.transform.scaleX, o.transform.scaleY);
  container.visible = o.visible;

  const bounds = getGroupLocalBounds(options?.groupChildren || []);
  const padding = pxToWorld(4, worldScaleX);

  const drawX = bounds.minX - padding;
  const drawY = bounds.minY - padding;
  const drawW = bounds.width + (padding * 2);
  const drawH = bounds.height + (padding * 2);

  const groupGraphics = new PIXI.Graphics();

  if (options?.isSelected) {
      groupGraphics.setStrokeStyle({
        width: pxToWorld(1, worldScaleX),
        color: 0x0099ff,
        alpha: 0.3,
        alignment: 0.5
      });
      drawDashedRectangle(groupGraphics, drawX, drawY, drawW, drawH);
      groupGraphics.stroke();
  }

  container.addChild(groupGraphics);
  container.hitArea = new PIXI.Rectangle(drawX, drawY, drawW, drawH);
  return container;
}

function drawDashedRectangle(
  graphics: PIXI.Graphics,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const dashLength = 0.2;
  const gapLength = 0.15;
  const points = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
    { x, y }
  ];

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const sideLength = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(sideLength / (dashLength + gapLength));

    for (let j = 0; j < steps; j++) {
      const t1 = j / steps;
      const t2 = Math.min((j + 0.6) / steps, 1);

      const x1 = start.x + dx * t1;
      const y1 = start.y + dy * t1;
      const x2 = start.x + dx * t2;
      const y2 = start.y + dy * t2;

      graphics.moveTo(x1, y1);
      graphics.lineTo(x2, y2);
    }
  }
}

function createTextDrawable(
  o: SceneNode,
  hitPadding: number,
  container: PIXI.Container
): PIXI.Container {
  const color = toNumColor(o.vertices[0]?.color, 0xffffff);

  const textStyle = new PIXI.TextStyle({
    fontFamily: "Comfortaa",
    fontSize: 64,
    fill: color,
    align: 'center',
    fontWeight: '300',
  });

  const text = new PIXI.Text({
    text: o.textContent || '',
    style: textStyle,
    resolution: 2,
  });

  text.anchor.set(0.5);
  const textScaleX = 0.003;
  const textScaleY = 0.003 * (0.0016 / 0.0011);
  text.scale.set(textScaleX, -textScaleY);

  container.position.set(o.transform.translateX, o.transform.translateY);
  container.rotation = (o.transform.rotate * Math.PI) / 180;
  container.scale.set(o.transform.scaleX, o.transform.scaleY);
  container.visible = o.visible;
  container.zIndex = 10;
  container.addChild(text);

  const w = text.width;
  const h = text.height;
  container.hitArea = createPaddedHitArea(-w/2, -h/2, w, h, hitPadding);
  return container;
}

function createGraphicsDrawable(
  o: SceneNode,
  worldScaleX: number | undefined,
  worldScaleY: number | undefined,
  hitPadding: number,
  container: PIXI.Container
): PIXI.Container {
  const g = new PIXI.Graphics();
  drawWithGraphics(g, o, worldScaleX, worldScaleY);

  container.addChild(g);
  container.position.set(o.transform.translateX, o.transform.translateY);
  container.rotation = (o.transform.rotate * Math.PI) / 180;
  container.scale.set(o.transform.scaleX, o.transform.scaleY);
  container.visible = o.visible;

  if (!g.hitArea) {
    const { cx, cy, rx, ry } = bboxRadii(o);
    container.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
  }

  return container;
}

function createMeshDrawable(
  o: SceneNode,
  worldScaleX: number | undefined,
  hitPadding: number,
  container: PIXI.Container
): PIXI.Container {
  const meshResult = createMesh(o);

  if (!meshResult) {
    const g = new PIXI.Graphics();
    drawWithGraphics(g, o, worldScaleX);
    container.addChild(g);
    container.position.set(o.transform.translateX, o.transform.translateY);
    container.rotation = (o.transform.rotate * Math.PI) / 180;
    container.scale.set(o.transform.scaleX, o.transform.scaleY);
    container.visible = o.visible;
    if (!g.hitArea) {
      const { cx, cy, rx, ry } = bboxRadii(o);
      container.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
    }
    return container;
  }

  container.addChild(meshResult.mesh);
  container.position.set(o.transform.translateX, o.transform.translateY);
  container.rotation = (o.transform.rotate * Math.PI) / 180;
  container.scale.set(o.transform.scaleX, o.transform.scaleY);
  container.visible = o.visible;

  const { cx, cy, rx, ry } = bboxRadii(o);
  container.hitArea = createPaddedHitArea(cx - rx, cy - ry, rx * 2, ry * 2, hitPadding);
  return container;
}