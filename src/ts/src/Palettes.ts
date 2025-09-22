
import * as Colors from './Colors';
import {ConvexHull3D} from './ConvexHulls';
import * as Debug from './Debug';
import * as Math3D from './Math3D';
import {Vec3} from './Math3D';
import {clip} from './Utils';

export const enum RoundMethod {
  NEAREST,
  EQUAL_DIVISION,
}

export const enum DitherMethod {
  NONE,
  DIFFUSION,
  PATTERN,
}

export const MAX_PALETTE_SIZE = 256;

export abstract class Palette {
  // 色数
  public abstract get numColors(): number;

  public nearest(dst: Vec3, src: Vec3): void {
    const orig = new Float32Array([src.x, src.y, src.z]);
    const reduced = new Uint8Array(3);
    this.reduce(orig, 0, reduced, 0, new Float32Array(3));
    const extracted = new Uint8Array(3);
    this.extract(reduced, 0, extracted, 0);
    dst.x = extracted[0] / 255;
    dst.y = extracted[1] / 255;
    dst.z = extracted[2] / 255;
  }

  // 減色
  public abstract reduce(
      src: Float32Array, srcOffset: number, dest: Uint8Array,
      destOffset: number, error: Float32Array): void;

  // プレビュー用に元の色を復元
  public abstract extract(
      src: Uint8Array, srcOffset: number, dest: Uint8Array,
      destOffset: number): void;

  // HSL 空間での色範囲を取得
  public abstract getHslRange(): Colors.HslRange;

  public abstract getAverageStep(): Float32Array;

  public abstract get convexHull(): ConvexHull3D;

  public abstract normalizeColor(dest: Float32Array): void;

  public getRgbAxis(): {K: Vec3, R: Vec3, G: Vec3, B: Vec3, dr: number} {
    const K = new Vec3(0, 0, 0);
    const W = new Vec3(1, 1, 1);
    const R = new Vec3(1, 0, 0);
    const G = new Vec3(0, 1, 0);
    const B = new Vec3(0, 0, 1);
    this.nearest(K, K);
    this.nearest(R, R);
    this.nearest(G, G);
    this.nearest(B, B);
    this.nearest(W, W);
    R.sub(K);
    G.sub(K);
    B.sub(K);
    W.sub(K);
    R.norm();
    G.norm();
    B.norm();
    const dr = W.len();
    return {K, R, G, B, dr};
  }
}

export class FixedPalette extends Palette {
  public inMin: Float32Array;
  public inMax: Float32Array;
  public outMax: Uint8Array;
  public convexHullCache: ConvexHull3D;

  constructor(public channelBits: number[], public roundMethod: RoundMethod) {
    super();
    this.inMin = new Float32Array(channelBits.length);
    this.inMax = new Float32Array(channelBits.length);
    this.outMax = new Uint8Array(channelBits.length);
    const equDiv = roundMethod == RoundMethod.EQUAL_DIVISION;
    for (let ch = 0; ch < channelBits.length; ch++) {
      const numLevel = 1 << channelBits[ch];
      this.inMin[ch] = equDiv ? (1 / (numLevel * 2)) : 0;
      this.inMax[ch] = equDiv ? ((numLevel * 2 - 1) / (numLevel * 2)) : 1;
      this.outMax[ch] = numLevel - 1;
    }

    const verts = new Float32Array([
      0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1
    ]);
    this.convexHullCache = new ConvexHull3D(verts);
  }

  get numColors(): number {
    let n = 1;
    for (let ch = 0; ch < this.channelBits.length; ch++) {
      n *= (1 << this.channelBits[ch]);
    }
    return n;
  }

  public reduce(
      src: Float32Array, srcOffset: number, dest: Uint8Array,
      destOffset: number, error: Float32Array): void {
    for (let ch = 0; ch < this.channelBits.length; ch++) {
      const inNorm = src[srcOffset + ch];
      const inMod = clip(
          0, 1, (inNorm - this.inMin[ch]) / (this.inMax[ch] - this.inMin[ch]));
      const out = Math.round(this.outMax[ch] * inMod);
      dest[destOffset + ch] = out;
      const outNorm = out / this.outMax[ch];
      error[ch] = inNorm - outNorm;
    }
  }

