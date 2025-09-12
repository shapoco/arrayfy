import {ArrayBlob} from './Blobs';
import * as CodeGen from './CodeGen';
import * as Colors from './Colors';
import * as Configs from './Configs';
import * as Debug from './Debug';
import * as Encoder from './Encoder';
import {Point, Rect, Size} from './Geometries';
import * as Images from './Images';
import {ChannelOrder, ColorSpace, PixelFormat} from './Images';
import {DitherMethod, FixedPalette, IndexedPalette, Palette, RoundMethod} from './Palettes';
import * as Preproc from './Preproc';
import * as Reducer from './Reducer';
import * as Resizer from './Resizer';
import * as Ui from './Ui'
import {clip} from './Utils';

const enum TrimState {
  IDLE,
  DRAG_TOP,
  DRAG_RIGHT,
  DRAG_BOTTOM,
  DRAG_LEFT,
}

class PlaneUi {
  public container = document.createElement('div');
  public planeTypeBox = Ui.makeSelectBox(
      [
        {
          value: Encoder.PlaneType.DIRECT,
          label: '直接出力',
          tip: 'ピクセルデータをそのまま出力します。',
        },
        {
          value: Encoder.PlaneType.INDEX_MATCH,
          label: '色番号を指定',
          tip: '指定した色番号に一致するピクセルを抽出します。',
        },
      ],
      Encoder.PlaneType.DIRECT);
  public matchIndexBox = Ui.makeTextBox('0', '', 4);
  public matchInvertBox = Ui.makeCheckBox('反転');
  public ul = Ui.makeFloatList([
    Ui.tip(['種類: ', this.planeTypeBox], 'プレーンの種類を指定します。'),
    Ui.tip(['色番号: ', this.matchIndexBox], '抽出する色番号を指定します。'),
    Ui.tip(['反転: ', this.matchInvertBox], '抽出結果を反転します。'),
  ]);

  constructor(public config: Configs.PlaneConfig) {
    this.container.appendChild(this.ul);
    this.planeTypeBox.value = config.planeType.toString();
    this.matchIndexBox.value = config.matchIndex.toString();
    this.matchInvertBox.checked = config.matchInvert;

    this.container.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', () => {
        requestGenerateCode();
      });
      el.addEventListener('input', () => {
        requestGenerateCode();
      });
    });
  }

  dispose() {
    this.container.remove();
  }
}

export function makeSampleImageButton(url: string) {
  const fileName = url.split('/').pop() || DEFAULT_INPUT_FILE_NAME;
  const button = document.createElement('button');
  button.classList.add('sampleImageButton');
  button.style.backgroundImage = `url(${url})`;
  button.addEventListener('click', () => {
    loadFromString(fileName, url);
  });
  button.textContent = '';
  return button;
}

