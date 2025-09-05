import {Palette} from './Palettes';

export const enum ColorSpace {
  GRAYSCALE,
  RGB,
}

export const enum PixelFormat {
  RGBA8888,
  // RGBA4444,
  RGB888,
  RGB666,
  RGB565,
  RGB555,
  RGB444,
  RGB332,
  RGB111,
  GRAY4,
  GRAY2,
  BW,
}

export class PixelFormatInfo {
  public colorSpace: ColorSpace;
  public colorBits: number[];
  public alphaBits = 0;

  constructor(fmt: PixelFormat) {
    switch (fmt) {
      case PixelFormat.RGBA8888:
        this.colorSpace = ColorSpace.RGB;
        this.colorBits = [8, 8, 8];
        this.alphaBits = 8;
        break;
      // case PixelFormat.RGBA4444:
      //   this.colorSpace = ColorSpace.RGB;
      //   this.colorBits = [4, 4, 4];
      //   this.alphaBits = 4;
      //   break;
      case PixelFormat.RGB888:
        this.colorSpace = ColorSpace.RGB;
        this.colorBits = [8, 8, 8];
        break;
      case PixelFormat.RGB666:
        this.colorSpace = ColorSpace.RGB;
        this.colorBits = [6, 6, 6];
        break;
      case PixelFormat.RGB565:
        this.colorSpace = ColorSpace.RGB;
        this.colorBits = [5, 6, 5];
        break;
      case PixelFormat.RGB555:
        this.colorSpace = ColorSpace.RGB;
        this.colorBits = [5, 5, 5];
        break;
      case PixelFormat.RGB444:
        this.colorSpace = ColorSpace.RGB;
        this.colorBits = [4, 4, 4];
        break;
      case PixelFormat.RGB332:
        this.colorSpace = ColorSpace.RGB;
        this.colorBits = [3, 3, 2];
        break;
      case PixelFormat.RGB111:
        this.colorSpace = ColorSpace.RGB;
        this.colorBits = [1, 1, 1];
        break;
      case PixelFormat.GRAY4:
        this.colorSpace = ColorSpace.GRAYSCALE;
        this.colorBits = [4];
        break;
      case PixelFormat.GRAY2:
        this.colorSpace = ColorSpace.GRAYSCALE;
        this.colorBits = [2];
        break;
      case PixelFormat.BW:
        this.colorSpace = ColorSpace.GRAYSCALE;
        this.colorBits = [1];
        break;
      default:
        throw new Error('Unknown image format');
    }
  }

  toString(): string {
    switch (this.colorSpace) {
      case ColorSpace.GRAYSCALE:
        if (this.colorBits[0] == 1) {
          return 'B/W';
        } else {
          return 'Gray' + this.colorBits[0];
        }
      case ColorSpace.RGB:
        if (this.hasAlpha) {
          return 'RGBA' + this.colorBits.join('') + this.alphaBits.toString();
        } else {
          return 'RGB' + this.colorBits.join('');
        }
      default:
        throw new Error('Unknown color space');
    }
  }

  get hasAlpha(): boolean {
    return this.alphaBits > 0;
  }

  get numTotalChannels(): number {
    return this.colorBits.length + (this.hasAlpha ? 1 : 0);
  }

  get numColorChannels(): number {
    return this.colorBits.length;
  }

  channelName(i: number): string {
    switch (this.colorSpace) {
      case ColorSpace.GRAYSCALE:
        return 'V';
      case ColorSpace.RGB:
        return 'RGBA'.slice(i, i + 1);
      default:
        throw new Error('Unknown color space');
    }
  }
}

export class NormalizedImage {
  public color: Float32Array;
  public alpha: Float32Array;
  public numColorChannels: number;
  constructor(
      public width: number, public height: number,
      public colorSpace: ColorSpace) {
    switch (colorSpace) {
      case ColorSpace.GRAYSCALE:
        this.numColorChannels = 1;
        break;
      case ColorSpace.RGB:
        this.numColorChannels = 3;
        break;
      default:
        throw new Error('Invalid color space');
    }
    this.color = new Float32Array(width * height * this.numColorChannels);
    this.alpha = new Float32Array(width * height);
  }
};

export class QuantizedImage {
  public data: Uint8Array[];
  public tmp: Uint8Array;

  constructor(
      public width: number, public height: number,
      public format: PixelFormatInfo, public palette: Palette) {
    const numPixels = width * height;
    const numAllCh = format.numTotalChannels;
    this.data = [];
    for (let i = 0; i < numAllCh; i++) {
      this.data.push(new Uint8Array(numPixels));
    }
    this.tmp = new Uint8Array(format.numTotalChannels);
  }

  getPreviewImage(dest: Uint8Array): void {
    const numAllCh = this.format.numTotalChannels;
    const numColCh = this.format.numColorChannels;
    const alpOutMax =
        this.format.hasAlpha ? (1 << this.format.alphaBits) - 1 : 1;
    for (let i = 0; i < this.width * this.height; i++) {
      // 色の復元
      for (let ch = 0; ch < numAllCh; ch++) {
        this.tmp[ch] = this.data[ch][i];
      }
      this.palette.extract(this.tmp, 0, dest, i * 4);

      // アルファ値の復元
      if (this.format.hasAlpha) {
        dest[i * 4 + 3] = Math.round(this.tmp[numColCh] * 255 / alpOutMax);
      } else {
        dest[i * 4 + 3] = 255;
      }
    }
  }
}
