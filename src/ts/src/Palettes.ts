
import {clip} from './Utils';

export const enum RoundMethod {
  NEAREST,
  EQUAL_DIVISION,
}

export abstract class Palette {
  abstract nearest(
      src: Float32Array, srcOffset: number, dest: Uint8Array,
      destOffset: number, error: Float32Array): void;
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

  nearest(
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
}
