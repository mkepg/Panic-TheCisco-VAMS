import type { SceneNode, Vertex } from '@/core/types/scene';
import { sanitizeName, getGlPrimitive } from './utils';

/* ------------------------------------------------------------------ */
/*  Helpers shared by VERTEX_ARRAY and VBO emission                   */
/* ------------------------------------------------------------------ */

function isPrimitive(o: SceneNode): boolean {
  return o.type !== 'GROUP' && o.type !== 'TEXT';
}

function bufferUsageMacro(o: SceneNode): string {
  switch (o.bufferUsage) {
    case 'DYNAMIC': return 'GL_DYNAMIC_DRAW';
    case 'STREAM':  return 'GL_STREAM_DRAW';
    case 'STATIC':
    default:        return 'GL_STATIC_DRAW';
  }
}

/**
 * Returns either { uniqueVerts, indices } when indexed drawing is requested
 * (deduplicating vertices that share both position and color), or null when
 * indexed drawing is off.
 */
function deduplicate(o: SceneNode): { uniqueVerts: Vertex[]; indices: number[] } | null {
  if (!o.useIndexed) return null;
  const uniqueVerts: Vertex[] = [];
  const indices: number[] = [];
  const keyToIndex = new Map<string, number>();
  for (const v of o.vertices) {
    const key = `${v.x.toFixed(6)}|${v.y.toFixed(6)}|${v.color}`;
    let idx = keyToIndex.get(key);
    if (idx === undefined) {
      idx = uniqueVerts.length;
      uniqueVerts.push(v);
      keyToIndex.set(key, idx);
    }
    indices.push(idx);
  }
  return { uniqueVerts, indices };
}

function effectiveVerts(o: SceneNode): Vertex[] {
  return deduplicate(o)?.uniqueVerts ?? o.vertices;
}

/* ------------------------------------------------------------------ */
/*  Globals: vertex arrays, color arrays, index arrays, VBO handles   */
/* ------------------------------------------------------------------ */

export function generateBufferGlobals(allObjects: SceneNode[]): string {
  const arrays: string[] = [];
  const handles: string[] = [];

  for (const o of allObjects) {
    if (!isPrimitive(o)) continue;
    const mode = o.renderingMode ?? 'IMMEDIATE';
    if (mode === 'IMMEDIATE') continue;

    const safe = sanitizeName(o.name);
    const verts = effectiveVerts(o);
    if (verts.length === 0) continue;

    // Position array
    const posStr = verts.map(v => `${v.x.toFixed(4)}f, ${v.y.toFixed(4)}f`).join(', ');
    arrays.push(`GLfloat verts_${safe}[] = { ${posStr} };`);

    // Color array (always emit — keeps glColorPointer wiring obvious)
    const colorStr = verts
      .map(v => {
        const r = (parseInt(v.color.slice(1, 3), 16) / 255).toFixed(2);
        const g = (parseInt(v.color.slice(3, 5), 16) / 255).toFixed(2);
        const b = (parseInt(v.color.slice(5, 7), 16) / 255).toFixed(2);
        return `${r}f, ${g}f, ${b}f`;
      })
      .join(', ');
    arrays.push(`GLfloat colors_${safe}[] = { ${colorStr} };`);

    // Indices (only when useIndexed)
    const dedup = deduplicate(o);
    if (dedup) {
      arrays.push(`GLuint indices_${safe}[] = { ${dedup.indices.join(', ')} };`);
    }

    // VBO handles
    if (mode === 'VBO') {
      handles.push(`GLuint vbo_${safe} = 0;`);
      handles.push(`GLuint cbo_${safe} = 0;`);
      if (dedup) handles.push(`GLuint ebo_${safe} = 0;`);
    }
  }

  if (arrays.length === 0 && handles.length === 0) return '';

  let out = `// --- Buffer Data ---\n`;
  if (arrays.length > 0) out += arrays.join('\n') + '\n';
  if (handles.length > 0) out += '\n// --- VBO Handles ---\n' + handles.join('\n') + '\n';
  return out + '\n';
}

/* ------------------------------------------------------------------ */
/*  init() body: VBO uploads                                          */
/* ------------------------------------------------------------------ */

