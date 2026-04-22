import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { Container, FederatedPointerEvent, Mesh } from "pixi.js";
import { useVamsStore } from "@/core/store";
import { createDrawable } from "@/shared/engine/pixi/primitives";
import type { SelectionOverlay } from "@/shared/engine/selection-overlay";
import type { SceneNode } from "@/core/types/scene";

interface UseSceneRendererProps {
  pixiReady: boolean;
  appRef: React.MutableRefObject<PIXI.Application | null>;
  worldRef: React.MutableRefObject<Container | null>;
  overlayRef: React.MutableRefObject<SelectionOverlay | null>;
  applyViewportTransform: () => void;
}

interface DragInfo {
  id: string;
  offsetX: number;
  offsetY: number;
  historyPushed: boolean;
}

export function useSceneRenderer({
  pixiReady,
  appRef,
  worldRef,
  overlayRef,
  applyViewportTransform,
}: UseSceneRendererProps) {
  const dragRef = useRef<DragInfo | null>(null);
  const interactionModeRef = useRef<string>("SELECT");
  const pushToHistoryRef = useRef<() => void>(() => {});
  const containersRef = useRef<Map<string, Container>>(new Map());
  const objectsRef = useRef<SceneNode[]>([]);
  const prevObjectsRef = useRef<Map<string, SceneNode>>(new Map());
  const prevSelectedObjectIdRef = useRef<string | null>(null);
  const prevWorldScaleRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const objects = useVamsStore((s) => s.objects);
  const selectedObjectId = useVamsStore((s) => s.selectedObjectId);
  const interactionMode = useVamsStore((s) => s.interactionMode);
  const selectObject = useVamsStore((s) => s.selectObject);
  const updateObjectTransform = useVamsStore((s) => s.updateObjectTransform);
  const pushToHistory = useVamsStore((s) => s.pushToHistory);

  useEffect(() => {
    interactionModeRef.current = interactionMode;
  }, [interactionMode]);

  useEffect(() => {
    pushToHistoryRef.current = pushToHistory;
  }, [pushToHistory]);

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    const app = appRef.current;
    const overlay = overlayRef.current;
    if (!app || !overlay || !pixiReady) return;

    const tickerFn = () => {
      if (overlay) overlay.update();
    };
    app.ticker.add(tickerFn);

    return () => {
      app.ticker.remove(tickerFn);
    };
  }, [pixiReady, appRef, overlayRef]);

  useEffect(() => {
    const app = appRef.current;
    const world = worldRef.current;
    const overlay = overlayRef.current;
    if (!app || !world || !overlay || !pixiReady) return;

    const onStageMove = (e: FederatedPointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !world) return;

      if (app.canvas.style.cursor !== "grabbing") {
        app.canvas.style.cursor = "grabbing";
      }

      const p = world.toLocal(e.global);
      const newX = p.x - drag.offsetX;
      const newY = p.y - drag.offsetY;

      const container = containersRef.current.get(drag.id);
      if (container) {
        container.position.set(newX, newY);
      }

      if (overlay) overlay.update();

      if (!drag.historyPushed) {
        pushToHistoryRef.current();
        drag.historyPushed = true;
      }
    };

    const endDrag = () => {
      const drag = dragRef.current;
      if (!drag) return;

      const container = containersRef.current.get(drag.id);
      if (container) {
        updateObjectTransform(drag.id, {
          translateX: container.position.x,
          translateY: container.position.y,
        });
      }

      dragRef.current = null;
      app.canvas.style.cursor = "grab";
    };

    app.stage.on("globalpointermove", onStageMove);
    app.stage.on("pointerup", endDrag);
    app.stage.on("pointerupoutside", endDrag);
    app.stage.on("pointercancel", endDrag);

    return () => {
      app.stage.off("globalpointermove", onStageMove);
      app.stage.off("pointerup", endDrag);
      app.stage.off("pointerupoutside", endDrag);
      app.stage.off("pointercancel", endDrag);
    };
  }, [pixiReady, appRef, worldRef, overlayRef, updateObjectTransform]);

  useEffect(() => {
    const world = worldRef.current;
    const app = appRef.current;
    const overlay = overlayRef.current;
    if (!world || !app || !overlay || !pixiReady) return;

    applyViewportTransform();

    const unusedIds = new Set(containersRef.current.keys());
    const nextContainers = new Map<string, Container>();
    const nextObjectsMap = new Map<string, SceneNode>();

    const worldScaleX = world.scale.x;
    const worldScaleY = world.scale.y;

    const worldScaleChanged =
      prevWorldScaleRef.current.x !== worldScaleX ||
      prevWorldScaleRef.current.y !== worldScaleY;

    objects.forEach((obj, index) => {
      nextObjectsMap.set(obj.id, obj);

      let container = containersRef.current.get(obj.id);
      const prevObj = prevObjectsRef.current.get(obj.id);

      const isSelected = obj.id === selectedObjectId;
      const wasSelected = prevSelectedObjectIdRef.current === obj.id;

      let needsRebuild =
        !container ||
        !prevObj ||
        worldScaleChanged ||
        prevObj.type !== obj.type ||
        prevObj.vertices !== obj.vertices ||
        prevObj.textContent !== obj.textContent ||
        prevObj.shading !== obj.shading;

      if (
        obj.type === "GROUP" &&
        (isSelected !== wasSelected || prevObj?.childIds !== obj.childIds || isSelected)
      ) {
        needsRebuild = true;
      }

      if (needsRebuild) {
        if (container) {
          container.removeChildren();
          let groupChildren: SceneNode[] | undefined;
          if (obj.type === "GROUP") {
            groupChildren = objects.filter((c) => c.parentId === obj.id);
          }
          const newContent = createDrawable(obj, worldScaleX, {
            groupChildren,
            isSelected,
            worldScaleY,
          });
          while (newContent.children.length > 0) {
            container.addChild(newContent.children[0]);
          }
          container.hitArea = newContent.hitArea;
          newContent.destroy();
        } else {
          let groupChildren: SceneNode[] | undefined;
          if (obj.type === "GROUP") {
            groupChildren = objects.filter((c) => c.parentId === obj.id);
          }
          container = createDrawable(obj, worldScaleX, {
            groupChildren,
            isSelected,
            worldScaleY,
          });
        }
      }

      unusedIds.delete(obj.id);

      const t = obj.transform;
      container!.position.set(t.translateX, t.translateY);
      container!.rotation = (t.rotate * Math.PI) / 180;
      container!.scale.set(t.scale);
      container!.visible = obj.isVisible;
      container!.zIndex = objects.length - index;
      container!.label = obj.id;
      container!.sortableChildren = true;

      const listenersNeedUpdate = needsRebuild || !prevObj;

      if (listenersNeedUpdate) {
        container!.removeAllListeners();
        container!.eventMode = "static";

        container!.on("pointerover", () => {
          if (!dragRef.current) {
            const mode = interactionModeRef.current;
            if (mode === "CUSTOM_SHAPE_PLACE") {
              app.canvas.style.cursor = "crosshair";
            } else if (mode === "VERTEX_EDIT") {
              app.canvas.style.cursor = "default";
            } else {
              app.canvas.style.cursor = "grab";
            }
          }
        });

        container!.on("pointerout", () => {
          if (!dragRef.current) {
            const mode = interactionModeRef.current;
            if (mode === "CUSTOM_SHAPE_PLACE") {
              app.canvas.style.cursor = "crosshair";
            } else {
              app.canvas.style.cursor = "default";
            }
          }
        });

        container!.on("pointerdown", (e: FederatedPointerEvent) => {
          if (interactionModeRef.current === "CUSTOM_SHAPE_PLACE") return;
          e.stopPropagation();
          selectObject(obj.id);

          if (e.button === 0 && interactionModeRef.current !== "VERTEX_EDIT") {
            const p = world.toLocal(e.global);
            const currentObj = objectsRef.current.find((o) => o.id === obj.id);
            if (currentObj) {
              dragRef.current = {
                id: currentObj.id,
                offsetX: p.x - currentObj.transform.translateX,
                offsetY: p.y - currentObj.transform.translateY,
                historyPushed: false,
              };
              app.canvas.style.cursor = "grabbing";
            }
          }
        });
      }

      nextContainers.set(obj.id, container!);
    });

    if (overlay.parent) overlay.parent.removeChild(overlay);

    objects.forEach((obj) => {
      const container = nextContainers.get(obj.id);
      if (!container) return;

      const isRoot = !obj.parentId;

      if (isRoot) {
        if (container.parent !== world) {
          world.addChild(container);
        }
        container.eventMode = 'static';
      } else {
        const parentContainer = nextContainers.get(obj.parentId!);
        if (parentContainer && container.parent !== parentContainer) {
          parentContainer.addChild(container);
          container.eventMode = 'none';
        }
      }
    });

    unusedIds.forEach((id) => {
      const c = containersRef.current.get(id);
      if (c) {
        c.children.forEach((child) => {
          if (child instanceof Mesh && child.geometry) {
            child.geometry.destroy();
          }
        });
        c.destroy({ children: true });
        if (c.parent) c.parent.removeChild(c);
      }
    });

    containersRef.current = nextContainers;
    prevObjectsRef.current = nextObjectsMap;
    prevSelectedObjectIdRef.current = selectedObjectId;
    prevWorldScaleRef.current = { x: worldScaleX, y: worldScaleY };

    world.addChild(overlay);
  }, [
    pixiReady,
    objects,
    selectedObjectId,
    worldRef,
    appRef,
    overlayRef,
    selectObject,
    applyViewportTransform,
  ]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (selectedObjectId) {
      const target = containersRef.current.get(selectedObjectId);
      if (target && !target.destroyed) {
        overlay.setTarget(target);
        overlay.visible = true;
      } else {
        overlay.setTarget(null);
        overlay.visible = false;
      }
    } else {
      overlay.setTarget(null);
      overlay.visible = false;
    }
  }, [selectedObjectId, objects, worldRef, overlayRef]);
}