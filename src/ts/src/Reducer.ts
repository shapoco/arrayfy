import {NormalizedImage, PixelFormatInfo, ReducedImage} from './Images';
import {DitherMethod, Palette} from './Palettes';

export class Arguments {
  public src: NormalizedImage;
  public colorDitherMethod: DitherMethod = DitherMethod.NONE;
  public alphaDitherMethod: DitherMethod = DitherMethod.NONE;
  public palette: Palette;
  public format: PixelFormatInfo;
  public output: ReducedImage;
}

export function reduce(args: Arguments) {
  const norm = args.src;
  const outW = norm.width;
  const outH = norm.height;

  const fmt = args.format;
  const numColCh = fmt.numColorChannels;

  const palette = args.palette;
  args.output = new ReducedImage(outW, outH, fmt, palette);
  const outData = args.output.data;

  const alpErrDiffuse = args.alphaDitherMethod == DitherMethod.DIFFUSION;
  const colErrDiffuse = args.colorDitherMethod == DitherMethod.DIFFUSION;

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
        diffuseError(norm, true, alpErr, x, y, fwd);
      }

      if (colErrDiffuse && !transparent) {
        // カラーチャンネルの誤差拡散
        diffuseError(norm, false, colErr, x, y, fwd);
      }
    }  // for ix
  }  // for y
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