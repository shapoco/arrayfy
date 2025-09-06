import {ArrayBlob} from './Blobs';
import * as CodeGen from './CodeGen';
import * as Encoder from './Encoder';
import {Point, Rect, Size} from './Geometries';
import {ColorSpace, NormalizedImage, PixelFormat, PixelFormatInfo, ReducedImage} from './Images';
import {DitherMethod, FixedPalette, Palette, RoundMethod} from './Palettes';
import * as Preproc from './Preproc';
import * as Reducer from './Reducer';
import {clip} from './Utils';

const enum TrimState {
  IDLE,
  DRAG_TOP,
  DRAG_RIGHT,
  DRAG_BOTTOM,
  DRAG_LEFT,
}

const enum ChannelOrder {
  RGBA,
  BGRA,
  ARGB,
  ABGR,
}

class StopWatch {
  lastTime: number;
  constructor(public report: boolean) {
    this.lastTime = performance.now();
    this.report = report;
  }

  lap(label: string) {
    const now = performance.now();
    if (this.report) {
      console.log(`${(now - this.lastTime).toFixed(1)} ms: ${label}`);
    }
    this.lastTime = now;
  }
}

class ArrayfyError extends Error {
  constructor(public element: HTMLElement, message: string) {
    super(message);
    this.name = 'ArrayfyError';
  }
}

class Preset {
  public channelOrder = ChannelOrder.ARGB;
  public farPixelFirst = false;
  public bigEndian = false;
  public packUnit = Encoder.PackUnit.PIXEL;
  public vertPack = false;
  public alignBoundary = Encoder.AlignBoundary.BYTE_1;
  public alignLeft = false;
  public vertAddr = false;
  constructor(
      public label: string, public description: string,
      public format: PixelFormat, ops = {}) {
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
      },
      ),
  rgb888_be: new Preset(
      'RGB888-BE',
      'フルカラー。24bit 液晶用。',
      PixelFormat.RGB888,
      {
        channelOrder: ChannelOrder.ARGB,
        bigEndian: true,
      },
      ),
  rgb666_be_ra: new Preset(
      'RGB666-BE-RA',
      '各バイトにチャネルを下位詰めで配置した RGB666。LovyanGFX 用。',
      PixelFormat.RGB666,
      {
        channelOrder: ChannelOrder.ARGB,
        packUnit: Encoder.PackUnit.UNPACKED,
        bigEndian: true,
      },
      ),
  rgb666_be_la: new Preset(
      'RGB666-BE-LA',
      '各バイトにチャネルを上位詰めで配置した RGB666。低レベル API の 18bit モード用。',
      PixelFormat.RGB666,
      {
        channelOrder: ChannelOrder.ARGB,
        packUnit: Encoder.PackUnit.UNPACKED,
        alignLeft: true,
        bigEndian: true,
      },
      ),
  rgb565_be: new Preset(
      'RGB565-BE',
      'ハイカラー。\n各種 GFX ライブラリでの使用を含め、\n組み込み用途で一般的な形式。',
      PixelFormat.RGB565,
      {
        bigEndian: true,
      },
      ),
  rgb444_be: new Preset(
      'RGB444-BE',
      'ST7789 の 12bit モード用の形式。',
      PixelFormat.RGB444,
      {
        packUnit: Encoder.PackUnit.ALIGNMENT,
        farPixelFirst: true,
        bigEndian: true,
        alignBoundary: Encoder.AlignBoundary.BYTE_3,
      },
      ),
  rgb332: new Preset(
      'RGB332',
      '各種 GFX ライブラリ用。',
      PixelFormat.RGB332,
      ),
  rgb111_ra: new Preset(
      'RGB111',
      'ILI9488 の 8 色モード用。',
      PixelFormat.RGB111,
      {
        packUnit: Encoder.PackUnit.ALIGNMENT,
        farPixelFirst: true,
      },
      ),
  bw_hscan: new Preset(
      '白黒 横スキャン',
      '各種 GFX ライブラリ用。',
      PixelFormat.BW,
      {
        packUnit: Encoder.PackUnit.ALIGNMENT,
        farPixelFirst: true,
      },
      ),
  bw_vpack: new Preset(
      '白黒 縦パッキング',
      'SPI/I2C ドライバを使用して\nSSD1306/1309 等の白黒ディスプレイに直接転送するための形式。',
      PixelFormat.BW,
      {
        packUnit: Encoder.PackUnit.ALIGNMENT,
        vertPack: true,
      },
      ),
};

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
  input.style.width = '60px';
  input.style.textAlign = 'right';
  input.maxLength = maxLength;
  input.inputMode = 'decimal';
  input.addEventListener('focus', () => input.select());
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
    parent = parent.parentElement as HTMLElement;
  }
  return parent as HTMLLIElement;
}

