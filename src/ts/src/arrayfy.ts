
const enum TrimState {
  IDLE,
  DRAG_TOP,
  DRAG_RIGHT,
  DRAG_BOTTOM,
  DRAG_LEFT,
}

const enum ColorSpace {
  GRAYSCALE,
  RGB,
}

const enum PixelFormat {
  // ARGB8888,
  RGB888,
  RGB666,
  RGB565,
  RGB555,
  RGB332,
  RGB111,
  GRAY4,
  GRAY2,
  BW,
}

const enum PackUnit {
  FRAGMENT,
  PIXEL,
  UNPACKED,
}

const enum AlignBoundary {
  BYTE = 8,
}

const enum AlignDir {
  HIGHER,
  LOWER,
}

const enum ScalingMethod {
  ZOOM,
  FIT,
  STRETCH,
}

const enum DitherMethod {
  NONE,
  DIFFUSION,
}

const enum RoundMethod {
  NEAREST,
  EQUAL_DIVISION,
}

const enum BitOrder {
  LSB_FIRST,
  MSB_FIRST,
}

const enum ByteOrder {
  LITTLE_ENDIAN,
  BIG_ENDIAN,
}

const enum ScanDir {
  HORIZONTAL,
  VERTICAL,
}

const enum Indent {
  TAB,
  SPACE_X2,
  SPACE_X4,
}

type Point = {
  x: number,
  y: number,
};

type Rect = {
  x: number,
  y: number,
  width: number,
  height: number,
};

class Preset {
  public channelOrder: BitOrder = BitOrder.MSB_FIRST;
  public pixelOrder: BitOrder = BitOrder.MSB_FIRST;
  public byteOrder: ByteOrder = ByteOrder.BIG_ENDIAN;
  public packUnit: PackUnit = PackUnit.PIXEL;
  public packDir: ScanDir = ScanDir.HORIZONTAL;
  public alignUnit: AlignBoundary = AlignBoundary.BYTE;
  public alignDir: AlignDir = AlignDir.LOWER;
  public addrDir: ScanDir = ScanDir.HORIZONTAL;
  constructor(
      public label: string, public description, public format: PixelFormat,
      ops = {}) {
    for (const k of Object.keys(ops)) {
      if (!(k in this)) {
        throw new Error(`Unknown property '${k}'`);
      }
      (this as any)[k] = (ops as any)[k];
    }
  }
}

let presets: Record<string, Preset> = {
  // argb8888_be: new Preset(
  //    'ARGB8888',
  //    '透明度付きフルカラー。\n各種 GFX
  //    ライブラリで透明ピクセルを含む画像を扱う場合に。',
  //    PixelFormat.ARGB8888,
  //    {packUnit: PackUnit.UNPACKED},
  //    ),
  rgb888_be: new Preset(
      'RGB888',
      'フルカラー。24bit 液晶用。',
      PixelFormat.RGB888,
      {packUnit: PackUnit.UNPACKED},
      ),
  rgb666_be: new Preset(
      'RGB666',
      '18bit 液晶用。',
      PixelFormat.RGB666,
      {packUnit: PackUnit.UNPACKED},
      ),
  rgb565_be: new Preset(
      'RGB565',
      'ハイカラー。\n各種 GFX ライブラリでの使用を含め、\n組み込み用途で一般的な形式。',
      PixelFormat.RGB565,
      ),
  rgb332: new Preset(
      'RGB332',
      '各種 GFX ライブラリ用。',
      PixelFormat.RGB332,
      ),
  bw_hp_mf: new Preset(
      '白黒 横パッキング',
      '各種 GFX ライブラリ用。',
      PixelFormat.BW,
      {
        packUnit: PackUnit.FRAGMENT,
        pixelOrder: BitOrder.MSB_FIRST,
        packDir: ScanDir.HORIZONTAL,
      },
      ),
  bw_vp_lf: new Preset(
      '白黒 縦パッキング',
      'SPI/I2C ドライバを使用して\nSSD1306/1309 等の白黒ディスプレイに直接転送可能。',
      PixelFormat.BW,
      {
        packUnit: PackUnit.FRAGMENT,
        pixelOrder: BitOrder.LSB_FIRST,
        packDir: ScanDir.VERTICAL,
      },
      ),
};

class PixelFormatInfo {
  public colorSpace: ColorSpace;
  public channelBits: number[];

  constructor(fmt: PixelFormat) {
    switch (fmt) {
      case PixelFormat.RGB888:
        this.colorSpace = ColorSpace.RGB;
        this.channelBits = [8, 8, 8];
        break;
      case PixelFormat.RGB666:
        this.colorSpace = ColorSpace.RGB;
        this.channelBits = [6, 6, 6];
        break;
      case PixelFormat.RGB565:
        this.colorSpace = ColorSpace.RGB;
        this.channelBits = [5, 6, 5];
        break;
      case PixelFormat.RGB555:
        this.colorSpace = ColorSpace.RGB;
        this.channelBits = [5, 5, 5];
        break;
      case PixelFormat.RGB332:
        this.colorSpace = ColorSpace.RGB;
        this.channelBits = [3, 3, 2];
        break;
      case PixelFormat.RGB111:
        this.colorSpace = ColorSpace.RGB;
        this.channelBits = [1, 1, 1];
        break;
      case PixelFormat.GRAY4:
        this.colorSpace = ColorSpace.GRAYSCALE;
        this.channelBits = [4];
        break;
      case PixelFormat.GRAY2:
        this.colorSpace = ColorSpace.GRAYSCALE;
        this.channelBits = [2];
        break;
      case PixelFormat.BW:
        this.colorSpace = ColorSpace.GRAYSCALE;
        this.channelBits = [1];
        break;
      default:
        throw new Error('Unknown image format');
    }
  }

  toString(): string {
    let ret = '';
    switch (this.colorSpace) {
      case ColorSpace.GRAYSCALE:
        if (this.channelBits[0] == 1) {
          return 'B/W';
        } else {
          return 'Gray' + this.channelBits[0];
        }
      case ColorSpace.RGB:
        return 'RGB' + this.channelBits.join('');
      default:
        throw new Error('Unknown color space');
    }
  }

  get numChannels(): number {
    return this.channelBits.length;
  }
}

class Palette {
  public inMin: Float32Array;
  public inMax: Float32Array;
  public outMax: Uint8Array;
  constructor(public format: PixelFormatInfo, public roundMethod: RoundMethod) {
    this.inMin = new Float32Array(format.numChannels);
    this.inMax = new Float32Array(format.numChannels);
    this.outMax = new Uint8Array(format.numChannels);
    const equDiv = roundMethod == RoundMethod.EQUAL_DIVISION;
    for (let ch = 0; ch < format.numChannels; ch++) {
      const numLevel = 1 << format.channelBits[ch];
      this.inMin[ch] = equDiv ? (1 / (numLevel * 2)) : 0;
      this.inMax[ch] = equDiv ? ((numLevel * 2 - 1) / (numLevel * 2)) : 1;
      this.outMax[ch] = numLevel - 1;
    }
  }

