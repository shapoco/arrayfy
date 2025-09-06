import {ArrayBlob} from './Blobs';
import {ReducedImage} from './Images';
import {intCeil} from './Utils';

export const enum PackUnit {
  UNPACKED,
  PIXEL,
  ALIGNMENT,
}

export const enum AlignBoundary {
  NIBBLE = 4,
  BYTE_1 = 8,
  BYTE_2 = 16,
  BYTE_3 = 24,
  BYTE_4 = 32,
}

export class FieldLayout {
  public srcChannel: number;
  public pos: number;
  public width: number;
}

export class PlaneOutput {
  public fields: FieldLayout[] = [];
  public pixelStride: number;  // ピクセルあたりのビット数 (パディング含む)
  public pixelsPerFrag: number;  // フラグメントあたりのピクセル数
  public bytesPerFrag: number;   // フラグメントあたりのバイト数
  public alignRequired: boolean;
  public blob: ArrayBlob;
}

export class PlaneArgs {
  public farPixelFirst: boolean;
  public bigEndian: boolean;
  public packUnit: PackUnit;
  public vertPack: boolean;
  public alignBoundary: AlignBoundary;
  public alignLeft: boolean;
  public vertAddr: boolean;
  public output: PlaneOutput = new PlaneOutput();
}

export class ImageArgs {
  public src: ReducedImage;
  public alphaFirst: boolean;
  public colorDescending: boolean;
  public planes: PlaneArgs[] = [];
}

