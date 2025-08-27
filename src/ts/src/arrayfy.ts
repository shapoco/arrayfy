
enum TrimState {
  IDLE = 0,
  DRAG_TOP = 1,
  DRAG_RIGHT = 2,
  DRAG_BOTTOM = 3,
  DRAG_LEFT = 4,
}

enum ColorSpace {
  GRAYSCALE = 0,
  RGB = 1,
}

class ImageFormat {
  public colorSpace: ColorSpace;
  public channelDepth: number[];

  constructor() {
    this.colorSpace = ColorSpace.GRAYSCALE;
    this.channelDepth = [1];
  }

  toString(): string {
    let ret = '';
    switch (this.colorSpace) {
      case ColorSpace.GRAYSCALE:
        if (this.channelDepth[0] == 1) {
          return 'B/W';
        } else {
          return 'Gray' + this.channelDepth[0];
        }
      case ColorSpace.RGB:
        return 'RGB' + this.channelDepth.join('');
      default:
        throw new Error('Unknown color space');
    }
  }
}

class Point {
  constructor(public x: number, public y: number) {}
}

class Rect {
  constructor(
      public x: number, public y: number, public width: number,
      public height: number) {}
}


function toElementArray(children = []): HTMLElement[] {
  for (let i = 0; i < children.length; i++) {
    if (typeof children[i] === 'string') {
      children[i] = document.createTextNode(children[i]);
    }
  }
  return children;
}

function makeHeader(text: string): HTMLHeadingElement {
  const h = document.createElement('h3');
  h.textContent = text;
  return h;
}

function makeParagraph(children = []): HTMLParagraphElement {
  const p = document.createElement('p');
  toElementArray(children).forEach(child => p.appendChild(child));
  return p;
}

function makePropertyContainer(children = []): HTMLSpanElement {
  const span = document.createElement('span');
  span.classList.add('propertyContainer');
  toElementArray(children).forEach(child => span.appendChild(child));
  return span;
}