  nearest(
      src: Float32Array, srcOffset: number, dest: Uint8Array,
      destOffset: number, error: Float32Array): void {
    for (let ch = 0; ch < this.format.numChannels; ch++) {
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

class NormalizedImage {
  constructor(
      public format: PixelFormatInfo, public palette: Palette,
      public width: number, public height: number, public data: Float32Array) {}

  getMinMax(): [number, number] {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < this.data.length; i++) {
      const value = this.data[i];
      if (value < min) min = value;
      if (value > max) max = value;
    }
    return [min, max];
  }

  diffuseError(error: Float32Array, x: number, y: number, forward: boolean) {
    const numCh = this.format.numChannels;
    const w = this.width;
    const h = this.height;
    const stride = this.width * numCh;
    for (let ch = 0; ch < numCh; ch++) {
      const i = y * stride + x * numCh + ch;
      const e = error[ch];
      if (e == 0) continue;
      if (forward) {
        if (x < w - 1) {
          this.data[i + numCh] += e * 7 / 16;
        }
        if (y < h - 1) {
          if (x > 0) {
            this.data[i + stride - numCh] += e * 3 / 16;
          }
          this.data[i + stride] += e * 5 / 16;
          if (x < w - 1) {
            this.data[i + stride + numCh] += e * 1 / 16;
          }
        }
      } else {
        if (x > 0) {
          this.data[i - numCh] += e * 7 / 16;
        }
        if (y < h - 1) {
          if (x < w - 1) {
            this.data[i + stride + numCh] += e * 3 / 16;
          }
          this.data[i + stride] += e * 5 / 16;
          if (x > 0) {
            this.data[i + stride - numCh] += e * 1 / 16;
          }
        }
      }
    }
  }
}

function toElementArray(children: any): HTMLElement[] {
  if (children == null) {
    return [];
  }
  if (!Array.isArray(children)) {
    children = [children];
  }
  for (let i = 0; i < children.length; i++) {
    if (typeof children[i] === 'string') {
      children[i] = document.createTextNode(children[i]);
    } else if (children[i] instanceof Node) {
      // Do nothing
    } else {
      throw new Error('Invalid child element');
    }
  }
  return children;
}

function makeSection(children: any = []): HTMLDivElement {
  const div = document.createElement('div');
  div.classList.add('propertySection');
  toElementArray(children).forEach(child => div.appendChild(child));
  return div;
}

function makeFloatList(
    children: any = [], sep: boolean = true): HTMLUListElement {
  const ul = document.createElement('ul');
  toElementArray(children).forEach(child => {
    if (!child.classList) {
      child = makeSpan(child);
    }

    const li = document.createElement('li');
    li.appendChild(child);
    if (sep && child.classList && !child.classList.contains('sectionHeader')) {
      li.style.marginRight = '20px';
    }
    ul.appendChild(li);
  });
  return ul;
}

function makeParagraph(children: any = []): HTMLParagraphElement {
  const p = document.createElement('p');
  toElementArray(children).forEach(child => p.appendChild(child));
  return p;
}

function makeSpan(children: any = []): HTMLSpanElement {
  const span = document.createElement('span');
  toElementArray(children).forEach(child => span.appendChild(child));
  return span;
}

function makeNowrap(children: any = []): HTMLSpanElement {
  const span = document.createElement('span');
  span.classList.add('nowrap');
  toElementArray(children).forEach(child => span.appendChild(child));
  return span;
}

function tip(children: any, text: string): HTMLElement {
  let target: HTMLElement;
  if (children instanceof HTMLElement) {
    target = children;
  } else {
    target = makeSpan(children);
  }
  if (text) target.title = text;
  return target;
}

function makeHeader(text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.classList.add('sectionHeader');
  span.textContent = text;
  return span;
}

function makeTextBox(
    value = '', placeholder = '', maxLength = 100): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.placeholder = placeholder;
  input.style.width = '50px';
  input.style.textAlign = 'right';
  input.maxLength = maxLength;
  return input;
}

function makeSelectBox(
    items: {value: number, label: string}[],
    defaultValue: number): HTMLSelectElement {
  const select = document.createElement('select');
  for (const {value, label} of items) {
    const option = document.createElement('option');
    option.value = value.toString();
    option.textContent = label;
    select.appendChild(option);
  }
  select.value = defaultValue.toString();
  return select;
}

function makeCheckBox(labelText: string): HTMLInputElement {
  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(labelText));
  return checkbox;
}

function makeButton(text = ''): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  return button;
}

function makeSampleImageButton(url: string) {
  const button = document.createElement('button');
  button.classList.add('sampleImageButton');
  button.style.backgroundImage = `url(${url})`;
  button.addEventListener('click', () => {
    loadFromString(url);
  });
  button.textContent = '';
  return button;
}

function makePresetButton(id: string, preset: Preset): HTMLButtonElement {
  const button = document.createElement('button');
  button.dataset.presetName = id;
  button.classList.add('presetButton');
  const img = document.createElement('img');
  img.src = `img/preset/${id}.svg`;
  button.appendChild(img);
  button.appendChild(document.createElement('br'))
  button.appendChild(document.createTextNode(preset.label));
  button.title = preset.description;
  button.addEventListener('click', () => loadPreset(preset));
  return button;
}

const dropTarget = document.createElement('div');
const hiddenFileBox = document.createElement('input');
const pasteTarget = document.createElement('input');
const origCanvas = document.createElement('canvas');
const bgColorBox = makeTextBox('#000');
const resetTrimButton = makeButton('範囲をリセット');
const trimCanvas = document.createElement('canvas');
const gammaBox = makeTextBox('1', '(auto)', 4);
const brightnessBox = makeTextBox('0', '(auto)', 5);
const contrastBox = makeTextBox('100', '(auto)', 5);
const invertBox = makeCheckBox('階調反転');
const pixelFormatBox = makeSelectBox(
    [
      //{value: PixelFormat.ARGB8888, label: 'ARGB8888'},
      {value: PixelFormat.RGB888, label: 'RGB888'},
      {value: PixelFormat.RGB666, label: 'RGB666'},
      {value: PixelFormat.RGB565, label: 'RGB565'},
      {value: PixelFormat.RGB555, label: 'RGB555'},
      {value: PixelFormat.RGB332, label: 'RGB332'},
      {value: PixelFormat.RGB111, label: 'RGB111'},
      {value: PixelFormat.GRAY4, label: 'Gray4'},
      {value: PixelFormat.GRAY2, label: 'Gray2'},
      {value: PixelFormat.BW, label: 'B/W'},
    ],
    PixelFormat.RGB565);
