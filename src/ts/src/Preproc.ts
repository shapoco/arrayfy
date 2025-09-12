import * as Colors from './Colors';
import * as Debug from './Debug';
import {Rect, Size} from './Geometries';
import {ColorSpace, NormalizedImage} from './Images';
import {Palette} from './Palettes';
import {clip} from './Utils';

export const enum AlphaMode {
  KEEP,
  FILL,
  BINARIZE,
  SET_KEY_COLOR,
}

export const enum ColorSpaceReductionMode {
  NONE,
  CLIP,
  FOLD,
  TRANSFORM,
}

export type ScalarParam = {
  value: number; automatic: boolean;
};

export class PreProcArgs {
  public src: NormalizedImage|null = null;

  public alphaProc: AlphaMode = AlphaMode.KEEP;
  public alphaThresh: number = 128;
  public backColor: number = 0x000000;

  public hue: number = 0;
  public saturation: number = 1;
  public lightness: number = 1;

  public csrMode: ColorSpaceReductionMode = ColorSpaceReductionMode.NONE;
  public csrHslRange: Colors.HslRange = new Colors.HslRange();
  public csrHueTolerance: number = 60 / 360;
  public csrTransformMatrix: Float32Array = new Float32Array(12);

  public gamma: ScalarParam = {value: 1, automatic: true};
  public brightness: ScalarParam = {value: 0, automatic: true};
  public contrast: ScalarParam = {value: 0, automatic: true};
  public invert: boolean = false;

  public out: NormalizedImage = new NormalizedImage(0, 0, ColorSpace.RGB);
}

export function process(args: PreProcArgs): void {
  const sw = new Debug.StopWatch(false);

  const img = (args.src as NormalizedImage).clone();

  // アルファチャンネルの補正
  if (args.alphaProc == AlphaMode.BINARIZE) {
    binarizeAlpha(img, args.alphaThresh / 255);
  } else if (args.alphaProc == AlphaMode.FILL) {
    fillBackground(img, args.backColor);
  }

  // 色調補正
  correctHSL(img, args.hue, args.saturation, args.lightness);
  args.gamma = correctGamma(img, args.gamma);
  args.brightness = offsetBrightness(img, args.brightness);
  args.contrast = correctContrast(img, args.contrast);

  // 階調反転
  if (args.invert) {
    for (let i = 0; i < img.color.length; i++) {
      img.color[i] = 1 - img.color[i];
    }
  }

  // 色空間の縮退
  switch (args.csrMode) {
    case ColorSpaceReductionMode.CLIP:
      clipColorSpace(img, args.csrHslRange, args.csrHueTolerance);
      break;
    case ColorSpaceReductionMode.FOLD:
      foldColorSpace(img, args.csrHslRange);
      break;
    case ColorSpaceReductionMode.TRANSFORM:
      transformColorSpace(img, args.csrTransformMatrix);
      break;
  }

  args.out = img;

  sw.lap('PreProc.process()');
}

function correctHSL(
    img: NormalizedImage, hShift: number, sCoeff: number,
    lCoeff: number): void {
  const numPixels = img.width * img.height;
  switch (img.colorSpace) {
    case ColorSpace.GRAYSCALE: {
      if (lCoeff == 1) return;
      for (let i = 0; i < numPixels; i++) {
        img.color[i] = clip(0, 1, img.color[i] * lCoeff);
      }
    } break;

    case ColorSpace.RGB: {
      if (hShift == 0 && sCoeff == 1 && lCoeff == 1) return;

      const hsl = new Float32Array(numPixels * 3);
      Colors.rgbToHslArrayF32(img.color, 0, hsl, 0, numPixels);
      for (let i = 0; i < numPixels; i++) {
        hsl[i * 3 + 0] = Colors.hueAdd(hsl[i * 3 + 0], hShift);
        hsl[i * 3 + 1] = clip(0, 1, hsl[i * 3 + 1] * sCoeff);
        hsl[i * 3 + 2] = clip(0, 1, hsl[i * 3 + 2] * lCoeff);
      }
      Colors.hslToRgbArrayF32(hsl, 0, img.color, 0, numPixels);
    } break;

    default:
      throw new Error('Invalid color space');
  }
}

