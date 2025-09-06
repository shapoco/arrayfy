
import {clip} from './Utils';

export const enum RoundMethod {
  NEAREST,
  EQUAL_DIVISION,
}

export const enum DitherMethod {
  NONE,
  DIFFUSION,
}

export abstract class Palette {
  // 減色
  abstract reduce(
      src: Float32Array, srcOffset: number, dest: Uint8Array,
      destOffset: number, error: Float32Array): void;

  // プレビュー用に元の色を復元
  abstract extract(
      src: Uint8Array, srcOffset: number, dest: Uint8Array,
      destOffset: number): void;
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
}