function makeSectionLabel(text: string): HTMLSpanElement {
  const span = makePropertyContainer([text]);
  span.style.width = '100px';
  span.style.borderStyle = 'none';
  span.style.borderRadius = '5px';
  span.style.padding = '0px';
  span.style.background = '#eee';
  span.style.textAlign = 'center';
  span.style.fontWeight = 'bold';
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
    dict: Record<string, string> = {}, defaultValue = ''): HTMLSelectElement {
  const select = document.createElement('select');
  for (const [value, label] of Object.entries(dict)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }
  select.value = defaultValue;
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

function makePresetButton(
    name: string, text: string, description: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.dataset.presetName = name;
  button.classList.add('presetButton');
  const img = document.createElement('img');
  img.src = `img/preset/${name}.svg`;
  const span = document.createElement('span');
  span.textContent = description;
  span.style.fontSize = 'smaller';
  button.appendChild(img);
  button.appendChild(document.createElement('br'))
  button.appendChild(document.createTextNode(text));
  button.appendChild(document.createElement('br'))
  button.appendChild(span);

  button.addEventListener('click', () => {
    loadPreset(name);
  });

  return button;
}

const dropTarget = document.createElement('div');
const hiddenFileBox = document.createElement('input');
const pasteTarget = document.createElement('input');
const origCanvas = document.createElement('canvas');
const bgColorBox = makeTextBox('#000');
const resetTrimButton = makeButton('範囲をリセット');
const trimCanvas = document.createElement('canvas');
const gammaBox = makeTextBox('100', '(auto)', 5);
const brightnessBox = makeTextBox('0', '(auto)', 5);
const contrastBox = makeTextBox('100', '(auto)', 5);
const invertBox = makeCheckBox('階調反転');
const presetRgb565Be =
    makePresetButton('rgb565_be', 'RGB565-BE', '各種 16bit カラー液晶');
const presetRgb332 =
    makePresetButton('rgb332', 'RGB332', '各種 GFX ライブラリ');
const presetBwVpLf =
    makePresetButton('bw_vp_lf', '白黒 縦パッキング', 'SSD1306/1309, 他...');
const presetBwHpMf =
    makePresetButton('bw_hp_mf', '白黒 横パッキング', 'SHARPメモリ液晶, 他...');
const formatBox = makeSelectBox(
    {
      rgb565: 'RGB565',
      rgb555: 'RGB555',
      rgb332: 'RGB332',
      rgb111: 'RGB111',
      gray4: 'Gray4',
      gray2: 'Gray2',
      bw: 'B/W',
    },
    'rgb565');
const widthBox = makeTextBox('', '(auto)', 4);
const heightBox = makeTextBox('', '(auto)', 4);
const scalingMethodBox = makeSelectBox(
    {
      zoom: 'ズーム',
      fit: 'フィット',
      stretch: 'ストレッチ',
    },
    'zoom');
const ditherBox = makeSelectBox(
    {
      none: 'なし',
      diffusion: '誤差拡散',
    },
    'diffusion');
const roundMethodBox = makeSelectBox(
    {
      nearest: '最も近い輝度',
      equalDivision: '均等割り',
    },
    'nearest');
const previewCanvas = document.createElement('canvas');
const quantizeErrorBox = document.createElement('span');
const channelOrderBox = makeSelectBox(
    {
      lsbRed: '下位から',
      msbRed: '上位から',
    },
    'msbRed');
const pixelOrderBox = makeSelectBox(
    {
      lsb1st: '下位から',
      msb1st: '上位から',
    },
    'msb1st');
const byteOrderBox = makeSelectBox(
    {
      le: 'Little Endian',
      be: 'Big Endian',
    },
    'be');
const packingBox = makeSelectBox(
    {
      hori: '横',
      vert: '縦',
    },
    'hori');
const addressingBox = makeSelectBox(
    {
      hori: '水平',
      vert: '垂直',
    },
    'hori');
const codeColsBox = makeSelectBox(
    {
      '8': '8',
      '16': '16',
      '32': '32',
    },
    '16');
const indentBox = makeSelectBox(
    {
      sp2: 'スペース x2',
      sp4: 'スペース x4',
      tab: 'タブ',
    },
    'sp2');
const arrayCode = document.createElement('pre');
const codeGenErrorBox = document.createElement('p');
const copyButton = makeButton('コードをコピー');

let container: HTMLDivElement = null;

let updateTrimCanvasTimeoutId = -1;
let quantizeTimeoutId = -1;
let generateCodeTimeoutId = -1;

let worldX0 = 0, worldY0 = 0, zoom = 1;
let trimL = 0, trimT = 0, trimR = 1, trimB = 1;

let trimUiState = TrimState.IDLE;

let imageCacheFormat = new ImageFormat();
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
    const fileBrowseButton = makeButton('選択');
    fileBrowseButton.addEventListener('click', () => {
      hiddenFileBox.click();
    });

    pasteTarget.type = 'text';
    pasteTarget.style.textAlign = 'center';
    pasteTarget.style.width = '8em';
    pasteTarget.placeholder = 'ここに貼り付け';

    container.appendChild(makeParagraph([
      makeSectionLabel('入力画像'),
      '画像をドロップ、または ',
      pasteTarget,
      ' または ',
      fileBrowseButton,
    ]));
  }

  {
    const p = makeParagraph([
      makeSectionLabel('プリセット'),
      '選んでください: ',
      document.createElement('br'),
      presetRgb565Be,
      presetRgb332,
      presetBwVpLf,
      presetBwHpMf,
    ]);
    container.appendChild(p);
  }

  {
    const p = makeParagraph([
      makeSectionLabel('トリミング'),
      makePropertyContainer([resetTrimButton]),
    ]);
    container.appendChild(p);
  }

  {
    trimCanvas.style.width = '100%';
    trimCanvas.style.height = '400px';
    trimCanvas.style.boxSizing = 'border-box';
    trimCanvas.style.border = 'solid 1px #444';
    trimCanvas.style.backgroundImage = 'url(./img/checker.png)';
    const p = makeParagraph([trimCanvas]);
    p.style.textAlign = 'center';
    container.appendChild(p);
  }

  {
    const p = makeParagraph([
      makeSectionLabel('透過色'),
      makePropertyContainer(['塗りつぶす: ', bgColorBox]),
    ]);
    container.appendChild(p);

    p.querySelectorAll('input, button').forEach((el) => {
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
    const p = makeParagraph([
      makeSectionLabel('色調補正'),
      makePropertyContainer(['ガンマ: ', gammaBox, '%']),
      makePropertyContainer(['輝度オフセット: ', brightnessBox]),
      makePropertyContainer(['コントラスト: ', contrastBox, '%']),
      makePropertyContainer([invertBox.parentNode]),
    ]);
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
    const p = makeParagraph([
      makeSectionLabel('出力サイズ'),
      makePropertyContainer([widthBox, ' x ', heightBox, ' px']),
      makePropertyContainer(['拡縮方法: ', scalingMethodBox]),
    ]);
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
    const p = makeParagraph([
      makeSectionLabel('量子化'),
      makePropertyContainer(['フォーマット: ', formatBox]),
      makePropertyContainer(['丸め方法: ', roundMethodBox]),
      makePropertyContainer(['ディザリング: ', ditherBox]),
    ]);
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
    previewCanvas.style.backgroundImage = 'url(./img/checker.png)';
    previewCanvas.style.display = 'none';
    quantizeErrorBox.style.color = 'red';
    quantizeErrorBox.style.display = 'none';
    const p = makeParagraph([previewCanvas, quantizeErrorBox]);
    p.style.height = '400px';
    p.style.background = '#444';
    p.style.border = 'solid 1px #444';
    p.style.textAlign = 'center';
    container.appendChild(p);
  }

  {
    const p = makeParagraph([
      makeSectionLabel('エンコード'),
      makePropertyContainer(['チャネル順: ', channelOrderBox]),
      makePropertyContainer(['ピクセル順: ', pixelOrderBox]),
      makePropertyContainer(['バイト順: ', byteOrderBox]),
      makePropertyContainer(['パッキング方向: ', packingBox]),
      makePropertyContainer(['アドレス方向: ', addressingBox]),
    ]);

    container.appendChild(p);

    p.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', () => {
        requestGenerateCode();
      });
      el.addEventListener('input', () => {
        requestGenerateCode();
      });
    });
  }

  {
    const p = makeParagraph([
      makeSectionLabel('コード生成'),
      makePropertyContainer(['列数: ', codeColsBox]),
      makePropertyContainer(['インデント: ', indentBox])
    ]);

    container.appendChild(p);

    p.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', () => {
        requestGenerateCode();
      });
      el.addEventListener('input', () => {
        requestGenerateCode();
      });
    });
  }

  {
    const p = makeParagraph([copyButton]);
    p.style.textAlign = 'right';
    container.appendChild(p);
  }

  {
    const div = document.createElement('div');
    arrayCode.id = 'arrayCode';
    arrayCode.classList.add('lang_cpp');
    div.appendChild(arrayCode);
    codeGenErrorBox.style.textAlign = 'center';
    codeGenErrorBox.style.color = 'red';
    codeGenErrorBox.style.display = 'none';
    div.appendChild(codeGenErrorBox);
    container.appendChild(div);
  }

  // ファイル選択
  hiddenFileBox.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      loadFile(input.files[0]);
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
  dropTarget.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropTarget.style.display = 'none';
    const items = e.dataTransfer.items;
    for (const item of items) {
      if (item.kind === 'file') {
        loadFile(item.getAsFile());
        break;
      }
    }
  });

  // 貼り付け
  pasteTarget.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.kind === 'file') {
        loadFile(item.getAsFile());
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
    if (!arrayCode.textContent) return;
    navigator.clipboard.writeText(arrayCode.textContent);
  });
}  // main