  public extract(
      src: Uint8Array, srcOffset: number, dest: Uint8Array,
      destOffset: number): void {
    switch (this.channelBits.length) {
      case 1:
        // グレースケール
        const gray = Math.round(src[srcOffset] * 255 / this.outMax[0]);
        for (let ch = 0; ch < 3; ch++) {
          dest[destOffset + ch] = gray;
        }
        break;
      case 3:
        // RGB
        for (let ch = 0; ch < 3; ch++) {
          dest[destOffset + ch] =
              Math.round(src[srcOffset + ch] * 255 / this.outMax[ch]);
        }
        break;
      default:
        throw new Error('Invalid channel number');
    }
  }

  public getHslRange(): Colors.HslRange {
    return {hMin: 0, hRange: 1, sMin: 0, sMax: 1, lMin: 0, lMax: 1};
  }

  public getAverageStep(): Float32Array {
    const avgStep = new Float32Array(this.channelBits.length);
    for (let ch = 0; ch < this.channelBits.length; ch++) {
      const numLevel = 1 << this.channelBits[ch];
      avgStep[ch] = 1 / (numLevel - 1);
    }
    return avgStep;
  }

  public get convexHull(): ConvexHull3D {
    return this.convexHullCache;
  }

  public normalizeColor(dest: Float32Array): void {
    // nothing to do
  }
}

export class IndexedPalette extends Palette {
  public colors: Float32Array;
  public enabled: boolean[];
  public convexHullCache: ConvexHull3D|null = null;

  constructor(public channelBits: number[], public indexBits: number) {
    super();
    const numColors = 1 << indexBits;
    this.colors = new Float32Array(numColors * channelBits.length);
    this.enabled = new Array(numColors).fill(false);
  }

  public get numColors(): number {
    return 1 << this.indexBits;
  }