function clipColorSpace(
    img: NormalizedImage, hslRange: Colors.HslRange, hueTolerance: number) {
  const hMin = Colors.hueWrap(hslRange.hMin);
  const hRange = clip(0, 1, hslRange.hRange);
  const sMin = clip(0, 1, hslRange.sMin);
  const sMax = clip(sMin, 1, hslRange.sMax);
  const lMin = clip(0, 1, hslRange.lMin);
  const lMax = clip(lMin, 1, hslRange.lMax);
  const hReduction = hRange < (1 - 1e-5);
  const sReduction = sMin != 0 || sMax != 1;
  const lReduction = lMin != 0 || lMax != 1;
  const hslReduction = hReduction || sReduction || lReduction;

  const numPixels = img.width * img.height;
  switch (img.colorSpace) {
    case ColorSpace.GRAYSCALE: {
      if (!lReduction) return;
      for (let i = 0; i < numPixels; i++) {
        img.color[i] = clip(lMin, lMax, img.color[i]);
      }
    } break;

    case ColorSpace.RGB: {
      if (!hslReduction) return;
      const hsl = new Float32Array(numPixels * 3);
      Colors.rgbToHslArrayF32(img.color, 0, hsl, 0, numPixels);
      for (let i = 0; i < numPixels; i++) {
        let h = hsl[i * 3 + 0];
        let s = hsl[i * 3 + 1];
        let l = hsl[i * 3 + 2];
        const hClipped = Colors.hueClip(hMin, hRange, h);
        const hDiff = Math.abs(Colors.hueDiff(hClipped, h));
        if (hDiff >= hueTolerance) {
          s = 0;
        } else {
          s *= (1 - hDiff / hueTolerance);
        }
        hsl[i * 3 + 0] = hClipped;
        hsl[i * 3 + 1] = clip(sMin, sMax, s);
        hsl[i * 3 + 2] = clip(lMin, lMax, l);
      }
      Colors.hslToRgbArrayF32(hsl, 0, img.color, 0, numPixels);
    } break;

    default:
      throw new Error('Invalid color space');
  }
}

function foldColorSpace(img: NormalizedImage, hslRange: Colors.HslRange) {
  const hMin = Colors.hueWrap(hslRange.hMin);
  const hRange = clip(0, 1, hslRange.hRange);
  const sMin = clip(0, 1, hslRange.sMin);
  const sMax = clip(sMin, 1, hslRange.sMax);
  const lMin = clip(0, 1, hslRange.lMin);
  const lMax = clip(lMin, 1, hslRange.lMax);
  const hReduction = hRange < (1 - 1e-5);
  const sReduction = sMin != 0 || sMax != 1;
  const lReduction = lMin != 0 || lMax != 1;
  const hslReduction = hReduction || sReduction || lReduction;

  const numPixels = img.width * img.height;
  switch (img.colorSpace) {
    case ColorSpace.GRAYSCALE: {
      if (!lReduction) return;
      for (let i = 0; i < numPixels; i++) {
        let l = img.color[i];
        l = lMin + (l - lMin) * (lMax - lMin);
        img.color[i] = clip(0, 1, l);
      }
    } break;

    case ColorSpace.RGB: {
      if (!hslReduction) return;
      const hHalfRange = hRange / 2;
      const hCenter = Colors.hueAdd(hMin, hHalfRange);
      const hsl = new Float32Array(numPixels * 3);
      Colors.rgbToHslArrayF32(img.color, 0, hsl, 0, numPixels);
      for (let i = 0; i < numPixels; i++) {
        let h = hsl[i * 3 + 0];
        let s = hsl[i * 3 + 1];
        let l = hsl[i * 3 + 2];
        if (hHalfRange == 0) {
          h = hMin;
        } else {
          let hDist = Colors.hueDiff(h, hCenter);
          if (hDist < -hHalfRange || hHalfRange < hDist) {
            const sign = hDist < 0 ? -1 : 1;
            hDist = Math.abs(hDist);
            hDist = (0.5 - hDist) / (0.5 - hHalfRange);
            hDist *= sign * hHalfRange;
            h = Colors.hueAdd(hCenter, hDist);
          }
        }
        l = lMin + (l - lMin) * (lMax - lMin);
        s = sMin + (s - sMin) * (sMax - sMin);
        hsl[i * 3 + 0] = h;
        hsl[i * 3 + 1] = clip(0, 1, s);
        hsl[i * 3 + 2] = clip(0, 1, l);
      }
      Colors.hslToRgbArrayF32(hsl, 0, img.color, 0, numPixels);
    } break;

    default:
      throw new Error('Invalid color space');
  }
}

function transformColorSpace(img: NormalizedImage, matrix: Float32Array) {
  const numPixels = img.width * img.height;
  switch (img.colorSpace) {
    case ColorSpace.RGB: {
      for (let i = 0; i < numPixels; i++) {
        Colors.transformColor(matrix, img.color, i * 3);
      }
    } break;

    default:
      throw new Error('Invalid color space for transform');
  }
}