export function generateInitBody(allObjects: SceneNode[]): string {
  const lines: string[] = [];
  for (const o of allObjects) {
    if (!isPrimitive(o)) continue;
    if (o.renderingMode !== 'VBO') continue;
    const verts = effectiveVerts(o);
    if (verts.length === 0) continue;

    const safe = sanitizeName(o.name);
    const usage = bufferUsageMacro(o);
    const dedup = deduplicate(o);

    lines.push(`    // ${o.name} — upload to GPU`);
    lines.push(`    glGenBuffers(1, &vbo_${safe});`);
    lines.push(`    glBindBuffer(GL_ARRAY_BUFFER, vbo_${safe});`);
    lines.push(`    glBufferData(GL_ARRAY_BUFFER, sizeof(verts_${safe}), verts_${safe}, ${usage});`);
    lines.push(`    glGenBuffers(1, &cbo_${safe});`);
    lines.push(`    glBindBuffer(GL_ARRAY_BUFFER, cbo_${safe});`);
    lines.push(`    glBufferData(GL_ARRAY_BUFFER, sizeof(colors_${safe}), colors_${safe}, ${usage});`);
    if (dedup) {
      lines.push(`    glGenBuffers(1, &ebo_${safe});`);
      lines.push(`    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo_${safe});`);
      lines.push(`    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices_${safe}), indices_${safe}, ${usage});`);
    }
    lines.push('');
  }

  if (lines.length === 0) {
    return '    // No GPU buffers to upload\n';
  }
  return lines.join('\n') + '\n';
}

/* ------------------------------------------------------------------ */
/*  Per-object draw bodies for VERTEX_ARRAY and VBO                    */
/* ------------------------------------------------------------------ */

function transformPrelude(o: SceneNode): string {
  const safe = sanitizeName(o.name);
  let out = '';
  out += `    // ${o.name}\n`;
  out += `    glPushMatrix();\n`;
  out += `    glTranslatef(state_${safe}.x, state_${safe}.y, 0.0f);\n`;
  out += `    glRotatef(state_${safe}.rotation, 0.0f, 0.0f, 1.0f);\n`;
  out += `    glScalef(state_${safe}.scaleX, state_${safe}.scaleY, 1.0f);\n`;
  return out;
}

function shadingLine(o: SceneNode): string {
  return `    glShadeModel(${o.shading === 'FLAT' ? 'GL_FLAT' : 'GL_SMOOTH'});\n`;
}

export function generateVertexArrayDrawBody(o: SceneNode): string {
  const safe = sanitizeName(o.name);
  const verts = effectiveVerts(o);
  const dedup = deduplicate(o);
  const prim = getGlPrimitive(o.type as Exclude<SceneNode['type'], 'GROUP' | 'TEXT'>);

  let out = transformPrelude(o);
  out += shadingLine(o);
  out += `\n    // Bind client-side arrays\n`;
  out += `    glEnableClientState(GL_VERTEX_ARRAY);\n`;
  out += `    glEnableClientState(GL_COLOR_ARRAY);\n`;
  out += `    glVertexPointer(2, GL_FLOAT, 0, verts_${safe});\n`;
  out += `    glColorPointer(3, GL_FLOAT, 0, colors_${safe});\n\n`;

  if (dedup) {
    out += `    glDrawElements(${prim}, ${dedup.indices.length}, GL_UNSIGNED_INT, indices_${safe});\n`;
  } else {
    out += `    glDrawArrays(${prim}, 0, ${verts.length});\n`;
  }

  out += `\n    glDisableClientState(GL_COLOR_ARRAY);\n`;
  out += `    glDisableClientState(GL_VERTEX_ARRAY);\n`;
  out += `    glPopMatrix();\n`;
  return out;
}

export function generateVBODrawBody(o: SceneNode): string {
  const safe = sanitizeName(o.name);
  const verts = effectiveVerts(o);
  const dedup = deduplicate(o);
  const prim = getGlPrimitive(o.type as Exclude<SceneNode['type'], 'GROUP' | 'TEXT'>);

  let out = transformPrelude(o);
  out += shadingLine(o);
  out += `\n    // Bind GPU buffers\n`;
  out += `    glEnableClientState(GL_VERTEX_ARRAY);\n`;
  out += `    glEnableClientState(GL_COLOR_ARRAY);\n\n`;
  out += `    glBindBuffer(GL_ARRAY_BUFFER, vbo_${safe});\n`;
  out += `    glVertexPointer(2, GL_FLOAT, 0, 0);\n\n`;
  out += `    glBindBuffer(GL_ARRAY_BUFFER, cbo_${safe});\n`;
  out += `    glColorPointer(3, GL_FLOAT, 0, 0);\n\n`;

  if (dedup) {
    out += `    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo_${safe});\n`;
    out += `    glDrawElements(${prim}, ${dedup.indices.length}, GL_UNSIGNED_INT, 0);\n`;
  } else {
    out += `    glDrawArrays(${prim}, 0, ${verts.length});\n`;
  }

  out += `\n    glBindBuffer(GL_ARRAY_BUFFER, 0);\n`;
  if (dedup) out += `    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0);\n`;
  out += `    glDisableClientState(GL_COLOR_ARRAY);\n`;
  out += `    glDisableClientState(GL_VERTEX_ARRAY);\n`;
  out += `    glPopMatrix();\n`;
  return out;
}
