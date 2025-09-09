import {clip} from './Utils';

export class HslRange {
  public hMin: number = 0;
  public hRange: number = 1;
  public sMin: number = 0;
  public sMax: number = 1;
  public lMin: number = 0;
  public lMax: number = 1;
}

export function hexStrToRgb(hex: string): number {
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return r | (g << 8) | (b << 16);
  } else if (hex.length == 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return r | (g << 8) | (b << 16);
  } else {
    throw new Error('Invalid hex color');
  }
}

export function rgbToHexStr(rgb: number): string {
  const {r, g, b} = rgbU32ToU8(rgb);
  const chVals = [r, g, b];
  let longFormat = false;
  for (let i = 0; i < 3; i++) {
    const hi = chVals[i] >> 4;
    const lo = chVals[i] & 0xf;
    if (hi != lo) {
      longFormat = true;
      break;
    }
  }
  if (longFormat) {
    return '#' + r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
  } else {
    return '#' + (r >> 4).toString(16) + (g >> 4).toString(16) +
        (b >> 4).toString(16);
  }
}

export function rgbU32ToU8(color: number): {r: number, g: number, b: number} {
  const r = color & 0xff;
  const g = (color >> 8) & 0xff;
  const b = (color >> 16) & 0xff;
  return {r, g, b};
}

export function rgbU32ToF32(color: number): {r: number, g: number, b: number} {
  const r = (color & 0xff) / 255;
  const g = ((color >> 8) & 0xff) / 255;
  const b = ((color >> 16) & 0xff) / 255;
  return {r, g, b};
}