function upDown(
    elem: HTMLElement, min: number, max: number, step: number): HTMLElement {
  const upDownButton = makeButton('');
  upDownButton.classList.add('upDown');
  upDownButton.tabIndex = -1;

  const textBox = elem as HTMLInputElement;

  upDownButton.addEventListener('pointermove', (e) => {
    e.preventDefault();
    if (upDownButton.dataset.dragStartY && upDownButton.dataset.dragStartVal) {
      const y = e.offsetY;
      const startY = parseFloat(upDownButton.dataset.dragStartY);
      const startVal = parseFloat(upDownButton.dataset.dragStartVal);

      const n = (max - min) / step;
      let deltaY = Math.round((y - startY) * n / 512);

      let val = clip(min, max, startVal - deltaY * step);
      textBox.value = (Math.round(val * 100) / 100).toString();
      textBox.dispatchEvent(new Event('change'));
    }
  });
  upDownButton.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (trimViewToNextState(e.offsetX, e.offsetY) != TrimState.IDLE) {
      const y = e.offsetY;
      let val: number;
      if (textBox.value.trim()) {
        val = parseFloat(textBox.value.trim());
      } else {
        val = parseFloat(textBox.placeholder.replaceAll(/[\(\)]/g, '').trim());
      }
      val = Math.round(val / step) * step;
      upDownButton.dataset.dragStartY = y.toString();
      upDownButton.dataset.dragStartVal = val.toString();
      upDownButton.style.cursor = 'grabbing';
      upDownButton.setPointerCapture(e.pointerId);
    }
  });
  upDownButton.addEventListener('pointerup', (e) => {
    e.preventDefault();
    delete upDownButton.dataset.dragStartY;
    delete upDownButton.dataset.dragStartVal;
    upDownButton.style.cursor = 'ns-resize';
    upDownButton.releasePointerCapture(e.pointerId);
  });
  upDownButton.addEventListener('touchstart', (e) => e.preventDefault());
  upDownButton.addEventListener('touchmove', (e) => e.preventDefault());
  upDownButton.addEventListener('touchend', (e) => e.preventDefault());

  return makeSpan([textBox, upDownButton]);
}

const dropTarget = document.createElement('div');
const hiddenFileBox = document.createElement('input');
const pasteTarget = document.createElement('input');
const origCanvas = document.createElement('canvas');
const resetTrimButton = makeButton('範囲をリセット');
const alphaProcBox = makeSelectBox(
    [
      {value: Preproc.AlphaProc.KEEP, label: '変更しない'},
      {value: Preproc.AlphaProc.FILL, label: '背景色を指定'},
      {value: Preproc.AlphaProc.BINARIZE, label: '二値化'},
      {value: Preproc.AlphaProc.SET_KEY_COLOR, label: '抜き色指定'},
    ],
    Preproc.AlphaProc.KEEP);
const backColorBox = makeTextBox('#00F');
const keyColorBox = makeTextBox('#00F');
const keyToleranceBox = makeTextBox('0', '(auto)', 5);
const alphaThreshBox = makeTextBox('128', '(auto)', 5);
const trimCanvas = document.createElement('canvas');
const hueBox = makeTextBox('0', '(0)', 4);
const saturationBox = makeTextBox('100', '(100)', 4);
const lightnessBox = makeTextBox('100', '(100)', 4);
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
      {value: PixelFormat.RGB444, label: 'RGB444'},
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
      {value: Preproc.ScalingMethod.ZOOM, label: 'ズーム'},
      {value: Preproc.ScalingMethod.FIT, label: 'フィット'},
      {value: Preproc.ScalingMethod.STRETCH, label: 'ストレッチ'},
    ],
    Preproc.ScalingMethod.ZOOM);
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
const farPixelFirstBox = makeSelectBox(
    [
      {value: 1, label: '上位から'},
      {value: 0, label: '下位から'},
    ],
    1);
