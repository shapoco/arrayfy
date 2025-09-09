import * as Colors from './Colors';
import * as Encoder from './Encoder';
import * as Images from './Images';

export interface PlaneConfig {
  planeType: Encoder.PlaneType;
  id: string;
  matchIndex: number;
  matchInvert: boolean;
}

function makeDirectPlane(id: string = 'color'): PlaneConfig {
  return {
    planeType: Encoder.PlaneType.DIRECT,
    id: id,
    matchIndex: -1,
    matchInvert: false,
  };
}

function makeIndexMatch(
    index: number, id: string, invert: boolean = false): PlaneConfig {
  return {
    planeType: Encoder.PlaneType.INDEX_MATCH,
    id: id,
    matchIndex: index,
    matchInvert: invert,
  };
}


export interface Config {
  label: string;
  description: string;
  format: Images.PixelFormat;
  channelOrder: Images.ChannelOrder;
  farPixelFirst: boolean;
  bigEndian: boolean;
  packUnit: Encoder.PackUnit;
  vertPack: boolean;
  alignBoundary: Encoder.AlignBoundary;
  alignLeft: boolean;
  vertAddr: boolean;
  palette: Uint32Array;
  planeCfgs: PlaneConfig[];
}

export const defaultConfig: Config = {
  label: 'default',
  description: 'default',
  format: Images.PixelFormat.RGBA8888,
  channelOrder: Images.ChannelOrder.ARGB,
  farPixelFirst: false,
  bigEndian: false,
  packUnit: Encoder.PackUnit.PIXEL,
  vertPack: false,
  alignBoundary: Encoder.AlignBoundary.BYTE_1,
  alignLeft: false,
  vertAddr: false,
  palette: new Uint32Array(),
  planeCfgs: [makeDirectPlane()],
};

const argb8888_le = (function(): Config {
  let p = {...defaultConfig};
  p.label = 'ARGB8888-LE';
  p.description = '透明度付きフルカラー。';
  p.format = Images.PixelFormat.RGBA8888;
  p.channelOrder = Images.ChannelOrder.ARGB;
  return p;
})();

const rgb888_be = (function(): Config {
  let p = {...defaultConfig};
  p.label = 'RGB888-BE';
  p.description = 'フルカラー。24bit 液晶用。';
  p.format = Images.PixelFormat.RGB888;
  p.channelOrder = Images.ChannelOrder.ARGB;
  p.bigEndian = true;
  return p;
})();

const rgb666_be_ra = (function(): Config {
  let p = {...defaultConfig};
  p.label = 'RGB666-BE-RA';
  p.description =
      '各バイトにチャネルを下位詰めで配置した RGB666。LovyanGFX 用。';
  p.format = Images.PixelFormat.RGB666;
  p.channelOrder = Images.ChannelOrder.ARGB;
  p.packUnit = Encoder.PackUnit.UNPACKED;
  p.bigEndian = true;
  return p;
})();

const rgb666_be_la = (function(): Config {
  let p = {...defaultConfig};
  p.label = 'RGB666-BE-LA';
  p.description =
      '各バイトにチャネルを上位詰めで配置した RGB666。低レベル API の 18bit モード用。';
  p.format = Images.PixelFormat.RGB666;
  p.channelOrder = Images.ChannelOrder.ARGB;
  p.packUnit = Encoder.PackUnit.UNPACKED;
  p.alignLeft = true;
  p.bigEndian = true;
  return p;
})();

const rgb565_be = (function(): Config {
  let p = {...defaultConfig};
  p.label = 'RGB565-BE';
  p.description =
      'ハイカラー。\n各種 GFX ライブラリでの使用を含め、\n組み込み用途で一般的な形式。';
  p.format = Images.PixelFormat.RGB565;
  p.channelOrder = Images.ChannelOrder.ARGB;
  p.bigEndian = true;
  return p;
})();

const rgb444_be = (function(): Config {
  let p = {...defaultConfig};
  p.label = 'RGB444-BE';
  p.description = 'ST7789 の 12bit モード用の形式。';
  p.format = Images.PixelFormat.RGB444;
  p.packUnit = Encoder.PackUnit.ALIGNMENT;
  p.farPixelFirst = true;
  p.bigEndian = true;
  p.alignBoundary = Encoder.AlignBoundary.BYTE_3;
  return p;
})();

const rgb332 = (function(): Config {
  let p = {...defaultConfig};
  p.label = 'RGB332';
  p.description = '各種 GFX ライブラリ用。';
  p.format = Images.PixelFormat.RGB332;
  return p;
})();

const rgb111_ra = (function(): Config {
  let p = {...defaultConfig};
  p.label = 'RGB111';
  p.description = 'ILI9488 の 8 色モード用。';
  p.format = Images.PixelFormat.RGB111;
  p.packUnit = Encoder.PackUnit.ALIGNMENT;
  p.farPixelFirst = true;
  return p;
})();

const bw_hscan = (function(): Config {
  let p = {...defaultConfig};
  p.label = '白黒 横スキャン';
  p.description = '各種 GFX ライブラリ用。';
  p.format = Images.PixelFormat.BW;
  p.packUnit = Encoder.PackUnit.ALIGNMENT;
  p.farPixelFirst = true;
  return p;
})();

const bw_vpack = (function(): Config {
  let p = {...defaultConfig};
  p.label = '白黒 縦パッキング';
  p.description =
      'SPI/I2C ドライバを使用して\nSSD1306/1309 等の白黒ディスプレイに直接転送するための形式。';
  p.format = Images.PixelFormat.BW;
  p.packUnit = Encoder.PackUnit.ALIGNMENT;
  p.vertPack = true;
  return p;
})();

const epd_kwr = (function(): Config {
  let p = {...defaultConfig};
  p.label = '黒白赤 (2plane)';
  p.description = '3色電子ペーパー向けの形式。';
  p.format = Images.PixelFormat.I2_RGB888;
  p.packUnit = Encoder.PackUnit.ALIGNMENT;
  p.farPixelFirst = true;
  p.palette = new Uint32Array([
    Colors.hexStrToRgb('#000'),
    Colors.hexStrToRgb('#FFF'),
    Colors.hexStrToRgb('#F00'),
  ]);
  p.planeCfgs = [
    makeIndexMatch(1, 'white'),
    makeIndexMatch(2, 'red'),
  ];
  return p;
})();

const epd_kwry = (function(): Config {
  let p = {...defaultConfig};
  p.label = '黒白赤黄 (2bpp)';
  p.description = '4色電子ペーパー向けの形式。';
  p.format = Images.PixelFormat.I2_RGB888;
  p.packUnit = Encoder.PackUnit.ALIGNMENT;
  p.farPixelFirst = true;
  p.palette = new Uint32Array([
    Colors.hexStrToRgb('#000'),
    Colors.hexStrToRgb('#FFF'),
    Colors.hexStrToRgb('#F00'),
    Colors.hexStrToRgb('#FF0'),
  ]);
  p.planeCfgs = [
    makeDirectPlane('index'),
  ];
  return p;
})();


export const presets: Record<string, Config> = {
  argb8888_le,
  rgb888_be,
  rgb666_be_ra,
  rgb666_be_la,
  rgb565_be,
  rgb444_be,
  rgb332,
  rgb111_ra,
  bw_hscan,
  bw_vpack,
  epd_kwr,
  epd_kwry,
};