const widthBox = makeTextBox('', '(auto)', 4);
const heightBox = makeTextBox('', '(auto)', 4);
const scalingMethodBox = makeSelectBox(
    [
      {value: ScalingMethod.ZOOM, label: 'ズーム'},
      {value: ScalingMethod.FIT, label: 'フィット'},
      {value: ScalingMethod.STRETCH, label: 'ストレッチ'},
    ],
    ScalingMethod.ZOOM);
const ditherBox = makeSelectBox(
    [
      {value: DitherMethod.NONE, label: 'なし'},
      {value: DitherMethod.DIFFUSION, label: '誤差拡散'},
    ],
    DitherMethod.DIFFUSION);
const roundMethodBox = makeSelectBox(
    [
      {value: RoundMethod.NEAREST, label: '最も近い輝度'},
      {value: RoundMethod.EQUAL_DIVISION, label: '均等割り'},
    ],
    RoundMethod.NEAREST);
const previewCanvas = document.createElement('canvas');
const quantizeErrorBox = document.createElement('span');
const channelOrderBox = makeSelectBox(
    [
      {value: BitOrder.LSB_FIRST, label: '下位から'},
      {value: BitOrder.MSB_FIRST, label: '上位から'},
    ],
    BitOrder.MSB_FIRST);
const pixelOrderBox = makeSelectBox(
    [
      {value: BitOrder.LSB_FIRST, label: '下位から'},
      {value: BitOrder.MSB_FIRST, label: '上位から'},
    ],
    BitOrder.MSB_FIRST);
const byteOrderBox = makeSelectBox(
    [
      {value: ByteOrder.LITTLE_ENDIAN, label: 'Little Endian'},
      {value: ByteOrder.BIG_ENDIAN, label: 'Big Endian'},
    ],
    ByteOrder.BIG_ENDIAN);
const packUnitBox = makeSelectBox(
    [
      {value: PackUnit.FRAGMENT, label: '複数ピクセル'},
      {value: PackUnit.PIXEL, label: '単一ピクセル'},
      {value: PackUnit.UNPACKED, label: 'アンパックド'},
    ],
    PackUnit.PIXEL);
const packDirBox = makeSelectBox(
    [
      {value: ScanDir.HORIZONTAL, label: '横'},
      {value: ScanDir.VERTICAL, label: '縦'},
    ],
    ScanDir.HORIZONTAL);
const alignBoundaryBox = makeSelectBox(
    [
      {value: AlignBoundary.BYTE, label: 'バイト'},
    ],
    AlignBoundary.BYTE);
const alignDirBox = makeSelectBox(
    [
      {value: AlignDir.LOWER, label: '右詰め'},
      {value: AlignDir.HIGHER, label: '左詰め'},
    ],
    AlignDir.LOWER);
const addressingBox = makeSelectBox(
    [
      {value: ScanDir.HORIZONTAL, label: '水平'},
      {value: ScanDir.VERTICAL, label: '垂直'},
    ],
    ScanDir.HORIZONTAL);
const codeColsBox = makeSelectBox(
    [
      {value: 8, label: '8'},
      {value: 16, label: '16'},
      {value: 32, label: '32'},
    ],
    16);
const indentBox = makeSelectBox(
    [
      {value: Indent.SPACE_X2, label: 'スペース x2'},
      {value: Indent.SPACE_X4, label: 'スペース x4'},
      {value: Indent.TAB, label: 'タブ'},
    ],
    Indent.SPACE_X2);
const codeBox = document.createElement('pre');
const codeGenErrorBox = document.createElement('p');
const copyButton = makeButton('コードをコピー');

let container: HTMLDivElement = null;

let updateTrimCanvasTimeoutId = -1;
let quantizeTimeoutId = -1;
let generateCodeTimeoutId = -1;

let worldX0 = 0, worldY0 = 0, zoom = 1;
let trimL = 0, trimT = 0, trimR = 1, trimB = 1;

let trimUiState = TrimState.IDLE;

let imageCacheFormat = new PixelFormatInfo(PixelFormat.RGB565);
let imageCacheData: Uint8Array[] = [null, null, null, null];

