
const enum TrimState {
  IDLE,
  DRAG_TOP,
  DRAG_RIGHT,
  DRAG_BOTTOM,
  DRAG_LEFT,
}

const enum AlphaProc {
  KEEP,
  FILL,
  BINARIZE,
  SET_KEY_COLOR,
}

const enum ColorSpace {
  GRAYSCALE,
  RGB,
}

const enum PixelFormat {
  RGBA8888,
  // RGBA4444,
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
  MULTI_PIXEL,
  PIXEL,
  UNPACKED,
}

const enum AlignBoundary {
  NIBBLE = 4,
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

const enum ChannelOrder {
  RGBA,
  BGRA,
  ARGB,
  ABGR,
}

const enum PixelOrder {
  NEAR_FIRST,
  FAR_FIRST,
}

const enum ByteOrder {
  LITTLE_ENDIAN,
  BIG_ENDIAN,
}

const enum ScanDir {
  HORIZONTAL,
  VERTICAL,
}

const enum CodeUnit {
  ELEMENTS,
  ARRAY_DEF,
  FILE,
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

class ArrayfyError extends Error {
  constructor(public element: HTMLElement, message: string) {
    super(message);
    this.name = 'ArrayfyError';
  }
}

class Preset {
  public channelOrder: ChannelOrder = ChannelOrder.ARGB;
  public pixelOrder: PixelOrder = PixelOrder.NEAR_FIRST;
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
  argb8888_le: new Preset(
      'ARGB8888-LE',
      '透明度付きフルカラー。\nLovyanGFX の pushAlphaImage 関数向け。',
      PixelFormat.RGBA8888,
      {
        channelOrder: ChannelOrder.ARGB,
        byteOrder: ByteOrder.LITTLE_ENDIAN,
      },
      ),
  rgb888_be: new Preset(
      'RGB888-BE',
      'フルカラー。24bit 液晶用。',
      PixelFormat.RGB888,
      {
        channelOrder: ChannelOrder.ARGB,
        byteOrder: ByteOrder.BIG_ENDIAN,
      },
      ),
  rgb666_be_ra: new Preset(
      'RGB666-BE',
      '各バイトにチャネルを右詰で配置した RGB666。LovyanGFX 用。',
      PixelFormat.RGB666,
      {
        channelOrder: ChannelOrder.ARGB,
        packUnit: PackUnit.UNPACKED,
        byteOrder: ByteOrder.BIG_ENDIAN,
      },
      ),
  rgb565_be: new Preset(
      'RGB565-BE',
      'ハイカラー。\n各種 GFX ライブラリでの使用を含め、\n組み込み用途で一般的な形式。',
      PixelFormat.RGB565,
      {
        byteOrder: ByteOrder.BIG_ENDIAN,
      },
      ),
  rgb332: new Preset(
      'RGB332',
      '各種 GFX ライブラリ用。',
      PixelFormat.RGB332,
      ),
  bw_hscan: new Preset(
      '白黒 横スキャン',
      '各種 GFX ライブラリ用。',
      PixelFormat.BW,
      {
        packUnit: PackUnit.MULTI_PIXEL,
        pixelOrder: PixelOrder.FAR_FIRST,
        packDir: ScanDir.HORIZONTAL,
      },
      ),
  bw_vpack: new Preset(
      '白黒 縦パッキング',
      'SPI/I2C ドライバを使用して\nSSD1306/1309 等の白黒ディスプレイに直接転送するための形式。',
      PixelFormat.BW,
      {
        packUnit: PackUnit.MULTI_PIXEL,
        pixelOrder: PixelOrder.NEAR_FIRST,
        packDir: ScanDir.VERTICAL,
      },
      ),
};

class PixelFormatInfo {
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

class Palette {
  public inMin: Float32Array;
  public inMax: Float32Array;
  public outMax: Uint8Array;
  constructor(public channelBits: number[], public roundMethod: RoundMethod) {
    this.inMin = new Float32Array(channelBits.length);
    this.inMax = new Float32Array(channelBits.length);
    this.outMax = new Uint8Array(channelBits.length);
    const equDiv = roundMethod == RoundMethod.EQUAL_DIVISION;
    for (let ch = 0; ch < channelBits.length; ch++) {
      const numLevel = 1 << channelBits[ch];
      this.inMin[ch] = equDiv ? (1 / (numLevel * 2)) : 0;
      this.inMax[ch] = equDiv ? ((numLevel * 2 - 1) / (numLevel * 2)) : 1;
      this.outMax[ch] = numLevel - 1;
    }
  }

  nearest(
      src: Float32Array, srcOffset: number, dest: Uint8Array,
      destOffset: number, error: Float32Array): void {
    for (let ch = 0; ch < this.channelBits.length; ch++) {
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
  public color: Float32Array;
  public alpha: Float32Array;

  constructor(

      public width: number, public height: number,
      public numColorChannels: number) {
    this.color = new Float32Array(width * height * numColorChannels);
    this.alpha = new Float32Array(width * height);
    for (let i = 0; i < this.alpha.length; i++) {
      this.alpha[i] = 1;
    }
  }

  getColorMinMax(): [number, number] {
    let min = Infinity;
    let max = -Infinity;
    const numColCh = this.numColorChannels;
    for (let i = 0; i < this.alpha.length; i++) {
      if (this.alpha[i] == 0) continue;
      const value = this.color[i * numColCh];
      if (value < min) min = value;
      if (value > max) max = value;
    }
    return [min, max];
  }

  diffuseColorError(
      error: Float32Array, x: number, y: number, forward: boolean) {
    this.diffuseError(this.color, this.numColorChannels, error, x, y, forward);
  }

  diffuseAlphaError(
      error: Float32Array, x: number, y: number, forward: boolean) {
    this.diffuseError(this.alpha, 1, error, x, y, forward);
  }

  diffuseError(
      target: Float32Array, numCh: number, error: Float32Array, x: number,
      y: number, forward: boolean) {
    const w = this.width;
    const h = this.height;
    const stride = this.width * numCh;
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

function basic(elem: HTMLElement): HTMLElement {
  elem.classList.add('basic');
  return elem;
}

function pro(elem: HTMLElement): HTMLElement {
  elem.classList.add('professional');
  return elem;
}

function show(elem: HTMLElement): HTMLElement {
  elem.classList.remove('hidden');
  return elem;
}

function hide(elem: HTMLElement): HTMLElement {
  elem.classList.add('hidden');
  return elem;
}

function setVisible(elem: HTMLElement, visible: boolean): HTMLElement {
  return visible ? show(elem) : hide(elem);
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

function parentLiOf(child: HTMLElement): HTMLLIElement {
  let parent = child;
  while (parent && parent.tagName !== 'LI') {
    parent = parent.parentElement;
  }
  return parent as HTMLLIElement;
}

const dropTarget = document.createElement('div');
const hiddenFileBox = document.createElement('input');
const pasteTarget = document.createElement('input');
const origCanvas = document.createElement('canvas');
const preModCanvas = document.createElement('canvas');
const resetTrimButton = makeButton('範囲をリセット');
const alphaProcBox = makeSelectBox(
    [
      {value: AlphaProc.KEEP, label: '変更しない'},
      {value: AlphaProc.FILL, label: '不透明化'},
      {value: AlphaProc.BINARIZE, label: '二値化'},
      {value: AlphaProc.SET_KEY_COLOR, label: '抜き色指定'},
    ],
    AlphaProc.KEEP);
const bgColorBox = makeTextBox('#000');
const keyColorBox = makeTextBox('#0F0');
const keyToleranceBox = makeTextBox('0', '(auto)', 5);
const alphaThreshBox = makeTextBox('128', '(auto)', 5);
const trimCanvas = document.createElement('canvas');
const gammaBox = makeTextBox('1', '(auto)', 4);
const brightnessBox = makeTextBox('0', '(auto)', 5);
const contrastBox = makeTextBox('100', '(auto)', 5);
const invertBox = makeCheckBox('階調反転');
const pixelFormatBox = makeSelectBox(
    [
      {value: PixelFormat.RGBA8888, label: 'RGBA8888'},
      //{value: PixelFormat.RGBA4444, label: 'RGBA4444'},
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
const colorDitherBox = makeSelectBox(
    [
      {value: DitherMethod.NONE, label: 'なし'},
      {value: DitherMethod.DIFFUSION, label: '誤差拡散'},
    ],
    DitherMethod.NONE);
const alphaDitherBox = makeSelectBox(
    [
      {value: DitherMethod.NONE, label: 'なし'},
      {value: DitherMethod.DIFFUSION, label: '誤差拡散'},
    ],
    DitherMethod.NONE);
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
      {value: ChannelOrder.RGBA, label: 'RGBA'},
      {value: ChannelOrder.BGRA, label: 'BGRA'},
      {value: ChannelOrder.ARGB, label: 'ARGB'},
      {value: ChannelOrder.ABGR, label: 'ABGR'},
    ],
    ChannelOrder.RGBA);
const pixelOrderBox = makeSelectBox(
    [
      {value: PixelOrder.FAR_FIRST, label: '上位から'},
      {value: PixelOrder.NEAR_FIRST, label: '下位から'},
    ],
    PixelOrder.FAR_FIRST);
const byteOrderBox = makeSelectBox(
    [
      {value: ByteOrder.LITTLE_ENDIAN, label: 'Little Endian'},
      {value: ByteOrder.BIG_ENDIAN, label: 'Big Endian'},
    ],
    ByteOrder.BIG_ENDIAN);
const packUnitBox = makeSelectBox(
    [
      {value: PackUnit.UNPACKED, label: 'アンパックド'},
      {value: PackUnit.PIXEL, label: '1 ピクセル'},
      {value: PackUnit.MULTI_PIXEL, label: '複数ピクセル'},
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
      {value: AlignBoundary.NIBBLE, label: 'ニブル'},
    ],
    AlignBoundary.BYTE);
const alignDirBox = makeSelectBox(
    [
      {value: AlignDir.HIGHER, label: '上位詰め'},
      {value: AlignDir.LOWER, label: '下位詰め'},
    ],
    AlignDir.LOWER);
const addressingBox = makeSelectBox(
    [
      {value: ScanDir.HORIZONTAL, label: '水平'},
      {value: ScanDir.VERTICAL, label: '垂直'},
    ],
    ScanDir.HORIZONTAL);
const structCanvas = document.createElement('canvas');
const structErrorBox = makeParagraph();
const codeUnitBox = makeSelectBox(
    [
      {value: CodeUnit.FILE, label: 'ファイル全体'},
      {value: CodeUnit.ARRAY_DEF, label: '配列定義'},
      {value: CodeUnit.ELEMENTS, label: '要素のみ'},
    ],
    CodeUnit.FILE)
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
const codeErrorBox = makeParagraph();
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
      '白黒ディスプレイについては、各種 GFX ライブラリを使用して描画する場合は横スキャンを選択してください。',
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
    const showProButton = document.createElement('a');
    const hideProButton = document.createElement('a');

    showProButton.textContent = '上級者向け設定を表示する';
    showProButton.href = '#detail';

    hideProButton.textContent = '上級者向け設定を隠す';
    hideProButton.href = '#';

    showProButton.addEventListener('click', showPro);
    hideProButton.addEventListener('click', hidePro);

    const section = makeSection([basic(showProButton), pro(hideProButton)]);
    section.style.textAlign = 'center';
    section.style.padding = '5px 0';
    container.appendChild(section);
  }

  {
    trimCanvas.style.width = '100%';
    trimCanvas.style.height = '400px';
    trimCanvas.style.boxSizing = 'border-box';
    trimCanvas.style.border = 'solid 1px #444';
    trimCanvas.style.backgroundImage = 'url(./img/checker.png)';

    const pCanvas = makeParagraph(trimCanvas);
    pCanvas.style.textAlign = 'center';

    container.appendChild(pro(makeSection([
      makeFloatList([
        makeHeader('トリミング'),
        tip(resetTrimButton, 'トリミングしていない状態に戻します。'),
      ]),
      pCanvas,
    ])));
  }

  {
    const section = pro(makeSection(makeFloatList(([
      makeHeader('透過色'),
      tip(['透過色の扱い: ', alphaProcBox],
          '入力画像に対する透過色の取り扱いを指定します。'),
      tip(['背景色: ', bgColorBox],
          '画像の透明部分をこの色で塗り潰して不透明化します。'),
      tip(['キーカラー: ', keyColorBox], '透明にしたい色を指定します。'),
      tip(['許容誤差: ', keyToleranceBox],
          'キーカラーからの許容誤差を指定します。'),
      tip(['閾値: ', alphaThreshBox], '透明にするかどうかの閾値を指定します。'),
    ]))));
    container.appendChild(section);

    function updateVisibility() {
      parentLiOf(bgColorBox).style.display = 'none';
      parentLiOf(keyColorBox).style.display = 'none';
      parentLiOf(keyToleranceBox).style.display = 'none';
      parentLiOf(alphaThreshBox).style.display = 'none';
      const alphaProc: AlphaProc = parseInt(alphaProcBox.value);
      switch (alphaProc) {
        case AlphaProc.FILL:
          parentLiOf(bgColorBox).style.display = 'inline-block';
          break;
        case AlphaProc.SET_KEY_COLOR:
          parentLiOf(keyColorBox).style.display = 'inline-block';
          parentLiOf(keyToleranceBox).style.display = 'inline-block';
          break;
        case AlphaProc.BINARIZE:
          parentLiOf(alphaThreshBox).style.display = 'inline-block';
          break;
      }
    }
    alphaProcBox.addEventListener('change', updateVisibility);
    updateVisibility();

    section.querySelectorAll('input, select').forEach((el) => {
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
    const section = pro(makeSection(makeFloatList([
      makeHeader('色調補正'),
      tip(['ガンマ: ', gammaBox],
          'デフォルトは 1.0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。'),
      tip(['輝度オフセット: ', brightnessBox],
          'デフォルトは 0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。'),
      tip(['コントラスト: ', contrastBox, '%'],
          'デフォルトは 100% です。\n空欄にすると、階調が失われない範囲でダイナミックレンジが最大となるように自動調整します。'),
      tip([invertBox.parentNode], '各チャネルの値を大小反転します。'),
    ])));
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
        pro(
            tip(['フォーマット: ', pixelFormatBox],
                'ピクセルフォーマットを指定します。')),
        pro(tip(
            ['丸め方法: ', roundMethodBox],
            'パレットから色を選択する際の戦略を指定します。\nディザリングを行う場合はあまり関係ありません。')),
        tip(['ディザリング: ', colorDitherBox],
            'あえてノイズを加えることでできるだけ元画像の色を再現します。'),
        pro(tip(
            ['透明度のディザ: ', alphaDitherBox],
            'あえてノイズを加えることでできるだけ元画像の透明度を再現します。')),
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

  {
    structCanvas.style.maxWidth = '100%';
    structErrorBox.style.textAlign = 'center';
    structErrorBox.style.color = 'red';
    structErrorBox.style.display = 'none';

    const pCanvas = makeParagraph([structCanvas, structErrorBox]);
    pCanvas.style.textAlign = 'center';

    const section = makeSection([
      makeFloatList([
        makeHeader('エンコード'),
        basic(makeSpan('このフォーマットで生成されます:')),
        pro(
            tip(['パッキング単位: ', packUnitBox],
                'パッキングの単位を指定します。')),
        pro(tip(
            ['パッキング方向: ', packDirBox],
            '複数ピクセルをパッキングする場合に、どの方向にパッキングするかを指定します。\n' +
                '多くの場合横ですが、SSD1306/1309 などの一部の白黒ディスプレイに\n' +
                '直接転送可能なデータを生成する場合は縦を指定してください。')),
        pro(tip(
            ['アドレス方向: ', addressingBox],
            'アドレスのインクリメント方向を指定します。\n通常は水平です。')),
        pro(
            tip(['チャネル順: ', channelOrderBox],
                'RGB のチャネルを並べる順序を指定します。')),
        pro(
            tip(['ピクセル順: ', pixelOrderBox],
                'バイト内のピクセルの順序を指定します。')),
        pro(
            tip(['アライメント境界: ', alignBoundaryBox],
                'アライメントの境界を指定します。')),
        pro(
            tip(['アライメント方向: ', alignDirBox],
                'アライメントの方向を指定します。')),
        pro(
            tip(['バイト順: ', byteOrderBox],
                'ピクセル内のバイトの順序を指定します。')),
      ]),
      pCanvas,
    ]);

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
    codeErrorBox.style.textAlign = 'center';
    codeErrorBox.style.color = 'red';
    codeErrorBox.style.display = 'none';

    const section = makeSection([
      makeFloatList([
        makeHeader('コード生成'),
        tip(['生成範囲: ', codeUnitBox], '生成するコードの範囲を指定します。'),
        tip(['列数: ', codeColsBox], '1 行に詰め込む要素数を指定します。'),
        tip(['インデント: ', indentBox],
            'インデントの形式とサイズを指定します。'),
        copyButton,
      ]),
      codeBox,
      codeErrorBox,
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

  if (window.location.hash === '#detail') {
    showPro();
  } else {
    hidePro();
  }

  // サンプルのロード
  await loadFromString('./img/sample/gradient.png');
}  // main

function showPro() {
  document.querySelectorAll('.professional').forEach((el) => {
    show(el as HTMLElement);
  });
  document.querySelectorAll('.basic').forEach((el) => {
    hide(el as HTMLElement);
  });
  updateTrimCanvas();
}

function hidePro() {
  document.querySelectorAll('.professional').forEach((el) => {
    hide(el as HTMLElement);
  });
  document.querySelectorAll('.basic').forEach((el) => {
    show(el as HTMLElement);
  });
}

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
      show(parentLiOf(scalingMethodBox));
    } else if (widthBox.value) {
      outW = parseInt(widthBox.value);
      outH = Math.ceil(srcH * (outW / srcW));
      hide(parentLiOf(scalingMethodBox));
    } else if (heightBox.value) {
      outH = parseInt(heightBox.value);
      outW = Math.ceil(srcW * (outH / srcH));
      hide(parentLiOf(scalingMethodBox));
    } else {
      if (outW > 256 || outH > 256) {
        const scale = Math.min(256 / outW, 256 / outH);
        outW = Math.floor(outW * scale);
        outH = Math.floor(outH * scale);
      }
      hide(parentLiOf(scalingMethodBox));
    }

    if (outW * outH > 1024 * 1024) {
      throw new Error('Too large image.');
    }

    widthBox.placeholder = '(' + outW + ')';
    heightBox.placeholder = '(' + outH + ')';

    const alphaProc: AlphaProc = parseInt(alphaProcBox.value);
    const alphaThresh = parseInt(alphaThreshBox.value) / 255;

    preModCanvas.width = origCanvas.width;
    preModCanvas.height = origCanvas.height;
    if (alphaProc == AlphaProc.SET_KEY_COLOR) {
      // 抜き色の処理
      const keyCol = hexToRgb(keyColorBox.value);
      const keyR = (keyCol >> 24) & 255;
      const keyG = (keyCol >> 16) & 255;
      const keyB = (keyCol >> 8) & 255;
      const keyTol = parseInt(keyToleranceBox.value);

      const origCtx = origCanvas.getContext('2d', {willReadFrequently: true});
      const origImageData =
          origCtx.getImageData(0, 0, origCanvas.width, origCanvas.height);
      const origData = origImageData.data;

      const modImageData =
          new ImageData(preModCanvas.width, preModCanvas.height);
      const modData = modImageData.data;

      for (let i = 0; i < origData.length; i += 4) {
        const r = origData[i];
        const g = origData[i + 1];
        const b = origData[i + 2];
        let a = origData[i + 3];
        const d = Math.abs(r - keyR) + Math.abs(g - keyG) + Math.abs(b - keyB);
        if (d <= keyTol) {
          a = 0;
        }
        modData[i] = r;
        modData[i + 1] = g;
        modData[i + 2] = b;
        modData[i + 3] = a;
      }

      const origModCtx =
          preModCanvas.getContext('2d', {willReadFrequently: true});
      origModCtx.putImageData(modImageData, 0, 0);
    } else {
      const modCtx = preModCanvas.getContext('2d', {willReadFrequently: true});
      modCtx.clearRect(0, 0, preModCanvas.width, preModCanvas.height);
      modCtx.drawImage(origCanvas, 0, 0);
    }

    // トリミング + リサイズの適用
    {
      const outCtx = previewCanvas.getContext('2d', {willReadFrequently: true});
      previewCanvas.width = outW;
      previewCanvas.height = outH;

      if (alphaProc == AlphaProc.FILL) {
        // 背景色の適用
        outCtx.fillStyle = bgColorBox.value;
        outCtx.fillRect(0, 0, outW, outH);
      }

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
        outCtx.drawImage(
            preModCanvas, trimL, trimT, srcW, srcH, dx, dy, dw, dh);
      }
    }

    const fmt = new PixelFormatInfo(parseInt(pixelFormatBox.value));

    let maxChannelDepth = 0;
    let roundMethod: RoundMethod = RoundMethod.NEAREST;
    for (const depth of fmt.colorBits) {
      if (depth > maxChannelDepth) {
        maxChannelDepth = depth;
      }
    }
    if (maxChannelDepth > 1) {
      show(parentLiOf(roundMethodBox));
      roundMethod = parseInt(roundMethodBox.value);
    } else {
      // 均等割りはチャンネル深度が2以上でないと意味がないので無効化
      hide(parentLiOf(roundMethodBox));
    }

    const norm = new NormalizedImage(outW, outH, fmt.colorBits.length);

    // 量子化の適用
    {
      const previewCtx =
          previewCanvas.getContext('2d', {willReadFrequently: true});
      const previewImageData = previewCtx.getImageData(0, 0, outW, outH);
      const srcRgbData = previewImageData.data;
      const previewData = new Uint8Array(srcRgbData.length);

      const numPixels = outW * outH;
      const numAllCh = fmt.numTotalChannels;
      const numColCh = fmt.numColorChannels;

      let outData = [];
      for (let i = 0; i < numAllCh; i++) {
        outData.push(new Uint8Array(numPixels));
      }

      // 正規化 + 自動ガンマ補正用の値収集
      const HISTOGRAM_SIZE = 16;
      const histogram = new Uint32Array(HISTOGRAM_SIZE);
      for (let i = 0; i < numPixels; i++) {
        const r = srcRgbData[i * 4] / 255;
        const g = srcRgbData[i * 4 + 1] / 255;
        const b = srcRgbData[i * 4 + 2] / 255;
        const a = srcRgbData[i * 4 + 3] / 255;
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        histogram[Math.round(gray * (HISTOGRAM_SIZE - 1))]++;
        switch (fmt.colorSpace) {
          case ColorSpace.GRAYSCALE:
            norm.color[i * numColCh] = gray;
            break;
          case ColorSpace.RGB:
            norm.color[i * numColCh + 0] = r;
            norm.color[i * numColCh + 1] = g;
            norm.color[i * numColCh + 2] = b;
            break;
          default:
            throw new Error('Unknown color space');
        }
        norm.alpha[i] = a;
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
          for (let i = 0; i < norm.color.length; i++) {
            const val = Math.pow(norm.color[i], 1 / gamma);
            norm.color[i] = val;
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
          const [chMin, chMax] = norm.getColorMinMax();
          brightness = 0.5 - (chMin + chMax) / 2;
        }
        brightness = clip(-1, 1, brightness);
        brightnessBox.placeholder = '(' + Math.round(brightness * 255) + ')';
        if (brightness != 0) {
          for (let i = 0; i < norm.color.length; i++) {
            norm.color[i] = clip(0, 1, norm.color[i] + brightness);
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
          const [chMin, chMax] = norm.getColorMinMax();
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
          for (let i = 0; i < norm.color.length; i++) {
            norm.color[i] = clip(0, 1, (norm.color[i] - 0.5) * contrast + 0.5);
          }
        }
      }

      // 階調反転
      if (invertBox.checked) {
        for (let i = 0; i < norm.color.length; i++) {
          norm.color[i] = 1 - norm.color[i];
        }
      }

      // プレビューのアルファチャンネルを初期化
      for (let i = 0; i < numPixels; i++) {
        previewData[i * 4 + 3] = 255;
      }

      // 減色方法の決定
      let minColBits = 999;
      for (const bits of fmt.colorBits) {
        if (bits < minColBits) minColBits = bits;
      }
      const colReduce = (minColBits < 8);
      const alpReduce = fmt.hasAlpha && (fmt.alphaBits < 8);
      const colDither: DitherMethod =
          colReduce ? parseInt(colorDitherBox.value) : DitherMethod.NONE;
      const alpDither: DitherMethod =
          alpReduce ? parseInt(alphaDitherBox.value) : DitherMethod.NONE;
      setVisible(parentLiOf(colorDitherBox), colReduce);
      setVisible(parentLiOf(alphaDitherBox), alpReduce);

      // 量子化
      const colErrDiffuse = colReduce && colDither === DitherMethod.DIFFUSION;
      const alpErrDiffuse = alpReduce && alpDither === DitherMethod.DIFFUSION;
      const colPalette = new Palette(fmt.colorBits, roundMethod);
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
            if (alphaProc == AlphaProc.BINARIZE) {
              alpOut = alpNormIn < alphaThresh ? 0 : alpOutMax;
              alpErr[0] = 0;
            } else {
              alpOut = Math.round(alpNormIn * alpOutMax);
              const alpNormOut = alpOut / alpOutMax;
              alpErr[0] = alpNormIn - alpNormOut;
            }
            transparent = alpOut == 0;
          }

          // パレットから最も近い色を選択
          colPalette.nearest(norm.color, iPix * numColCh, colOut, 0, colErr);

          // 出力
          for (let ch = 0; ch < numColCh; ch++) {
            outData[ch][iPix] = colOut[ch];
          }
          if (fmt.hasAlpha) {
            outData[numColCh][iPix] = alpOut;
          }

          // プレビュー用の色生成
          if (fmt.colorSpace === ColorSpace.GRAYSCALE) {
            const gray = Math.round(colOut[0] * 255 / colPalette.outMax[0]);
            for (let ch = 0; ch < 3; ch++) {
              previewData[iPix * 4 + ch] = gray;
            }
          } else {
            for (let ch = 0; ch < 3; ch++) {
              const outMax = colPalette.outMax[ch];
              previewData[iPix * 4 + ch] =
                  Math.round(colOut[ch] * 255 / outMax);
            }
          }

          // プレビュー用のアルファ生成
          if (fmt.hasAlpha) {
            previewData[iPix * 4 + 3] = Math.round(alpOut * 255 / alpOutMax);
          }

          if (alpErrDiffuse && fmt.hasAlpha) {
            norm.diffuseAlphaError(alpErr, x, y, fwd);
          }

          if (colErrDiffuse && !transparent) {
            // 誤差拡散
            norm.diffuseColorError(colErr, x, y, fwd);
          }
        }  // for ix
      }  // for y

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

function generateCode(): void {
  if (!imageCacheData) {
    codeBox.textContent = '';
    codeBox.style.display = 'block';
    codeErrorBox.style.display = 'none';
    return;
  }

  try {
    const channelData = imageCacheData;
    const fmt = imageCacheFormat;

    const chOrder: ChannelOrder = parseInt(channelOrderBox.value);
    const msb1st = parseInt(pixelOrderBox.value) == PixelOrder.FAR_FIRST;
    const bigEndian = parseInt(byteOrderBox.value) == ByteOrder.BIG_ENDIAN;
    const packUnit: PackUnit = parseInt(packUnitBox.value);
    const vertPack = parseInt(packDirBox.value) == ScanDir.VERTICAL;
    const alignBoundary: AlignBoundary = parseInt(alignBoundaryBox.value);
    const alignLeft = parseInt(alignDirBox.value) == AlignDir.HIGHER;
    const vertAddr = parseInt(addressingBox.value) == ScanDir.VERTICAL;

    const numCh = fmt.numTotalChannels;

    let chMap: Int32Array;
    switch (fmt.colorSpace) {
      case ColorSpace.GRAYSCALE:
        chMap = new Int32Array([0]);
        break;
      case ColorSpace.RGB:
        if (fmt.hasAlpha) {
          switch (chOrder) {
            case ChannelOrder.RGBA:
              chMap = new Int32Array([3, 2, 1, 0]);
              break;
            case ChannelOrder.BGRA:
              chMap = new Int32Array([3, 0, 1, 2]);
              break;
            case ChannelOrder.ARGB:
              chMap = new Int32Array([2, 1, 0, 3]);
              break;
            case ChannelOrder.ABGR:
              chMap = new Int32Array([0, 1, 2, 3]);
              break;
            default:
              throw new Error('Unsupported channel order');
          }
        } else {
          switch (chOrder) {
            case ChannelOrder.RGBA:
            case ChannelOrder.ARGB:
              chMap = new Int32Array([2, 1, 0]);
              break;
            case ChannelOrder.BGRA:
            case ChannelOrder.ABGR:
              chMap = new Int32Array([0, 1, 2]);
              break;
            default:
              throw new Error('Unsupported channel order');
          }
        }
        break;
      default:
        throw new Error('Unsupported color space');
    }

    const chBits = new Int32Array(numCh);
    {
      const tmp = new Int32Array(numCh);
      for (let i = 0; i < fmt.numColorChannels; i++) {
        tmp[i] = fmt.colorBits[i];
      }
      if (fmt.hasAlpha) {
        tmp[fmt.numColorChannels] = fmt.alphaBits;
      }
      for (let i = 0; i < numCh; i++) {
        chBits[i] = tmp[chMap[i]];
      }
    }

    let chPos = new Uint8Array(numCh);  // チャネル毎のビット位置
    let pixelStride = 0;  // ピクセルあたりのビット数 (パディング含む)
    let pixelsPerFrag = 0;  // フラグメントあたりのピクセル数
    let bytesPerFrag = 0;   // フラグメントあたりのバイト数
    let alignRequired = false;
    if (packUnit == PackUnit.UNPACKED) {
      // 一番幅の広いチャネルに合わせてチャネル毎の幅を決定
      let maxChBits = 0;
      for (let i = 0; i < numCh; i++) {
        if (maxChBits < chBits[i]) {
          maxChBits = chBits[i];
        }
      }
      const chStride = Math.ceil(maxChBits / alignBoundary) * alignBoundary;

      // 各チャネルのビット位置を算出
      for (let ch = 0; ch < numCh; ch++) {
        chPos[ch] = ch * chStride;
        alignRequired ||= chStride != chBits[ch];
        if (alignLeft) {
          chPos[ch] += chStride - chBits[ch];
        }
      }

      pixelStride = chStride * numCh;
      bytesPerFrag = Math.ceil(pixelStride / 8);
      pixelsPerFrag = 1;

    } else {
      // 各チャネルのビット位置 (下位詰めの場合)
      let pixBits = 0;
      for (let ch = 0; ch < numCh; ch++) {
        chPos[ch] = pixBits;
        pixBits += chBits[ch];
      }

      switch (packUnit) {
        case PackUnit.PIXEL:
          // ピクセル単位のパッキングの場合
          pixelStride = Math.ceil(pixBits / alignBoundary) * alignBoundary;
          pixelsPerFrag = Math.max(1, Math.floor(8 / pixelStride));
          bytesPerFrag = Math.ceil(pixelStride / 8);
          alignRequired = pixelStride != pixBits;
          if (alignLeft) {
            // 上位詰めの場合はチャネルのビット位置修正
            for (let ch = 0; ch < numCh; ch++) {
              chPos[ch] += pixelStride - pixBits;
            }
          }
          break;

        case PackUnit.MULTI_PIXEL:
          // 複数ピクセルをパッキングする場合
          if (pixBits > alignBoundary / 2) {
            throw new ArrayfyError(
                packUnitBox,
                'アライメント境界の半分より大きなピクセルを複数パッキングできません。',
            );
          }
          pixelStride = pixBits;
          pixelsPerFrag = Math.floor(8 / pixBits);

          const fragBits = pixBits * pixelsPerFrag;
          const fragStride =
              Math.ceil(fragBits / alignBoundary) * alignBoundary;
          bytesPerFrag = Math.ceil(fragStride / 8);
          alignRequired = fragStride != fragBits;
          if (alignLeft) {
            // 上位詰めの場合はチャネルビット位置に下駄を履かせる
            for (let i = 0; i < numCh; i++) {
              chPos[i] += fragStride - fragBits;
            }
          }

          break;

        default:
          throw new Error('Unsupported PackUnit');
      }
    }

    setVisible(parentLiOf(alignDirBox), alignRequired);
    setVisible(parentLiOf(channelOrderBox), numCh > 1);
    setVisible(parentLiOf(pixelOrderBox), pixelsPerFrag > 1);
    setVisible(parentLiOf(packDirBox), pixelsPerFrag > 1);
    setVisible(parentLiOf(byteOrderBox), bytesPerFrag > 1);

    // 構造体の図を描画
    {
      const numCols = bytesPerFrag * 8;
      const numRows = 3;

      const colW = clip(20, 40, Math.round(800 / numCols));
      const rowH = 30;
      const tableW = numCols * colW;
      const tableH = numRows * rowH;

      const pad = 0;

      structCanvas.width = tableW + 1 + pad * 2;
      structCanvas.height = tableH + 1 + pad * 2;
      const ctx = structCanvas.getContext('2d');

      ctx.fillStyle = '#FFF';
      ctx.fillRect(0, 0, structCanvas.width, structCanvas.height);
      ctx.font = '16px sans-serif';

      // 線が滲むの防ぐため半ピクセルオフセット
      ctx.translate(0.5, 0.5);

      ctx.fillStyle = '#888';
      ctx.fillRect(pad, pad + tableH - rowH, tableW, rowH);

      // 縦の罫線
      ctx.strokeStyle = '#000';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= numCols; i++) {
        const x = pad + i * colW;
        ctx.beginPath();
        if (i % 8 == 0) {
          ctx.moveTo(x, pad);
        } else {
          ctx.moveTo(x, pad + rowH);
        }
        ctx.lineTo(x, pad + tableH);
        ctx.stroke();
        if (i < numCols) {
          const iBit = (numCols - 1 - i) % 8;
          ctx.fillText(iBit.toString(), x + colW / 2, pad + rowH + rowH / 2);
          if (iBit == 3) {
            const ib = Math.floor((numCols - 1 - i) / 8);
            const iByte = bigEndian ? (bytesPerFrag - 1 - ib) : ib;
            ctx.fillText('Byte' + iByte.toString(), x, pad + rowH / 2);
          }
        }
      }

      // 横の罫線
      for (let i = 0; i <= numRows; i++) {
        ctx.beginPath();
        ctx.moveTo(pad, pad + i * rowH);
        ctx.moveTo(pad, pad + i * rowH);
        ctx.lineTo(pad + tableW, pad + i * rowH);
        ctx.stroke();
      }

      // 各チャネルの色
      let rgbColors: string[];
      switch (fmt.colorSpace) {
        case ColorSpace.GRAYSCALE:
          rgbColors = ['rgba(255,255,255,0.8)'];
          break;
        case ColorSpace.RGB:
          rgbColors = [
            'rgba(255,128,128,0.8)',
            'rgba(128,255,128,0.8)',
            'rgba(128,160,255,0.8)',
            'rgba(192,128,255,0.8)',
          ];
          break;
        default:
          throw new Error('Unknown color space');
      }

      // チャネルの描画
      for (let ip = 0; ip < pixelsPerFrag; ip++) {
        const iPix = msb1st ? (pixelsPerFrag - 1 - ip) : ip;
        for (let ch = 0; ch < numCh; ch++) {
          const r = pad + tableW - (ip * pixelStride + chPos[ch]) * colW;
          const w = chBits[ch] * colW;
          const x = r - w;
          const y = pad + tableH - rowH;
          ctx.fillStyle = rgbColors[chMap[ch]];
          ctx.fillRect(x, y, w, rowH);

          ctx.strokeStyle = '#000';
          ctx.strokeRect(x, y, w, rowH);

          ctx.fillStyle = '#000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const label =
              fmt.channelName(chMap[ch]) + (pixelsPerFrag > 1 ? iPix : '');
          const mtx = ctx.measureText(label);
          ctx.fillText(label, x + w / 2, y + rowH / 2);
        }
      }
    }

    // エンコードパラメータ
    const fragWidth = vertPack ? 1 : pixelsPerFrag;
    const fragHeight = vertPack ? pixelsPerFrag : 1;
    const width = previewCanvas.width;
    const height = previewCanvas.height;
    const cols = Math.ceil(width / fragWidth);
    const rows = Math.ceil(height / fragHeight);
    const numPacks = cols * rows;

    const arrayData = new Uint8Array(numPacks * bytesPerFrag);
    let iByte = 0;

    // フラグメントループ
    for (let fragIndex = 0; fragIndex < numPacks; fragIndex++) {
      let xCoarse: number, yCoarse: number;
      if (vertAddr) {
        xCoarse = fragWidth * Math.floor(fragIndex / rows);
        yCoarse = fragHeight * (fragIndex % rows);
      } else {
        xCoarse = fragWidth * (fragIndex % cols);
        yCoarse = fragHeight * Math.floor(fragIndex / cols);
      }

      // ピクセルループ
      let fragData = 0;
      let ip = 0;
      for (let yFine = 0; yFine < fragHeight; yFine++) {
        for (let xFine = 0; xFine < fragWidth; xFine++) {
          const x = xCoarse + xFine;
          const y = yCoarse + yFine;

          if (y < height && x < width) {
            // チャネルループ
            const iPix = msb1st ? (pixelsPerFrag - 1 - ip) : ip;
            const pixOffset = pixelStride * iPix;
            for (let ch = 0; ch < numCh; ch++) {
              const chData = channelData[chMap[ch]][y * width + x];
              const shift = pixOffset + chPos[ch];
              fragData |= chData << shift;
            }  // for ch
          }

          ip++;
        }  // for xFine
      }  // for yFine

      // バイト単位に変換
      const fragBits = bytesPerFrag * 8;
      for (let j = 0; j < bytesPerFrag; j++) {
        if (bigEndian) {
          arrayData[iByte++] = (fragData >> (fragBits - 8)) & 0xFF;
          fragData <<= 8;
        } else {
          arrayData[iByte++] = fragData & 0xFF;
          fragData >>= 8;
        }
      }
    }  // for packIndex

    try {
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

      const codeUnit: CodeUnit = parseInt(codeUnitBox.value);

      // コード生成
      let code = '';
      if (codeUnit >= CodeUnit.FILE) {
        code += `#pragma once\n`;
        code += `\n`;
        code += `#include <stdint.h>\n`;
        code += `\n`;
      }

      if (codeUnit >= CodeUnit.ARRAY_DEF) {
        code += `// ${width}x${height}px, ${imageCacheFormat.toString()}\n`;
        code += `// `;
        if (numCh > 1) {
          let chOrderStr = '';
          for (let i = 0; i < numCh; i++) {
            if (i > 0) chOrderStr += ':';
            chOrderStr += fmt.channelName(chMap[numCh - 1 - i]);
          }
          code += chOrderStr + ', ';
        }
        if (pixelsPerFrag > 1) {
          code += (msb1st ? 'MSB' : 'LSB') + ' First, ';
          code += (vertPack ? 'Vertical' : 'Horizontal') + ' Packing, ';
        }
        if (bytesPerFrag > 1) {
          code += (bigEndian ? 'Big' : 'Little') + ' Endian, ';
        }
        code += `${vertAddr ? 'Vertical' : 'Horizontal'} Adressing\n`;
        code += `// ${arrayData.length} Bytes\n`;
        code += 'const uint8_t imageArray[] = {\n';
      }

      for (let i = 0; i < arrayData.length; i++) {
        if (i % arrayCols == 0) code += indent;
        code += '0x' + arrayData[i].toString(16).padStart(2, '0') + ',';
        if ((i + 1) % arrayCols == 0 || i + 1 == arrayData.length) {
          code += '\n';
        } else {
          code += ' ';
        }
      }

      if (codeUnit >= CodeUnit.ARRAY_DEF) {
        code += '};\n';
      }

      codeBox.textContent = code;
      codeBox.style.display = 'block';
      codeErrorBox.style.display = 'none';
    } catch (error) {
      codeBox.style.display = 'none';
      codeErrorBox.textContent = error.message;
      codeErrorBox.style.display = 'block';
    }

    structCanvas.style.display = 'inline-block';
    structErrorBox.style.display = 'none';
  } catch (error) {
    codeBox.textContent = '';
    codeBox.style.display = 'block';
    codeErrorBox.style.display = 'none';
    structCanvas.style.display = 'none';
    structErrorBox.textContent = error.message;
    structErrorBox.style.display = 'block';
  }
}

function clip(min: number, max: number, val: number): number {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}

function hexToRgb(hex: string): number {
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r << 24) | (g << 16) | (b << 8) | 255;
  } else if (hex.length == 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r << 24) | (g << 16) | (b << 8) | 255;
  } else {
    throw new Error('Invalid hex color');
  }
}

document.addEventListener('DOMContentLoaded', async (e) => {
  await main();
});

window.addEventListener('resize', (e) => {
  requestUpdateTrimCanvas();
});
