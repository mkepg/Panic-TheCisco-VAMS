import type { GlutCallbackKind, SceneNode } from '@/core/types/scene';
import {
  generateAppOutput,
  type RegisteredCallback,
} from './code-generator';

/**
 * Pure, React-free version of the code-generation pipeline that
 * `SceneCodePanel` uses. The lesson engine calls this twice per step
 * transition (pre/post action) so it can diff the two snapshots without
 * coupling to the component tree.
 *
 * Visual output stays driven by `SceneCodePanel` — this file is only a
 * snapshot tool.
 */

interface GenerateInput {
  objects: SceneNode[];
  canvasBackgroundColor: string;
  callbacks: Record<GlutCallbackKind, string>;
}

function isEffectivelyHidden(
  obj: SceneNode,
  byId: Map<string, SceneNode>
): boolean {
  if (!obj.visible) return true;
  if (obj.parentId) {
    const parent = byId.get(obj.parentId);
    if (parent && isEffectivelyHidden(parent, byId)) return true;
  }
  return false;
}

function getEffectivelyVisibleObjects(objects: SceneNode[]): SceneNode[] {
  const byId = new Map(objects.map((o) => [o.id, o]));
  return objects.filter((o) => !isEffectivelyHidden(o, byId));
}

const CALLBACK_KINDS: GlutCallbackKind[] = [
  'keyboard', 'mouse', 'reshape', 'motion', 'idle',
];

function getRegisteredCallbacks(
  callbacks: Record<GlutCallbackKind, string>
): RegisteredCallback[] {
  return CALLBACK_KINDS
    .filter((k) => callbacks[k] && callbacks[k].trim().length > 0)
    .map((k) => ({ kind: k, handlerName: callbacks[k].trim() }));
}

export function generateCodeFromState(
  input: GenerateInput,
  canvasSize: { width: number; height: number }
): string {
  const { objects, canvasBackgroundColor, callbacks } = input;
  const cbs = getRegisteredCallbacks(callbacks);

  if (objects.length === 0) {
    return generateAppOutput(
      [], [], [],
      canvasBackgroundColor,
      canvasSize,
      '    // Empty scene\n',
      cbs,
    );
  }

  const visible = getEffectivelyVisibleObjects(objects);
  const roots = visible.filter((o) => !o.parentId);
  return generateAppOutput(
    visible,
    roots,
    visible,
    canvasBackgroundColor,
    canvasSize,
    '    // Empty scene\n',
    cbs,
  );
}
