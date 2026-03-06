import { useEffect, useRef, useCallback } from "react";
import { Application, FederatedPointerEvent, Container, Text, TextStyle } from "pixi.js";
import { useVamsStore } from "@/stores";
import type { VamsObject, Behavior, TransformState } from "@/types";

interface UseBehaviorEngineProps {
  pixiReady: boolean;
  appRef: React.MutableRefObject<Application | null>;
  transformCacheRef: React.MutableRefObject<Map<string, TransformState>>;
  containersRef: React.MutableRefObject<Map<string, Container>>;
}

interface TimerState {
  lastTrigger: number;
  interval: number;
}

interface CollisionState {
  isActive: boolean;
  lastTrigger: number;
  interval: number;
  originalColors?: { id: string; color: string }[];
}

interface Point {
  x: number;
  y: number;
}

function multiplyMatrices(m1: number[][], m2: number[][]): number[][] {
    const result = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];
    for(let i = 0; i < 3; i++) {
        for(let j = 0; j < 3; j++) {
            for(let k = 0; k < 3; k++) {
                result[i][j] += m1[i][k] * m2[k][j];
            }
        }
    }
    return result;
}

function getLocalMatrix(t: TransformState): number[][] {
    const rad = (t.rotate * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return [
        [t.scale * cos, -t.scale * sin, t.translateX],
        [t.scale * sin,  t.scale * cos, t.translateY],
        [0,             0,             1           ]
    ];
}

function getGlobalTransformMatrix(obj: VamsObject, allObjects: VamsObject[], cache: Map<string, TransformState>): number[][] {
    let matrix = getLocalMatrix(cache.get(obj.id) || obj.transform);
    let currentObj = obj;
    while (currentObj.parentId) {
        const parent = allObjects.find(o => o.id === currentObj.parentId);
        if (!parent) break;
        const pt = cache.get(parent.id) || parent.transform;
        const parentMat = getLocalMatrix(pt);
        matrix = multiplyMatrices(parentMat, matrix);
        currentObj = parent;
    }
    return matrix;
}

function applyMatrixToPoint(matrix: number[][], point: Point): Point {
    return {
        x: matrix[0][0] * point.x + matrix[0][1] * point.y + matrix[0][2],
        y: matrix[1][0] * point.x + matrix[1][1] * point.y + matrix[1][2]
    };
}

function isPointInPolygon(point: Point, vs: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i].x, yi = vs[i].y;
        const xj = vs[j].x, yj = vs[j].y;
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function doLineSegmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
    const ccw = (a: Point, b: Point, c: Point) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
    return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
}

function checkConcaveCollision(verts1: Point[], verts2: Point[]): boolean {
    for (const v of verts1) {
        if (isPointInPolygon(v, verts2)) return true;
    }
    for (const v of verts2) {
        if (isPointInPolygon(v, verts1)) return true;
    }
    for (let i = 0; i < verts1.length; i++) {
        const p1 = verts1[i];
        const p2 = verts1[(i + 1) % verts1.length];
        for (let j = 0; j < verts2.length; j++) {
            const p3 = verts2[j];
            const p4 = verts2[(j + 1) % verts2.length];
            if (doLineSegmentsIntersect(p1, p2, p3, p4)) return true;
        }
    }
    return false;
}

function projectPolygon(axis: Point, vertices: Point[]) {
  let min = Infinity;
  let max = -Infinity;
  for (const v of vertices) {
    const dot = v.x * axis.x + v.y * axis.y;
    if (dot < min) min = dot;
    if (dot > max) max = dot;
  }
  return { min, max };
}

function getAxes(vertices: Point[]) {
  const axes = [];
  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % vertices.length];
    const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
    const normal = { x: -edge.y, y: edge.x };
    const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    if (len > 0) {
      axes.push({ x: normal.x / len, y: normal.y / len });
    }
  }
  return axes;
}

function checkConvexSAT(verts1: Point[], verts2: Point[]): boolean {
  const axes = [...getAxes(verts1), ...getAxes(verts2)];
  if (axes.length === 0) return true;
  for (const axis of axes) {
    const p1 = projectPolygon(axis, verts1);
    const p2 = projectPolygon(axis, verts2);
    if (p1.max < p2.min || p2.max < p1.min) {
      return false;
    }
  }
  return true;
}