export function makePresetButton(
    id: string, preset: Configs.Config): HTMLButtonElement {
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
dropTarget.classList.add('dropTarget');
dropTarget.innerHTML = 'ドロップして読み込む';
document.body.appendChild(dropTarget);
Ui.hide(dropTarget);

const fileBrowseButton = Ui.makeButton('ファイルを選択');

// 「ファイルが選択されていません」の表示が邪魔なので button で wrap する
const hiddenFileBox = document.createElement('input');
hiddenFileBox.type = 'file';
hiddenFileBox.accept = 'image/*';
hiddenFileBox.style.display = 'none';
fileBrowseButton.addEventListener('click', () => {
  hiddenFileBox.click();
});

const pasteTarget = document.createElement('input');
pasteTarget.type = 'text';
pasteTarget.style.textAlign = 'center';
pasteTarget.style.width = '8em';
pasteTarget.placeholder = 'ここに貼り付け';

const fileSection = Ui.makeSection(Ui.makeFloatList(
    [
      Ui.makeHeader('入力画像'), '画像をドロップ、',
      Ui.makeSpan([pasteTarget, '、']),
      Ui.makeSpan(['または ', fileBrowseButton]),
      Ui.makeSpan(
          [
            '（サンプル: ',
            makeSampleImageButton('./img/sample/gradient.png'),
            makeSampleImageButton('./img/sample/forest-path.jpg'),
            makeSampleImageButton('./img/sample/rgb-chan.png'),
            makeSampleImageButton('./img/sample/rgb-chan-tp.png'),
            '）',
          ],
          )
    ],
    false))

const pPresetButtons = Ui.makeParagraph();
for (const id in Configs.presets) {
  pPresetButtons.appendChild(makePresetButton(id, Configs.presets[id]));
}

const presetSection = Ui.makeSection([
  Ui.makeFloatList([
    Ui.makeHeader('プリセット'),
    Ui.makeNowrap('選んでください: '),
  ]),
  pPresetButtons,
]);

const proModeCheckBox = Ui.makeCheckBox('上級者向け設定を表示する');
proModeCheckBox.addEventListener('change', onProModeChanged);

function onProModeChanged(): void {
  const pro = proModeCheckBox.checked;
  history.replaceState(null, '', pro ? '#detail' : '#');
  document.querySelectorAll('.professional').forEach((el) => {
    Ui.setVisible(el as HTMLElement, pro);
    onRelayout();
  });
  document.querySelectorAll('.basic').forEach((el) => {
    Ui.setVisible(el as HTMLElement, !pro);
    onRelayout();
  });
  updateTrimCanvas();
}

const proModeSection = Ui.makeSection(Ui.makeFloatList([
  Ui.makeHeader('編集モード'),
  proModeCheckBox.parentElement,
]));

let origCanvas = document.createElement('canvas');

const resetTrimButton = Ui.makeButton('範囲をリセット');
const rotateRightButton = Ui.makeButton('90° 回転');

const trimCanvas = document.createElement('canvas');
trimCanvas.style.width = '100%';
trimCanvas.style.height = '400px';
trimCanvas.style.boxSizing = 'border-box';
trimCanvas.style.border = 'solid 1px #444';
trimCanvas.style.backgroundImage = 'url(./img/checker.png)';

const pTrimCanvas = Ui.makeParagraph(trimCanvas);
pTrimCanvas.style.textAlign = 'center';

const trimSection = Ui.makeSection([
  Ui.makeFloatList([
    Ui.makeHeader('トリミング'),
    Ui.tip(resetTrimButton, 'トリミングしていない状態に戻します。'),
    Ui.tip(rotateRightButton, '画像を右に 90° 回転します。'),
  ]),
  pTrimCanvas,
])

const alphaModeBox = Ui.makeSelectBox(
    [
      {value: Preproc.AlphaMode.KEEP, label: '変更しない'},
      {value: Preproc.AlphaMode.FILL, label: '背景色を指定'},
      {value: Preproc.AlphaMode.BINARIZE, label: '二値化'},
      {value: Preproc.AlphaMode.SET_KEY_COLOR, label: '抜き色指定'},
    ],
    Preproc.AlphaMode.KEEP);
const backColorBox = Ui.makeTextBox('#00F');
const keyColorBox = Ui.makeTextBox('#00F');
const keyToleranceBox = Ui.makeTextBox('0', '(auto)', 5);
const alphaThreshBox = Ui.makeTextBox('128', '(auto)', 5);

const alphaSection = Ui.pro(Ui.makeSection(Ui.makeFloatList(([
  Ui.makeHeader('透過色'),
  Ui.tip(
      ['透過色の扱い: ', alphaModeBox],
      '入力画像に対する透過色の取り扱いを指定します。'),
  Ui.tip(
      ['背景色: ', backColorBox],
      '画像の透明部分をこの色で塗り潰して不透明化します。'),
  Ui.tip(['キーカラー: ', keyColorBox], '透明にしたい色を指定します。'),
  Ui.tip(
      ['許容誤差: ', Ui.upDown(keyToleranceBox, 0, 255, 1)],
      'キーカラーからの許容誤差を指定します。'),
  Ui.tip(
      ['閾値: ', Ui.upDown(alphaThreshBox, 0, 255, 1)],
      '透明にするかどうかの閾値を指定します。'),
]))));

const hueBox = Ui.makeTextBox('0', '(0)', 4);
const saturationBox = Ui.makeTextBox('100', '(100)', 4);
const lightnessBox = Ui.makeTextBox('100', '(100)', 4);
const gammaBox = Ui.makeTextBox('1', '(auto)', 4);
const brightnessBox = Ui.makeTextBox('0', '(auto)', 5);
const contrastBox = Ui.makeTextBox('100', '(auto)', 5);
const invertBox = Ui.makeCheckBox('階調反転');

const colorCorrectSection = Ui.makeSection(Ui.makeFloatList([
  Ui.makeHeader('色調補正'),
  Ui.pro(Ui.tip(
      ['色相: ', Ui.upDown(hueBox, -360, 360, 5), '°'],
      'デフォルトは 0° です。')),
  Ui.tip(
      ['彩度: ', Ui.upDown(saturationBox, 0, 200, 5), '%'],
      'デフォルトは 100% です。'),
  Ui.pro(Ui.tip(
      ['明度: ', Ui.upDown(lightnessBox, 0, 200, 5), '%'],
      'デフォルトは 100% です。')),
  Ui.tip(
      ['ガンマ: ', Ui.upDown(gammaBox, 0.1, 2, 0.05)],
      'デフォルトは 1.0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。'),
  Ui.pro(Ui.tip(
      ['輝度: ', Ui.upDown(brightnessBox, -255, 255, 8)],
      'デフォルトは 0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。')),
  Ui.tip(
      ['コントラスト: ', Ui.upDown(contrastBox, 0, 200, 5), '%'],
      'デフォルトは 100% です。\n空欄にすると、階調が失われない範囲でダイナミックレンジが最大となるように自動調整します。'),
  Ui.pro(Ui.tip([invertBox.parentElement], '各チャネルの値を大小反転します。')),
]));

const widthBox = Ui.makeTextBox('', '(auto)', 4);
const heightBox = Ui.makeTextBox('', '(auto)', 4);

const relaxSizeLimitBox = Ui.makeCheckBox('サイズ制限緩和');

const scalingMethodBox = Ui.makeSelectBox(
    [
      {
        value: Resizer.ScalingMethod.ZOOM,
        label: 'ズーム',
        tip:
            'アスペクト比を維持したまま、出力画像に余白が出ないように画像をズームします。',
      },
      {
        value: Resizer.ScalingMethod.FIT,
        label: 'フィット',
        tip:
            'アスペクト比を維持したまま、画像全体が出力画像に収まるようにズームします。',
      },
      {
        value: Resizer.ScalingMethod.STRETCH,
        label: 'ストレッチ',
        tip: 'アスペクト比を無視して、出力画像に合わせて画像を引き伸ばします。',
      },
    ],
    Resizer.ScalingMethod.ZOOM);

const interpMethodBox = Ui.makeSelectBox(
    [
      {
        value: Resizer.InterpMethod.NEAREST_NEIGHBOR,
        label: 'なし',
        tip: 'ニアレストネイバー法で補間します。'
      },
      {
        value: Resizer.InterpMethod.AVERAGE,
        label: '高精度',
        tip: '各出力画素に関係する入力画素を全て平均します。',
      },
    ],
    Resizer.InterpMethod.AVERAGE);

const resizeSection = Ui.makeSection(Ui.makeFloatList([
  Ui.makeHeader('出力サイズ'),
  Ui.tip(
      [
        'サイズ: ',
        Ui.upDown(widthBox, 1, 1024, 1),
        ' x ',
        Ui.upDown(heightBox, 1, 1024, 1),
        ' px',
      ],
      '片方を空欄にすると他方はアスペクト比に基づいて自動的に決定されます。'),
  Ui.tip(
      [relaxSizeLimitBox.parentElement],
      '出力サイズの制限を緩和します。処理が重くなる可能性があります。'),
  Ui.tip(
      ['拡縮方法: ', scalingMethodBox],
      'トリミングサイズと出力サイズが異なる場合の拡縮方法を指定します。'),
  Ui.pro(Ui.tip(
      ['補間方法: ', interpMethodBox], '拡縮時の補間方法を指定します。')),
]));
Ui.hide(Ui.parentLiOf(relaxSizeLimitBox));

const csrModeBox = Ui.makeSelectBox(
    [
      {
        value: Preproc.ColorSpaceReductionMode.NONE,
        label: '縮退しない',
        tip:
            '元の色を保ったまま減色を行います。誤差拡散と組み合わせると不自然になることがあります。',
      },
      {
        value: Preproc.ColorSpaceReductionMode.CLIP,
        label: '切り捨てる',
        tip: '新しい色空間で表現できない色は彩度を下げて灰色にします。',
      },
      {
        value: Preproc.ColorSpaceReductionMode.FOLD,
        label: '折り畳む',
        tip:
            '新しい色空間で表現できない色は色相環上で折り返して空間内に収めます。',
      },
      {
        value: Preproc.ColorSpaceReductionMode.TRANSFORM,
        label: '圧縮する',
        tip: '元の色空間全体を変形してパレットの空間内に収まるようにします。',
      },
    ],
    Preproc.ColorSpaceReductionMode.FOLD);
const csrHueToleranceBox = Ui.makeTextBox('60', '(60)', 4);

const paletteTable = document.createElement('table');

const paletteSection = Ui.makeSection([
  Ui.makeFloatList([
    Ui.makeHeader('パレット'),
    Ui.tip(
        ['色空間の縮退方法: ', csrModeBox],
        'パレット内の色で表現できない色の扱いを指定します。'),
    Ui.tip(
        ['許容誤差: ', Ui.upDown(csrHueToleranceBox, 0, 180, 5), '°'],
        '新しい色空間の外側をどこまで空間内に丸めるかを色相の角度で指定します。'),
  ]),
  Ui.pro(paletteTable),
]);

const pixelFormatBox = Ui.makeSelectBox(
    [
      {value: PixelFormat.RGBA8888, label: 'RGBA8888'},
      //{value: PixelFormat.RGBA4444, label: 'RGBA4444'},
      {value: PixelFormat.RGB888, label: 'RGB888'},
      {value: PixelFormat.RGB666, label: 'RGB666'},
      {value: PixelFormat.RGB565, label: 'RGB565'},
      //{value: PixelFormat.RGB555, label: 'RGB555'},
      {value: PixelFormat.RGB444, label: 'RGB444'},
      {value: PixelFormat.RGB332, label: 'RGB332'},
      {value: PixelFormat.RGB111, label: 'RGB111'},
      {value: PixelFormat.GRAY4, label: 'Gray4'},
      {value: PixelFormat.GRAY2, label: 'Gray2'},
      {value: PixelFormat.BW, label: 'B/W'},
      {value: PixelFormat.I2_RGB888, label: 'Index2'},
    ],
    PixelFormat.RGB565);

const colorDitherMethodBox = Ui.makeSelectBox(
    [
      {value: DitherMethod.NONE, label: 'なし'},
      {value: DitherMethod.DIFFUSION, label: '誤差拡散'},
      {value: DitherMethod.PATTERN_GRAY, label: 'パターン'},
    ],
    DitherMethod.NONE);
const colorDitherStrengthBox =
    Ui.makeTextBox('80', `(${Reducer.DEFAULT_DITHER_STRENGTH * 100})`, 4);
const alphaDitherMethodBox = Ui.makeSelectBox(
    [
      {value: DitherMethod.NONE, label: 'なし'},
      {value: DitherMethod.DIFFUSION, label: '誤差拡散'},
      {value: DitherMethod.PATTERN_GRAY, label: 'パターン'},
    ],
    DitherMethod.NONE);
const alphaDitherStrengthBox =
    Ui.makeTextBox('80', `(${Reducer.DEFAULT_DITHER_STRENGTH * 100})`, 4);
const roundMethodBox = Ui.makeSelectBox(
    [
      {
        value: RoundMethod.NEAREST,
        label: '近似値',
        tip: '元の色の輝度値に最も近い色を選択します。'
      },
      {
        value: RoundMethod.EQUAL_DIVISION,
        label: '均等割り',
        tip: '色の範囲を均等に分割します。'
      },
    ],
    RoundMethod.NEAREST);
const previewCanvas = document.createElement('canvas');
const reductionErrorBox = document.createElement('span');

previewCanvas.style.backgroundImage = 'url(./img/checker.png)';
reductionErrorBox.style.color = 'red';
Ui.hide(previewCanvas);
Ui.hide(reductionErrorBox);

const pPreviewCanvas = Ui.makeParagraph([previewCanvas, reductionErrorBox]);
pPreviewCanvas.style.height = '400px';
pPreviewCanvas.style.background = '#444';
pPreviewCanvas.style.border = 'solid 1px #444';
pPreviewCanvas.style.textAlign = 'center';

const colorReductionSection = Ui.makeSection([
  Ui.makeFloatList([
    Ui.makeHeader('減色'),
    Ui.pro(Ui.tip(
        ['フォーマット: ', pixelFormatBox],
        'ピクセルフォーマットを指定します。')),
    Ui.pro(Ui.tip(
        ['丸め方法: ', roundMethodBox],
        'パレットから色を選択する際の戦略を指定します。\nディザリングを行う場合はあまり関係ありません。')),
    Ui.tip(
        ['ディザ: ', colorDitherMethodBox],
        'あえてノイズを加えることでできるだけ元画像の色を再現します。'),
    Ui.tip(
        ['強度: ', Ui.upDown(colorDitherStrengthBox, 0, 100, 10), '%'],
        'ディザリングの強度を指定します。'),
    Ui.pro(Ui.tip(
        ['透明度のディザ: ', alphaDitherMethodBox],
        'あえてノイズを加えることでできるだけ元画像の透明度を再現します。')),
    Ui.pro(Ui.tip(
        ['強度: ', Ui.upDown(alphaDitherStrengthBox, 0, 100, 10), '%'],
        '透明度に対するディザリングの強度を指定します。')),
  ]),
  pPreviewCanvas,
]);

const channelOrderBox = Ui.makeSelectBox(
    [
      {value: Images.ChannelOrder.RGBA, label: 'RGBA'},
      {value: Images.ChannelOrder.BGRA, label: 'BGRA'},
      {value: Images.ChannelOrder.ARGB, label: 'ARGB'},
      {value: Images.ChannelOrder.ABGR, label: 'ABGR'},
    ],
    Images.ChannelOrder.RGBA);
const farPixelFirstBox = Ui.makeSelectBox(
    [
      {value: 1, label: '上位から'},
      {value: 0, label: '下位から'},
    ],
    1);
const bigEndianBox = Ui.makeCheckBox('ビッグエンディアン');
const packUnitBox = Ui.makeSelectBox(
    [
      {value: Encoder.PackUnit.UNPACKED, label: 'アンパックド'},
      {value: Encoder.PackUnit.PIXEL, label: '1 ピクセル'},
      {value: Encoder.PackUnit.ALIGNMENT, label: 'アライメント境界'},
    ],
    Encoder.PackUnit.PIXEL);
const vertPackBox = Ui.makeCheckBox('縦パッキング');
const alignBoundaryBox = Ui.makeSelectBox(
    [
      {value: Encoder.AlignBoundary.NIBBLE, label: 'ニブル'},
      {value: Encoder.AlignBoundary.BYTE_1, label: '1 バイト'},
      {value: Encoder.AlignBoundary.BYTE_2, label: '2 バイト'},
      {value: Encoder.AlignBoundary.BYTE_3, label: '3 バイト'},
      {value: Encoder.AlignBoundary.BYTE_4, label: '4 バイト'},
    ],
    Encoder.AlignBoundary.BYTE_1);
const leftAlignBox = Ui.makeCheckBox('左詰め');
const vertAddrBox = Ui.makeCheckBox('垂直スキャン');

const planeSelectBox = Ui.makeSelectBox([{value: 0, label: 'プレーン0'}], 0);
const planeGroupBody = Ui.makeGroupBody();
const planeGroupBox =
    Ui.makeGroup([Ui.makeGroupTitle([planeSelectBox]), planeGroupBody]);

planeSelectBox.addEventListener('change', onSelectedPlaneChanged);

const structCanvas = document.createElement('canvas');
structCanvas.style.maxWidth = '100%';

const structErrorBox = Ui.makeParagraph();
structErrorBox.style.textAlign = 'center';
structErrorBox.style.color = 'red';
Ui.hide(structErrorBox);

const pStructCanvas = Ui.makeParagraph([structCanvas, structErrorBox]);
pStructCanvas.style.textAlign = 'center';

const encodeSection = Ui.makeSection([
  Ui.makeFloatList([
    Ui.makeHeader('エンコード'),
    Ui.basic(Ui.makeSpan('この構造で生成されます:')),
    Ui.pro(Ui.tip(
        ['パッキング単位: ', packUnitBox], 'パッキングの単位を指定します。')),
    Ui.pro(Ui.tip(
        [vertPackBox.parentElement],
        '複数ピクセルをパッキングする場合に、縦方向にパッキングします。\n' +
            'SSD1306/1309 などの一部の白黒ディスプレイに\n' +
            '直接転送可能なデータを生成する場合はチェックします。')),
    Ui.pro(Ui.tip(
        [vertAddrBox.parentElement],
        'アドレスを縦方向にインクリメントする場合にチェックします。')),
    Ui.pro(Ui.tip(
        ['チャネル順: ', channelOrderBox],
        'RGB のチャネルを並べる順序を指定します。')),
    Ui.pro(Ui.tip(
        ['ピクセル順: ', farPixelFirstBox],
        'バイト内のピクセルの順序を指定します。')),
    Ui.pro(Ui.tip(
        ['アライメント境界: ', alignBoundaryBox],
        'アライメントの境界を指定します。')),
    Ui.pro(Ui.tip(
        [leftAlignBox.parentElement],
        'フィールドをアライメント境界内で左詰めします。')),
    Ui.pro(Ui.tip(
        [bigEndianBox.parentElement],
        'ピクセル内のバイトの順序を指定します。')),
  ]),
  Ui.pro(planeGroupBox),
  pStructCanvas,
]);


const codeUnitBox = Ui.makeSelectBox(
    [
      {value: CodeGen.CodeUnit.FILE, label: 'ファイル全体'},
      {value: CodeGen.CodeUnit.ARRAY_DEF, label: '配列定義'},
      {value: CodeGen.CodeUnit.ELEMENTS, label: '要素のみ'},
    ],
    CodeGen.CodeUnit.FILE)
const codeColsBox = Ui.makeSelectBox(
    [
      {value: 8, label: '8'},
      {value: 16, label: '16'},
      {value: 32, label: '32'},
    ],
    16);
const indentBox = Ui.makeSelectBox(
    [
      {value: CodeGen.Indent.SPACE_X2, label: 'スペース x2'},
      {value: CodeGen.Indent.SPACE_X4, label: 'スペース x4'},
      {value: CodeGen.Indent.TAB, label: 'タブ'},
    ],
    CodeGen.Indent.SPACE_X2);

const codePlaneContainer = document.createElement('div');

const showCodeLink = document.createElement('a');
showCodeLink.href = '#';
showCodeLink.textContent = '表示する';

const codeErrorBox = Ui.makeParagraph();
codeErrorBox.style.textAlign = 'center';
codeErrorBox.style.color = 'red';

Ui.hide(codeErrorBox);

const codeGenSection = Ui.makeSection([
  Ui.makeFloatList([
    Ui.makeHeader('コード生成'),
    Ui.tip(['生成範囲: ', codeUnitBox], '生成するコードの範囲を指定します。'),
    Ui.tip(['列数: ', codeColsBox], '1 行に詰め込む要素数を指定します。'),
    Ui.tip(
        ['インデント: ', indentBox], 'インデントの形式とサイズを指定します。'),
  ]),
  codePlaneContainer,
  codeErrorBox,
]);

let container: HTMLDivElement;

let updateTrimCanvasTimeoutId = -1;
let quantizeTimeoutId = -1;
let generateCodeTimeoutId = -1;

let worldX0 = 0, worldY0 = 0, zoom = 1;
let trimL = 0, trimT = 0, trimR = 1, trimB = 1;

let trimUiState = TrimState.IDLE;

let normImageCache: Images.NormalizedImage|null = null;

let paletteColor: Uint32Array = new Uint32Array(256);
let paletteEnabled: boolean[] = new Array(256).fill(false);
let reducedImage: Images.ReducedImage|null = null;

let trimCanvasWidth = 800;
let trimCanvasHeight = 400;

let previewCanvasWidth = 800;
let previewCanvasHeight = 400;

let planeUis: Record<string, PlaneUi> = {};

let keepShowLongCode = false;

const DEFAULT_INPUT_FILE_NAME = 'imageArray';
let inputFileName = DEFAULT_INPUT_FILE_NAME;

async function onLoad() {
  container = document.querySelector('#arrayfyContainer') as HTMLDivElement;
  container.appendChild(proModeSection);
  container.appendChild(fileSection);
  container.appendChild(presetSection);
  container.appendChild(trimSection);
  container.appendChild(resizeSection);
  container.appendChild(alphaSection);
  container.appendChild(colorCorrectSection);
  container.appendChild(paletteSection);
  container.appendChild(colorReductionSection);
  container.appendChild(encodeSection);
  container.appendChild(codeGenSection);

  alphaModeBox.addEventListener('change', onAlphaProcChanged);
  onAlphaProcChanged();

  const resizeSections = [trimSection, resizeSection, alphaSection];
  for (const section of resizeSections) {
    section.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', () => {
        requestTrimResize();
      });
      el.addEventListener('input', () => {
        requestTrimResize();
      });
    });
  }

  pixelFormatBox.addEventListener('change', () => requestTrimResize());

  const colorReductionSections = [
    colorCorrectSection,
    paletteSection,
    colorReductionSection,
  ];
  for (const section of colorReductionSections) {
    section.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', () => {
        requestColorReduction();
      });
      el.addEventListener('input', () => {
        requestColorReduction();
      });
    });
  }

  const codeGenSections = [encodeSection, codeGenSection];
  for (const section of codeGenSections) {
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
      await loadFromFile(input.files[0].name, input.files[0]);
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
        Ui.show(dropTarget);
        break;
      }
    }
  });
  dropTarget.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    Ui.hide(dropTarget);
  });
  dropTarget.addEventListener('drop', async (e) => {
    if (!e.dataTransfer) return;
    Ui.hide(dropTarget);
    const items = e.dataTransfer.items;
    for (const item of items) {
      if (item.kind === 'file') {
        e.preventDefault();
        e.stopPropagation();
        const file = item.getAsFile() as File;
        await loadFromFile(file.name, file);
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
        const file = item.getAsFile() as File;
        await loadFromFile(file.name, file);
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
          setTrimRect(Math.min(x, trimR - 1), trimT, trimR, trimB);
          break;
        case TrimState.DRAG_TOP:
          setTrimRect(trimL, Math.min(y, trimB - 1), trimR, trimB);
          break;
        case TrimState.DRAG_RIGHT:
          setTrimRect(trimL, trimT, Math.max(x, trimL + 1), trimB);
          break;
        case TrimState.DRAG_BOTTOM:
          setTrimRect(trimL, trimT, trimR, Math.max(y, trimT + 1));
          break;
      }
      requestUpdateTrimCanvas();
      requestColorReduction();
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
    setTrimRect(trimL, trimT, trimR, trimB, true);  // 高品質で再描画
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
  rotateRightButton.addEventListener('click', () => {
    rotate();
  });

  proModeCheckBox.checked = (window.location.hash === '#detail');
  onProModeChanged();

  // サンプルのロード
  loadPreset(Configs.presets['rgb565_be']);
  await loadFromString('gradient', './img/sample/gradient.png');

  onRelayout();
}  // main

function onAlphaProcChanged() {
  Ui.hide(Ui.parentLiOf(backColorBox));
  Ui.hide(Ui.parentLiOf(keyColorBox));
  Ui.hide(Ui.parentLiOf(keyToleranceBox));
  Ui.hide(Ui.parentLiOf(alphaThreshBox));
  const alphaProc: Preproc.AlphaMode = parseInt(alphaModeBox.value);
  switch (alphaProc) {
    case Preproc.AlphaMode.FILL:
      Ui.show(Ui.parentLiOf(backColorBox));
      break;
    case Preproc.AlphaMode.SET_KEY_COLOR:
      Ui.show(Ui.parentLiOf(keyColorBox));
      Ui.show(Ui.parentLiOf(keyToleranceBox));
      break;
    case Preproc.AlphaMode.BINARIZE:
      Ui.show(Ui.parentLiOf(alphaThreshBox));
      break;
  }
}

async function loadFromFile(name: string, file: File): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target && typeof e.target.result === 'string') {
        await loadFromString(name, e.target.result);
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

async function loadFromString(
    fileName: string, blobStr: string): Promise<void> {
  inputFileName = DEFAULT_INPUT_FILE_NAME;
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      inputFileName = fileName;

      origCanvas.width = img.width;
      origCanvas.height = img.height;
      const ctx = origCanvas.getContext('2d', {willReadFrequently: true});
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.clearRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);

      keepShowLongCode = false;
      resetTrim(true);
      requestTrimResize();
      resolve();
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = blobStr;
  });
}

