import * as Debug from './Debug';
import {NormalizedImage, PixelFormatInfo, ReducedImage} from './Images';
import {DitherMethod, Palette} from './Palettes';
import {clip} from './Utils';

export const DEFAULT_DITHER_STRENGTH = 0.8;

export const enum DiffusionKernel {
  FLOYD_STEINBERG,
  JARVIS_JUDICE_NINKE,
  STUCKI,
  SIERRA,
}

export class ReduceArgs {
  public src: NormalizedImage|null = null;
  public colorDitherMethod: DitherMethod = DitherMethod.NONE;
  public colorDitherStrength: number = DEFAULT_DITHER_STRENGTH;
  public colorDitherAntiSaturation = false;
  public alphaDitherMethod: DitherMethod = DitherMethod.NONE;
  public alphaDitherStrength: number = DEFAULT_DITHER_STRENGTH;
  public diffusionKernel: DiffusionKernel = DiffusionKernel.STUCKI;
  public palette: Palette|null = null;
  public format: PixelFormatInfo|null = null;
  public output: ReducedImage|null = null;
}

const ditherPattern = new Float32Array([
  0.5 / 16 - 0.5,
  8.5 / 16 - 0.5,
  2.5 / 16 - 0.5,
  10.5 / 16 - 0.5,
  12.5 / 16 - 0.5,
  4.5 / 16 - 0.5,
  14.5 / 16 - 0.5,
  6.5 / 16 - 0.5,
  3.5 / 16 - 0.5,
  11.5 / 16 - 0.5,
  1.5 / 16 - 0.5,
  9.5 / 16 - 0.5,
  15.5 / 16 - 0.5,
  7.5 / 16 - 0.5,
  13.5 / 16 - 0.5,
  5.5 / 16 - 0.5,
]);

const diffuseKernels: {[key in DiffusionKernel]: number[]} = {
  [DiffusionKernel.FLOYD_STEINBERG]: [
    0 / 16, 0 / 16, 0 / 16, 7 / 16, 0 / 16, 0 / 16, 3 / 16, 5 / 16, 1 / 16,
    0 / 16, 0 / 16, 0 / 16, 0 / 16, 0 / 16, 0 / 16
  ],
  [DiffusionKernel.JARVIS_JUDICE_NINKE]: [
    0 / 48, 0 / 48, 0 / 48, 7 / 48, 5 / 48, 3 / 48, 5 / 48, 7 / 48, 5 / 48,
    3 / 48, 1 / 48, 3 / 48, 5 / 48, 3 / 48, 1 / 48
  ],
  [DiffusionKernel.STUCKI]: [
    0 / 42, 0 / 42, 0 / 42, 8 / 42, 4 / 42, 2 / 42, 4 / 42, 8 / 42, 4 / 42,
    2 / 42, 1 / 42, 2 / 42, 4 / 42, 2 / 42, 1 / 42
  ],
  [DiffusionKernel.SIERRA]: [
    0 / 32, 0 / 32, 0 / 32, 5 / 32, 3 / 32, 2 / 32, 4 / 32, 5 / 32, 4 / 32,
    2 / 32, 0 / 32, 2 / 32, 3 / 32, 2 / 32, 0 / 32
  ],
};