function makeHistogramF32(
    img: NormalizedImage, histogramSize: number): Uint32Array {
  const histogram = new Uint32Array(histogramSize);
  const numPixels = img.width * img.height;
  const numCh = img.numColorChannels;
  for (let i = 0; i < numPixels; i++) {
    if (img.alpha[i] > 0) {
      const gray = Colors.grayscaleArrayF32(img.color, i * numCh);
      histogram[Math.round(gray * (histogramSize - 1))]++;
    }
  }
  return histogram;
}

function determineGammaValue(img: NormalizedImage): number {
  const HISTOGRAM_SIZE = 16;
  const histogram = makeHistogramF32(img, HISTOGRAM_SIZE);

  let min = 0.5;
  let max = 2;

  // 輝度 50% を中心にバランスが取れるようなガンマ値を二分探索
  let gamma = 1;
  while (max - min > 0.01) {
    gamma = (min + max) / 2;
    let lo = 0, hi = 0;
    for (let i = 0; i < HISTOGRAM_SIZE; i++) {
      const val = Math.pow(i / (HISTOGRAM_SIZE - 1), 1 / gamma);
      if (val < 0.5) {
        lo += histogram[i];
      } else {
        hi += histogram[i];
      }
    }
    if (lo > hi) {
      min = gamma;
    } else {
      max = gamma;
    }
  }
  return gamma;
}

function binarizeAlpha(img: NormalizedImage, thresh: number) {
  const numPixels = img.width * img.height;
  for (let i = 0; i < numPixels; i++) {
    img.alpha[i] = img.alpha[i] < thresh ? 0 : 1;
  }
}

// 透明部分を背景色で塗りつぶす
function fillBackground(img: NormalizedImage, color: number) {
  const numCh = img.numColorChannels;
  let bk = new Float32Array(numCh);

  const {r: backR, g: backG, b: backB} = Colors.rgbU32ToF32(color);
  switch (img.colorSpace) {
    case ColorSpace.GRAYSCALE:
      bk[0] = Colors.grayscale(backR, backG, backB);
      break;
    case ColorSpace.RGB:
      bk[0] = backR;
      bk[1] = backG;
      bk[2] = backB;
      break;
    default:
      throw new Error('Invalid color space');
  }

  const numPixels = img.width * img.height;
  for (let i = 0; i < numPixels; i++) {
    const a1 = img.alpha[i];
    const a0 = 1 - a1;
    for (let c = 0; c < numCh; c++) {
      img.color[i * numCh + c] = bk[c] * a0 + img.color[i * numCh + c] * a1;
    }
    img.alpha[i] = 1;
  }
}

function correctGamma(img: NormalizedImage, gamma: ScalarParam): ScalarParam {
  if (gamma.automatic) {
    gamma.value = determineGammaValue(img);
  }
  gamma.value = clip(0.01, 5, gamma.value);
  if (gamma.value != 1) {
    for (let i = 0; i < img.color.length; i++) {
      const val = Math.pow(img.color[i], 1 / gamma.value);
      img.color[i] = val;
    }
  }
  return gamma;
}

function offsetBrightness(
    img: NormalizedImage, param: ScalarParam): ScalarParam {
  if (param.automatic) {
    const {min, max} = getColorMinMax(img);
    param.value = 0.5 - (min + max) / 2;
  }
  param.value = clip(-1, 1, param.value);
  if (param.value != 0) {
    for (let i = 0; i < img.color.length; i++) {
      img.color[i] = clip(0, 1, img.color[i] + param.value);
    }
  }
  return param;
}

function correctContrast(
    img: NormalizedImage, param: ScalarParam): ScalarParam {
  if (param.automatic) {
    const {min, max} = getColorMinMax(img);
    const middle = (min + max) / 2;
    if (middle < 0.5 && min < middle) {
      param.value = 0.5 / (middle - min);
    } else if (middle > 0.5 && max > middle) {
      param.value = 0.5 / (max - middle);
    }
  }
  param.value = clip(0.01, 10, param.value);
  if (param.value != 1) {
    for (let i = 0; i < img.color.length; i++) {
      img.color[i] = clip(0, 1, (img.color[i] - 0.5) * param.value + 0.5);
    }
  }
  return param;
}

function getColorMinMax(img: NormalizedImage): {min: number, max: number} {
  const numPixels = img.width * img.height;
  const numCh = img.numColorChannels;
  let min = 9999;
  let max = -9999;
  for (let i = 0; i < numPixels; i++) {
    if (img.alpha[i] > 0) {
      const gray = Colors.grayscaleArrayF32(img.color, i * numCh);
      min = Math.min(min, gray);
      max = Math.max(max, gray);
    }
  }
  if (min <= max) {
    return {min, max};
  } else {
    return {min: 0.5, max: 0.5};
  }
}