// トリミングのリセット
function resetTrim(forceUpdate: boolean = false): void {
  setTrimRect(0, 0, origCanvas.width, origCanvas.height, forceUpdate);
}

function rotate(): void {
  const newTrimL = origCanvas.height - trimB;
  const newTrimT = trimL;
  const newTrimR = origCanvas.height - trimT;
  const newTrimB = trimR;
  setTrimRect(newTrimL, newTrimT, newTrimR, newTrimB, true);

  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = origCanvas.height;
  tmpCanvas.height = origCanvas.width;
  const tmpCtx = tmpCanvas.getContext('2d', {willReadFrequently: true});
  if (!tmpCtx) {
    throw new Error('Failed to get canvas context');
  }
  tmpCtx.imageSmoothingEnabled = false;
  tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
  tmpCtx.translate(tmpCanvas.width / 2, tmpCanvas.height / 2);
  tmpCtx.rotate(Math.PI / 2);
  tmpCtx.drawImage(origCanvas, -origCanvas.width / 2, -origCanvas.height / 2);
  origCanvas = tmpCanvas;

  requestUpdateTrimCanvas();
  requestColorReduction();
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

function setTrimRect(
    l: number, t: number, r: number, b: number,
    forceUpdate: boolean = false): void {
  const changed = (l != trimL || t != trimT || r != trimR || b != trimB);
  if (!changed && !forceUpdate) return;
  trimL = l;
  trimT = t;
  trimR = r;
  trimB = b;
  requestTrimResize();
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
    const lineWidth = 2;
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

function loadPreset(preset: Configs.Config): void {
  pixelFormatBox.value = preset.format.toString();
  channelOrderBox.value = preset.channelOrder.toString();
  farPixelFirstBox.value = preset.farPixelFirst ? '1' : '0';
  bigEndianBox.checked = preset.bigEndian;
  packUnitBox.value = preset.packUnit.toString();
  vertPackBox.checked = preset.vertPack;
  alignBoundaryBox.value = preset.alignBoundary.toString();
  leftAlignBox.checked = preset.alignLeft;
  vertAddrBox.checked = preset.vertAddr;

  // パレットのロード
  paletteTable.innerHTML = '';
  if (preset.palette) {
    for (let i = 0; i < 256; i++) {
      if (i < preset.palette.length) {
        paletteColor[i] = preset.palette[i];
        paletteEnabled[i] = true;
      } else {
        paletteEnabled[i] = false;
      }
    }
    const headerTr = document.createElement('tr');
    for (let i = 0; i < preset.palette.length; i++) {
      const th = document.createElement('th');
      th.textContent = i.toString();
      headerTr.appendChild(th);
    }
    const colorTr = document.createElement('tr');
    for (let i = 0; i < preset.palette.length; i++) {
      const {r, g, b} = Colors.rgbU32ToU8(preset.palette[i]);
      const colorStr = Colors.rgbToHexStr(preset.palette[i]);
      const td = document.createElement('td');
      td.textContent = colorStr;
      td.style.backgroundColor = colorStr;
      if (r + g + b < 384) {
        td.style.color = '#FFF';
      } else {
        td.style.color = '#000';
      }
      colorTr.appendChild(td);
    }
    paletteTable.appendChild(headerTr);
    paletteTable.appendChild(colorTr);
  }

  // プレーン設定のロード
  for (const [key, value] of Object.entries(planeUis)) {
    value.dispose();
  }
  planeUis = {};
  planeSelectBox.innerHTML = '';
  for (const planeCfg of preset.planeCfgs) {
    const planeUi = new PlaneUi(planeCfg);
    planeUis[planeCfg.id] = planeUi;
    Ui.hide(planeUi.container);
    planeGroupBody.appendChild(planeUi.container);
    const option = document.createElement('option');
    option.value = planeCfg.id;
    option.textContent = planeCfg.id + ' プレーン';
    planeSelectBox.appendChild(option);
  }
  (planeSelectBox.firstChild as HTMLOptionElement).selected = true;
  onSelectedPlaneChanged();

  requestTrimResize();
}

function onSelectedPlaneChanged() {
  for (const [key, value] of Object.entries(planeUis)) {
    Ui.setVisible(value.container, key === planeSelectBox.value);
  }
}

function requestTrimResize(): void {
  normImageCache = null;
  requestUpdateTrimCanvas();
  requestColorReduction();
}

function requestColorReduction(): void {
  if (quantizeTimeoutId >= 0) return;
  quantizeTimeoutId = setTimeout(() => {
    reduceColor();
  }, 100);
}

function reduceColor(): void {
  reducedImage = null;

  if (quantizeTimeoutId >= 0) {
    clearTimeout(quantizeTimeoutId);
    quantizeTimeoutId = -1;
  }

  const swDetail = new Debug.StopWatch(false);

  try {
    let outW = -1, outH = -1;
    let norm: Images.NormalizedImage;

    const fmt = new Images.PixelFormatInfo(parseInt(pixelFormatBox.value));

    // 丸めの方法
    let roundMethod: RoundMethod = RoundMethod.NEAREST;
    {
      let maxChannelDepth = 0;
      for (const depth of fmt.colorBits) {
        if (depth > maxChannelDepth) {
          maxChannelDepth = depth;
        }
      }

      // 丸め方法の選択はチャンネル深度が 2bit 以上のときのみ有効
      if (maxChannelDepth > 1 && !fmt.isIndexed) {
        Ui.show(Ui.parentLiOf(roundMethodBox));
        roundMethod = parseInt(roundMethodBox.value);
      } else {
        Ui.hide(Ui.parentLiOf(roundMethodBox));
      }
    }

    // パレットの作成
    let palette: Palette;
    if (fmt.isIndexed) {
      const indexedPalette = new IndexedPalette(fmt.colorBits, fmt.indexBits);
      palette = indexedPalette;
      const numColors = (1 << indexedPalette.indexBits);
      for (let i = 0; i < numColors; i++) {
        const {r, g, b} = Colors.rgbU32ToF32(paletteColor[i]);
        indexedPalette.colors[i * 3 + 0] = r;
        indexedPalette.colors[i * 3 + 1] = g;
        indexedPalette.colors[i * 3 + 2] = b;
        indexedPalette.enabled[i] = paletteEnabled[i];
      }
    } else {
      palette = new FixedPalette(fmt.colorBits, roundMethod);
    }

    const srcW = origCanvas.width;
    const srcH = origCanvas.height;
    const trimW = Math.round(trimR - trimL);
    const trimH = Math.round(trimB - trimT);
    outW = trimW;
    outH = trimH;

    // 出力サイズの決定
    {
      // 出力サイズ決定
      let aspectChanged = false;
      if (widthBox.value && heightBox.value) {
        outW = parseInt(widthBox.value);
        outH = parseInt(heightBox.value);
        aspectChanged = true;
      } else if (widthBox.value) {
        outW = parseInt(widthBox.value);
        outH = Math.max(1, Math.round(trimH * (outW / trimW)));
      } else if (heightBox.value) {
        outH = parseInt(heightBox.value);
        outW = Math.max(1, Math.round(trimW * (outH / trimH)));
      } else {
        const MAX_SIZE = 512;
        if (outW > MAX_SIZE || outH > MAX_SIZE) {
          const scale = Math.min(MAX_SIZE / outW, MAX_SIZE / outH);
          outW = Math.floor(outW * scale);
          outH = Math.floor(outH * scale);
        }
      }

      const resizing = (outW != trimW || outH != trimH);
      Ui.setVisible(Ui.parentLiOf(scalingMethodBox), resizing && aspectChanged);
      Ui.setVisible(Ui.parentLiOf(interpMethodBox), resizing);

      widthBox.placeholder = '(' + outW + ')';
      heightBox.placeholder = '(' + outH + ')';

      if (outW < 1 || outH < 1) {
        throw new Error('サイズは正の値で指定してください');
      }

      if (relaxSizeLimitBox.checked) {
        if (outW * outH > 2048 * 2048) {
          throw new Error('出力サイズが大きすぎます。');
        }
      } else {
        if (outW * outH > 1024 * 1024) {
          Ui.show(Ui.parentLiOf(relaxSizeLimitBox));
          throw new Error(
              '出力サイズが大きすぎます。処理が重くなることを承知で制限を緩和するには「サイズ制限緩和」にチェックしてください。');
        }
      }
    }

    // トリミング・リサイズ処理
    if (normImageCache == null || normImageCache.width != outW ||
        normImageCache.height != outH) {
      let args = new Resizer.ResizeArgs();
      args.colorSpace = fmt.colorSpace;

      args.srcSize.width = srcW;
      args.srcSize.height = srcH;

      // 入力画像の配列化
      {
        const origCtx = origCanvas.getContext('2d', {willReadFrequently: true});
        if (!origCtx) throw new Error('Failed to get canvas context');
        const origImageData = origCtx.getImageData(0, 0, srcW, srcH);
        const origData = new Uint8Array(srcW * srcH * 4);
        for (let i = 0; i < origImageData.data.length; i++) {
          origData[i] = origImageData.data[i];
        }
        args.srcData = origData;
      }

      args.scalingMethod = parseInt(scalingMethodBox.value);
      if (trimUiState == TrimState.IDLE) {
        args.interpMethod = parseInt(interpMethodBox.value);
      } else {
        args.interpMethod = Resizer.InterpMethod.NEAREST_NEIGHBOR;
      }

      args.trimRect.x = trimL;
      args.trimRect.y = trimT;
      args.trimRect.width = trimW;
      args.trimRect.height = trimH;

      args.outSize.width = outW;
      args.outSize.height = outH;

      args.applyKeyColor =
          (parseInt(alphaModeBox.value) == Preproc.AlphaMode.SET_KEY_COLOR);
      if (keyColorBox.value) {
        args.keyColor = Colors.hexStrToRgb(keyColorBox.value);
      }
      if (keyToleranceBox.value) {
        args.keyTolerance = parseInt(keyToleranceBox.value);
      }

      Resizer.resize(args);
      normImageCache = args.out;
    }

    // 補正処理
    {
      let args = new Preproc.PreProcArgs();
      args.src = normImageCache as Images.NormalizedImage;

      // 画像補正系のパラメータ決定
      {
        args.alphaProc = parseInt(alphaModeBox.value);
        args.alphaThresh = parseInt(alphaThreshBox.value);
        if (backColorBox.value) {
          args.backColor = Colors.hexStrToRgb(backColorBox.value);
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

      Ui.setVisible(paletteSection, fmt.isIndexed);

      if (fmt.isIndexed) {
        args.csrMode = parseInt(csrModeBox.value);
        args.csrHslRange = palette.getHslRange();

        Ui.setVisible(
            Ui.parentLiOf(csrHueToleranceBox),
            args.csrMode == Preproc.ColorSpaceReductionMode.CLIP);

        if (args.csrMode == Preproc.ColorSpaceReductionMode.CLIP) {
          args.csrHueTolerance = parseFloat(csrHueToleranceBox.value) / 360;
        } else if (args.csrMode == Preproc.ColorSpaceReductionMode.TRANSFORM) {
          // パレット内の色を RGB 空間の四隅に割り当てる
          const indexedPalette = palette as IndexedPalette;
          const numColors = 1 << indexedPalette.indexBits;
          const vecs = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]];
          let remainingVecIndexes:
              {[key: number]: boolean} = {0: true, 1: true, 2: true, 3: true};
          let mappedVecIndices: {[key: number]: number} = {};
          let mappedPalIndices: {[key: number]: number} = {};
          while (Object.keys(remainingVecIndexes).length > 0) {
            let bestPalIndex = -1;
            let bestVecIndex = -1;
            let bestDist = 999;
            for (const ivStr in remainingVecIndexes) {
              const iv = parseInt(ivStr);
              const vr = vecs[iv][0];
              const vg = vecs[iv][1];
              const vb = vecs[iv][2];
              for (let ip = 0; ip < numColors; ip++) {
                if (!indexedPalette.enabled[ip]) continue;
                const pr = indexedPalette.colors[ip * 3 + 0];
                const pg = indexedPalette.colors[ip * 3 + 1];
                const pb = indexedPalette.colors[ip * 3 + 2];
                const dist = Math.abs(pr - vr) * 0.299 +
                    Math.abs(pg - vg) * 0.587 + Math.abs(pb - vb) * 0.114;
                if (dist < bestDist && !(ip in mappedPalIndices)) {
                  bestDist = dist;
                  bestPalIndex = ip;
                  bestVecIndex = iv;
                }
              }
            }

            if (bestVecIndex >= 0) {
              mappedVecIndices[bestVecIndex] = bestPalIndex;
              mappedPalIndices[bestPalIndex] = bestVecIndex;
              delete remainingVecIndexes[bestVecIndex];
            } else {
              throw new Error('色空間の圧縮には 4 色以上のパレットが必要です');
            }
          }

          const io = mappedVecIndices[0];
          const ir = mappedVecIndices[1];
          const ig = mappedVecIndices[2];
          const ib = mappedVecIndices[3];
          const o0 = indexedPalette.colors[io * 3 + 0];
          const o1 = indexedPalette.colors[io * 3 + 1];
          const o2 = indexedPalette.colors[io * 3 + 2];
          const r0 = indexedPalette.colors[ir * 3 + 0] - o0;
          const r1 = indexedPalette.colors[ir * 3 + 1] - o1;
          const r2 = indexedPalette.colors[ir * 3 + 2] - o2;
          const g0 = indexedPalette.colors[ig * 3 + 0] - o0;
          const g1 = indexedPalette.colors[ig * 3 + 1] - o1;
          const g2 = indexedPalette.colors[ig * 3 + 2] - o2;
          const b0 = indexedPalette.colors[ib * 3 + 0] - o0;
          const b1 = indexedPalette.colors[ib * 3 + 1] - o1;
          const b2 = indexedPalette.colors[ib * 3 + 2] - o2;

          const dr = Math.sqrt(r0 * r0 + r1 * r1 + r2 * r2) * Math.sqrt(3);
          const dg = Math.sqrt(g0 * g0 + g1 * g1 + g2 * g2) * Math.sqrt(3);
          const db = Math.sqrt(b0 * b0 + b1 * b1 + b2 * b2) * Math.sqrt(3);

          const mat = new Float32Array([
            r0 / dr,
            g0 / dg,
            b0 / db,
            o0,
            r1 / dr,
            g1 / dg,
            b1 / db,
            o1,
            r2 / dr,
            g2 / dg,
            b2 / db,
            o2,
          ]);

          args.csrTransformMatrix = mat;
        }
      } else {
        args.csrMode = Preproc.ColorSpaceReductionMode.NONE;
        Ui.hide(Ui.parentLiOf(csrHueToleranceBox));
      }

      Ui.setVisible(Ui.parentLiOf(hueBox), fmt.numColorChannels > 1);
      Ui.setVisible(Ui.parentLiOf(saturationBox), fmt.numColorChannels > 1);

      // 前処理実行
      Preproc.process(args);
      norm = args.out;

      // 自動決定されたパラメータをプレースホルダに反映
      gammaBox.placeholder = `(${args.gamma.value.toFixed(2)})`;
      brightnessBox.placeholder =
          `(${Math.round(args.brightness.value * 255)})`;
      contrastBox.placeholder = `(${Math.round(args.contrast.value * 100)})`;
    }

    // 減色の適用
    {
      const numPixels = outW * outH;

      // 減色方法の決定
      let minColBits = 999;
      for (const bits of fmt.colorBits) {
        if (bits < minColBits) minColBits = bits;
      }
      const colReduce = (minColBits < 8) || fmt.isIndexed;
      const alpReduce = fmt.hasAlpha && (fmt.alphaBits < 8);
      const colDither: DitherMethod =
          colReduce ? parseInt(colorDitherMethodBox.value) : DitherMethod.NONE;
      const alpDither: DitherMethod =
          alpReduce ? parseInt(alphaDitherMethodBox.value) : DitherMethod.NONE;
      Ui.setVisible(Ui.parentLiOf(colorDitherMethodBox), colReduce);
      Ui.setVisible(Ui.parentLiOf(alphaDitherMethodBox), alpReduce);

      Ui.setVisible(
          Ui.parentLiOf(colorDitherStrengthBox),
          colDither != DitherMethod.NONE);
      Ui.setVisible(
          Ui.parentLiOf(alphaDitherStrengthBox),
          alpDither != DitherMethod.NONE);

      // 減色
      const args = new Reducer.Arguments();
      args.src = norm;
      args.format = fmt;
      args.palette = palette;
      args.colorDitherMethod = colDither;
      if (colorDitherStrengthBox.value) {
        args.colorDitherStrength =
            parseFloat(colorDitherStrengthBox.value) / 100;
      }
      args.alphaDitherMethod = alpDither;
      if (alphaDitherStrengthBox.value) {
        args.alphaDitherStrength =
            parseFloat(alphaDitherStrengthBox.value) / 100;
      }

      Reducer.reduce(args);

      reducedImage = args.output as Images.ReducedImage;

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

      Ui.show(previewCanvas);
      Ui.hide(reductionErrorBox);

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
      previewCanvas.style.imageRendering = zoom < 1 ? 'auto' : 'pixelated';
    }

    swDetail.lap('Fix Preview Size');

  } catch (error) {
    Ui.hide(previewCanvas);
    Ui.hide(codePlaneContainer);
    Ui.show(reductionErrorBox);
    let e: Error;

    if (error instanceof Error) {
      reductionErrorBox.textContent = `${error.stack}`;
    } else {
      reductionErrorBox.textContent = String(error);
    }
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
  const swDetail = new Debug.StopWatch(false);

  if (!reducedImage) {
    codeErrorBox.textContent = 'まだコードは生成されていません。';
    Ui.show(codePlaneContainer);
    Ui.show(codeErrorBox);
    return;
  }
  let blobs: ArrayBlob[] = [];


  try {
    const args = new Encoder.EncodeArgs();
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

    // プレーンの定義
    for (const [id, planeUi] of Object.entries(planeUis)) {
      const plane = new Encoder.PlaneArgs();

      plane.id = id;
      plane.type = parseInt(planeUi.planeTypeBox.value);

      const indexMatchMode = (plane.type == Encoder.PlaneType.INDEX_MATCH);
      if (indexMatchMode) {
        plane.indexMatchValue = parseInt(planeUi.matchIndexBox.value);
        plane.postInvert = planeUi.matchInvertBox.checked;
      }
      Ui.setVisible(Ui.parentLiOf(planeUi.matchIndexBox), indexMatchMode);
      Ui.setVisible(Ui.parentLiOf(planeUi.matchInvertBox), indexMatchMode);

      // 以下は共通
      plane.farPixelFirst = parseInt(farPixelFirstBox.value) == 1;
      plane.bigEndian = bigEndianBox.checked;
      plane.packUnit = parseInt(packUnitBox.value);
      plane.vertPack = vertPackBox.checked;
      plane.alignBoundary = parseInt(alignBoundaryBox.value);
      plane.alignLeft = leftAlignBox.checked;
      plane.vertAddr = vertAddrBox.checked;

      args.planes.push(plane);
    }

    if (args.planes.length == 0) {
      throw new Error('プレーンが定義されていません');
    }

    Encoder.encode(args);

    for (const plane of args.planes) {
      blobs.push(plane.output.blob as ArrayBlob);
    }

    const firstPlane = args.planes[0];

    Ui.setVisible(Ui.parentLiOf(leftAlignBox), firstPlane.output.alignRequired);
    Ui.setVisible(
        Ui.parentLiOf(channelOrderBox), firstPlane.output.fields.length > 1);
    Ui.setVisible(
        Ui.parentLiOf(farPixelFirstBox), firstPlane.output.pixelsPerFrag > 1);
    Ui.setVisible(
        Ui.parentLiOf(vertPackBox), firstPlane.output.pixelsPerFrag > 1);
    Ui.setVisible(
        Ui.parentLiOf(bigEndianBox), firstPlane.output.bytesPerFrag > 1);

    {
      const fmt = args.src.format;
      const out = firstPlane.output;

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
            const iByte =
                firstPlane.bigEndian ? (out.bytesPerFrag - 1 - ib) : ib;
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
      let cellColors: string[];
      if (firstPlane.type == Encoder.PlaneType.DIRECT && !fmt.isIndexed &&
          fmt.colorSpace == ColorSpace.RGB) {
        cellColors = [
          'rgba(255,128,128,0.8)',
          'rgba(128,255,128,0.8)',
          'rgba(128,160,255,0.8)',
          'rgba(192,128,255,0.8)',
        ];
      } else {
        cellColors = ['rgba(255,255,255,0.8)'];
      }

      // チャネルの描画
      for (let ip = 0; ip < out.pixelsPerFrag; ip++) {
        const iPix =
            firstPlane.farPixelFirst ? (out.pixelsPerFrag - 1 - ip) : ip;
        for (const field of out.fields) {
          const r = pad + tableW - (ip * out.pixelStride + field.pos) * colW;
          const w = field.width * colW;
          const x = r - w;
          const y = pad + tableH - rowH;
          ctx.fillStyle = cellColors[field.srcChannel];
          ctx.fillRect(x, y, w, rowH);

          ctx.strokeStyle = '#000';
          ctx.strokeRect(x, y, w, rowH);

          ctx.fillStyle = '#000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let label: string;
          if (firstPlane.type == Encoder.PlaneType.INDEX_MATCH) {
            label = 'C';
          } else if (fmt.isIndexed) {
            label = 'Index';
          } else {
            label = fmt.channelName(field.srcChannel);
          }
          if (out.pixelsPerFrag > 1) {
            label += iPix.toString();
          }
          const mtx = ctx.measureText(label);
          ctx.fillText(label, x + w / 2, y + rowH / 2);
        }
      }
    }
    Ui.show(structCanvas);
    Ui.hide(structErrorBox);
  } catch (error) {
    Ui.hide(structCanvas);
    Ui.show(structErrorBox);
    if (error instanceof Error) {
      structErrorBox.textContent = `${error.stack}`;
    } else {
      structErrorBox.textContent = String(error);
    }
    codeErrorBox.textContent = 'エンコードのエラーを解消してください。';
    Ui.hide(codePlaneContainer);
    Ui.show(codeErrorBox);
    return;
  }

  try {
    const args = new CodeGen.CodeGenArgs();
    args.name = inputFileName.split('.')[0].replaceAll(/[-\s]/g, '_');
    args.src = reducedImage;
    args.blobs = blobs;
    args.codeUnit = parseInt(codeUnitBox.value);
    args.indent = parseInt(indentBox.value);
    args.arrayCols = Math.max(1, parseInt(codeColsBox.value));

    CodeGen.generate(args);

    codePlaneContainer.innerHTML = '';
    for (const code of args.codes) {
      const copyButton = Ui.makeButton('コピー');
      copyButton.style.float = 'right';

      const title = document.createElement('div');
      title.classList.add('codePlaneTitle');
      title.appendChild(document.createTextNode(code.name));
      title.appendChild(copyButton);

      const pre = document.createElement('pre');
      pre.textContent = code.code;

      const wrap = document.createElement('div');
      wrap.classList.add('codePlane');
      wrap.appendChild(title);
      wrap.appendChild(pre);

      if (code.numLines > 1000 && !keepShowLongCode) {
        const showCodeLink = document.createElement('a');
        showCodeLink.href = '#';
        showCodeLink.textContent = `表示する (${code.numLines} 行)`;

        const hiddenBox = document.createElement('div');
        hiddenBox.classList.add('codeHiddenBox');
        hiddenBox.style.textAlign = 'center';
        hiddenBox.innerHTML =
            `コードが非常に長いため非表示になっています。<br>`;
        hiddenBox.appendChild(showCodeLink);

        Ui.hide(pre);
        wrap.appendChild(hiddenBox);

        showCodeLink.addEventListener('click', (e) => {
          e.preventDefault();
          keepShowLongCode = true;
          Ui.show(pre);
          Ui.hide(hiddenBox);
        });
      }
      codePlaneContainer.appendChild(wrap);

      copyButton.addEventListener('click', () => {
        if (!pre.textContent) return;
        navigator.clipboard.writeText(pre.textContent);
      });
    }

    Ui.show(codePlaneContainer);
    Ui.hide(codeErrorBox);
  } catch (error) {
    if (error instanceof Error) {
      codeErrorBox.textContent = `${error.stack}`;
    } else {
      codeErrorBox.textContent = String(error);
    }
    Ui.hide(codePlaneContainer);
    Ui.show(codeErrorBox);
  }

  swDetail.lap('UI Update');
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