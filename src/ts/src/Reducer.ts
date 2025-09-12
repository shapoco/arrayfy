import * as Debug from './Debug';
import {NormalizedImage, PixelFormatInfo, ReducedImage} from './Images';
import {DitherMethod, Palette} from './Palettes';
import {clip} from './Utils';

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

export class Arguments {
  public src: NormalizedImage|null = null;
  public colorDitherMethod: DitherMethod = DitherMethod.NONE;
  public alphaDitherMethod: DitherMethod = DitherMethod.NONE;
  public colorDitherStrength: number = 1.0;
  public alphaDitherStrength: number = 1.0;
  public palette: Palette|null = null;
  public format: PixelFormatInfo|null = null;
  public output: ReducedImage|null = null;
}

export function reduce(args: Arguments) {
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

  if (args.colorDitherMethod == DitherMethod.PATTERN_GRAY) {
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
        diffuseError(norm, true, alpErr, x, y, fwd);
      }

      if (colErrDiffuse && !transparent) {
        // カラーチャンネルの誤差拡散
        if (args.colorDitherStrength < 1.0) {
          for (let ch = 0; ch < numColCh; ch++) {
            colErr[ch] *= args.colorDitherStrength;
          }
        }
        diffuseError(norm, false, colErr, x, y, fwd);
      }
    }  // for ix
  }  // for y

  sw.lap('Reducer.reduce()');
}

function diffuseError(
    img: NormalizedImage, alpha: boolean, error: Float32Array, x: number,
    y: number, forward: boolean) {
  const target = alpha ? img.alpha : img.color;
  const numCh = alpha ? 1 : img.numColorChannels;

  const w = img.width;
  const h = img.height;
  const stride = img.width * numCh;
  for (let ch = 0; ch < numCh; ch++) {
    const i = y * stride + x * numCh + ch;
    const e = error[ch];
    if (e == 0) continue;
    if (forward) {
      if (x < w - 1) {
        target[i + numCh] += e * 7 / 16;
      }
      if (y < h - 1) {
        if (x > 0) {
          target[i + stride - numCh] += e * 3 / 16;
        }
        target[i + stride] += e * 5 / 16;
        if (x < w - 1) {
          target[i + stride + numCh] += e * 1 / 16;
        }
      }
    } else {
      if (x > 0) {
        target[i - numCh] += e * 7 / 16;
      }
      if (y < h - 1) {
        if (x < w - 1) {
          target[i + stride + numCh] += e * 3 / 16;
        }
        target[i + stride] += e * 5 / 16;
        if (x > 0) {
          target[i + stride - numCh] += e * 1 / 16;
        }
      }
    }
  }
}