  public reduce(
      src: Float32Array, srcOffset: number, dest: Uint8Array,
      destOffset: number, error: Float32Array): void {
    const numCh = this.channelBits.length;
    let bestIdx = 0;
    let bestDist = Number.MAX_VALUE;
    for (let i = 0; i < (1 << this.indexBits); i++) {
      if (!this.enabled[i]) continue;
      let dist = 0;
      for (let ch = 0; ch < numCh; ch++) {
        const diff = src[srcOffset + ch] - this.colors[i * numCh + ch];
        // dist += Math.abs(diff);
        dist += diff * diff;
      }
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    dest[destOffset] = bestIdx;
    for (let ch = 0; ch < numCh; ch++) {
      const outNorm = this.colors[bestIdx * numCh + ch];
      error[ch] = src[srcOffset + ch] - outNorm;
    }
  }

  public extract(
      src: Uint8Array, srcOffset: number, dest: Uint8Array,
      destOffset: number): void {
    switch (this.channelBits.length) {
      case 1:
        // グレースケール
        const gray = Math.round(this.colors[src[srcOffset]] * 255);
        for (let ch = 0; ch < 3; ch++) {
          dest[destOffset + ch] = gray;
        }
        break;
      case 3:
        // RGB
        for (let ch = 0; ch < 3; ch++) {
          dest[destOffset + ch] =
              Math.round(this.colors[src[srcOffset] * 3 + ch] * 255);
        }
        break;
      default:
        throw new Error('Invalid channel number');
    }
  }

  public getHslRange(): Colors.HslRange {
    const numColors = this.numColors;

    // RGB 空間で重心を調べ、その重心の色相を中心とおく
    let rgbCenter = new Float32Array([0, 0, 0]);
    for (let i = 0; i < numColors; i++) {
      if (!this.enabled[i]) continue;
      rgbCenter[0] += this.colors[i * 3 + 0];
      rgbCenter[1] += this.colors[i * 3 + 1];
      rgbCenter[2] += this.colors[i * 3 + 2];
    }
    rgbCenter[0] /= numColors;
    rgbCenter[1] /= numColors;
    rgbCenter[2] /= numColors;
    let hslCenter = new Float32Array(3);
    Colors.rgbToHslArrayF32(rgbCenter, 0, hslCenter, 0, 1);
    const centerH = hslCenter[0];

    // HSL空間の範囲を調べる
    const hsl = new Float32Array(this.colors.length);
    Colors.rgbToHslArrayF32(this.colors, 0, hsl, 0, numColors);
    let hDistMin = 0, hDistMax = 0, sMin = 1, sMax = 0, lMin = 1, lMax = 0;
    for (let i = 0; i < numColors; i++) {
      if (!this.enabled[i]) continue;
      const h = hsl[i * 3 + 0];
      const s = hsl[i * 3 + 1];
      const l = hsl[i * 3 + 2];
      if (s > 0) {
        const hDist = Colors.hueDiff(h, centerH);
        if (hDist < hDistMin) hDistMin = hDist;
        if (hDist > hDistMax) hDistMax = hDist;
      }
      if (s < sMin) sMin = s;
      if (s > sMax) sMax = s;
      if (l < lMin) lMin = l;
      if (l > lMax) lMax = l;
    }

    const hMin = Colors.hueAdd(centerH, hDistMin);
    const hRange = hDistMax - hDistMin;
    return {hMin, hRange, sMin, sMax, lMin, lMax};
  }

  public getAverageStep(): Float32Array {
    const numCh = this.channelBits.length;
    const avgStep = new Float32Array(numCh);
    const numLevels = Math.max(2, Math.pow(this.numColors, 1 / numCh));
    for (let ch = 0; ch < numCh; ch++) {
      let min = 1;
      let max = 0;
      for (let i = 0; i < this.numColors; i++) {
        if (!this.enabled[i]) continue;
        min = Math.min(min, this.colors[i * 3 + ch]);
        max = Math.max(max, this.colors[i * 3 + ch]);
      }
      avgStep[ch] = Math.max(0.1, max - min) / (numLevels - 1);
    }
    return avgStep;
  }

  public get convexHull(): ConvexHull3D {
    if (!this.convexHullCache) {
      let numAvailableColors = 0;
      for (let i = 0; i < this.numColors; i++) {
        if (this.enabled[i]) numAvailableColors++;
      }
      const v = new Float32Array(numAvailableColors * 3);
      let idx = 0;
      for (let i = 0; i < this.numColors; i++) {
        if (!this.enabled[i]) continue;
        v[idx * 3 + 0] = this.colors[i * 3 + 0];
        v[idx * 3 + 1] = this.colors[i * 3 + 1];
        v[idx * 3 + 2] = this.colors[i * 3 + 2];
        idx++;
      }
      this.convexHullCache = new ConvexHull3D(v);
    }
    return this.convexHullCache;
  }

  public normalizeColor(dest: Float32Array): void {
    const sw = new Debug.StopWatch(false);
    const hull = this.convexHull;
    const numCh = this.channelBits.length;
    if (numCh != 3) return;
    const black = new Vec3(0, 0, 0);
    const white = new Vec3(1, 1, 1);
    const rayOrigin = new Vec3();
    const rayDir = new Vec3();
    let numInside = 0;  // todo: delete
    const outBuff = new Uint8Array(3);
    const errBuff = new Float32Array(3);
    hull.hitCount = 0;
    for (let i = 0; i < dest.length; i += 3) {
      rayOrigin.set(dest[i], dest[i + 1], dest[i + 2]);
      if (true) {
        rayDir.copyFrom(Math3D.projectPointToLine(black, white, rayOrigin));
      } else {
        rayDir.copyFrom(hull.areaWeight);
      }
      rayDir.sub(rayOrigin);
      if (rayDir.len() <= 1e-6) {
        numInside++;  // todo: delete
        continue;
      }
      rayDir.norm();
      const ret = hull.intersectWithRay(rayOrigin, rayDir);
      if (ret.inside) {
        numInside++;  // todo: delete
        continue;
      }
      const hit = ret.hit!;
      if (hit.result != Math3D.HitResult.HIT || hit.point == null) {
        this.reduce(dest, i, outBuff, 0, errBuff);
        dest[i + 0] = this.colors[outBuff[0] * 3 + 0];
        dest[i + 1] = this.colors[outBuff[0] * 3 + 1];
        dest[i + 2] = this.colors[outBuff[0] * 3 + 2];
      } else if (hit.front) {
        dest[i + 0] = hit.point.x;
        dest[i + 1] = hit.point.y;
        dest[i + 2] = hit.point.z;
      }
    }

    // todo: delete
    if (false) {
      const hitRate = hull.hitCount * 100 / (dest.length / 3);
      const insideRate = numInside * 100 / (dest.length / 3);
      console.log(`IndexedPalette: octree hit rate = ${hitRate.toFixed(1)}%`);
      console.log(`IndexedPalette: inside rate = ${insideRate.toFixed(1)}%`);
    }

    sw.lap('IndexedPalette.normalizeColor()');
  }
}