const bigEndianBox = makeCheckBox('ビッグエンディアン');
const packUnitBox = makeSelectBox(
    [
      {value: Encoder.PackUnit.UNPACKED, label: 'アンパックド'},
      {value: Encoder.PackUnit.PIXEL, label: '1 ピクセル'},
      {value: Encoder.PackUnit.ALIGNMENT, label: 'アライメント境界'},
    ],
    Encoder.PackUnit.PIXEL);
const vertPackBox = makeCheckBox('縦パッキング');
const alignBoundaryBox = makeSelectBox(
    [
      {value: Encoder.AlignBoundary.NIBBLE, label: 'ニブル'},
      {value: Encoder.AlignBoundary.BYTE_1, label: '1 バイト'},
      {value: Encoder.AlignBoundary.BYTE_2, label: '2 バイト'},
      {value: Encoder.AlignBoundary.BYTE_3, label: '3 バイト'},
      {value: Encoder.AlignBoundary.BYTE_4, label: '4 バイト'},
    ],
    Encoder.AlignBoundary.BYTE_1);
const leftAlignBox = makeCheckBox('左詰め');
const vertAddrBox = makeCheckBox('垂直スキャン');
const structCanvas = document.createElement('canvas');
const structErrorBox = makeParagraph();
const codeUnitBox = makeSelectBox(
    [
      {value: CodeGen.CodeUnit.FILE, label: 'ファイル全体'},
      {value: CodeGen.CodeUnit.ARRAY_DEF, label: '配列定義'},
      {value: CodeGen.CodeUnit.ELEMENTS, label: '要素のみ'},
    ],
    CodeGen.CodeUnit.FILE)
const codeColsBox = makeSelectBox(
    [
      {value: 8, label: '8'},
      {value: 16, label: '16'},
      {value: 32, label: '32'},
    ],
    16);
const indentBox = makeSelectBox(
    [
      {value: CodeGen.Indent.SPACE_X2, label: 'スペース x2'},
      {value: CodeGen.Indent.SPACE_X4, label: 'スペース x4'},
      {value: CodeGen.Indent.TAB, label: 'タブ'},
    ],
    CodeGen.Indent.SPACE_X2);

const codeBox = document.createElement('pre');

const showCodeLink = document.createElement('a');
showCodeLink.href = '#';
showCodeLink.textContent = '表示する';

const codeHiddenBox = makeParagraph([
  '生成されたコードが非常に長いので非表示になっています',
  document.createElement('br'),
  showCodeLink,
]);
codeHiddenBox.classList.add('codeHiddenBox');
codeHiddenBox.style.textAlign = 'center';

showCodeLink.addEventListener('click', (e) => {
  e.preventDefault();
  show(codeBox);
  hide(codeHiddenBox);
});

const codeErrorBox = makeParagraph();
codeErrorBox.style.textAlign = 'center';
codeErrorBox.style.color = 'red';

const copyButton = makeButton('コードをコピー');

let container: HTMLDivElement;

let updateTrimCanvasTimeoutId = -1;
let quantizeTimeoutId = -1;
let generateCodeTimeoutId = -1;

let worldX0 = 0, worldY0 = 0, zoom = 1;
let trimL = 0, trimT = 0, trimR = 1, trimB = 1;

let trimUiState = TrimState.IDLE;

let reducedImage: ReducedImage|null = null;

let trimCanvasWidth = 800;
let trimCanvasHeight = 400;

let previewCanvasWidth = 800;
let previewCanvasHeight = 400;