export function reduce(args: ReduceArgs) {
  const sw = new Debug.StopWatch(false);
  const norm = args.src as NormalizedImage;
  const outW = norm.width;
  const outH = norm.height;

  const fmt = args.format as PixelFormatInfo;
  const numColCh = fmt.numColorChannels;

  const palette = args.palette as Palette;
  args.output = new ReducedImage(outW, outH, fmt, palette);
  const outData = args.output.data;

  const alpErrDiffuse = args.alphaDitherMethod == DitherMethod.DIFFUSION;
  const colErrDiffuse = args.colorDitherMethod == DitherMethod.DIFFUSION;

  if (args.colorDitherMethod == DitherMethod.DIFFUSION) {
    // 誤差拡散ディザの場合:
    // 誤差が発散しないよう、変換先のパレットの色から成る凸包内に押し込んでおく
    if (args.colorDitherAntiSaturation) {
      palette.normalizeColor(norm.color);
    }
  } else if (args.colorDitherMethod == DitherMethod.PATTERN) {
    // パターンディザの場合: パターンを加算
    const step = palette.getAverageStep();
    for (let y = 0; y < outH; y++) {
      const iPixelStep = y * outW * numColCh;
      const iPatStep = (y % 4) * 4;
      for (let x = 0; x < outW; x++) {
        const iPixel = iPixelStep + x * numColCh;
        const iPat = iPatStep + (x % 4);
        for (let ch = 0; ch < numColCh; ch++) {
          const s = step[ch];
          let v = norm.color[iPixel + ch];
          v += s * ditherPattern[iPat] * args.colorDitherStrength;
          norm.color[iPixel + ch] = clip(0, 1, v);
        }
      }
    }
  }

  const alpOutMax = (1 << fmt.alphaBits) - 1;
  const colOut = new Uint8Array(numColCh);
  const colErr = new Float32Array(numColCh);
  const alpErr = new Float32Array(1);
  for (let y = 0; y < outH; y++) {
    for (let ix = 0; ix < outW; ix++) {
      // 誤差拡散をジグザグに行うため
      // ライン毎にスキャン方向を変える
      const fwd = y % 2 == 0;
      const x = fwd ? ix : (outW - 1 - ix);
      const iPix = (y * outW + x);

      // アルファチャンネルの値を算出
      let transparent = false;
      let alpOut = alpOutMax;
      if (fmt.hasAlpha) {
        const alpNormIn = norm.alpha[iPix];
        alpOut = Math.round(alpNormIn * alpOutMax);
        const alpNormOut = alpOut / alpOutMax;
        alpErr[0] = alpNormIn - alpNormOut;
        transparent = alpOut == 0;
      }

      // パレットから最も近い色を選択
      palette.reduce(norm.color, iPix * numColCh, colOut, 0, colErr);

      // 出力
      for (let ch = 0; ch < numColCh; ch++) {
        outData[ch][iPix] = colOut[ch];
      }
      if (fmt.hasAlpha) {
        outData[numColCh][iPix] = alpOut;
      }

      if (alpErrDiffuse && fmt.hasAlpha) {
        // アルファチャンネルの誤差拡散
        if (args.alphaDitherStrength < 1.0) {
          alpErr[0] *= args.alphaDitherStrength;
        }
        diffuseError(norm, args.diffusionKernel, true, alpErr, x, y, fwd);
      }

      if (colErrDiffuse && !transparent) {
        // カラーチャンネルの誤差拡散
        if (args.colorDitherStrength < 1.0) {
          for (let ch = 0; ch < numColCh; ch++) {
            colErr[ch] *= args.colorDitherStrength;
          }
        }
        diffuseError(norm, args.diffusionKernel, false, colErr, x, y, fwd);
      }
    }  // for ix
  }  // for y

  sw.lap('Reducer.reduce()');
}

function addError(target: Float32Array, index: number, error: number): void {
  target[index] = clip(0, 1, target[index] + error);
}

function diffuseError(
    img: NormalizedImage, kernel: DiffusionKernel, alpha: boolean,
    error: Float32Array, x: number, y: number, forward: boolean) {
  const target = alpha ? img.alpha : img.color;
  const numCh = alpha ? 1 : img.numColorChannels;

  const w = img.width;
  const h = img.height;
  const stride = img.width * numCh;
  for (let ch = 0; ch < numCh; ch++) {
    // const i = y * stride + x * numCh + ch;
    const e = error[ch];
    if (e == 0) continue;
    for (let ky = 0; ky < 3; ky++) {
      const ty = y + ky;
      if (ty < 0 || ty >= h) continue;
      for (let kx = -2; kx <= 2; kx++) {
        const tx = forward ? (x + kx) : (x - kx);
        if (tx < 0 || tx >= w) continue;

        const ik = ky * 5 + (kx + 2);
        const coeff = diffuseKernels[kernel][ik];
        if (coeff == 0) continue;

        addError(target, ty * stride + tx * numCh + ch, e * coeff);
      }
    }
    // if (forward) {
    //   if (x < w - 1) {
    //     addError(target, i + numCh, e * 7 / 16);
    //   }
    //   if (y < h - 1) {
    //     if (x > 0) {
    //       addError(target, i + stride - numCh, e * 3 / 16);
    //     }
    //     addError(target, i + stride, e * 5 / 16);
    //     if (x < w - 1) {
    //       addError(target, i + stride + numCh, e * 1 / 16);
    //     }
    //   }
    // } else {
    //   if (x > 0) {
    //     addError(target, i - numCh, e * 7 / 16);
    //   }
    //   if (y < h - 1) {
    //     if (x < w - 1) {
    //       addError(target, i + stride + numCh, e * 3 / 16);
    //     }
    //     addError(target, i + stride, e * 5 / 16);
    //     if (x > 0) {
    //       addError(target, i + stride - numCh, e * 1 / 16);
    //     }
    //   }
    // }
  }
}