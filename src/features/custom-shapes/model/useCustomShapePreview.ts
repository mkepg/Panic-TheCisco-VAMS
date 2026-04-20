import { useEffect, useRef } from "react";
import { Graphics, Container } from "pixi.js";
import { useVamsStore } from "@/core/store";
interface UseCustomShapePreviewProps {
  pixiReady: boolean;
  worldRef: React.MutableRefObject<Container | null>;
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
    if (pendingShapeType === "TRIANGLE_STRIP") {
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
    }
    else if (pendingShapeType !== "POINTS" && verts.length >= 2) {
      g.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < verts.length; i++) {
        g.lineTo(verts[i].x, verts[i].y);
      }
      const isClosedShape = [
        "POLYGON",
        "RECTANGLE",
        "HEXAGON",
        "TRIANGLE",
        "STAR",
      ].includes(pendingShapeType);
      if (verts.length >= 3 && isClosedShape) {
        g.lineTo(verts[0].x, verts[0].y);
      }
      g.stroke({ color: 0x60a5fa, alpha: 0.7, width: strokeW });
      if (verts.length >= 3 && isClosedShape) {
        g.fill({ color: 0x2563eb, alpha: 0.12 });
      }
    }
    verts.forEach((v) => {
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