async function main() {
  container = document.querySelector('#arrayfyContainer');

  {
    dropTarget.style.display = 'none';
    dropTarget.style.position = 'fixed';
    dropTarget.style.left = '0px';
    dropTarget.style.top = '0px';
    dropTarget.style.width = '100%';
    dropTarget.style.height = '100%';
    dropTarget.style.background = '#000';
    dropTarget.style.opacity = '0.5';
    dropTarget.style.zIndex = '9999';
    dropTarget.style.textAlign = 'center';
    dropTarget.style.color = '#FFF';
    dropTarget.style.paddingTop = 'calc(50vh - 2em)';
    dropTarget.style.fontSize = '30px';
    dropTarget.innerHTML = 'ドロップして読み込む';
    document.body.appendChild(dropTarget);

    // 「ファイルが選択されていません」の表示が邪魔なので button で wrap する
    hiddenFileBox.type = 'file';
    hiddenFileBox.accept = 'image/*';
    hiddenFileBox.style.display = 'none';
    const fileBrowseButton = makeButton('ファイルを選択');
    fileBrowseButton.addEventListener('click', () => {
      hiddenFileBox.click();
    });

    pasteTarget.type = 'text';
    pasteTarget.style.textAlign = 'center';
    pasteTarget.style.width = '8em';
    pasteTarget.placeholder = 'ここに貼り付け';

    container.appendChild(makeSection(makeFloatList(
        [
          makeHeader('入力画像'),
          '画像をドロップ、',
          makeSpan([pasteTarget, '、']),
          makeSpan(['または ', fileBrowseButton]),
          makeSpan([
            '（サンプル: ',
            makeSampleImageButton('./img/sample/gradient.png'),
            makeSampleImageButton('./img/sample/forest-path.jpg'),
            makeSampleImageButton('./img/sample/anime-girl.png'),
            '）',
          ]),
        ],
        false)));
  }

  {
    const pPresetButtons = makeParagraph();
    for (const id in presets) {
      pPresetButtons.appendChild(makePresetButton(id, presets[id]));
    }
    const pNote = makeParagraph([
      '白黒ディスプレイについては、各種 GFX ライブラリを使用して描画する場合は横パッキングを選択してください。',
      'I2C や SPI ドライバを用いて直接転送する場合はディスプレイの仕様に従ってください。',
      'SSD1306/1309 など一部のディスプレイでは縦パッキングされたデータが必要です。',
    ])
    pNote.style.fontSize = 'smaller';
    container.appendChild(makeSection([
      makeFloatList([
        makeHeader('プリセット'),
        makeNowrap('選んでください: '),
      ]),
      pPresetButtons,
      pNote,
    ]));
  }

  {
    trimCanvas.style.width = '100%';
    trimCanvas.style.height = '400px';
    trimCanvas.style.boxSizing = 'border-box';
    trimCanvas.style.border = 'solid 1px #444';
    trimCanvas.style.backgroundImage = 'url(./img/checker.png)';

    const pCanvas = makeParagraph(trimCanvas);
    pCanvas.style.textAlign = 'center';

    container.appendChild(makeSection([
      makeFloatList([
        makeHeader('トリミング'),
        tip(resetTrimButton, 'トリミングしていない状態に戻します。'),
      ]),
      pCanvas,
    ]));
  }

  {
    const section = makeSection(makeFloatList(([
      makeHeader('透過色'),
      tip(['塗りつぶす: ', bgColorBox],
          '画像の透明部分をこの色で塗り潰して不透明化します。'),
    ])));
    container.appendChild(section);

    section.querySelectorAll('input, button').forEach((el) => {
      el.addEventListener('change', () => {
        requestUpdateTrimCanvas();
        requestQuantize();
      });
      el.addEventListener('input', () => {
        requestUpdateTrimCanvas();
        requestQuantize();
      });
    });
  }

  {
    const p = makeSection(makeFloatList([
      makeHeader('色調補正'),
      tip(['ガンマ: ', gammaBox],
          'デフォルトは 1.0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。'),
      tip(['輝度オフセット: ', brightnessBox],
          'デフォルトは 0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。'),
      tip(['コントラスト: ', contrastBox, '%'],
          'デフォルトは 100% です。\n空欄にすると、階調が失われない範囲でダイナミックレンジが最大となるように自動調整します。'),
      tip([invertBox.parentNode], '各チャネルの値を大小反転します。'),
    ]));
    container.appendChild(p);

    p.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', () => {
        requestQuantize();
      });
      el.addEventListener('input', () => {
        requestQuantize();
      });
    });
  }

  {
    const section = makeSection(makeFloatList([
      makeHeader('出力サイズ'),
      tip([widthBox, ' x ', heightBox, ' px'],
          '片方を空欄にすると他方はアスペクト比に基づいて自動的に決定されます。'),
      tip(['拡縮方法: ', scalingMethodBox],
          'トリミングサイズと出力サイズが異なる場合の拡縮方法を指定します。'),
    ]));
    container.appendChild(section);

    section.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', () => {
        requestQuantize();
      });
      el.addEventListener('input', () => {
        requestQuantize();
      });
    });
  }

  {
    previewCanvas.style.backgroundImage = 'url(./img/checker.png)';
    previewCanvas.style.display = 'none';
    quantizeErrorBox.style.color = 'red';
    quantizeErrorBox.style.display = 'none';

    const pCanvas = makeParagraph([previewCanvas, quantizeErrorBox]);
    pCanvas.style.height = '400px';
    pCanvas.style.background = '#444';
    pCanvas.style.border = 'solid 1px #444';
    pCanvas.style.textAlign = 'center';
    container.appendChild(pCanvas);

    const section = makeSection([
      makeFloatList([
        makeHeader('量子化'),
        tip(['フォーマット: ', pixelFormatBox],
            'ピクセルフォーマットを指定します。'),
        tip(['丸め方法: ', roundMethodBox],
            'パレットから色を選択する際の戦略を指定します。\nディザリングを行う場合はあまり関係ありません。'),
        tip(['ディザリング: ', ditherBox],
            'あえてノイズを加えることでできるだけ元画像の輝度を再現します。'),
      ]),
      pCanvas,
    ]);
    container.appendChild(section);

    section.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', () => {
        requestQuantize();
      });
      el.addEventListener('input', () => {
        requestQuantize();
      });
    });
  }

  {}

  {
    const section = makeSection(makeFloatList([
      makeHeader('エンコード'),
      tip(['チャネル順: ', channelOrderBox],
          'RGB のチャネルを並べる順序を指定します。\n上位からであることが多いです。'),
      tip(['ピクセル順: ', pixelOrderBox],
          'バイト内のピクセルの順序を指定します。\n横パッキングでは上位から、縦パッキングでは下位からであることが多いです。'),
      tip(['バイト順: ', byteOrderBox],
          'ピクセル内のバイトの順序を指定します。\nGFX ライブラリなどでは BigEndian であることが多いです。'),
      tip(['パッキング単位: ', packUnitBox],
          'パッキングの単位を指定します。\n1 チャネルが 8 bit の倍数の場合は出力に影響しません。'),
      tip(['パッキング方向: ', packDirBox],
          'ピクセルをどの方向にパッキングするかを指定します。\n' +
              '多くの場合横ですが、SSD1306/1309 などの一部の白黒ディスプレイに\n' +
              '直接転送可能なデータを生成する場合は縦を指定してください。'),
      tip(['アライメント境界: ', alignBoundaryBox],
          'アライメントの境界を指定します。\nパッキングの単位が 8 bit の倍数の場合は出力に影響しません。'),
      tip(['アライメント方向: ', alignDirBox],
          'アライメントの方向を指定します。\nパッキングの単位が 8 bit の倍数の場合は出力に影響しません。'),
      tip(['アドレス方向: ', addressingBox],
          'アドレスのインクリメント方向を指定します。\n通常は水平です。'),
    ]));

    container.appendChild(section);

    section.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', () => {
        requestGenerateCode();
      });
      el.addEventListener('input', () => {
        requestGenerateCode();
      });
    });
  }

  {
    codeBox.id = 'arrayCode';
    codeBox.classList.add('lang_cpp');
    codeGenErrorBox.style.textAlign = 'center';
    codeGenErrorBox.style.color = 'red';
    codeGenErrorBox.style.display = 'none';

    const section = makeSection([
      makeFloatList([
        makeHeader('コード生成'),
        tip(['列数: ', codeColsBox], '1 行に詰め込む要素数を指定します。'),
        tip(['インデント: ', indentBox],
            'インデントの形式とサイズを指定します。'),
        copyButton,
      ]),
      codeBox,
      codeGenErrorBox,
    ]);

    container.appendChild(section);
    copyButton.parentElement.style.float = 'right';
    copyButton.parentElement.style.marginRight = '0';
    copyButton.parentElement.style.paddingRight = '0';
    copyButton.parentElement.style.borderRight = 'none';

    section.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', () => {
        requestGenerateCode();
      });
      el.addEventListener('input', () => {
        requestGenerateCode();
      });
    });
  }

  // ファイル選択
  hiddenFileBox.addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      await loadFromFile(input.files[0]);
    }
  });

  // ドラッグ & ドロップ
  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const items = e.dataTransfer.items;
    for (const item of items) {
      if (item.kind === 'file') {
        dropTarget.style.display = 'block';
        break;
      }
    }
  });
  dropTarget.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropTarget.style.display = 'none';
  });
  dropTarget.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropTarget.style.display = 'none';
    const items = e.dataTransfer.items;
    for (const item of items) {
      if (item.kind === 'file') {
        await loadFromFile(item.getAsFile());
        break;
      }
    }
  });

  // 貼り付け
  pasteTarget.addEventListener('paste', async (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.kind === 'file') {
        await loadFromFile(item.getAsFile());
        break;
      }
    }
  });
  pasteTarget.addEventListener('input', (e) => {
    pasteTarget.value = '';
  });
  pasteTarget.addEventListener('change', (e) => {
    pasteTarget.value = '';
  });

  // トリミング操作
  trimCanvas.addEventListener('pointermove', (e) => {
    e.preventDefault();
    if (trimUiState == TrimState.IDLE) {
      switch (trimViewToNextState(e.offsetX, e.offsetY)) {
        case TrimState.DRAG_LEFT:
          trimCanvas.style.cursor = 'w-resize';
          break;
        case TrimState.DRAG_TOP:
          trimCanvas.style.cursor = 'n-resize';
          break;
        case TrimState.DRAG_RIGHT:
          trimCanvas.style.cursor = 'e-resize';
          break;
        case TrimState.DRAG_BOTTOM:
          trimCanvas.style.cursor = 's-resize';
          break;
        default:
          trimCanvas.style.cursor = 'default';
          break;
      }
    } else {
      const {x, y} = trimViewToWorld(e.offsetX, e.offsetY);
      switch (trimUiState) {
        case TrimState.DRAG_LEFT:
          trimL = Math.min(x, trimR - 1);
          break;
        case TrimState.DRAG_TOP:
          trimT = Math.min(y, trimB - 1);
          break;
        case TrimState.DRAG_RIGHT:
          trimR = Math.max(x, trimL + 1);
          break;
        case TrimState.DRAG_BOTTOM:
          trimB = Math.max(y, trimT + 1);
          break;
      }
      requestUpdateTrimCanvas();
      requestQuantize();
    }
  });
  trimCanvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (trimViewToNextState(e.offsetX, e.offsetY) != TrimState.IDLE) {
      trimUiState = trimViewToNextState(e.offsetX, e.offsetY);
      trimCanvas.style.cursor = 'grabbing';
      trimCanvas.setPointerCapture(e.pointerId);
    }
  });
  trimCanvas.addEventListener('pointerup', (e) => {
    e.preventDefault();
    trimUiState = TrimState.IDLE;
    trimCanvas.style.cursor = 'default';
    trimCanvas.releasePointerCapture(e.pointerId);
    requestUpdateTrimCanvas();
  });
  trimCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
  });
  trimCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
  });
  trimCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
  });
  resetTrimButton.addEventListener('click', () => {
    resetTrim();
  });

  // コードのコピー
  copyButton.addEventListener('click', () => {
    if (!codeBox.textContent) return;
    navigator.clipboard.writeText(codeBox.textContent);
  });

  // サンプルのロード
  await loadFromString('./img/sample/gradient.png');
}  // main

