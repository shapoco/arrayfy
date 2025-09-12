import * as Colors from './Colors';
import * as Debug from './Debug';
import {Rect, Size} from './Geometries';
import {ColorSpace, NormalizedImage} from './Images';
import {clip} from './Utils';

export const enum ScalingMethod {
  ZOOM,
  FIT,
  STRETCH,
}

export const enum InterpMethod {
  NEAREST_NEIGHBOR,
  AVERAGE,
}

export class ResizeArgs {
  public srcData: Uint8Array = new Uint8Array(0);
  public srcSize: Size = {width: 0, height: 0};
  public trimRect: Rect = {x: 0, y: 0, width: 0, height: 0};
  public outSize: Size = {width: 0, height: 0};
  public colorSpace: ColorSpace = ColorSpace.RGB;
  public scalingMethod: ScalingMethod = ScalingMethod.ZOOM;
  public interpMethod: InterpMethod =
      InterpMethod.NEAREST_NEIGHBOR;

  public applyKeyColor: boolean = false;
  public keyColor: number = 0x000000;
  public keyTolerance: number = 0;

  public out: NormalizedImage|null = null;
}

export function resize(args: ResizeArgs): void {
  const sw = new Debug.StopWatch(false);

  let src = args.srcData;

  // 元配列の複製 + トリミング
  {
    const {data, rect} = trim(
        src, args.srcSize, args.trimRect, args.outSize, args.scalingMethod);
    src = data;
    args.trimRect = rect;
  }

  if (args.applyKeyColor) {
    // 滲みを防ぐためキーカラー処理はリサイズ前に行う
    applyKeyColor(src, args.srcSize, args.keyColor, args.keyTolerance);
  }

  // リサイズ
  const trimSize = {width: args.trimRect.width, height: args.trimRect.height};
  let resized = src;
  if (trimSize.width != args.outSize.width ||
      trimSize.height != args.outSize.height) {
    switch (args.interpMethod) {
      case InterpMethod.NEAREST_NEIGHBOR:
        resized = resizeWithNearestNeighbor(src, trimSize, args.outSize);
        break;
      case InterpMethod.AVERAGE:
        resized = resizeWithAverage(src, trimSize, args.outSize);
        break;
      default:
        throw new Error('Invalid interpolation method');
    }
  }

  // 正規化
  args.out = normalize(resized, args.outSize, args.colorSpace);

  sw.lap('Resizer.resize()');
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
        trimW = Math.max(1, Math.round(trimH * outW / outH));
        destW = trimRect.width;
        destX = Math.round((trimW - trimRect.width) / 2);
      } else if (outAspect < trimAspect) {
        trimH = Math.max(1, Math.round(trimW * outH / outW));
        destH = trimRect.height;
        destY = Math.round((trimH - trimRect.height) / 2);
      }
    }
  }

  const out = new Uint8Array(trimW * trimH * 4);
  const srcStride = srcW * 4;
  const destStride = trimW * 4;

  for (let y = 0; y < destH; y++) {
    const srcY = trimY + y;
    if (srcY < 0 || srcH <= srcY) continue;

    let iSrc = srcY * srcStride + trimX * 4;
    let iDest = (destY + y) * destStride + destX * 4;
    for (let x = 0; x < destW; x++) {
      const srcX = trimX + x;
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
  const {r: keyR, g: keyG, b: keyB} = Colors.rgbU32ToU8(key);
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

function resizeWithNearestNeighbor(
    src: Uint8Array, srcSize: Size, outSize: Size): Uint8Array {
  const srcW = srcSize.width;
  const srcH = srcSize.height;
  const outW = outSize.width;
  const outH = outSize.height;
  const srcStride = srcW * 4;
  const outStride = outW * 4;
  const out = new Uint8Array(outStride * outH);
  for (let outY = 0; outY < outH; outY++) {
    const srcY = outH <= 1 ? 0 : Math.floor(outY * (srcH - 1) / (outH - 1));
    let iDest = outY * outStride;
    for (let outX = 0; outX < outW; outX++) {
      const srcX = outW <= 1 ? 0 : Math.floor(outX * (srcW - 1) / (outW - 1));
      const iSrc = srcY * srcStride + srcX * 4;
      for (let c = 0; c < 4; c++) {
        out[iDest++] = src[iSrc + c];
      }
    }
  }
  return out;
}

function resizeWithAverage(
    src: Uint8Array, srcSize: Size, outSize: Size): Uint8Array {
  let srcW = srcSize.width;
  let srcH = srcSize.height;
  const outW = outSize.width;
  const outH = outSize.height;

  const srcStride = srcW * 4;

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
        img.color[i] = Colors.grayscaleArrayU8(data, i * 4) / 255;
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