async function onLoad() {
  container = document.querySelector('#arrayfyContainer') as HTMLDivElement;

  {
    dropTarget.classList.add('dropTarget');
    dropTarget.innerHTML = 'ドロップして読み込む';
    document.body.appendChild(dropTarget);
    hide(dropTarget);

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
            makeSampleImageButton('./img/sample/rgb-chan.png'),
            makeSampleImageButton('./img/sample/rgb-chan-tp.png'),
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
    showProButton.href = '#';

    hideProButton.textContent = '上級者向け設定を隠す';
    hideProButton.href = '#';

    showProButton.addEventListener('click', (e) => {
      e.preventDefault();
      showPro();
      history.replaceState(null, '', '#detail');
    });
    hideProButton.addEventListener('click', (e) => {
      e.preventDefault();
      hidePro();
      history.replaceState(null, '', '#');
    });

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
      tip(['背景色: ', backColorBox],
          '画像の透明部分をこの色で塗り潰して不透明化します。'),
      tip(['キーカラー: ', keyColorBox], '透明にしたい色を指定します。'),
      tip(['許容誤差: ', upDown(keyToleranceBox, 0, 255, 1)],
          'キーカラーからの許容誤差を指定します。'),
      tip(['閾値: ', upDown(alphaThreshBox, 0, 255, 1)],
          '透明にするかどうかの閾値を指定します。'),
    ]))));
    container.appendChild(section);

    alphaProcBox.addEventListener('change', onAlphaProcChanged);
    onAlphaProcChanged();

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
      tip(['色相: ', upDown(hueBox, -360, 360, 5), '°'],
          'デフォルトは 0° です。'),
      tip(['彩度: ', upDown(saturationBox, 0, 200, 1), '%'],
          'デフォルトは 100% です。'),
      tip(['明度: ', upDown(lightnessBox, 0, 200, 1), '%'],
          'デフォルトは 100% です。'),
      tip(['ガンマ: ', upDown(gammaBox, 0.1, 2, 0.1)],
          'デフォルトは 1.0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。'),
      tip(['輝度: ', upDown(brightnessBox, -255, 255, 8)],
          'デフォルトは 0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。'),
      tip(['コントラスト: ', upDown(contrastBox, 0, 200, 1), '%'],
          'デフォルトは 100% です。\n空欄にすると、階調が失われない範囲でダイナミックレンジが最大となるように自動調整します。'),
      tip([invertBox.parentElement], '各チャネルの値を大小反転します。'),
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
      tip(
          [
            upDown(widthBox, 1, 1024, 1),
            ' x ',
            upDown(heightBox, 1, 1024, 1),
            ' px',
          ],
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
    quantizeErrorBox.style.color = 'red';
    hide(previewCanvas);
    hide(quantizeErrorBox);

    const pCanvas = makeParagraph([previewCanvas, quantizeErrorBox]);
    pCanvas.style.height = '400px';
    pCanvas.style.background = '#444';
    pCanvas.style.border = 'solid 1px #444';
    pCanvas.style.textAlign = 'center';
    container.appendChild(pCanvas);

    const section = makeSection([
      makeFloatList([
        makeHeader('減色'),
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
    hide(structErrorBox);

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
            [vertPackBox.parentElement],
            '複数ピクセルをパッキングする場合に、縦方向にパッキングします。\n' +
                'SSD1306/1309 などの一部の白黒ディスプレイに\n' +
                '直接転送可能なデータを生成する場合はチェックします。')),
        pro(
            tip([vertAddrBox.parentElement],
                'アドレスを縦方向にインクリメントする場合にチェックします。')),
        pro(
            tip(['チャネル順: ', channelOrderBox],
                'RGB のチャネルを並べる順序を指定します。')),
        pro(
            tip(['ピクセル順: ', farPixelFirstBox],
                'バイト内のピクセルの順序を指定します。')),
        pro(
            tip(['アライメント境界: ', alignBoundaryBox],
                'アライメントの境界を指定します。')),
        pro(
            tip([leftAlignBox.parentElement],
                'フィールドをアライメント境界内で左詰めします。')),
        pro(
            tip([bigEndianBox.parentElement],
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
    hide(codeHiddenBox);
    hide(codeErrorBox);

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
      codeHiddenBox,
      codeErrorBox,
    ]);

    container.appendChild(section);
    const buttonParent = parentLiOf(copyButton);
    buttonParent.style.float = 'right';
    buttonParent.style.marginRight = '0';
    buttonParent.style.paddingRight = '0';
    buttonParent.style.borderRight = 'none';

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
    if (!e.dataTransfer) return;
    const items = e.dataTransfer.items;
    for (const item of items) {
      if (item.kind === 'file') {
        e.preventDefault();
        e.stopPropagation();
        show(dropTarget);
        break;
      }
    }
  });
  dropTarget.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hide(dropTarget);
  });
  dropTarget.addEventListener('drop', async (e) => {
    if (!e.dataTransfer) return;
    hide(dropTarget);
    const items = e.dataTransfer.items;
    for (const item of items) {
      if (item.kind === 'file') {
        e.preventDefault();
        e.stopPropagation();
        await loadFromFile(item.getAsFile() as File);
        break;
      }
    }
  });

  // 貼り付け
  pasteTarget.addEventListener('paste', async (e) => {
    if (!e.clipboardData) return;
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.kind === 'file') {
        e.preventDefault();
        e.stopPropagation();
        await loadFromFile(item.getAsFile() as File);
        break;
      }
    }
  });
  pasteTarget.addEventListener('input', (e) => {
    e.preventDefault();
    e.stopPropagation();
    pasteTarget.value = '';
  });
  pasteTarget.addEventListener('change', (e) => {
    e.preventDefault();
    e.stopPropagation();
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
      let {x, y} = trimViewToWorld(e.offsetX, e.offsetY);
      x = Math.round(x);
      y = Math.round(y);
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

  onRelayout();
}  // main

function onAlphaProcChanged() {
  hide(parentLiOf(backColorBox));
  hide(parentLiOf(keyColorBox));
  hide(parentLiOf(keyToleranceBox));
  hide(parentLiOf(alphaThreshBox));
  const alphaProc: Preproc.AlphaProc = parseInt(alphaProcBox.value);
  switch (alphaProc) {
    case Preproc.AlphaProc.FILL:
      show(parentLiOf(backColorBox));
      break;
    case Preproc.AlphaProc.SET_KEY_COLOR:
      show(parentLiOf(keyColorBox));
      show(parentLiOf(keyToleranceBox));
      break;
    case Preproc.AlphaProc.BINARIZE:
      show(parentLiOf(alphaThreshBox));
      break;
  }
}

function showPro(): void {
  document.querySelectorAll('.professional').forEach((el) => {
    show(el as HTMLElement);
    onRelayout();
  });
  document.querySelectorAll('.basic').forEach((el) => {
    hide(el as HTMLElement);
    onRelayout();
  });
  updateTrimCanvas();
}

function hidePro(): void {
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
      if (e.target && typeof e.target.result === 'string') {
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
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.clearRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      resetTrim();
      convert();
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
  trimCanvas.width = trimCanvasWidth - 2;
  trimCanvas.height = trimCanvasHeight - 2;

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
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  ctx.clearRect(0, 0, canvasW, canvasH);

  // 画像描画
  {
    const dx = view.x - worldX0 * zoom;
    const dy = view.y - worldY0 * zoom;
    const dw = origCanvas.width * zoom;
    const dh = origCanvas.height * zoom;

    ctx.imageSmoothingEnabled = zoom < 3;
    ctx.drawImage(origCanvas, dx, dy, dw, dh);
    ctx.imageSmoothingEnabled = true;
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
  farPixelFirstBox.value = preset.farPixelFirst ? '1' : '0';
  bigEndianBox.checked = preset.bigEndian;
  packUnitBox.value = preset.packUnit.toString();
  vertPackBox.checked = preset.vertPack;
  alignBoundaryBox.value = preset.alignBoundary.toString();
  leftAlignBox.checked = preset.alignLeft;
  vertAddrBox.checked = preset.vertAddr;
  requestQuantize();
}

function requestQuantize(): void {
  if (quantizeTimeoutId >= 0) return;
  quantizeTimeoutId = setTimeout(() => {
    convert();
  }, 100);
}

function convert(): void {
  reducedImage = null;

  if (quantizeTimeoutId >= 0) {
    clearTimeout(quantizeTimeoutId);
    quantizeTimeoutId = -1;
  }

  const swDetail = new StopWatch(false);

  try {
    let outW = -1, outH = -1;
    let norm: NormalizedImage;

    const fmt = new PixelFormatInfo(parseInt(pixelFormatBox.value));

    // 前処理
    {
      let args = new Preproc.Args();
      args.colorSpace = fmt.colorSpace;

      // 入力画像の配列化
      {
        const srcW = origCanvas.width;
        const srcH = origCanvas.height;
        args.srcSize.width = srcW;
        args.srcSize.height = srcH;

        const origCtx = origCanvas.getContext('2d', {willReadFrequently: true});
        if (!origCtx) throw new Error('Failed to get canvas context');
        const origImageData = origCtx.getImageData(0, 0, srcW, srcH);

        const origData = new Uint8Array(srcW * srcH * 4);
        for (let i = 0; i < origImageData.data.length; i++) {
          origData[i] = origImageData.data[i];
        }
        args.srcData = origData;
      }

      // トリミング範囲と出力サイズの決定
      {
        const trimW = Math.round(trimR - trimL);
        const trimH = Math.round(trimB - trimT);
        outW = trimW;
        outH = trimH;

        // 出力サイズ決定
        if (widthBox.value && heightBox.value) {
          outW = parseInt(widthBox.value);
          outH = parseInt(heightBox.value);
          show(parentLiOf(scalingMethodBox));
        } else if (widthBox.value) {
          outW = parseInt(widthBox.value);
          outH = Math.max(1, Math.round(trimH * (outW / trimW)));
          hide(parentLiOf(scalingMethodBox));
        } else if (heightBox.value) {
          outH = parseInt(heightBox.value);
          outW = Math.max(1, Math.round(trimW * (outH / trimH)));
          hide(parentLiOf(scalingMethodBox));
        } else {
          if (outW > 256 || outH > 256) {
            const scale = Math.min(256 / outW, 256 / outH);
            outW = Math.floor(outW * scale);
            outH = Math.floor(outH * scale);
          }
          hide(parentLiOf(scalingMethodBox));
        }

        if (outW < 1 || outH < 1) {
          throw new Error('サイズは正の値で指定してください');
        }
        if (outW * outH > 1024 * 1024) {
          throw new Error('画像が大きすぎます');
        }

        widthBox.placeholder = '(' + outW + ')';
        heightBox.placeholder = '(' + outH + ')';

        args.trimRect.x = trimL;
        args.trimRect.y = trimT;
        args.trimRect.width = trimW;
        args.trimRect.height = trimH;

        args.outSize.width = outW;
        args.outSize.height = outH;

        args.scalingMethod = parseInt(scalingMethodBox.value);
      }

      // 画像補正系のパラメータ決定
      {
        args.alphaProc = parseInt(alphaProcBox.value);
        args.alphaThresh = parseInt(alphaThreshBox.value);
        if (keyColorBox.value) {
          args.keyColor = hexToRgb(keyColorBox.value);
        }
        if (keyToleranceBox.value) {
          args.keyTolerance = parseInt(keyToleranceBox.value);
        }
        if (backColorBox.value) {
          args.backColor = hexToRgb(backColorBox.value);
        }
        if (hueBox.value && fmt.numColorChannels > 1) {
          args.hue = parseFloat(hueBox.value) / 360;
        }
        if (saturationBox.value && fmt.numColorChannels > 1) {
          args.saturation = parseFloat(saturationBox.value) / 100;
        }
        if (lightnessBox.value) {
          args.lightness = parseFloat(lightnessBox.value) / 100;
        }
        if (gammaBox.value) {
          args.gamma.automatic = false;
          args.gamma.value = parseFloat(gammaBox.value);
        }
        if (brightnessBox.value) {
          args.brightness.automatic = false;
          args.brightness.value = parseFloat(brightnessBox.value) / 255;
        }
        if (contrastBox.value) {
          args.contrast.automatic = false;
          args.contrast.value = parseFloat(contrastBox.value) / 100;
        }
        args.invert = invertBox.checked;
      }

      setVisible(parentLiOf(hueBox), fmt.numColorChannels > 1);
      setVisible(parentLiOf(saturationBox), fmt.numColorChannels > 1);

      // 前処理実行
      Preproc.process(args);
      norm = args.outImage;

      // 自動決定されたパラメータをプレースホルダに反映
      gammaBox.placeholder = `(${args.gamma.value.toFixed(2)})`;
      brightnessBox.placeholder =
          `(${Math.round(args.brightness.value * 255)})`;
      contrastBox.placeholder = `(${Math.round(args.contrast.value * 100)})`;
    }

    // 減色の適用
    {
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


      const numPixels = outW * outH;
      const numAllCh = fmt.numTotalChannels;
      const numColCh = fmt.numColorChannels;


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

      const palette = new FixedPalette(fmt.colorBits, roundMethod);

      // 減色
      const args = new Reducer.Arguments();
      args.src = norm;
      args.format = fmt;
      args.palette = palette;
      args.colorDitherMethod = colDither;
      args.alphaDitherMethod = alpDither;

      Reducer.reduce(args);

      reducedImage = args.output;

      swDetail.lap('Quantization');

      // プレビューの作成
      {
        const previewData = new Uint8Array(numPixels * 4);
        reducedImage.getPreviewImage(previewData);

        previewCanvas.width = outW;
        previewCanvas.height = outH;
        const ctx = previewCanvas.getContext('2d', {willReadFrequently: true});
        if (!ctx) throw new Error('Failed to get canvas context');
        const previewImageData = ctx.getImageData(0, 0, outW, outH);
        previewImageData.data.set(previewData);
        ctx.putImageData(previewImageData, 0, 0);
      }

      show(previewCanvas);
      hide(quantizeErrorBox);

      swDetail.lap('Update Preview');

      generateCode();

      swDetail.lap('Entire Code Generation');
    }

    // 小さい画像はプレビューを大きく表示
    {
      const borderWidth = 1;
      const viewW = previewCanvasWidth - (borderWidth * 2);
      const viewH = previewCanvasHeight - (borderWidth * 2);
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

    swDetail.lap('Fix Preview Size');

  } catch (error) {
    hide(previewCanvas);
    hide(codeBox);
    hide(codeHiddenBox);
    show(quantizeErrorBox);
    let e: Error;

    quantizeErrorBox.textContent = `${error.stack}`;
  }
}

function requestGenerateCode(): void {
  if (generateCodeTimeoutId !== -1) {
    clearTimeout(generateCodeTimeoutId);
  }
  generateCodeTimeoutId = setTimeout(() => {
    generateCode();
    generateCodeTimeoutId = -1;
  }, 100);
}

function generateCode(): void {
  const swDetail = new StopWatch(false);

  if (!reducedImage) {
    codeBox.textContent = '';
    show(codeBox);
    hide(codeHiddenBox);
    hide(codeErrorBox);
    return;
  }
  let blobs: ArrayBlob[] = [];


  try {
    const args = new Encoder.ImageArgs();
    args.src = reducedImage;
    const chOrder: ChannelOrder = parseInt(channelOrderBox.value);
    switch (chOrder) {
      case ChannelOrder.RGBA:
        args.alphaFirst = true;
        args.colorDescending = true;
        break;
      case ChannelOrder.BGRA:
        args.alphaFirst = true;
        args.colorDescending = false;
        break;
      case ChannelOrder.ARGB:
        args.alphaFirst = false;
        args.colorDescending = true;
        break;
      case ChannelOrder.ABGR:
        args.alphaFirst = false;
        args.colorDescending = false;
        break;
      default:
        throw new Error('Unsupported channel order');
    }
    const plane = new Encoder.PlaneArgs();
    plane.farPixelFirst = parseInt(farPixelFirstBox.value) == 1;
    plane.bigEndian = bigEndianBox.checked;
    plane.packUnit = parseInt(packUnitBox.value);
    plane.vertPack = vertPackBox.checked;
    plane.alignBoundary = parseInt(alignBoundaryBox.value);
    plane.alignLeft = leftAlignBox.checked;
    plane.vertAddr = vertAddrBox.checked;
    args.planes.push(plane);

    Encoder.encode(args);

    for (const plane of args.planes) {
      blobs.push(plane.output.blob);
    }

    setVisible(parentLiOf(leftAlignBox), plane.output.alignRequired);
    setVisible(parentLiOf(channelOrderBox), plane.output.fields.length > 1);
    setVisible(parentLiOf(farPixelFirstBox), plane.output.pixelsPerFrag > 1);
    setVisible(parentLiOf(vertPackBox), plane.output.pixelsPerFrag > 1);
    setVisible(parentLiOf(bigEndianBox), plane.output.bytesPerFrag > 1);
    {
      const fmt = args.src.format;
      const out = plane.output;
      const numCh = out.fields.length;

      const numCols = out.bytesPerFrag * 8;
      const numRows = 3;

      const colW = clip(20, 40, Math.round(800 / numCols));
      const rowH = 30;
      const tableW = numCols * colW;
      const tableH = numRows * rowH;

      const pad = 0;

      structCanvas.width = tableW + 1 + pad * 2;
      structCanvas.height = tableH + 1 + pad * 2;
      const ctx = structCanvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

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
            const iByte = plane.bigEndian ? (out.bytesPerFrag - 1 - ib) : ib;
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
      for (let ip = 0; ip < out.pixelsPerFrag; ip++) {
        const iPix = plane.farPixelFirst ? (out.pixelsPerFrag - 1 - ip) : ip;
        for (const field of out.fields) {
          const r = pad + tableW - (ip * out.pixelStride + field.pos) * colW;
          const w = field.width * colW;
          const x = r - w;
          const y = pad + tableH - rowH;
          ctx.fillStyle = rgbColors[field.srcChannel];
          ctx.fillRect(x, y, w, rowH);

          ctx.strokeStyle = '#000';
          ctx.strokeRect(x, y, w, rowH);

          ctx.fillStyle = '#000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const label = fmt.channelName(field.srcChannel) +
              (out.pixelsPerFrag > 1 ? iPix : '');
          const mtx = ctx.measureText(label);
          ctx.fillText(label, x + w / 2, y + rowH / 2);
        }
      }
    }
    show(structCanvas);
    hide(structErrorBox);
  } catch (error) {
    hide(structCanvas);
    show(structErrorBox);
    structErrorBox.textContent = `${error.stack}`;
    codeBox.textContent = '';
    show(codeBox);
    hide(codeHiddenBox);
    hide(codeErrorBox);
    return;
  }

  try {
    const args = new CodeGen.Args();
    args.src = reducedImage;
    args.blobs = blobs;
    args.codeUnit = parseInt(codeUnitBox.value);
    args.indent = parseInt(indentBox.value);
    args.arrayCols = Math.max(1, parseInt(codeColsBox.value));

    CodeGen.generate(args);

    const code = args.codes[0];

    codeBox.textContent = code.code;
    if (code.numLines < 1000) {
      show(codeBox);
      hide(codeHiddenBox);
    } else {
      showCodeLink.textContent = `表示する (${code.numLines} 行)`;
      hide(codeBox);
      show(codeHiddenBox);
    }

    hide(codeErrorBox);
  } catch (error) {
    codeErrorBox.textContent = `${error.stack}`;
    codeBox.textContent = '';
    show(codeBox);
    hide(codeHiddenBox);
    hide(codeErrorBox);
  }

  swDetail.lap('UI Update');
}

function hexToRgb(hex: string): number {
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return r | (g << 8) | (b << 16);
  } else if (hex.length == 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return r | (g << 8) | (b << 16);
  } else {
    throw new Error('Invalid hex color');
  }
}

function onRelayout() {
  {
    const rect = trimCanvas.getBoundingClientRect();
    trimCanvasWidth = rect.width;
    trimCanvasHeight = rect.height;
  }
  {
    const canvasParent = previewCanvas.parentElement as HTMLElement;
    const rect = canvasParent.getBoundingClientRect();
    previewCanvasWidth = rect.width;
    previewCanvasHeight = rect.height;
  }
  requestUpdateTrimCanvas();
}

export function main() {
  document.addEventListener('DOMContentLoaded', async (e) => {
    await onLoad();
  });

  window.addEventListener('resize', (e) => onRelayout());
}