async function loadFromFile(file: File): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (typeof e.target.result === 'string') {
        await loadFromString(e.target.result);
      } else {
        throw new Error('Invalid image data');
      }
      resolve();
    };
    reader.onerror = (e) => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

async function loadFromString(s: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      origCanvas.width = img.width;
      origCanvas.height = img.height;
      const ctx = origCanvas.getContext('2d', {willReadFrequently: true});
      ctx.clearRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      resetTrim();
      quantize();
      requestUpdateTrimCanvas();
      resolve();
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = s;
  });
}

// トリミングのリセット
function resetTrim(): void {
  trimL = 0;
  trimT = 0;
  trimR = origCanvas.width;
  trimB = origCanvas.height;
  requestUpdateTrimCanvas();
  requestQuantize();
}

// トリミングUIのビュー領域の取得
function getTrimViewArea(): Rect {
  const margin = 20;
  const canvasW = trimCanvas.width;
  const canvasH = trimCanvas.height;
  const viewX0 = canvasW / 2;
  const viewY0 = canvasH / 2;
  const viewW = canvasW - margin * 2;
  const viewH = canvasH - margin * 2;
  return {x: viewX0, y: viewY0, width: viewW, height: viewH};
}

// トリミングUIのワールド座標をビュー座標に変換
function trimWorldToView(x: number, y: number): Point {
  const view = getTrimViewArea();
  return {
    x: view.x + (x - worldX0) * zoom,
    y: view.y + (y - worldY0) * zoom,
  };
}

// トリミングUIのビュー座標をワールド座標に変換
function trimViewToWorld(x: number, y: number): Point {
  const view = getTrimViewArea();
  return {
    x: (x - view.x) / zoom + worldX0,
    y: (y - view.y) / zoom + worldY0,
  };
}

// ポイントされているビュー座標からトリミングUIの次の状態を取得
function trimViewToNextState(x: number, y: number): TrimState {
  const {x: trimViewL, y: trimViewT} = trimWorldToView(trimL, trimT);
  const {x: trimViewR, y: trimViewB} = trimWorldToView(trimR, trimB);
  if (Math.abs(x - trimViewL) < 10) return TrimState.DRAG_LEFT;
  if (Math.abs(x - trimViewR) < 10) return TrimState.DRAG_RIGHT;
  if (Math.abs(y - trimViewT) < 10) return TrimState.DRAG_TOP;
  if (Math.abs(y - trimViewB) < 10) return TrimState.DRAG_BOTTOM;
  return TrimState.IDLE;
}

function requestUpdateTrimCanvas(): void {
  if (updateTrimCanvasTimeoutId >= 0) return;
  updateTrimCanvasTimeoutId = setTimeout(() => {
    updateTrimCanvas();
  }, 10);
}

function updateTrimCanvas(): void {
  if (updateTrimCanvasTimeoutId >= 0) {
    clearTimeout(updateTrimCanvasTimeoutId);
    updateTrimCanvasTimeoutId = -1;
  }

  // キャンバスの論理サイズを見かけ上のサイズに合わせる
  // ただし枠線は含めない
  const rect = trimCanvas.getBoundingClientRect();
  trimCanvas.width = rect.width - 2;
  trimCanvas.height = rect.height - 2;

  const canvasW = trimCanvas.width;
  const canvasH = trimCanvas.height;

  const origW = origCanvas.width;
  const origH = origCanvas.height;

  const view = getTrimViewArea();

  if (trimUiState == TrimState.IDLE) {
    // ビューに触れていない間に座標系を調整
    const worldL = trimL;  // Math.min(trimL, 0);
    const worldR = trimR;  // Math.max(trimR, origW);
    const worldT = trimT;  // Math.min(trimT, 0);
    const worldB = trimB;  // Math.max(trimB, origH);
    const worldW = worldR - worldL;
    const worldH = worldB - worldT;
    worldX0 = (worldL + worldR) / 2;
    worldY0 = (worldT + worldB) / 2;
    const worldAspect = worldW / Math.max(1, worldH);
    const viewAspect = view.width / Math.max(1, view.height);
    if (worldAspect > viewAspect) {
      zoom = view.width / Math.max(1, worldW);
    } else {
      zoom = view.height / Math.max(1, worldH);
    }
  }

  const {x: trimViewL, y: trimViewT} = trimWorldToView(trimL, trimT);
  const {x: trimViewR, y: trimViewB} = trimWorldToView(trimR, trimB);

  const ctx = trimCanvas.getContext('2d', {willReadFrequently: true});
  ctx.clearRect(0, 0, canvasW, canvasH);

  ctx.fillStyle = bgColorBox.value;
  ctx.fillRect(
      trimViewL, trimViewT, trimViewR - trimViewL, trimViewB - trimViewT);

  // 画像描画
  {
    const dx = view.x - worldX0 * zoom;
    const dy = view.y - worldY0 * zoom;
    const dw = origCanvas.width * zoom;
    const dh = origCanvas.height * zoom;
    ctx.drawImage(origCanvas, dx, dy, dw, dh);
  }

  // トリミングのガイド線描画
  {
    const lineWidth = 3;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(trimViewL - lineWidth - 2, 0, lineWidth + 4, canvasH);
    ctx.fillRect(0, trimViewT - lineWidth - 2, canvasW, lineWidth + 4);
    ctx.fillRect(trimViewR - 2, 0, lineWidth + 4, canvasH);
    ctx.fillRect(0, trimViewB - 2, canvasW, lineWidth + 4);
    ctx.fillStyle = '#FFF';
    ctx.fillRect(trimViewL - lineWidth, 0, lineWidth, canvasH);
    ctx.fillRect(0, trimViewT - lineWidth, canvasW, lineWidth);
    ctx.fillRect(trimViewR, 0, lineWidth, canvasH);
    ctx.fillRect(0, trimViewB, canvasW, lineWidth);
  }
}

