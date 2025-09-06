import {Rect, Size} from './Geometries';
import {ColorSpace, NormalizedImage} from './Images';
import {clip} from './Utils';

export const enum AlphaProc {
  KEEP,
  FILL,
  BINARIZE,
  SET_KEY_COLOR,
}

export const enum ScalingMethod {
  ZOOM,
  FIT,
  STRETCH,
}

export type ScalarParam = {
  value: number; automatic: boolean;
};

export class Args {
  public srcData: Uint8Array;
  public srcSize: Size = {width: 0, height: 0};
  public trimRect: Rect = {x: 0, y: 0, width: 0, height: 0};
  public outSize: Size = {width: 0, height: 0};
  public outImage: NormalizedImage;
  public colorSpace: ColorSpace;
  public scalingMethod: ScalingMethod = ScalingMethod.ZOOM;
  public alphaProc: AlphaProc = AlphaProc.KEEP;
  public alphaThresh: number = 128;
  public keyColor: number = 0x000000;
  public keyTolerance: number = 0;
  public backColor: number = 0x000000;
  public hue: number = 0;
  public saturation: number = 1;
  public lightness: number = 1;
  public gamma: ScalarParam = {value: 1, automatic: true};
  public brightness: ScalarParam = {value: 0, automatic: true};
  public contrast: ScalarParam = {value: 0, automatic: true};
  public invert: boolean;
}

export function process(args: Args): void {
  let src = args.srcData;

  // 元配列の複製 + トリミング
  {
    const {data, rect} = trim(
        src, args.srcSize, args.trimRect, args.outSize, args.scalingMethod);
    src = data;
    args.trimRect = rect;
  }

  if (args.alphaProc == AlphaProc.SET_KEY_COLOR) {
    // 滲みを防ぐためキーカラー処理はリサイズ前に行う
    applyKeyColor(src, args.srcSize, args.keyColor, args.keyTolerance);
  }

  // リサイズ
  const trimSize = {width: args.trimRect.width, height: args.trimRect.height};
  const resized = resize(src, trimSize, args.outSize);

  // 正規化
  const img = normalize(resized, args.outSize, args.colorSpace);

  // アルファチャンネルの補正
  if (args.alphaProc == AlphaProc.BINARIZE) {
    binarizeAlpha(img, args.alphaThresh / 255);
  } else if (args.alphaProc == AlphaProc.FILL) {
    fillBackground(img, args.backColor);
  }

  // 色調補正
  applyHSL(img, args.hue, args.saturation, args.lightness);
  args.gamma = correctGamma(img, args.gamma);
  args.brightness = offsetBrightness(img, args.brightness);
  args.contrast = correctContrast(img, args.contrast);

  // 階調反転
  if (args.invert) {
    for (let i = 0; i < img.color.length; i++) {
      img.color[i] = 1 - img.color[i];
    }
  }

  args.outImage = img;
}

function trim(
    src: Uint8Array, srcSize: Size, trimRect: Rect, outSize: Size,
    scalingMethod: ScalingMethod): {data: Uint8Array, rect: Rect} {
  const srcW = srcSize.width;
  const srcH = srcSize.height;
  const outW = outSize.width;
  const outH = outSize.height;
  let trimX = trimRect.x;
  let trimY = trimRect.y;
  let trimW = trimRect.width;
  let trimH = trimRect.height;
  let destX = 0;
  let destY = 0;
  let destW = trimW;
  let destH = trimH;

  if (srcW < 1 || srcH < 1 || trimW < 1 || trimH < 1 || outW < 1 || outH < 1) {
    throw new Error('画像サイズは正の値でなければなりません');
  }

  // アスペクト比を維持するようにトリミング範囲を修正
  {
    const outAspect = outW / outH;
    const trimAspect = trimW / trimH;
    if (scalingMethod == ScalingMethod.ZOOM) {
      // 描画範囲が全部画像で埋まるようにトリミング範囲を修正
      if (outAspect > trimAspect) {
        trimH = Math.max(1, Math.round(trimW * outH / outW));
        trimY += Math.round((trimRect.height - trimH) / 2);
      } else if (outAspect < trimAspect) {
        trimW = Math.max(1, Math.round(trimH * outW / outH));
        trimX += Math.round((trimRect.width - trimW) / 2);
      }
    } else if (scalingMethod == ScalingMethod.FIT) {
      // トリミング範囲の画像が全部収まるように描画範囲に余白を追加
      if (outAspect > trimAspect) {
        destW = Math.max(1, Math.round(destH * outW / outH));
        destX += Math.round((trimRect.width - destW) / 2);
      } else if (outAspect < trimAspect) {
        destH = Math.max(1, Math.round(destW * outH / outW));
        destY += Math.round((trimRect.height - destH) / 2);
      }
    }
  }

  const out = new Uint8Array(trimW * trimH * 4);
  const srcStride = srcW * 4;
  const destStride = trimW * 4;

  for (let i = 0; i < destH; i++) {
    const srcY = trimY + i;
    if (srcY < 0 || srcH <= srcY) continue;

    let iSrc = srcY * srcStride + trimX * 4;
    let iDest = (destY + i) * destStride + destX * 4;
    for (let j = 0; j < destW; j++) {
      const srcX = trimX + j;
      if (0 <= srcX && srcX < srcW) {
        for (let c = 0; c < 4; c++) {
          out[iDest++] = src[iSrc++];
        }
      } else {
        iDest += 4;
        iSrc += 4;
      }
    }
  }

  trimRect.x = trimX;
  trimRect.y = trimY;
  trimRect.width = trimW;
  trimRect.height = trimH;
  return {data: out, rect: trimRect};
}