function checkPrimitiveCollision(obj1: VamsObject, obj2: VamsObject, allObjects: VamsObject[], cache: Map<string, TransformState>): boolean {
  if (!obj1.isVisible || !obj2.isVisible) return false;
  if (obj1.vertices.length === 0 || obj2.vertices.length === 0) return false;

  const m1 = getGlobalTransformMatrix(obj1, allObjects, cache);
  const m2 = getGlobalTransformMatrix(obj2, allObjects, cache);

  const verts1 = obj1.vertices.map((v) => applyMatrixToPoint(m1, v));
  const verts2 = obj2.vertices.map((v) => applyMatrixToPoint(m2, v));

  let minX1 = Infinity, maxX1 = -Infinity, minY1 = Infinity, maxY1 = -Infinity;
  let minX2 = Infinity, maxX2 = -Infinity, minY2 = Infinity, maxY2 = -Infinity;

  for (const v of verts1) {
    minX1 = Math.min(minX1, v.x); maxX1 = Math.max(maxX1, v.x);
    minY1 = Math.min(minY1, v.y); maxY1 = Math.max(maxY1, v.y);
  }
  for (const v of verts2) {
    minX2 = Math.min(minX2, v.x); maxX2 = Math.max(maxX2, v.x);
    minY2 = Math.min(minY2, v.y); maxY2 = Math.max(maxY2, v.y);
  }

  // Broadphase AABB Check
  if (maxX1 < minX2 || minX1 > maxX2 || maxY1 < minY2 || minY1 > maxY2) {
    return false;
  }

  const complexTypes = ['POLYGON', 'STAR', 'TRIANGLE_STRIP', 'LINE_STRIP', 'CUSTOM_SHAPE_PLACE'];
  const isComplex1 = complexTypes.includes(obj1.type);
  const isComplex2 = complexTypes.includes(obj2.type);

  if (isComplex1 || isComplex2) {
      return checkConcaveCollision(verts1, verts2);
  } else {
      return checkConvexSAT(verts1, verts2);
  }
}

function checkCollision(obj1: VamsObject, obj2: VamsObject, allObjects: VamsObject[], cache: Map<string, TransformState>): boolean {
    if (!obj1.isVisible || !obj2.isVisible) return false;
    if (obj1.type === 'GROUP') {
        const children = allObjects.filter(o => o.parentId === obj1.id);
        return children.some(child => checkCollision(child, obj2, allObjects, cache));
    }
    if (obj2.type === 'GROUP') {
        const children = allObjects.filter(o => o.parentId === obj2.id);
        return children.some(child => checkCollision(obj1, child, allObjects, cache));
    }
    return checkPrimitiveCollision(obj1, obj2, allObjects, cache);
}

