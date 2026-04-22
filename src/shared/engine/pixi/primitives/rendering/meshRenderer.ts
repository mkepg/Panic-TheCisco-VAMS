import * as PIXI from "pixi.js";
import type { SceneNode } from "@/core/types/scene";
import { colorToRGB } from "../utils/color-utils";
import { bboxRadii } from "../utils/geometry-utils";

export interface MeshCreationResult {
  mesh: PIXI.Mesh<PIXI.MeshGeometry, PIXI.Shader>;
}

const VERTEX_COLOR_SHADER: PIXI.Shader = createVertexColorShader();

export function createMesh(o: SceneNode): MeshCreationResult | null {
  const { positions, colors, indices, topology } = buildMeshData(o);

  if (positions.length === 0) {
    return null;
  }

  const geometry = new PIXI.MeshGeometry({
    positions: new Float32Array(positions),
    uvs: new Float32Array(positions.length).fill(0),
    indices: new Uint32Array(indices),
    topology: topology,
  });

  const colorBuffer = new PIXI.Buffer({
    data: new Float32Array(colors),
    usage: PIXI.BufferUsage.VERTEX | PIXI.BufferUsage.COPY_DST,
  });

  geometry.addAttribute('aColor', {
    buffer: colorBuffer,
    format: 'float32x4',
    stride: 4 * 4,
    offset: 0,
    instance: false,
  });

  const mesh = new PIXI.Mesh({ geometry, shader: VERTEX_COLOR_SHADER });
  return { mesh };
}

function buildMeshData(o: SceneNode): {
  positions: number[];
  colors: number[];
  indices: number[];
  topology: 'triangle-list' | 'triangle-strip' | 'line-strip';
} {
  const positions: number[] = [];
  const colors: number[] = [];
  let indices: number[] = [];
  let topology: 'triangle-list' | 'triangle-strip' | 'line-strip' = 'triangle-list';

  if (o.type === "TRIANGLE_STRIP") {
    topology = 'triangle-strip';
    for (let i = 0; i < o.vertices.length; i++) {
      positions.push(o.vertices[i].x, o.vertices[i].y);
      const rgb = colorToRGB(o.vertices[i].color);
      colors.push(rgb[0], rgb[1], rgb[2], 1.0);
      indices.push(i);
    }
  }
  else if (o.type === "LINE_STRIP" || o.type === "LINE") {
    topology = 'line-strip';
    for (let i = 0; i < o.vertices.length; i++) {
      positions.push(o.vertices[i].x, o.vertices[i].y);
      const rgb = colorToRGB(o.vertices[i].color);
      colors.push(rgb[0], rgb[1], rgb[2], 1.0);
      indices.push(i);
    }
  }
  else if (o.type === "TRIANGLE" && o.vertices.length >= 3) {
    for (let i = 0; i < 3; i++) {
      positions.push(o.vertices[i].x, o.vertices[i].y);
      const rgb = colorToRGB(o.vertices[i].color);
      colors.push(rgb[0], rgb[1], rgb[2], 1.0);
    }
    indices = [0, 1, 2];
  }
  else if (o.type === "RECTANGLE" && o.vertices.length >= 4) {
    for (let i = 0; i < 4; i++) {
      positions.push(o.vertices[i].x, o.vertices[i].y);
      const rgb = colorToRGB(o.vertices[i].color);
      colors.push(rgb[0], rgb[1], rgb[2], 1.0);
    }
    indices = [0, 1, 2, 0, 2, 3];
  }
  else if ((o.type === "CIRCLE" || o.type === "ELLIPSE") && o.vertices.length >= 2) {
    buildCircleOrEllipseMeshData(o, positions, colors, indices);
  }
  else if (o.type === "STAR" && o.vertices.length >= 5) {
    buildStarMeshData(o, positions, colors, indices);
  }
  else if (o.vertices.length >= 3) {
    buildPolygonMeshData(o, positions, colors, indices);
  }

  return { positions, colors, indices, topology };
}

