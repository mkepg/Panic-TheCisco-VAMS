import { useEffect, useRef } from "react";
import { Graphics, Container } from "pixi.js";
import { useVamsStore } from "@/core/store";
import type { PendingVertex } from "@/core/types/scene";
interface UseCustomShapePreviewProps {
  pixiReady: boolean;
  worldRef: React.MutableRefObject<Container | null>;
}
function drawDashedLine(
  g: Graphics,
  from: PendingVertex,
  to: PendingVertex,
  strokeW: number,
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return;
  const dashLen = strokeW * 8;
  const gapLen = strokeW * 5;
  const stride = dashLen + gapLen;
  const steps = Math.max(1, Math.floor(length / stride));
  const ux = dx / length;
  const uy = dy / length;
  for (let i = 0; i < steps; i++) {
    const s = i * stride;
    const e = Math.min(s + dashLen, length);
    g.moveTo(from.x + ux * s, from.y + uy * s);
    g.lineTo(from.x + ux * e, from.y + uy * e);
  }
  g.stroke({ color: 0x60a5fa, alpha: 0.6, width: strokeW });
}
export function useCustomShapePreview({
  pixiReady,
  worldRef,
}: UseCustomShapePreviewProps) {
  const previewRef = useRef<Graphics | null>(null);
  const pendingShapeType = useVamsStore((s) => s.pendingShapeType);
  const pendingVertices = useVamsStore((s) => s.pendingVertices);
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    if (previewRef.current) {
      previewRef.current.destroy();
      previewRef.current = null;
    }
    if (!pendingShapeType || pendingVertices.length === 0) return;
    const g = new Graphics();
    world.addChild(g);
    previewRef.current = g;
    const verts = pendingVertices;
    const worldScaleX = world.scale.x;
    const strokeW = worldScaleX !== 0 ? 1 / Math.abs(worldScaleX) : 0.02;
    const dotRadius = worldScaleX !== 0 ? 5 / Math.abs(worldScaleX) : 0.04;
    switch (pendingShapeType) {
      case "POINTS": {
        break;
      }
      case "LINES": {
        for (let i = 0; i + 1 < verts.length; i += 2) {
          g.moveTo(verts[i].x, verts[i].y);
          g.lineTo(verts[i + 1].x, verts[i + 1].y);
        }
        if (Math.floor(verts.length / 2) > 0) {
          g.stroke({ color: 0x60a5fa, alpha: 0.8, width: strokeW });
        }
        if (verts.length % 2 !== 0) {
          const last = verts[verts.length - 1];
          g.circle(last.x, last.y, dotRadius);
          g.fill({ color: 0x60a5fa, alpha: 0.4 });
        }
        break;
      }
      case "LINE_STRIP": {
        if (verts.length >= 2) {
          g.moveTo(verts[0].x, verts[0].y);
          for (let i = 1; i < verts.length; i++) {
            g.lineTo(verts[i].x, verts[i].y);
          }
          g.stroke({ color: 0x60a5fa, alpha: 0.8, width: strokeW });
        }
        break;
      }
      case "LINE_LOOP": {
        if (verts.length >= 2) {
          g.moveTo(verts[0].x, verts[0].y);
          for (let i = 1; i < verts.length; i++) {
            g.lineTo(verts[i].x, verts[i].y);
          }
          g.stroke({ color: 0x60a5fa, alpha: 0.8, width: strokeW });
        }
        if (verts.length >= 3) {
          drawDashedLine(g, verts[verts.length - 1], verts[0], strokeW);
        }
        break;
      }
      case "TRIANGLES": {
        const completeTriangles = Math.floor(verts.length / 3);
        for (let i = 0; i < completeTriangles * 3; i += 3) {
          g.poly([
            verts[i].x, verts[i].y,
            verts[i + 1].x, verts[i + 1].y,
            verts[i + 2].x, verts[i + 2].y,
          ]);
          g.fill({ color: 0x2563eb, alpha: 0.12 });
          g.stroke({ color: 0x60a5fa, alpha: 0.7, width: strokeW });
        }
        break;
      }
      case "TRIANGLE_STRIP": {
        if (verts.length >= 3) {
          for (let i = 0; i < verts.length - 2; i++) {
            g.moveTo(verts[i].x, verts[i].y);
            g.lineTo(verts[i + 1].x, verts[i + 1].y);
            g.lineTo(verts[i + 2].x, verts[i + 2].y);
            g.closePath();
            g.fill({ color: 0x2563eb, alpha: 0.12 });
            g.stroke({ color: 0x60a5fa, alpha: 0.2, width: strokeW * 0.5 });
          }
        }
        if (verts.length >= 2) {
          g.moveTo(verts[0].x, verts[0].y);
          for (let i = 1; i < verts.length; i++) {
            g.lineTo(verts[i].x, verts[i].y);
          }
          g.stroke({ color: 0x60a5fa, alpha: 0.8, width: strokeW });
        }
        break;
      }
      case "TRIANGLE_FAN": {
        if (verts.length >= 3) {
          for (let i = 1; i < verts.length - 1; i++) {
            g.poly([
              verts[0].x, verts[0].y,
              verts[i].x, verts[i].y,
              verts[i + 1].x, verts[i + 1].y,
            ]);
            g.fill({ color: 0x2563eb, alpha: 0.12 });
            g.stroke({ color: 0x60a5fa, alpha: 0.7, width: strokeW });
          }
        }
        break;
      }
      case "QUADS": {
        const completeQuads = Math.floor(verts.length / 4);
        for (let i = 0; i < completeQuads * 4; i += 4) {
          g.poly([
            verts[i].x, verts[i].y,
            verts[i + 1].x, verts[i + 1].y,
            verts[i + 2].x, verts[i + 2].y,
            verts[i + 3].x, verts[i + 3].y,
          ]);
          g.fill({ color: 0x2563eb, alpha: 0.12 });
          g.stroke({ color: 0x60a5fa, alpha: 0.7, width: strokeW });
        }
        break;
      }
      case "QUAD_STRIP": {
        for (let i = 0; i + 3 < verts.length; i += 2) {
          g.poly([
            verts[i].x, verts[i].y,
            verts[i + 1].x, verts[i + 1].y,
            verts[i + 3].x, verts[i + 3].y,
            verts[i + 2].x, verts[i + 2].y,
          ]);
          g.fill({ color: 0x2563eb, alpha: 0.12 });
          g.stroke({ color: 0x60a5fa, alpha: 0.7, width: strokeW });
        }
        break;
      }
      case "POLYGON": {
        if (verts.length >= 2) {
          g.moveTo(verts[0].x, verts[0].y);
          for (let i = 1; i < verts.length; i++) {
            g.lineTo(verts[i].x, verts[i].y);
          }
          if (verts.length >= 3) {
            g.lineTo(verts[0].x, verts[0].y);
          }
          g.stroke({ color: 0x60a5fa, alpha: 0.7, width: strokeW });
          if (verts.length >= 3) {
            g.fill({ color: 0x2563eb, alpha: 0.12 });
          }
        }
        break;
      }
    }
    verts.forEach((v, i) => {
      if (pendingShapeType === "TRIANGLE_FAN" && i === 0) {
        g.circle(v.x, v.y, dotRadius * 1.8);
        g.fill({ color: 0xf97316, alpha: 0.25 });
        g.circle(v.x, v.y, dotRadius * 1.4);
        g.fill({ color: 0xf97316, alpha: 1 });
        g.circle(v.x, v.y, dotRadius * 1.4);
        g.stroke({ color: 0xffffff, alpha: 0.9, width: strokeW * 0.8 });
        return;
      }
      g.circle(v.x, v.y, dotRadius * 1.6);
      g.fill({ color: 0x2563eb, alpha: 0.25 });
      g.circle(v.x, v.y, dotRadius);
      g.fill({ color: 0x60a5fa, alpha: 1 });
      g.circle(v.x, v.y, dotRadius);
      g.stroke({ color: 0xffffff, alpha: 0.9, width: strokeW * 0.8 });
    });
  }, [pendingShapeType, pendingVertices, pixiReady, worldRef]);
  useEffect(() => {
    return () => {
      if (previewRef.current) {
        previewRef.current.destroy();
        previewRef.current = null;
      }
    };
  }, []);
}