export function useBehaviorEngine({
  pixiReady,
  appRef,
  transformCacheRef,
  containersRef
}: UseBehaviorEngineProps) {
  const simulationState = useVamsStore((s) => s.simulationState);
  const isGameOver = useVamsStore((s) => s.isGameOver);
  
  const updateVertexPosition = useVamsStore((s) => s.updateVertexPosition);
  const deleteObject = useVamsStore((s) => s.deleteObject);
  const deleteGroup = useVamsStore((s) => s.deleteGroup);
  const setAllVertexColors = useVamsStore((s) => s.setAllVertexColors);
  const updateVertexColor = useVamsStore((s) => s.updateVertexColor);
  const setGameOver = useVamsStore((s) => s.setGameOver);

  const keysPressed = useRef<Set<string>>(new Set());
  const keysPressedThisFrame = useRef<Set<string>>(new Set());
  const timers = useRef<Map<string, TimerState>>(new Map());
  const collisionStates = useRef<Map<string, CollisionState>>(new Map());
  const gameOverOverlayRef = useRef<Container | null>(null);

  const clearGameOverOverlay = useCallback(() => {
    if (gameOverOverlayRef.current) {
      if (gameOverOverlayRef.current.parent) {
        gameOverOverlayRef.current.parent.removeChild(gameOverOverlayRef.current);
      }
      gameOverOverlayRef.current.destroy({ children: true });
      gameOverOverlayRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (simulationState !== "PLAYING" || !isGameOver) {
      clearGameOverOverlay();
    }
  }, [simulationState, isGameOver, clearGameOverOverlay]);

  const applyAction = useCallback((
    obj: VamsObject,
    behavior: Behavior,
    deltaValue: number
  ) => {
    const { action, target, colorPayload, textPayload } = behavior;

    if (action === 'GAME_OVER') {
      const app = appRef.current;
      if (app) {
        clearGameOverOverlay();
        const overlay = new Container();
        overlay.eventMode = 'none';
        
        const screenW = app.screen.width;
        const screenH = app.screen.height;
        
        const titleStyle = new TextStyle({
          fontFamily: "monospace",
          fontSize: Math.max(48, screenW * 0.08),
          fill: colorPayload || '#ff0000',
          align: 'center',
          fontWeight: 'bold',
        });
        
        const titleText = new Text({
          text: textPayload || "GAME OVER",
          style: titleStyle
        });
        titleText.anchor.set(0.5);
        titleText.position.set(screenW / 2, screenH * 0.08);

        const subStyle = new TextStyle({
          fontFamily: "monospace",
          fontSize: Math.max(16, screenW * 0.03),
          fill: '#ffffff',
          align: 'center',
        });
        
        const subText = new Text({
          text: "Click anywhere to continue or restart",
          style: subStyle
        });
        subText.anchor.set(0.5);
        subText.position.set(screenW / 2, screenH * 0.18);

        overlay.addChild(titleText, subText);
        app.stage.addChild(overlay);
        gameOverOverlayRef.current = overlay;
      }
      setGameOver(true);
      return;
    }

    if (action === 'DESTROY') {
      if (obj.type === 'GROUP') {
        deleteGroup(obj.id);
      } else {
        deleteObject(obj.id);
      }
      return;
    }

    if (action === 'SET_COLOR') {
      if (colorPayload) {
        setAllVertexColors(obj.id, colorPayload);
      }
      return;
    }

    const isVertexTarget = target !== "OBJECT" && target !== "GROUP";
    const vertexId = isVertexTarget ? target : undefined;

    if (isVertexTarget && vertexId) {
      const vertex = obj.vertices.find((v) => v.id === vertexId);
      if (!vertex) return;
      if (action !== "TRANSLATE_X" && action !== "TRANSLATE_Y") return;

      if (action === "TRANSLATE_X") {
        updateVertexPosition(obj.id, vertexId, vertex.x + deltaValue, vertex.y);
      } else if (action === "TRANSLATE_Y") {
        updateVertexPosition(obj.id, vertexId, vertex.x, vertex.y + deltaValue);
      }
    }
    else {
      // SHADOW STATE FIX: Mutate Cache and Container instead of Zustand store
      const currentTransform = transformCacheRef.current.get(obj.id) || obj.transform;
      
      let property: keyof TransformState;
      let currentValue: number;

      switch (action) {
        case "TRANSLATE_X":
          property = "translateX";
          currentValue = currentTransform.translateX;
          break;
        case "TRANSLATE_Y":
          property = "translateY";
          currentValue = currentTransform.translateY;
          break;
        case "ROTATE":
          property = "rotate";
          currentValue = currentTransform.rotate;
          break;
        case "SCALE":
          property = "scale";
          currentValue = currentTransform.scale;
          break;
        default:
          return;
      }

      const newValue = action === "SCALE"
        ? Math.max(0.01, currentValue + deltaValue)
        : currentValue + deltaValue;

      const newTransform = { ...currentTransform, [property]: newValue };
      transformCacheRef.current.set(obj.id, newTransform);

      // Instant Visual Update (Bypass React)
      const container = containersRef.current.get(obj.id);
      if (container) {
          container.position.set(newTransform.translateX, newTransform.translateY);
          container.rotation = (newTransform.rotate * Math.PI) / 180;
          container.scale.set(newTransform.scale);
      }
    }
  }, [
    updateVertexPosition, deleteObject, deleteGroup, setAllVertexColors, 
    setGameOver, appRef, clearGameOverOverlay, transformCacheRef, containersRef
  ]);

  const processCollisions = useCallback(() => {
    const objects = useVamsStore.getState().objects;
    const objectMap = new Map(objects.map(o => [o.id, o]));
    const now = Date.now();

    objects.forEach((obj) => {
      if (!obj.isVisible) return;
      
      const collisionBehaviors = obj.behaviors.filter(
        (b) => b.enabled && (b.trigger === "COLLISION_START" || b.trigger === "COLLISION_STAY") && b.triggerTargetId
      );

      collisionBehaviors.forEach((behavior) => {
        const targetObj = objectMap.get(behavior.triggerTargetId!);
        if (!targetObj) return;

        if (obj.parentId) {
            if (targetObj.id === obj.parentId) return;
            if (targetObj.parentId === obj.parentId) return;
        }

        if (obj.type === 'GROUP') {
            if (targetObj.parentId === obj.id) return;
        }

        const interval = parseInt(behavior.triggerKey, 10) || 0;
        const stateKey = `${obj.id}-${behavior.id}-${behavior.triggerTargetId}`;
        let collisionState = collisionStates.current.get(stateKey);

        if (!collisionState) {
          collisionState = {
            isActive: false,
            lastTrigger: 0,
            interval
          };
          collisionStates.current.set(stateKey, collisionState);
        }

        const isImmediate = behavior.action === 'DESTROY' || behavior.action === 'GAME_OVER' || behavior.action === 'SET_COLOR';

        if (behavior.trigger === "COLLISION_START") {
            if (!collisionState.isActive) {
               const isColliding = checkCollision(obj, targetObj, objects, transformCacheRef.current);
               if (isColliding) {
                 collisionState.isActive = true;
                 collisionState.lastTrigger = now;
               }
            }
            if (collisionState.isActive) {
              if (isImmediate) {
                 applyAction(obj, behavior, behavior.value);
                 collisionState.lastTrigger = now;
              } else if (now - collisionState.lastTrigger >= interval) {
                applyAction(obj, behavior, behavior.value);
                collisionState.lastTrigger = now;
              }
            }
        }
        else if (behavior.trigger === "COLLISION_STAY") {
            const isColliding = checkCollision(obj, targetObj, objects, transformCacheRef.current);
            if (isColliding) {
                if (!collisionState.isActive) {
                    collisionState.isActive = true;
                    if (behavior.action === 'SET_COLOR') {
                        collisionState.originalColors = obj.vertices.map(v => ({ id: v.id, color: v.color }));
                        applyAction(obj, behavior, behavior.value);
                    }
                }
                
                if (isImmediate) {
                    if (behavior.action !== 'SET_COLOR') {
                        applyAction(obj, behavior, behavior.value);
                        collisionState.lastTrigger = now;
                    }
                } else if (now - collisionState.lastTrigger >= interval) {
                    applyAction(obj, behavior, behavior.value);
                    collisionState.lastTrigger = now;
                }
            } else {
                if (collisionState.isActive) {
                    collisionState.isActive = false;
                    if (behavior.action === 'SET_COLOR' && collisionState.originalColors) {
                        const firstColor = collisionState.originalColors[0]?.color;
                        if (firstColor) {
                            const isUniform = collisionState.originalColors.every(v => v.color === firstColor);
                            if (isUniform) {
                                setAllVertexColors(obj.id, firstColor);
                            } else {
                                collisionState.originalColors.forEach(v => {
                                    updateVertexColor(obj.id, v.id, v.color);
                                });
                            }
                        }
                    }
                }
            }
        }
      });
    });
  }, [applyAction, setAllVertexColors, updateVertexColor, transformCacheRef]);

  const processBehaviors = useCallback(() => {
    const objects = useVamsStore.getState().objects;
    const now = Date.now();

    objects.forEach((obj) => {
      if (!obj.isVisible) return;
      obj.behaviors.forEach((behavior) => {
        if (!behavior.enabled) return;
        const { trigger, triggerKey, value } = behavior;
        switch (trigger) {
          case "KEY_PRESS": {
            const key = triggerKey.toLowerCase();
            if (keysPressedThisFrame.current.has(key)) {
              applyAction(obj, behavior, value);
            }
            break;
          }
          case "KEY_HOLD": {
            const key = triggerKey.toLowerCase();
            if (keysPressed.current.has(key)) {
              applyAction(obj, behavior, value);
            }
            break;
          }
          case "ON_START": {
            const interval = parseInt(triggerKey, 10);
            const isImmediate = behavior.action === 'DESTROY' || behavior.action === 'GAME_OVER' || behavior.action === 'SET_COLOR';
            
            if (isImmediate) {
                const timerKey = `${obj.id}-${behavior.id}`;
                if (!timers.current.has(timerKey)) {
                     applyAction(obj, behavior, value);
                     timers.current.set(timerKey, { lastTrigger: now, interval: 0 });
                }
                break;
            }

            if (isNaN(interval) || interval <= 0) break;
            const timerKey = `${obj.id}-${behavior.id}`;
            let timerState = timers.current.get(timerKey);
            if (!timerState) {
              timerState = { lastTrigger: now, interval };
              timers.current.set(timerKey, timerState);
            }
            if (now - timerState.lastTrigger >= interval) {
              applyAction(obj, behavior, value);
              timerState.lastTrigger = now;
            }
            break;
          }
        }
      });
    });

    processCollisions();
    keysPressedThisFrame.current.clear();
  }, [applyAction, processCollisions]);

  const handleObjectPointerDown = useCallback((e: FederatedPointerEvent, objId: string) => {
    if (useVamsStore.getState().simulationState !== "PLAYING") return;
    if (useVamsStore.getState().isGameOver) return;
    
    const objects = useVamsStore.getState().objects;
    const obj = objects.find(o => o.id === objId);
    if (!obj || !obj.isVisible) return;
    
    const button = e.button;
    
    obj.behaviors.forEach((behavior) => {
      if (!behavior.enabled) return;
      const expectedButton = behavior.triggerKey === "2" ? 2 : 0;
      if (behavior.trigger === "MOUSE_CLICK" && button === expectedButton) {
        e.stopPropagation();
        applyAction(obj, behavior, behavior.value);
      }
    });
  }, [applyAction]);

  useEffect(() => {
    if (simulationState !== "PLAYING") return;

    const keysPressedRef = keysPressed.current;
    const keysPressedThisFrameRef = keysPressedThisFrame.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const wasPressed = keysPressedRef.has(key);
      keysPressedRef.add(key);
      if (!wasPressed) {
        keysPressedThisFrameRef.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressedRef.delete(key);
      keysPressedThisFrameRef.delete(key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      keysPressedRef.clear();
      keysPressedThisFrameRef.clear();
    };
  }, [simulationState]);

  useEffect(() => {
    if (simulationState !== "PLAYING" || !pixiReady) return;
    const app = appRef.current;
    if (!app) return;

    const timersRef = timers.current;
    const collisionStatesRef = collisionStates.current;

    const tickerFn = () => {
      if (useVamsStore.getState().isGameOver) return;
      processBehaviors();
    };

    const handleStageClick = () => {
        if (useVamsStore.getState().isGameOver) {
            useVamsStore.getState().stop();
        }
    };

    app.ticker.add(tickerFn);
    app.stage.on('pointerdown', handleStageClick);

    return () => {
      app.ticker.remove(tickerFn);
      app.stage.off('pointerdown', handleStageClick);
      timersRef.clear();
      collisionStatesRef.clear();
    };
  }, [simulationState, pixiReady, appRef, processBehaviors]);

  useEffect(() => {
    if (simulationState !== "PLAYING") {
      keysPressed.current.clear();
      keysPressedThisFrame.current.clear();
      timers.current.clear();
      collisionStates.current.clear();
    }
  }, [simulationState]);

  return { handleObjectPointerDown };
}