function loadPreset(preset: Preset): void {
  pixelFormatBox.value = preset.format.toString();
  channelOrderBox.value = preset.channelOrder.toString();
  pixelOrderBox.value = preset.pixelOrder.toString();
  byteOrderBox.value = preset.byteOrder.toString();
  packUnitBox.value = preset.packUnit.toString();
  packDirBox.value = preset.packDir.toString();
  alignBoundaryBox.value = preset.alignUnit.toString();
  alignDirBox.value = preset.alignDir.toString();
  addressingBox.value = preset.addrDir.toString();
  requestQuantize();
}

function requestQuantize(): void {
  if (quantizeTimeoutId >= 0) return;
  quantizeTimeoutId = setTimeout(() => {
    quantize();
  }, 300);
}

function quantize(): void {
  if (quantizeTimeoutId >= 0) {
    clearTimeout(quantizeTimeoutId);
    quantizeTimeoutId = -1;
  }

  try {
    const origCtx = origCanvas.getContext('2d', {willReadFrequently: true});

    const srcW = Math.round(trimR - trimL);
    const srcH = Math.round(trimB - trimT);
    let outW = srcW;
    let outH = srcH;

    // 出力サイズ決定
    if (widthBox.value && heightBox.value) {
      outW = parseInt(widthBox.value);
      outH = parseInt(heightBox.value);
      scalingMethodBox.disabled = false;
    } else if (widthBox.value) {
      outW = parseInt(widthBox.value);
      outH = Math.ceil(srcH * (outW / srcW));
      scalingMethodBox.disabled = true;
    } else if (heightBox.value) {
      outH = parseInt(heightBox.value);
      outW = Math.ceil(srcW * (outH / srcH));
      scalingMethodBox.disabled = true;
    } else {
      if (outW > 256 || outH > 256) {
        const scale = Math.min(256 / outW, 256 / outH);
        outW = Math.floor(outW * scale);
        outH = Math.floor(outH * scale);
      }
      scalingMethodBox.disabled = true;
    }

    if (outW * outH > 1024 * 1024) {
      throw new Error('Too large image.');
    }

    widthBox.placeholder = '(' + outW + ')';
    heightBox.placeholder = '(' + outH + ')';

    // トリミング + リサイズの適用
    {
      const outCtx = previewCanvas.getContext('2d', {willReadFrequently: true});
      previewCanvas.width = outW;
      previewCanvas.height = outH;

      // 背景色の適用
      outCtx.fillStyle = bgColorBox.value;
      outCtx.fillRect(0, 0, outW, outH);

      {
        // トリミング + リサイズ
        const srcX0 = (trimL + trimR) / 2;
        const srcY0 = (trimT + trimB) / 2;
        const srcAspect = srcW / srcH;
        const outAspect = outW / outH;
        let scaleX, scaleY;
        switch (parseInt(scalingMethodBox.value)) {
          case ScalingMethod.ZOOM:
            if (srcAspect > outAspect) {
              scaleX = scaleY = outH / srcH;
            } else {
              scaleX = scaleY = outW / srcW;
            }
            break;
          case ScalingMethod.FIT:
            if (srcAspect > outAspect) {
              scaleX = scaleY = outW / srcW;
            } else {
              scaleX = scaleY = outH / srcH;
            }
            break;
          case ScalingMethod.STRETCH:
            scaleX = outW / srcW;
            scaleY = outH / srcH;
            break;
          default:
            throw new Error('Unknown scaling method');
        }
        const dx = outW / 2 + (trimL - srcX0) * scaleX;
        const dy = outH / 2 + (trimT - srcY0) * scaleY;
        const dw = srcW * scaleX;
        const dh = srcH * scaleY;
        outCtx.drawImage(origCanvas, trimL, trimT, srcW, srcH, dx, dy, dw, dh);
      }
    }

    const fmt = new PixelFormatInfo(parseInt(pixelFormatBox.value));

    let maxChannelDepth = 0;
    let roundMethod: RoundMethod = RoundMethod.NEAREST;
    for (const depth of fmt.channelBits) {
      if (depth > maxChannelDepth) {
        maxChannelDepth = depth;
      }
    }
    if (maxChannelDepth > 1) {
      roundMethodBox.disabled = false;
      roundMethod = parseInt(roundMethodBox.value);
    } else {
      // 均等割りはチャンネル深度が2以上でないと意味がないので無効化
      roundMethodBox.disabled = true;
    }

    const palette = new Palette(fmt, roundMethod);
    const normData = new Float32Array(outW * outH * fmt.numChannels);
    const norm = new NormalizedImage(fmt, palette, outW, outH, normData);

    // 量子化の適用
    {
      const previewCtx =
          previewCanvas.getContext('2d', {willReadFrequently: true});
      const previewImageData = previewCtx.getImageData(0, 0, outW, outH);
      const srcRgbData = previewImageData.data;
      const previewData = new Uint8Array(srcRgbData.length);

      const numPixels = outW * outH;
      const numCh = fmt.colorSpace === ColorSpace.GRAYSCALE ? 1 : 3;

      let outData = [];
      for (let i = 0; i < numCh; i++) {
        outData.push(new Uint8Array(numPixels));
      }

      // 正規化 + 自動ガンマ補正用の値収集
      const HISTOGRAM_SIZE = 16;
      const histogram = new Uint32Array(HISTOGRAM_SIZE);
      for (let i = 0; i < numPixels; i++) {
        const r = srcRgbData[i * 4] / 255;
        const g = srcRgbData[i * 4 + 1] / 255;
        const b = srcRgbData[i * 4 + 2] / 255;
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        histogram[Math.round(gray * (HISTOGRAM_SIZE - 1))]++;
        switch (fmt.colorSpace) {
          case ColorSpace.GRAYSCALE:
            norm.data[i * numCh] = gray;
            break;
          case ColorSpace.RGB:
            norm.data[i * numCh + 0] = r;
            norm.data[i * numCh + 1] = g;
            norm.data[i * numCh + 2] = b;
            break;
          default:
            throw new Error('Unknown color space');
        }
      }

      // ガンマ補正
      {
        let gamma = 1;
        if (gammaBox.value) {
          gamma = parseFloat(gammaBox.value);
          gammaBox.placeholder = '';
        } else {
          gamma = correctGamma(histogram);
        }
        gamma = clip(0.01, 5, gamma);
        gammaBox.placeholder = '(' + Math.round(gamma * 100) / 100 + ')';
        if (gamma != 1) {
          for (let i = 0; i < norm.data.length; i++) {
            const val = Math.pow(norm.data[i], 1 / gamma);
            norm.data[i] = val;
          }
        }
      }

      // 輝度補正
      {
        let brightness = 0;
        if (brightnessBox.value) {
          brightness = parseFloat(brightnessBox.value) / 255;
          brightnessBox.placeholder = '';
        } else {
          const [chMin, chMax] = norm.getMinMax();
          brightness = 0.5 - (chMin + chMax) / 2;
        }
        brightness = clip(-1, 1, brightness);
        brightnessBox.placeholder = '(' + Math.round(brightness * 255) + ')';
        if (brightness != 0) {
          for (let i = 0; i < norm.data.length; i++) {
            norm.data[i] = clip(0, 1, norm.data[i] + brightness);
          }
        }
      }

      // コントラスト補正
      {
        let contrast = 1;
        if (contrastBox.value) {
          contrast = parseFloat(contrastBox.value) / 100;
          contrastBox.placeholder = '';
        } else {
          const [chMin, chMax] = norm.getMinMax();
          const middle = (chMin + chMax) / 2;
          if (middle < 0.5 && chMin < middle) {
            contrast = 0.5 / (middle - chMin);
          } else if (middle > 0.5 && chMax > middle) {
            contrast = 0.5 / (chMax - middle);
          }
        }
        contrast = clip(0.01, 10, contrast);
        contrastBox.placeholder = '(' + Math.round(contrast * 100) + ')';
        if (contrast != 1) {
          for (let i = 0; i < norm.data.length; i++) {
            norm.data[i] = clip(0, 1, (norm.data[i] - 0.5) * contrast + 0.5);
          }
        }
      }

      // 階調反転
      if (invertBox.checked) {
        for (let i = 0; i < norm.data.length; i++) {
          norm.data[i] = 1 - norm.data[i];
        }
      }

      // 量子化
      const diffusion = parseInt(ditherBox.value) === DitherMethod.DIFFUSION;
      const palette = new Palette(fmt, roundMethod);
      const out = new Uint8Array(numCh);
      const error = new Float32Array(numCh);
      for (let y = 0; y < outH; y++) {
        for (let ix = 0; ix < outW; ix++) {
          // 誤差拡散をジグザグに行うため
          // ライン毎にスキャン方向を変える
          const fwd = y % 2 == 0;
          const x = fwd ? ix : (outW - 1 - ix);

          // パレットから最も近い色を選択
          const iPix = (y * outW + x);
          palette.nearest(norm.data, iPix * numCh, out, 0, error);

          // 出力
          for (let ch = 0; ch < numCh; ch++) {
            outData[ch][iPix] = out[ch];
          }

          // プレビュー用の色生成
          if (fmt.colorSpace === ColorSpace.GRAYSCALE) {
            const gray = Math.round(out[0] * 255 / palette.outMax[0]);
            for (let ch = 0; ch < 3; ch++) {
              previewData[iPix * 4 + ch] = gray;
            }
          } else {
            for (let ch = 0; ch < 3; ch++) {
              const outMax = palette.outMax[ch];
              previewData[iPix * 4 + ch] = Math.round(out[ch] * 255 / outMax);
            }
          }

          if (diffusion) {
            // 誤差拡散
            norm.diffuseError(error, x, y, fwd);
          }
        }  // for ix
      }  // for y

      // プレビューを不透明化
      for (let i = 0; i < numPixels; i++) {
        previewData[i * 4 + 3] = 255;
      }

      imageCacheFormat = fmt;
      imageCacheData = outData;

      previewImageData.data.set(previewData);
      previewCtx.putImageData(previewImageData, 0, 0);

      previewCanvas.style.display = 'inline-block';
      quantizeErrorBox.style.display = 'none';

      generateCode();
    }

    // 小さい画像はプレビューを大きく表示
    {
      const borderWidth = 1;
      const rect = previewCanvas.parentElement.getBoundingClientRect();
      const viewW = rect.width - (borderWidth * 2);
      const viewH = rect.height - (borderWidth * 2);
      let zoom = Math.min(viewW / outW, viewH / outH);
      if (zoom >= 1) {
        zoom = Math.max(1, Math.floor(zoom));
      }
      const canvasW = Math.round(outW * zoom);
      const canvasH = Math.round(outH * zoom);
      previewCanvas.style.width = `${canvasW}px`;
      previewCanvas.style.height = `${canvasH}px`;
      previewCanvas.style.marginTop = `${Math.floor((viewH - canvasH) / 2)}px`;
      previewCanvas.style.imageRendering = 'pixelated';
    }
  } catch (error) {
    previewCanvas.style.display = 'none';
    codeBox.style.display = 'none';
    quantizeErrorBox.style.display = 'inline';
    quantizeErrorBox.textContent = error.message;
  }
}

