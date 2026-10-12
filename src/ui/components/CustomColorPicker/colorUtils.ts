/**
 * Color math and parsing utilities for Framer Standard Color Picker
 * Supports HEX, HEX8, RGB, and RGBA with full HSV conversion.
 */

export function clamp(val: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, val));
}

export interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseColor(colorStr?: string, fallback = "#ffffff"): ParsedColor {
  if (!colorStr || typeof colorStr !== "string") {
    return parseColor(fallback, "#ffffff");
  }

  const str = colorStr.trim().toLowerCase();

  // 1. Transparent
  if (str === "transparent") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // 2. RGBA / RGB regex: rgb(255, 255, 255) or rgba(255, 255, 255, 0.35)
  const rgbMatch = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (rgbMatch) {
    const r = Math.round(clamp(parseFloat(rgbMatch[1]), 0, 255));
    const g = Math.round(clamp(parseFloat(rgbMatch[2]), 0, 255));
    const b = Math.round(clamp(parseFloat(rgbMatch[3]), 0, 255));
    const a = rgbMatch[4] !== undefined ? clamp(parseFloat(rgbMatch[4]), 0, 1) : 1;
    return { r, g, b, a };
  }

  // 3. HEX (#fff, #ffff, #ffffff, #ffffffff)
  if (str.startsWith("#")) {
    const hex = str.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b, a: 1 };
    }
    if (hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const a = parseInt(hex[3] + hex[3], 16) / 255;
      return { r, g, b, a };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b, a: 1 };
    }
    if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return { r, g, b, a };
    }
  }

  // Default fallback if unknown format
  if (fallback && fallback !== colorStr) {
    return parseColor(fallback, "#ffffff");
  }

  return { r: 255, g: 255, b: 255, a: 1 };
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const normR = r / 255;
  const normG = g / 255;
  const normB = b / 255;

  const max = Math.max(normR, normG, normB);
  const min = Math.min(normR, normG, normB);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    if (max === normR) {
      h = (normG - normB) / d + (normG < normB ? 6 : 0);
    } else if (max === normG) {
      h = (normB - normR) / d + 2;
    } else {
      h = (normR - normG) / d + 4;
    }
    h = h / 6;
  }

  return {
    h: Math.round(h * 360),
    s: clamp(s, 0, 1),
    v: clamp(v, 0, 1),
  };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const normH = (h % 360) / 360;
  const i = Math.floor(normH * 6);
  const f = normH * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0;
  let g = 0;
  let b = 0;

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function formatColorString(r: number, g: number, b: number, a = 1): string {
  const roundedA = Math.round(a * 100) / 100;
  if (roundedA < 1) {
    return `rgba(${r}, ${g}, ${b}, ${roundedA})`;
  }
  return rgbToHex(r, g, b);
}