function loadFile(file: File): void {
  const reader = new FileReader();
  reader.onload = (event) => {
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
    };
    if (typeof event.target.result === 'string') {
      img.src = event.target.result;
    } else {
      throw new Error('Invalid image data');
    }
  };
  reader.readAsDataURL(file);
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
  return new Rect(viewX0, viewY0, viewW, viewH);
}

// トリミングUIのワールド座標をビュー座標に変換
function trimWorldToView(x: number, y: number): Point {
  const view = getTrimViewArea();
  return new Point(
      view.x + (x - worldX0) * zoom, view.y + (y - worldY0) * zoom);
}

// トリミングUIのビュー座標をワールド座標に変換
function trimViewToWorld(x: number, y: number): Point {
  const view = getTrimViewArea();
  return new Point(
      (x - view.x) / zoom + worldX0, (y - view.y) / zoom + worldY0);
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
    const worldL = Math.min(trimL, 0);
    const worldR = Math.max(trimR, origW);
    const worldT = Math.min(trimT, 0);
    const worldB = Math.max(trimB, origH);
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

function loadPreset(name: string): void {
  const PRESETS: Record<string, Record<string, string>> = {
    rgb565_be:
        {fmt: 'rgb565', chOrder: 'msbRed', byteOrder: 'be', addrDir: 'hori'},
    rgb332: {fmt: 'rgb332', chOrder: 'msbRed', addrDir: 'hori'},
    bw_vp_lf: {fmt: 'bw', pixOrder: 'lsb1st', packDir: 'vert', addrDir: 'hori'},
    bw_hp_mf: {fmt: 'bw', pixOrder: 'msb1st', packDir: 'hori', addrDir: 'hori'},
  };
  if (!(name in PRESETS)) {
    throw new Error(`Unknown preset: ${name}`);
  }
  for (const [key, value] of Object.entries(PRESETS[name])) {
    switch (key) {
      case 'fmt':
        formatBox.value = value;
        break;
      case 'chOrder':
        channelOrderBox.value = value;
        break;
      case 'pixOrder':
        pixelOrderBox.value = value;
        break;
      case 'byteOrder':
        byteOrderBox.value = value;
        break;
      case 'packDir':
        packingBox.value = value;
        break;
      case 'addrDir':
        addressingBox.value = value;
        break;
      default:
        throw new Error(`Unknown key: ${key}`);
    }
  }
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
      widthBox.placeholder = '';
      heightBox.placeholder = '';
      scalingMethodBox.disabled = false;
    } else if (widthBox.value) {
      outW = parseInt(widthBox.value);
      outH = Math.ceil(srcH * (outW / srcW));
      widthBox.placeholder = '';
      heightBox.placeholder = '(' + outH + ')';
      scalingMethodBox.disabled = true;
    } else if (heightBox.value) {
      outH = parseInt(heightBox.value);
      outW = Math.ceil(srcW * (outH / srcH));
      widthBox.placeholder = '(' + outW + ')';
      heightBox.placeholder = '';
      scalingMethodBox.disabled = true;
    } else {
      if (outW > 256 || outH > 256) {
        const scale = Math.min(256 / outW, 256 / outH);
        outW = Math.floor(outW * scale);
        outH = Math.floor(outH * scale);
      }
      widthBox.placeholder = '(' + outW + ')';
      heightBox.placeholder = '(' + outH + ')';
      scalingMethodBox.disabled = true;
    }

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
        switch (scalingMethodBox.value) {
          case 'zoom':
            if (srcAspect > outAspect) {
              scaleX = scaleY = outH / srcH;
            } else {
              scaleX = scaleY = outW / srcW;
            }
            break;
          case 'fit':
            if (srcAspect > outAspect) {
              scaleX = scaleY = outW / srcW;
            } else {
              scaleX = scaleY = outH / srcH;
            }
            break;
          case 'stretch':
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

    const fmt = new ImageFormat();
    switch (formatBox.value) {
      case 'rgb565':
        fmt.colorSpace = ColorSpace.RGB;
        fmt.channelDepth = [5, 6, 5];
        break;
      case 'rgb555':
        fmt.colorSpace = ColorSpace.RGB;
        fmt.channelDepth = [5, 5, 5];
        break;
      case 'rgb332':
        fmt.colorSpace = ColorSpace.RGB;
        fmt.channelDepth = [3, 3, 2];
        break;
      case 'rgb111':
        fmt.colorSpace = ColorSpace.RGB;
        fmt.channelDepth = [1, 1, 1];
        break;
      case 'gray4':
        fmt.colorSpace = ColorSpace.GRAYSCALE;
        fmt.channelDepth = [4];
        break;
      case 'gray2':
        fmt.colorSpace = ColorSpace.GRAYSCALE;
        fmt.channelDepth = [2];
        break;
      case 'bw':
        fmt.colorSpace = ColorSpace.GRAYSCALE;
        fmt.channelDepth = [1];
        break;
      default:
        throw new Error('Unknown image format');
    }

    // 均等割りはチャンネル深度が2以上でないと意味がないので無効化
    let maxChannelDepth = 0;
    for (const depth of fmt.channelDepth) {
      if (depth > maxChannelDepth) {
        maxChannelDepth = depth;
      }
    }
    roundMethodBox.disabled = (maxChannelDepth <= 1);

    // 量子化の適用
    {
      const previewCtx =
          previewCanvas.getContext('2d', {willReadFrequently: true});
      const previewImageData = previewCtx.getImageData(0, 0, outW, outH);
      const srcRgbData = previewImageData.data;
      const previewData = new Uint8Array(srcRgbData.length);

      const numPixels = outW * outH;
      const numChannels = fmt.colorSpace === ColorSpace.GRAYSCALE ? 1 : 3;

      let normChannels = [];
      let outData = [];
      for (let i = 0; i < numChannels; i++) {
        normChannels.push(new Float32Array(numPixels));
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
            normChannels[0][i] = gray;
            break;
          case ColorSpace.RGB:
            normChannels[0][i] = r;
            normChannels[1][i] = g;
            normChannels[2][i] = b;
            break;
          default:
            throw new Error('Unknown color space');
        }
      }

      // 輝度自動補正用の値収集
      let chMin = 1;
      let chMax = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        for (let i = 0; i < numPixels; i++) {
          const val = normChannels[ch][i];
          if (val < chMin) chMin = val;
          if (val > chMax) chMax = val;
        }
      }

      // ガンマ補正
      let gamma = 1;
      if (gammaBox.value) {
        gamma = parseFloat(gammaBox.value) / 100;
        gammaBox.placeholder = '';
      } else {
        gamma = correctGamma(histogram);
      }
      gamma = clip(0.01, 5, gamma);
      gammaBox.placeholder = '(' + Math.round(gamma * 100) + ')';
      if (gamma != 1) {
        chMin = 255;
        chMax = 0;
        for (let ch = 0; ch < numChannels; ch++) {
          for (let i = 0; i < numPixels; i++) {
            const val = Math.pow(normChannels[ch][i], 1 / gamma);
            normChannels[ch][i] = val;
            if (val < chMin) chMin = val;
            if (val > chMax) chMax = val;
          }
        }
      }

      // 輝度補正
      let brightness = 0;
      if (brightnessBox.value) {
        brightness = parseFloat(brightnessBox.value) / 255;
        brightnessBox.placeholder = '';
      } else {
        brightness = 0.5 - (chMin + chMax) / 2;
      }
      brightness = clip(-1, 1, brightness);
      brightnessBox.placeholder = '(' + Math.round(brightness * 255) + ')';
      if (brightness != 0) {
        chMin = 255;
        chMax = 0;
        for (let ch = 0; ch < numChannels; ch++) {
          for (let i = 0; i < numPixels; i++) {
            const val = clip(0, 1, normChannels[ch][i] + brightness);
            normChannels[ch][i] = val;
            if (val < chMin) chMin = val;
            if (val > chMax) chMax = val;
          }
        }
      }

      // コントラスト補正
      let contrast = 1;
      if (contrastBox.value) {
        contrast = parseFloat(contrastBox.value) / 100;
        contrastBox.placeholder = '';
      } else {
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
        for (let ch = 0; ch < numChannels; ch++) {
          for (let i = 0; i < numPixels; i++) {
            const val = (normChannels[ch][i] - 0.5) * contrast + 0.5;
            normChannels[ch][i] = clip(0, 1, val);
          }
        }
      }

      // 階調反転
      if (invertBox.checked) {
        for (let ch = 0; ch < numChannels; ch++) {
          for (let i = 0; i < numPixels; i++) {
            normChannels[ch][i] = 1 - normChannels[ch][i];
          }
        }
      }

      // 量子化
      const diffusion = ditherBox.value === 'diffusion';
      const equalDivision =
          !roundMethodBox.disabled && roundMethodBox.value === 'equalDivision';
      for (let ch = 0; ch < numChannels; ch++) {
        let norm = normChannels[ch];
        const numLevel = 1 << fmt.channelDepth[ch];
        const inMin = equalDivision ? (1 / (numLevel * 2)) : 0;
        const inMax = equalDivision ? ((numLevel * 2 - 1) / (numLevel * 2)) : 1;
        const outMax = numLevel - 1;
        for (let y = 0; y < outH; y++) {
          for (let ix = 0; ix < outW; ix++) {
            const fwd = y % 2 == 0;
            const x = fwd ? ix : (outW - 1 - ix);

            const i = (y * outW + x);

            const normIn = norm[i];

            // 量子化
            const normMod = clip(0, 1, (normIn - inMin) / (inMax - inMin));
            const out = Math.round(outMax * normMod);
            const normOut = out / outMax;

            outData[ch][i] = out;

            // プレビューの色生成
            if (fmt.colorSpace === ColorSpace.GRAYSCALE) {
              previewData[i * 4] = previewData[i * 4 + 1] =
                  previewData[i * 4 + 2] = Math.round(out * 255 / outMax);
            } else {
              previewData[i * 4 + ch] = Math.round(out * 255 / outMax);
            }

            let error = normIn - normOut;

            if (diffusion && error != 0) {
              if (fwd) {
                if (x < outW - 1) {
                  norm[i + 1] += error * 7 / 16;
                }
                if (y < outH - 1) {
                  if (x > 0) {
                    norm[i + outW - 1] += error * 3 / 16;
                  }
                  norm[i + outW] += error * 5 / 16;
                  if (x < outW - 1) {
                    norm[i + outW + 1] += error * 1 / 16;
                  }
                }
              } else {
                if (x > 0) {
                  norm[i - 1] += error * 7 / 16;
                }
                if (y < outH - 1) {
                  if (x < outW - 1) {
                    norm[i + outW + 1] += error * 3 / 16;
                  }
                  norm[i + outW] += error * 5 / 16;
                  if (x > 0) {
                    norm[i + outW - 1] += error * 1 / 16;
                  }
                }
              }
            }  // if diffusion
          }  // for x
        }  // for y
      }  // for ch

      // アルファチャンネル
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
      const zoom =
          Math.max(1, Math.floor(Math.min(viewW / outW, viewH / outH)));
      const canvasW = Math.round(outW * zoom);
      const canvasH = Math.round(outH * zoom);
      previewCanvas.style.width = `${canvasW}px`;
      previewCanvas.style.height = `${canvasH}px`;
      previewCanvas.style.marginTop = `${Math.floor((viewH - canvasH) / 2)}px`;
      previewCanvas.style.imageRendering = 'pixelated';
    }
  } catch (error) {
    previewCanvas.style.display = 'none';
    arrayCode.style.display = 'none';
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
    arrayCode.textContent = '';
    arrayCode.style.display = 'block';
    codeGenErrorBox.style.display = 'none';
    return;
  }

  try {
    // チャネル順
    const msbRed = channelOrderBox.value == 'msbRed';

    // ピクセルオーダー
    const msb1st = pixelOrderBox.value === 'msb1st';

    // パッキング方向
    const vertPack = packingBox.value === 'vert';

    // アドレッシング
    const vertAddr = addressingBox.value === 'vert';

    // バイトオーダー
    const bigEndian = byteOrderBox.value === 'be';

    // ピクセルあたりのビット数
    const numChannels = imageCacheData.length;
    let bitsPerPixel = 0;
    for (let i = 0; i < numChannels; i++) {
      bitsPerPixel += imageCacheFormat.channelDepth[i];
    }

    // エンコードパラメータ
    let pixelsPerPack = Math.max(1, Math.floor(8 / bitsPerPixel));
    let bytesPerPack = Math.ceil(bitsPerPixel / 8);
    let packWidth = vertPack ? 1 : pixelsPerPack;
    let packHeight = vertPack ? pixelsPerPack : 1;

    // 1 チャネルのときはチャネル順指定無効
    channelOrderBox.disabled = (numChannels <= 1);

    // 1 byte/pack 以下のときはエンディアン指定無効
    byteOrderBox.disabled = (bytesPerPack <= 1);

    // 1 pixel/byte 以下のときはパッキング設定無効
    pixelOrderBox.disabled = (pixelsPerPack <= 1);
    packingBox.disabled = (pixelsPerPack <= 1);

    // 列数決定
    let arrayCols = parseInt(codeColsBox.value);

    // インデント決定
    let indent = '  ';
    switch (indentBox.value) {
      case 'sp2':
        indent = '  ';
        break;
      case 'sp4':
        indent = '    ';
        break;
      case 'tab':
        indent = '\t';
        break;
      default:
        throw new Error('Unknown indent type');
    }

    const width = previewCanvas.width;
    const height = previewCanvas.height;
    const cols = Math.ceil(width / packWidth);
    const rows = Math.ceil(height / packHeight);
    const numPacks = cols * rows;

    const arrayData = new Uint8Array(numPacks * bytesPerPack);

    // 配列化
    let byteIndex = 0;

    for (let packIndex = 0; packIndex < numPacks; packIndex++) {
      let xCoarse, yCoarse;
      if (vertAddr) {
        xCoarse = packWidth * Math.floor(packIndex / rows);
        yCoarse = packHeight * (packIndex % rows);
      } else {
        xCoarse = packWidth * (packIndex % cols);
        yCoarse = packHeight * Math.floor(packIndex / cols);
      }

      // パッキング
      let packData = 0;
      let pixPos = msb1st ? (bitsPerPixel * pixelsPerPack) : 0;
      for (let yFine = 0; yFine < packHeight; yFine++) {
        for (let xFine = 0; xFine < packWidth; xFine++) {
          const x = xCoarse + xFine;
          const y = yCoarse + yFine;

          // ピクセルのエンコード
          let pixData = 0;
          let chPos = msbRed ? bitsPerPixel : 0;
          for (let ch = 0; ch < numChannels; ch++) {
            const val = imageCacheData[ch][y * width + x];
            const chBits = imageCacheFormat.channelDepth[ch];
            if (msbRed) {
              chPos -= chBits;
              pixData |= val << chPos;
            } else {
              pixData |= val << chPos;
              chPos += chBits;
            }
          }  // for ch

          if (msb1st) {
            pixPos -= bitsPerPixel;
            packData |= pixData << pixPos;
          } else {
            packData |= pixData << pixPos;
            pixPos += bitsPerPixel;
          }

        }  // for xFine
      }  // for yFine

      // バイト単位に変換
      for (let j = 0; j < bytesPerPack; j++) {
        if (bigEndian) {
          arrayData[byteIndex++] =
              (packData >> ((bytesPerPack - 1) * 8)) & 0xFF;
          packData <<= 8;
        } else {
          arrayData[byteIndex++] = packData & 0xFF;
          packData >>= 8;
        }
      }
    }  // for packIndex



    // コード生成
    let code = '';
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
      if (!packingBox.disabled) {
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

    arrayCode.textContent = code;
    arrayCode.style.display = 'block';
    codeGenErrorBox.style.display = 'none';
  } catch (error) {
    arrayCode.style.display = 'none';
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