function correctGamma(histogram: Uint32Array): number {
  const N = histogram.length;
  let min = 0.5;
  let max = 2;

  let gamma: number;
  while (max - min > 0.01) {
    gamma = (min + max) / 2;
    let lo = 0, hi = 0;
    for (let i = 0; i < N; i++) {
      const val = Math.pow(i / (N - 1), 1 / gamma);
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


function requestGenerateCode(): void {
  if (generateCodeTimeoutId !== -1) {
    clearTimeout(generateCodeTimeoutId);
  }
  generateCodeTimeoutId = setTimeout(() => {
    generateCode();
    generateCodeTimeoutId = -1;
  }, 300);
}

function align(
    data: number, width: number, boundary: number,
    alignLeft: boolean): [number, number] {
  const outWidth = Math.ceil(width / boundary) * boundary;
  if (alignLeft) {
    data <<= outWidth - width;
  }
  return [data, outWidth];
}

function generateCode(): void {
  if (!imageCacheData) {
    codeBox.textContent = '';
    codeBox.style.display = 'block';
    codeGenErrorBox.style.display = 'none';
    return;
  }

  try {
    const msbRed = parseInt(channelOrderBox.value) == BitOrder.MSB_FIRST;
    const msb1st = parseInt(pixelOrderBox.value) == BitOrder.MSB_FIRST;
    const bigEndian = parseInt(byteOrderBox.value) == ByteOrder.BIG_ENDIAN;
    const packUnit: PackUnit = parseInt(packUnitBox.value);
    const vertPack = parseInt(packDirBox.value) == ScanDir.VERTICAL;
    const alignBoundary: AlignBoundary = parseInt(alignBoundaryBox.value);
    const alignLeft = parseInt(alignDirBox.value) == AlignDir.HIGHER;
    const vertAddr = parseInt(addressingBox.value) == ScanDir.VERTICAL;

    // ピクセルあたりのビット数
    const numChannels = imageCacheData.length;
    let bitsPerPixel = 0;
    for (let i = 0; i < numChannels; i++) {
      bitsPerPixel += imageCacheFormat.channelBits[i];
    }

    // エンコードパラメータ
    let pixelsPerPack = Math.max(1, Math.floor(8 / bitsPerPixel));
    let bytesPerPack = Math.ceil(bitsPerPixel / 8);
    let fragWidth = vertPack ? 1 : pixelsPerPack;
    let fragHeight = vertPack ? pixelsPerPack : 1;

    // 1 チャネルのときはチャネル順指定無効
    channelOrderBox.disabled = (numChannels <= 1);

    // 1 byte/pack 以下のときはエンディアン指定無効
    byteOrderBox.disabled = (bytesPerPack <= 1);

    // 1 pixel/byte 以下のときはパッキング設定無効
    pixelOrderBox.disabled = (pixelsPerPack <= 1);
    packDirBox.disabled = (pixelsPerPack <= 1);

    // 列数決定
    let arrayCols = parseInt(codeColsBox.value);

    // インデント決定
    let indent = '  ';
    switch (parseInt(indentBox.value)) {
      case Indent.SPACE_X2:
        indent = '  ';
        break;
      case Indent.SPACE_X4:
        indent = '    ';
        break;
      case Indent.TAB:
        indent = '\t';
        break;
      default:
        throw new Error('Unknown indent type');
    }

    const width = previewCanvas.width;
    const height = previewCanvas.height;
    const cols = Math.ceil(width / fragWidth);
    const rows = Math.ceil(height / fragHeight);
    const numPacks = cols * rows;

    const arrayData = new Uint8Array(numPacks * bytesPerPack);

    // 配列化
    let byteIndex = 0;

    // パック単位
    for (let packIndex = 0; packIndex < numPacks; packIndex++) {
      let xCoarse, yCoarse;
      if (vertAddr) {
        xCoarse = fragWidth * Math.floor(packIndex / rows);
        yCoarse = fragHeight * (packIndex % rows);
      } else {
        xCoarse = fragWidth * (packIndex % cols);
        yCoarse = fragHeight * Math.floor(packIndex / cols);
      }

      // ピクセル単位
      let fragData = 0;
      let fragBits = 0;
      for (let yFine = 0; yFine < fragHeight; yFine++) {
        for (let xFine = 0; xFine < fragWidth; xFine++) {
          const x = xCoarse + xFine;
          const y = yCoarse + yFine;

          // ピクセルのエンコード
          let pixData = 0;
          let pixBits = 0;
          for (let ch = 0; ch < numChannels; ch++) {
            let chData = 0;
            if (y < height && x < width) {
              chData = imageCacheData[ch][y * width + x];
            }
            let chBits = imageCacheFormat.channelBits[ch];

            if (packUnit == PackUnit.UNPACKED) {
              [chData, chBits] =
                  align(chData, chBits, alignBoundary, alignLeft);
            }

            if (msbRed) {
              pixData <<= chBits;
              pixData |= chData;
            } else {
              pixData |= chData << pixBits;
            }
            pixBits += chBits;
          }  // for ch

          if (packUnit == PackUnit.PIXEL) {
            [pixData, pixBits] =
                align(pixData, pixBits, alignBoundary, alignLeft);
          }

          if (msb1st) {
            fragData <<= pixBits;
            fragData |= pixData;
          } else {
            fragData |= pixData << fragBits;
          }
          fragBits += pixBits;

        }  // for xFine
      }  // for yFine

      if (packUnit == PackUnit.FRAGMENT) {
        [fragData, fragBits] =
            align(fragData, fragBits, alignBoundary, alignLeft);
      }

      if (fragBits % 8 != 0) {
        throw new Error(`Invalid fragment fields`);
      }

      // バイト単位に変換
      for (let j = 0; j < fragBits / 8; j++) {
        if (bigEndian) {
          arrayData[byteIndex++] = (fragData >> (fragBits - 8)) & 0xFF;
          fragData <<= 8;
        } else {
          arrayData[byteIndex++] = fragData & 0xFF;
          fragData >>= 8;
        }
      }
    }  // for packIndex

    // コード生成
    let code = '';
    code += `#pragma once\n`;
    code += `\n`;
    code += `#include <stdint.h>\n`;
    code += `\n`;
    code += `// ${width}x${height}px, ${imageCacheFormat.toString()}\n`;
    {
      code += `// `;
      if (!channelOrderBox.disabled) {
        code += (msbRed ? 'R->G->B' : 'B->G->R') + ', ';
      }
      if (!pixelOrderBox.disabled) {
        code += (msb1st ? 'MSB' : 'LSB') + ' First, ';
      }
      if (!byteOrderBox.disabled) {
        code += (bigEndian ? 'Big' : 'Little') + ' Endian, ';
      }
      if (!packDirBox.disabled) {
        code += (vertPack ? 'Vertical' : 'Horizontal') + ' Packing, ';
      }
      code += `${vertAddr ? 'Vertical' : 'Horizontal'} Adressing\n`;
    }
    code += `// ${arrayData.length} Bytes\n`;
    code += 'const uint8_t imageArray[] = {\n';
    for (let i = 0; i < arrayData.length; i++) {
      if (i % arrayCols == 0) code += indent;
      code += '0x' + arrayData[i].toString(16).padStart(2, '0') + ',';
      if ((i + 1) % arrayCols == 0 || i + 1 == arrayData.length) {
        code += '\n';
      } else {
        code += ' ';
      }
    }
    code += '};';

    codeBox.textContent = code;
    codeBox.style.display = 'block';
    codeGenErrorBox.style.display = 'none';
  } catch (error) {
    codeBox.style.display = 'none';
    codeGenErrorBox.textContent = error.message;
    codeGenErrorBox.style.display = 'block';
  }
}

function clip(min: number, max: number, val: number): number {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}

document.addEventListener('DOMContentLoaded', async (e) => {
  await main();
});

window.addEventListener('resize', (e) => {
  requestUpdateTrimCanvas();
});
