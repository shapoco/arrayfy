
import * as Colors from './Colors';
import {clip} from './Utils';

export const enum RoundMethod {
  NEAREST,
  EQUAL_DIVISION,
}

export const enum DitherMethod {
  NONE,
  DIFFUSION,
  PATTERN_GRAY,
}

export abstract class Palette {
  // 色数
  abstract get numColors(): number;

  // 減色
  abstract reduce(
      src: Float32Array, srcOffset: number, dest: Uint8Array,
      destOffset: number, error: Float32Array): void;

  // プレビュー用に元の色を復元
  abstract extract(
      src: Uint8Array, srcOffset: number, dest: Uint8Array,
      destOffset: number): void;

  // HSL 空間での色範囲を取得
  abstract getHslRange(): Colors.HslRange;

  abstract getAverageStep(): Float32Array;
}

export class FixedPalette extends Palette {
  public inMin: Float32Array;
  public inMax: Float32Array;
  public outMax: Uint8Array;

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
  }

  get numColors(): number {
    let n = 1;
    for (let ch = 0; ch < this.channelBits.length; ch++) {
      n *= (1 << this.channelBits[ch]);
    }
    return n;
  }

  reduce(
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

  extract(
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

  getHslRange(): Colors.HslRange {
    return {hMin: 0, hRange: 1, sMin: 0, sMax: 1, lMin: 0, lMax: 1};
  }

  getAverageStep(): Float32Array {
    const avgStep = new Float32Array(this.channelBits.length);
    for (let ch = 0; ch < this.channelBits.length; ch++) {
      const numLevel = 1 << this.channelBits[ch];
      avgStep[ch] = 1 / (numLevel - 1);
    }
    return avgStep;
  }
}

export class IndexedPalette extends Palette {
  public colors: Float32Array;
  public enabled: boolean[];
  constructor(public channelBits: number[], public indexBits: number) {
    super();
    const numColors = 1 << indexBits;
    this.colors = new Float32Array(numColors * channelBits.length);
    this.enabled = new Array(numColors).fill(false);
  }

  get numColors(): number {
    return 1 << this.indexBits;
  }

  reduce(
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

  extract(
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

  getHslRange(): Colors.HslRange {
    const numColors = this.numColors;

    // RGB 空間で重心を調べ、その重心の色相を中心とおく
    let rgbCenter = new Float32Array([0, 0, 0]);
    for (let i = 0; i < numColors; i++) {
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

  getAverageStep(): Float32Array {
    const avgStep = new Float32Array(this.channelBits.length);
    for (let ch = 0; ch < this.channelBits.length; ch++) {
      let levels: number[] = [];
      for (let i = 0; i < this.numColors; i++) {
        if (!this.enabled[i]) continue;
        const v = this.colors[i * this.channelBits.length + ch];
        if (!levels.includes(v)) {
          levels.push(v);
        }
      }
      levels.sort((a, b) => a - b);
      let stepSum = 0;
      for (let i = 1; i < levels.length; i++) {
        stepSum += (levels[i] - levels[i - 1]);
      }
      avgStep[ch] = stepSum / Math.max(1, levels.length - 1);
    }
    return avgStep;
  }
}