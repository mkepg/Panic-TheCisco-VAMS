import type { SceneNode, Vertex } from '@/core/types/scene';
import { sanitizeName, hexToGlColor, hexToGlByteColor, getGlPrimitive } from './utils';

const isLine = (t: SceneNode['type']): boolean =>
  t === 'LINES' || t === 'LINE_STRIP' || t === 'LINE_LOOP';

/** Emit a `glColor3f(...)` or `glColor3ub(...)` call based on the object's color mode. */
function emitColor(v: Vertex, colorMode: 'FLOAT' | 'BYTE' | undefined, indent = '        '): string {
  if (colorMode === 'BYTE') {
    return `${indent}glColor3ub(${hexToGlByteColor(v.color)});\n`;
  }
  return `${indent}glColor3f(${hexToGlColor(v.color)});\n`;
}

export const generateObjectDrawBody = (
  object: SceneNode,
  allObjects: SceneNode[]
): string => {
  let drawBody = '';
  const safeName = sanitizeName(object.name);

  drawBody += `    // ${object.name}\n`;
  drawBody += `    glPushMatrix();\n`;
  drawBody += `    // Transform\n`;
  drawBody += `    glTranslatef(state_${safeName}.x, state_${safeName}.y, 0.0f);\n`;
  drawBody += `    glRotatef(state_${safeName}.rotation, 0.0f, 0.0f, 1.0f);\n`;
  drawBody += `    glScalef(state_${safeName}.scaleX, state_${safeName}.scaleY, 1.0f);\n\n`;

  if (object.type === 'GROUP') {
    drawBody += `    // Children\n`;
    const children = allObjects.filter(o => o.parentId === object.id);
    [...children].reverse().forEach(child => {
      drawBody += `    draw_${sanitizeName(child.name)}();\n`;
    });
  } else if (object.type === 'TEXT') {
    // -----------------------------------------------------------------
    // Bitmap text via glRasterPos2f + glutBitmapCharacter (per plan).
    // glRasterPos is set ONCE; glutBitmapCharacter advances the raster
    // position automatically. A line break resets to a new raster
    // position offset by a fixed line height in NDC.
    // -----------------------------------------------------------------
    const textContent = object.textContent || '';
    const safeTextComment = textContent.replace(/\n/g, '\\n');
    const colorHex = object.vertices[0]?.color || '#ffffff';
    const useByte = object.colorMode === 'BYTE';

    drawBody += `    // Text: "${safeTextComment}"\n`;
    drawBody += useByte
      ? `    glColor3ub(${hexToGlByteColor(colorHex)});\n`
      : `    glColor3f(${hexToGlColor(colorHex)});\n`;

    const lines = textContent.split('\n');
    const lineHeight = 0.07; // NDC units between baselines

    lines.forEach((line, index) => {
      const safeLine = line
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\r/g, '')
        // Strip non-printable ASCII; bitmap fonts only render printable glyphs.
        .split('')
        .filter((ch) => {
          const c = ch.charCodeAt(0);
          return c > 0x1F && c < 0x7F;
        })
        .join('');

      const yOffset = ((lines.length - 1) / 2 - index) * lineHeight;

      drawBody += `    glRasterPos2f(0.0f, ${yOffset.toFixed(4)}f);\n`;
      drawBody += `    {\n`;
      drawBody += `        const char* textLine = "${safeLine}";\n`;
      drawBody += `        for (const char* c = textLine; *c != '\\0'; c++) {\n`;
      drawBody += `            glutBitmapCharacter(GLUT_BITMAP_9_BY_15, *c);\n`;
      drawBody += `        }\n`;
      drawBody += `    }\n`;
    });
  } else {
    drawBody += `    // Render\n`;
    drawBody += `    glShadeModel(${object.shading === 'FLAT' ? 'GL_FLAT' : 'GL_SMOOTH'});\n`;

    // ---- Line-primitive styling -----------------------------------------
    if (isLine(object.type)) {
      const lw = object.lineWidth ?? 1;
      drawBody += `    glLineWidth(${lw.toFixed(2)}f);\n`;

      if (object.lineStipple) {
        const factor = Math.max(1, Math.min(256, Math.floor(object.lineStipple.factor)));
        const pattern = object.lineStipple.pattern & 0xFFFF;
        const patternHex = `0x${pattern.toString(16).toUpperCase().padStart(4, '0')}`;
        drawBody += `    glEnable(GL_LINE_STIPPLE);\n`;
        drawBody += `    glLineStipple(${factor}, ${patternHex});\n`;
      }
    }

    if (object.type === 'POINTS') {
      drawBody += `    // Adjust visible point size — default is 1px\n`;
      drawBody += `    glPointSize(8.0f);\n`;
    }

    drawBody += `\n    glBegin(${getGlPrimitive(object.type)});\n`;
    object.vertices.forEach((v) => {
      drawBody += emitColor(v, object.colorMode);
      drawBody += `        glVertex2f(${v.x.toFixed(4)}f, ${v.y.toFixed(4)}f);\n`;
    });
    drawBody += `    glEnd();\n`;

    if (object.type === 'POINTS') {
      drawBody += `    glPointSize(1.0f); // Reset\n`;
    }

    // Reset line state so it doesn't leak to the next object.
    if (isLine(object.type)) {
      if (object.lineStipple) drawBody += `    glDisable(GL_LINE_STIPPLE);\n`;
      drawBody += `    glLineWidth(1.0f);\n`;
    }
  }

  drawBody += `    glPopMatrix();\n`;

  return drawBody;
};