export function encode(args: ImageArgs): void {
  const fmt = args.src.format;

  let alphaField: FieldLayout|null = null;
  if (fmt.hasAlpha) {
    alphaField = new FieldLayout();
    alphaField.srcChannel = fmt.numColorChannels;
    alphaField.width = fmt.alphaBits;
  }

  // チャネル順の決定
  if (alphaField && args.alphaFirst) {
    args.planes[0].output.fields.push(alphaField);
  }
  for (let ch = 0; ch < fmt.numColorChannels; ch++) {
    const field = new FieldLayout();
    if (args.colorDescending) {
      field.srcChannel = fmt.numColorChannels - 1 - ch;
    } else {
      field.srcChannel = ch;
    }
    field.width = fmt.colorBits[field.srcChannel];
    args.planes[0].output.fields.push(field);
  }
  if (alphaField && !args.alphaFirst) {
    args.planes[0].output.fields.push(alphaField);
  }

  // 構造体の構造を決定
  for (let plane of args.planes) {
    const out = plane.output;
    const numCh = out.fields.length;

    if (plane.packUnit == PackUnit.UNPACKED) {
      // 一番幅の広いチャネルに合わせてチャネル毎の幅を決定
      let maxChBits = 0;
      for (const field of out.fields) {
        if (maxChBits < field.width) {
          maxChBits = field.width;
        }
      }
      const chStride = intCeil(maxChBits, plane.alignBoundary);

      // 各チャネルのビット位置を算出
      for (let ch = 0; ch < numCh; ch++) {
        const field = out.fields[ch];
        field.pos = ch * chStride;
        out.alignRequired ||= chStride != field.width;
        if (plane.alignLeft) {
          field.pos += chStride - field.width;
        }
      }

      out.pixelStride = chStride * numCh;
      out.bytesPerFrag = Math.ceil(out.pixelStride / 8);
      out.pixelsPerFrag = 1;

    } else {
      // 各チャネルのビット位置 (まずは下位詰め)
      let pixBits = 0;
      for (const field of out.fields) {
        field.pos = pixBits;
        pixBits += field.width;
      }

      switch (plane.packUnit) {
        case PackUnit.PIXEL:
          // ピクセル単位のパッキングの場合
          out.pixelStride = intCeil(pixBits, plane.alignBoundary);
          out.pixelsPerFrag = Math.max(1, Math.floor(8 / out.pixelStride));
          out.bytesPerFrag = Math.ceil(out.pixelStride / 8);
          out.alignRequired = out.pixelStride != pixBits;
          if (plane.alignLeft) {
            // 上位詰めの場合はチャネルのビット位置修正
            for (const field of out.fields) {
              field.pos += out.pixelStride - pixBits;
            }
          }
          break;

        case PackUnit.ALIGNMENT:
          // 複数ピクセルをパッキングする場合
          if (pixBits > plane.alignBoundary) {
            throw new Error(
                'アライメント境界より大きなピクセルをパッキングできません。',
            );
          }
          out.pixelStride = pixBits;
          out.pixelsPerFrag = Math.floor(plane.alignBoundary / pixBits);

          const fragBits = pixBits * out.pixelsPerFrag;
          const fragStride =
              Math.ceil(fragBits / plane.alignBoundary) * plane.alignBoundary;
          out.bytesPerFrag = Math.ceil(fragStride / 8);
          out.alignRequired = fragStride != fragBits;
          if (plane.alignLeft) {
            // 上位詰めの場合はチャネルビット位置に下駄を履かせる
            for (const field of out.fields) {
              field.pos += fragStride - fragBits;
            }
          }

          break;

        default:
          throw new Error('Unsupported PackUnit');
      }
    }
  }

  const src = args.src;
  for (let plane of args.planes) {
    const out = plane.output;
    const numCh = out.fields.length;

    // エンコードパラメータ
    const fragWidth = plane.vertPack ? 1 : out.pixelsPerFrag;
    const fragHeight = plane.vertPack ? out.pixelsPerFrag : 1;
    const fragSize = fragWidth * fragHeight;
    const cols = Math.ceil(src.width / fragWidth);
    const rows = Math.ceil(src.height / fragHeight);
    const numFrags = cols * rows;

    out.blob = new ArrayBlob('imageArray', numFrags * out.bytesPerFrag);
    const array = out.blob.array;
    let iByte = 0;

    // フラグメントループ
    for (let iFrag = 0; iFrag < numFrags; iFrag++) {
      let xCoarse: number, yCoarse: number;
      if (plane.vertAddr) {
        xCoarse = fragWidth * Math.floor(iFrag / rows);
        yCoarse = fragHeight * (iFrag % rows);
      } else {
        xCoarse = fragWidth * (iFrag % cols);
        yCoarse = fragHeight * Math.floor(iFrag / cols);
      }

      // ピクセルループ
      let fragData = 0;
      for (let iSrc = 0; iSrc < fragSize; iSrc++) {
        const iDest = plane.farPixelFirst ? (fragSize - 1 - iSrc) : iSrc;
        const xFine = iSrc % fragWidth;
        const yFine = Math.floor(iSrc / fragWidth);
        const x = xCoarse + xFine;
        const y = yCoarse + yFine;
        if (y < src.height && x < src.width) {
          // チャネルループ
          const pixOffset = out.pixelStride * iDest;
          for (const field of out.fields) {
            const chData = src.data[field.srcChannel][y * src.width + x];
            const shift = pixOffset + field.pos;
            fragData |= chData << shift;
          }
        }
      }

      // バイト単位に変換
      const fragBits = out.bytesPerFrag * 8;
      for (let j = 0; j < out.bytesPerFrag; j++) {
        if (plane.bigEndian) {
          array[iByte++] = (fragData >> (fragBits - 8)) & 0xFF;
          fragData <<= 8;
        } else {
          array[iByte++] = fragData & 0xFF;
          fragData >>= 8;
        }
      }
    }  // for fragIndex

    // コメントの生成
    {
      let buff: string[] = [];
      buff.push(`${args.src.width}x${args.src.height}px, ${fmt.toString()}\n`);
      if (numCh > 1) {
        let chOrderStr = '';
        for (let i = 0; i < numCh; i++) {
          const field = out.fields[i];
          if (i > 0) chOrderStr += ':';
          chOrderStr += fmt.channelName(field.srcChannel);
        }
        buff.push(chOrderStr + ', ');
      }
      if (out.pixelsPerFrag > 1) {
        buff.push((plane.farPixelFirst ? 'MSB' : 'LSB') + ' First, ');
        buff.push((plane.vertPack ? 'Vertical' : 'Horizontal') + ' Packing, ');
      }
      if (out.bytesPerFrag > 1) {
        buff.push((plane.bigEndian ? 'Big' : 'Little') + ' Endian, ');
      }
      buff.push(`${plane.vertAddr ? 'Vertical' : 'Horizontal'} Adressing\n`);
      buff.push(`${array.length} Bytes\n`);
      out.blob.comment = buff.join('');
    }

  }  // for plane
}
