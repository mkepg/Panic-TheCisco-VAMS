// src/pixi/utils/colorUtils.ts
import * as PIXI from "pixi.js";

/**
 * Converts a hex color string to a numeric color value.
 * Falls back to a default color if parsing fails.
 */
export function toNumColor(c: string | undefined, fallback = 0xffffff): number {
  try {
    return new PIXI.Color(c ?? fallback).toNumber();
  } catch {
    return fallback;
  }
}

/**
 * Converts a hex color string to normalized RGB array [r, g, b] (0-1 range).
 * Used for vertex coloring in mesh shaders.
 */
export function colorToRGB(colorHex: string): [number, number, number] {
  const color = new PIXI.Color(colorHex);
  return [color.red, color.green, color.blue];
}