function applyKeyColor(
    data: Uint8Array, size: Size, key: number, tol: number): void {
  const keyR = key & 0xff;
  const keyG = (key >> 8) & 0xff;
  const keyB = (key >> 16) & 0xff;
  for (let y = 0; y < size.height; y++) {
    let i = y * size.width * 4;
    for (let x = 0; x < size.width; x++, i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      let a = data[i + 3];
      const d = Math.abs(r - keyR) + Math.abs(g - keyG) + Math.abs(b - keyB);
      if (d <= tol) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
      }
    }
  }
}

function resize(src: Uint8Array, srcSize: Size, outSize: Size): Uint8Array {
  let srcW = srcSize.width;
  let srcH = srcSize.height;
  const outW = outSize.width;
  const outH = outSize.height;

  const srcStride = srcW * 4;

  if (srcW == outW && srcH == outH) {
    return src;
  }

  let preW = outW;
  while (preW * 2 < srcW) preW *= 2;
  const preStride = preW * 4;
  const pre = new Uint8Array(preStride * srcH);

  // 横方向の縮小
  {
    // 2 のべき乗でない端数は線形補間
    for (let srcY = 0; srcY < srcH; srcY++) {
      let iDest = srcY * preStride;
      if (preW == srcW) {
        let iSrc = srcY * srcStride;
        for (let i = 0; i < preW * 4; i++) {
          pre[iDest++] = src[iSrc++];
        }
      } else {
        const iSrcOffset = srcY * srcStride;
        for (let destX = 0; destX < preW; destX++, iDest += 4) {
          const srcFracX = destX * (srcW - 1) / (preW - 1);
          let srcIntX = Math.floor(srcFracX);
          let coeff = srcFracX - srcIntX;
          if (srcIntX >= srcW - 1) {
            srcIntX -= 1;
            coeff = 1;
          }
          let iSrc = iSrcOffset + srcIntX * 4;
          blend(src, iSrc, iSrc + 4, pre, iDest, coeff);
        }
      }
    }

    // 2 のべき乗の縮小
    while (preW > outW) {
      preW = Math.round(preW / 2);
      for (let y = 0; y < srcH; y++) {
        let iDest = y * preStride;
        let iSrc = y * preStride;
        for (let x = 0; x < preW; x++, iDest += 4, iSrc += 8) {
          blend(pre, iSrc, iSrc + 4, pre, iDest, 0.5);
        }
      }
    }
  }

  if (srcH == outH && preStride == outW * 4) {
    return pre;
  }

  let postH = outH;
  while (postH * 2 < srcH) postH *= 2;
  const postStride = outW * 4;
  const post = new Uint8Array(postStride * postH);

  // 縦方向の縮小
  {
    // 2 のべき乗でない端数は線形補間
    for (let destY = 0; destY < postH; destY++) {
      let iDest = destY * postStride;
      if (postH == srcH) {
        let iSrc = destY * preStride;
        for (let i = 0; i < postStride; i++) {
          post[iDest++] = pre[iSrc++];
        }
      } else {
        const srcFracY = destY * (srcH - 1) / (postH - 1);
        let srcIntY = Math.floor(srcFracY);
        let coeff = srcFracY - srcIntY;
        if (srcIntY >= srcH - 1) {
          srcIntY -= 1;
          coeff = 1;
        }
        let iSrc = srcIntY * preStride;

        for (let destX = 0; destX < outW; destX++, iDest += 4, iSrc += 4) {
          blend(pre, iSrc, iSrc + preStride, post, iDest, coeff);
        }
      }
    }

    // 2 のべき乗の縮小
    while (postH > outH) {
      postH = Math.round(postH / 2);
      for (let y = 0; y < postH; y++) {
        let iDest = y * postStride;
        let iSrc = y * postStride * 2;
        for (let x = 0; x < outW; x++, iDest += 4, iSrc += 4) {
          blend(post, iSrc, iSrc + postStride, post, iDest, 0.5);
        }
      }
    }
  }

  if (postH == outH) {
    return post;
  } else {
    const ret = new Uint8Array(outW * outH * 4);
    for (let i = 0; i < ret.length; i++) {
      ret[i] = post[i];
    }
    return ret;
  }
}