export function grayscale(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function grayscaleArrayF32(data: Float32Array, offset: number): number {
  return grayscale(data[offset], data[offset + 1], data[offset + 2]);
}

export function grayscaleArrayU8(data: Uint8Array, offset: number): number {
  return grayscale(data[offset], data[offset + 1], data[offset + 2]);
}

export function rgbToHslArrayF32(
    src: Float32Array, srcOffset: number, dest: Float32Array,
    destOffset: number, numPixels: number): void {
  for (let i = 0; i < numPixels; i++) {
    const r = src[srcOffset];
    const g = src[srcOffset + 1];
    const b = src[srcOffset + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max != min) {
      const d = max - min;
      s = d;
      // s = (max - min) / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
    }
    h /= 6;
    dest[destOffset] = h;
    dest[destOffset + 1] = s;
    dest[destOffset + 2] = l;
    srcOffset += 3;
    destOffset += 3;
  }
}

export function hslToRgbArrayF32(
    src: Float32Array, srcOffset: number, dest: Float32Array,
    destOffset: number, numPixels: number): void {
  for (let i = 0; i < numPixels; i++) {
    let h = src[srcOffset];
    let s = src[srcOffset + 1];
    let l = src[srcOffset + 2];
    let r: number, g: number, b: number;

    if (s == 0) {
      r = g = b = l;  // achromatic
    } else {
      // const p = s * (1 - Math.abs(2 * l - 1)) / 2;
      const p = s / 2;
      const max = l + p;
      const min = l - p;
      h -= Math.floor(h);
      h *= 6;
      if (h < 1) {
        r = max;
        g = min + (max - min) * h;
        b = min;
      } else if (h < 2) {
        r = min + (max - min) * (2 - h);
        g = max;
        b = min;
      } else if (h < 3) {
        r = min;
        g = max;
        b = min + (max - min) * (h - 2);
      } else if (h < 4) {
        r = min;
        g = min + (max - min) * (4 - h);
        b = max;
      } else if (h < 5) {
        r = min + (max - min) * (h - 4);
        g = min;
        b = max;
      } else {
        r = max;
        g = min;
        b = min + (max - min) * (6 - h);
      }
    }

    dest[destOffset] = clip(0, 1, r);
    dest[destOffset + 1] = clip(0, 1, g);
    dest[destOffset + 2] = clip(0, 1, b);
    srcOffset += 3;
    destOffset += 3;
  }
}

export function hueWrap(hue: number): number {
  return hue - Math.floor(hue);
}

export function hueAdd(hue: number, add: number): number {
  return hueWrap(hue + add);
}

export function hueDiff(hue1: number, hue2: number): number {
  const d = hueWrap(hue1 - hue2);
  if (d < 0.5) {
    return d;
  } else {
    return d - 1;
  }
}

export function hueRange(min: number, max: number): number {
  if (max >= min) {
    return max - min;
  } else {
    return (1 - min) + max;
  }
}

export function hueCenter(min: number, max: number): number {
  return hueAdd(min, hueRange(min, max) / 2);
}

export function hueClip(min: number, range: number, hue: number): number {
  const radius = range / 2;
  const center = hueAdd(min, radius);
  const d = hueDiff(hue, center);
  if (d < -radius) {
    return hueAdd(center, -radius);
  } else if (d > radius) {
    return hueAdd(center, radius);
  } else {
    return hue;
  }
}

// 内積
function dot(a: Float32Array, ia: number, b: Float32Array, ib: number): number {
  return a[ia + 0] * b[ib + 0] + a[ia + 1] * b[ib + 1] + a[ia + 2] * b[ib + 2];
}

// 色変換行列の生成
export function createTransformMatrix(
    src: Float32Array, iO: number, iR: number, iG: number,
    iB: number): Float32Array {
  const o0 = src[iO + 0];
  const o1 = src[iO + 1];
  const o2 = src[iO + 2];
  let r0 = src[iR + 0] - o0;
  let r1 = src[iR + 1] - o1;
  let r2 = src[iR + 2] - o2;
  let g0 = src[iG + 0] - o0;
  let g1 = src[iG + 1] - o1;
  let g2 = src[iG + 2] - o2;
  let b0 = src[iB + 0] - o0;
  let b1 = src[iB + 1] - o1;
  let b2 = src[iB + 2] - o2;
  const dr = Math.sqrt(r0 * r0 + r1 * r1 + r2 * r2);
  const dg = Math.sqrt(g0 * g0 + g1 * g1 + g2 * g2);
  const db = Math.sqrt(b0 * b0 + b1 * b1 + b2 * b2);
  r0 /= dr;
  r1 /= dr;
  r2 /= dr;
  g0 /= dg;
  g1 /= dg;
  g2 /= dg;
  b0 /= db;
  b1 /= db;
  b2 /= db;

  console.log('o:', o0, o1, o2);
  console.log('R:', r0, r1, r2);
  console.log('G:', g0, g1, g2);
  console.log('B:', b0, b1, b2);

  const det = r0 * (g1 * b2 - g2 * b1) - r1 * (g0 * b2 - g2 * b0) +
      r2 * (g0 * b1 - g1 * b0);

  if (Math.abs(det) < 1e-12) throw new Error('行列が特異です');

  // 逆行列計算 + 転置
  return new Float32Array([
    (g1 * b2 - g2 * b1) / det,  // 0
    (g2 * b0 - g0 * b2) / det,  // 3
    (g0 * b1 - g1 * b0) / det,  // 6
    o0,
    (r2 * b1 - r1 * b2) / det,  // 1
    (r0 * b2 - r2 * b0) / det,  // 4
    (r1 * b0 - r0 * b1) / det,  // 7
    o1,
    (r1 * g2 - r2 * g1) / det,  // 2
    (r2 * g0 - r0 * g2) / det,  // 5
    (r0 * g1 - r1 * g0) / det,  // 8
    o2,
  ]);
}

export function transformColor(
    mat: Float32Array, v: Float32Array, iv: number): void {
  const r = dot(mat, 0, v, iv + 0) + mat[3];
  const g = dot(mat, 4, v, iv + 0) + mat[7];
  const b = dot(mat, 8, v, iv + 0) + mat[11];
  v[iv + 0] = clip(0, 1, r);
  v[iv + 1] = clip(0, 1, g);
  v[iv + 2] = clip(0, 1, b);
}
