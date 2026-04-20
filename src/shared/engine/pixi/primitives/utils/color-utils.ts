import * as PIXI from "pixi.js";
export function toNumColor(c: string | undefined, fallback = 0xffffff): number {
  try {
    return new PIXI.Color(c ?? fallback).toNumber();
  } catch {
    return fallback;
  }
}
export function colorToRGB(colorHex: string): [number, number, number] {
  const color = new PIXI.Color(colorHex);
  return [color.red, color.green, color.blue];
}