function blend(
    src: Uint8Array, si0: number, si1: number, dest: Uint8Array, di: number,
    coeff1: number): void {
  let coeff0 = 1 - coeff1;
  const a0 = src[si0 + 3];
  const a1 = src[si1 + 3];
  const a = a0 * coeff0 + a1 * coeff1;
  coeff0 *= a0 / 255;
  coeff1 *= a1 / 255;
  if (coeff0 + coeff1 > 0) {
    const norm = 1 / (coeff0 + coeff1);
    coeff0 *= norm;
    coeff1 *= norm;
  }
  for (let c = 0; c < 3; c++) {
    const m = src[si0++] * coeff0 + src[si1++] * coeff1;
    dest[di++] = clip(0, 255, Math.round(m));
  }
  dest[di] = clip(0, 255, Math.round(a));
}

function normalize(
    data: Uint8Array, size: Size, colorSpace: ColorSpace): NormalizedImage {
  const numPixels = size.width * size.height;
  const img = new NormalizedImage(size.width, size.height, colorSpace);
  for (let i = 0; i < numPixels; i++) {
    switch (colorSpace) {
      case ColorSpace.GRAYSCALE:
        img.color[i] = grayscaleArrayU8(data, i * 4) / 255;
        break;
      case ColorSpace.RGB:
        img.color[i * 3 + 0] = data[i * 4 + 0] / 255;
        img.color[i * 3 + 1] = data[i * 4 + 1] / 255;
        img.color[i * 3 + 2] = data[i * 4 + 2] / 255;
        break;
      default:
        throw new Error('Invalid color space');
    }
    img.alpha[i] = data[i * 4 + 3] / 255;
  }
  return img;
}

function applyHSL(img: NormalizedImage, h: number, s: number, l: number): void {
  const numPixels = img.width * img.height;
  switch (img.colorSpace) {
    case ColorSpace.GRAYSCALE: {
      if (l == 1) return;
      for (let i = 0; i < numPixels; i++) {
        img.color[i] = clip(0, 1, img.color[i] * l);
      }
    } break;
    case ColorSpace.RGB: {
      if (h == 0 && s == 1 && l == 1) return;
      const hsl = new Float32Array(3);
      for (let i = 0; i < numPixels; i++) {
        rgbToHsl(img.color, i * 3, hsl, 0);
        const hMod = hsl[0] + h;
        hsl[0] = hMod - Math.floor(hMod);
        hsl[1] = clip(0, 1, hsl[1] * s);
        hsl[2] = clip(0, 1, hsl[2] * l);
        hslToRgb(hsl, 0, img.color, i * 3);
      }
    } break;
    default:
      throw new Error('Invalid color space');
  }
}

function makeHistogramF32(
    img: NormalizedImage, histogramSize: number): Uint32Array {
  const histogram = new Uint32Array(histogramSize);
  const numPixels = img.width * img.height;
  const numCh = img.numColorChannels;
  for (let i = 0; i < numPixels; i++) {
    if (img.alpha[i] > 0) {
      const gray = grayscaleArrayF32(img.color, i * numCh);
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

  const backR = (color & 0xff) / 255;
  const backG = ((color >> 8) & 0xff) / 255;
  const backB = ((color >> 16) & 0xff) / 255;
  switch (img.colorSpace) {
    case ColorSpace.GRAYSCALE:
      bk[0] = grayscale(backR, backG, backB);
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
      const gray = grayscaleArrayF32(img.color, i * numCh);
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

function grayscale(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function grayscaleArrayF32(data: Float32Array, offset: number): number {
  return grayscale(data[offset], data[offset + 1], data[offset + 2]);
}

function grayscaleArrayU8(data: Uint8Array, offset: number): number {
  return grayscale(data[offset], data[offset + 1], data[offset + 2]);
}

function rgbToHsl(
    src: Float32Array, srcOffset: number, dest: Float32Array,
    destOffset: number): void {
  const r = src[srcOffset];
  const g = src[srcOffset + 1];
  const b = src[srcOffset + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max != min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
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
}

function hslToRgb(
    src: Float32Array, srcOffset: number, dest: Float32Array,
    destOffset: number): void {
  let h = src[srcOffset];
  let s = src[srcOffset + 1];
  let l = src[srcOffset + 2];
  let r: number, g: number, b: number;

  if (s == 0) {
    r = g = b = l;  // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  dest[destOffset] = r;
  dest[destOffset + 1] = g;
  dest[destOffset + 2] = b;
}