function buildCircleOrEllipseMeshData(
  o: SceneNode,
  positions: number[],
  colors: number[],
  indices: number[]
): void {
  const { cx, cy, rx, ry } = bboxRadii(o);
  const R = o.type === "CIRCLE" ? (rx + ry) / 2 : undefined;
  const segments = 64;

  positions.push(cx, cy);

  let avgR = 0, avgG = 0, avgB = 0;
  for (const v of o.vertices) {
    const rgb = colorToRGB(v.color);
    avgR += rgb[0];
    avgG += rgb[1];
    avgB += rgb[2];
  }
  const count = o.vertices.length;
  colors.push(avgR / count, avgG / count, avgB / count, 1.0);

  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const x = cx + Math.cos(t) * (o.type === "CIRCLE" ? R! : rx);
    const y = cy + Math.sin(t) * (o.type === "CIRCLE" ? R! : ry);
    positions.push(x, y);

    const ratio = (i % segments) / segments;
    const idx = Math.floor(ratio * o.vertices.length);
    const nextIdx = (idx + 1) % o.vertices.length;
    const localRatio = (ratio * o.vertices.length) - idx;

    const rgb1 = colorToRGB(o.vertices[idx].color);
    const rgb2 = colorToRGB(o.vertices[nextIdx].color);

    colors.push(
      rgb1[0] * (1 - localRatio) + rgb2[0] * localRatio,
      rgb1[1] * (1 - localRatio) + rgb2[1] * localRatio,
      rgb1[2] * (1 - localRatio) + rgb2[2] * localRatio,
      1.0
    );
  }

  for (let i = 1; i <= segments; i++) {
    indices.push(0, i, i + 1);
  }
}

function buildStarMeshData(
  o: SceneNode,
  positions: number[],
  colors: number[],
  indices: number[]
): void {
  let cx = 0, cy = 0;
  for (const v of o.vertices) {
    cx += v.x;
    cy += v.y;
  }
  cx /= o.vertices.length;
  cy /= o.vertices.length;
  positions.push(cx, cy);

  let avgR = 0, avgG = 0, avgB = 0;
  for (const v of o.vertices) {
    const rgb = colorToRGB(v.color);
    avgR += rgb[0];
    avgG += rgb[1];
    avgB += rgb[2];
  }
  const count = o.vertices.length;
  colors.push(avgR / count, avgG / count, avgB / count, 1.0);

  for (let i = 0; i < o.vertices.length; i++) {
    positions.push(o.vertices[i].x, o.vertices[i].y);
    const rgb = colorToRGB(o.vertices[i].color);
    colors.push(rgb[0], rgb[1], rgb[2], 1.0);
  }

  for (let i = 0; i < o.vertices.length; i++) {
    const next = (i + 1) % o.vertices.length;
    indices.push(0, i + 1, next + 1);
  }
}

function buildPolygonMeshData(
  o: SceneNode,
  positions: number[],
  colors: number[],
  indices: number[]
): void {
  const startIndex = positions.length / 2;

  for (let i = 0; i < o.vertices.length; i++) {
    positions.push(o.vertices[i].x, o.vertices[i].y);
    const rgb = colorToRGB(o.vertices[i].color);
    colors.push(rgb[0], rgb[1], rgb[2], 1.0);
  }

  // OpenGL 1.5 strictly renders GL_POLYGON as a triangle fan originating from vertex 0.
  // Concave polygons will intentionally artifact here.
  for (let i = 1; i < o.vertices.length - 1; i++) {
    indices.push(startIndex, startIndex + i, startIndex + i + 1);
  }
}

function createVertexColorShader(): PIXI.Shader {
  return PIXI.Shader.from({
    gl: {
      vertex: `
        attribute vec2 aPosition;
        attribute vec4 aColor;
        uniform mat3 uProjectionMatrix;
        uniform mat3 uWorldTransformMatrix;
        uniform mat3 uTransformMatrix;
        varying vec4 vColor;
        void main() {
          mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
          gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
          vColor = aColor;
        }
      `,
      fragment: `
        precision mediump float;
        varying vec4 vColor;
        void main() {
          gl_FragColor = vColor;
        }
      `,
    },
    gpu: {
      vertex: {
        entryPoint: 'main',
        source: `
          struct GlobalUniforms {
            uProjectionMatrix: mat3x3<f32>,
            uWorldTransformMatrix: mat3x3<f32>,
            uTransformMatrix: mat3x3<f32>,
          };
          @group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
          struct VertexOutput {
            @builtin(position) position: vec4<f32>,
            @location(0) vColor: vec4<f32>,
          };
          @vertex
          fn main(@location(0) aPosition: vec2<f32>, @location(1) aColor: vec4<f32>) -> VertexOutput {
            var output: VertexOutput;
            let mvp = globalUniforms.uProjectionMatrix * globalUniforms.uWorldTransformMatrix * globalUniforms.uTransformMatrix;
            let pos = mvp * vec3<f32>(aPosition, 1.0);
            output.position = vec4<f32>(pos.xy, 0.0, 1.0);
            output.vColor = aColor;
            return output;
          }
        `,
      },
      fragment: {
        entryPoint: 'main',
        source: `
          @fragment
          fn main(@location(0) vColor: vec4<f32>) -> @location(0) vec4<f32> {
            return vColor;
          }
        `,
      },
    },
  });
}