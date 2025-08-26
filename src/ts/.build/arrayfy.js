var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var _this = this;
var TrimState;
(function (TrimState) {
    TrimState[TrimState["IDLE"] = 0] = "IDLE";
    TrimState[TrimState["DRAG_TOP"] = 1] = "DRAG_TOP";
    TrimState[TrimState["DRAG_RIGHT"] = 2] = "DRAG_RIGHT";
    TrimState[TrimState["DRAG_BOTTOM"] = 3] = "DRAG_BOTTOM";
    TrimState[TrimState["DRAG_LEFT"] = 4] = "DRAG_LEFT";
})(TrimState || (TrimState = {}));
var ColorSpace;
(function (ColorSpace) {
    ColorSpace[ColorSpace["GRAYSCALE"] = 0] = "GRAYSCALE";
    ColorSpace[ColorSpace["RGB"] = 1] = "RGB";
})(ColorSpace || (ColorSpace = {}));
var ImageFormat = /** @class */ (function () {
    function ImageFormat() {
        this.colorSpace = ColorSpace.GRAYSCALE;
        this.channelDepth = [1];
    }
    ImageFormat.prototype.toString = function () {
        var ret = '';
        switch (this.colorSpace) {
            case ColorSpace.GRAYSCALE:
                if (this.channelDepth[0] == 1) {
                    return 'B/W';
                }
                else {
                    return 'Gray' + this.channelDepth[0];
                }
            case ColorSpace.RGB:
                return 'RGB' + this.channelDepth.join('');
            default:
                throw new Error('Unknown color space');
        }
    };
    return ImageFormat;
}());
var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
}());
var Rect = /** @class */ (function () {
    function Rect(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    return Rect;
}());
function toElementArray(children) {
    if (children === void 0) { children = []; }
    for (var i = 0; i < children.length; i++) {
        if (typeof children[i] === 'string') {
            children[i] = document.createTextNode(children[i]);
        }
    }
    return children;
}
function makeHeader(text) {
    var h = document.createElement('h3');
    h.textContent = text;
    return h;
}
function makeParagraph(children) {
    if (children === void 0) { children = []; }
    var p = document.createElement('p');
    toElementArray(children).forEach(function (child) { return p.appendChild(child); });
    return p;
}
function makeNoWrapSpan(children) {
    if (children === void 0) { children = []; }
    var span = document.createElement('span');
    span.style.marginRight = '10px';
    span.style.paddingRight = '10px';
    span.style.borderRight = 'solid 1px #ccc';
    span.style.whiteSpace = 'nowrap';
    span.style.display = 'inline-block';
    span.style.lineHeight = '30px';
    toElementArray(children).forEach(function (child) { return span.appendChild(child); });
    return span;
}
function makeSectionLabel(text) {
    var span = makeNoWrapSpan([text]);
    span.style.width = '100px';
    span.style.borderStyle = 'none';
    span.style.borderRadius = '5px';
    span.style.padding = '0px';
    span.style.background = '#eee';
    span.style.textAlign = 'center';
    span.style.fontWeight = 'bold';
    return span;
}
function makeTextBox(value, placeholder, maxLength) {
    if (value === void 0) { value = ''; }
    if (placeholder === void 0) { placeholder = ''; }
    if (maxLength === void 0) { maxLength = 100; }
    var input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.placeholder = placeholder;
    input.style.width = '50px';
    input.style.textAlign = 'right';
    input.maxLength = maxLength;
    return input;
}
function makeSelectBox(dict, defaultValue) {
    var e_1, _a;
    if (dict === void 0) { dict = {}; }
    if (defaultValue === void 0) { defaultValue = ''; }
    var select = document.createElement('select');
    try {
        for (var _b = __values(Object.entries(dict)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), value = _d[0], label = _d[1];
            var option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    select.value = defaultValue;
    return select;
}
function makeCheckBox(labelText) {
    var label = document.createElement('label');
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(labelText));
    return checkbox;
}
function makeButton(text) {
    if (text === void 0) { text = ''; }
    var button = document.createElement('button');
    button.textContent = text;
    return button;
}
function makePresetButton(name, text, description) {
    var button = makeButton(text);
    button.dataset.presetName = name;
    button.style.height = '50px';
    button.style.margin = '10px 5px 10px 0px';
    button.style.padding = '5px 10px';
    button.style.textAlign = 'center';
    button.style.verticalAlign = 'middle';
    var span = document.createElement('span');
    span.textContent = description;
    span.style.fontSize = '12px';
    button.appendChild(document.createElement('br'));
    button.appendChild(span);
    button.addEventListener('click', function () {
        loadPreset(name);
    });
    return button;
}
var hiddenFileBox = document.createElement('input');
var dropTarget = document.createElement('div');
var origCanvas = document.createElement('canvas');
var bgColorBox = makeTextBox('#000');
var resetTrimButton = makeButton('範囲をリセット');
var trimCanvas = document.createElement('canvas');
var gammaBox = makeTextBox('100', '(auto)', 5);
var brightnessBox = makeTextBox('100', '(auto)', 5);
var contrastBox = makeTextBox('100', '(auto)', 5);
var invertBox = makeCheckBox('階調反転');
var presetRgb565Be = makePresetButton('rgb565_be', 'RGB565-BE', '各種 16bit カラー液晶');
var presetRgb332 = makePresetButton('rgb332', 'RGB332', '各種 GFX ライブラリ');
var presetBwVpLf = makePresetButton('bw_vp_lf', '白黒 縦パッキング', 'SSD1306/1309, 他...');
var presetBwHpMf = makePresetButton('bw_hp_mf', '白黒 横パッキング', 'SHARPメモリ液晶, 他...');
var formatBox = makeSelectBox({
    rgb565: 'RGB565',
    rgb555: 'RGB555',
    rgb332: 'RGB332',
    rgb111: 'RGB111',
    gray4: 'Gray4',
    gray2: 'Gray2',
    bw: 'B/W',
}, 'rgb565');
var widthBox = makeTextBox('', '(auto)', 4);
var heightBox = makeTextBox('', '(auto)', 4);
var scalingMethodBox = makeSelectBox({
    zoom: 'ズーム',
    fit: 'フィット',
    stretch: 'ストレッチ',
}, 'zoom');
var ditherBox = makeSelectBox({
    none: 'なし',
    diffusion: '誤差拡散',
}, 'diffusion');
var previewCanvas = document.createElement('canvas');
var quantizeErrorBox = document.createElement('span');
var channelOrderBox = makeSelectBox({
    lsbRed: '下位から',
    msbRed: '上位から',
}, 'msbRed');
var pixelOrderBox = makeSelectBox({
    lsb1st: '下位から',
    msb1st: '上位から',
}, 'msb1st');
var byteOrderBox = makeSelectBox({
    le: 'Little Endian',
    be: 'Big Endian',
}, 'be');
var packingBox = makeSelectBox({
    hori: '横',
    vert: '縦',
}, 'hori');
var addressingBox = makeSelectBox({
    hori: '水平',
    vert: '垂直',
}, 'hori');
var codeColsBox = makeTextBox('16', '', 3);
var indentBox = makeSelectBox({
    sp2: 'スペース x2',
    sp4: 'スペース x4',
    tab: 'タブ',
}, 'sp2');
var arrayCode = document.createElement('pre');
var codeGenErrorBox = document.createElement('p');
var copyButton = makeButton('コードをコピー');
var container = null;
var updateTrimCanvasTimeoutId = -1;
var quantizeTimeoutId = -1;
var generateCodeTimeoutId = -1;
var worldX0 = 0, worldY0 = 0, zoom = 1;
var trimL = 0, trimT = 0, trimR = 1, trimB = 1;
var trimUiState = TrimState.IDLE;
var imageCacheFormat = new ImageFormat();
var imageCacheData = [null, null, null, null];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var fileBrowseButton, p, p, p, p, p, p, p, p, p, p, p, div;
        return __generator(this, function (_a) {
            container = document.querySelector('#arrayfyContainer');
            {
                // 「ファイルが選択されていません」の表示が邪魔なので button で wrap する
                hiddenFileBox.type = 'file';
                hiddenFileBox.accept = 'image/*';
                hiddenFileBox.style.display = 'none';
                fileBrowseButton = makeButton('選択');
                fileBrowseButton.addEventListener('click', function () {
                    hiddenFileBox.click();
                });
                dropTarget.style.width = '100%';
                dropTarget.style.padding = '30px 0px 30px 0px';
                dropTarget.style.boxSizing = 'border-box';
                dropTarget.style.borderRadius = '5px';
                dropTarget.style.backgroundColor = '#cde';
                dropTarget.style.textAlign = 'center';
                dropTarget.appendChild(document.createTextNode('ここに画像をドロップ、貼り付け、または '));
                dropTarget.appendChild(fileBrowseButton);
                p = makeParagraph([dropTarget]);
                p.style.textAlign = 'center';
                container.appendChild(p);
            }
            {
                p = makeParagraph([
                    makeSectionLabel('トリミング'),
                    makeNoWrapSpan(['透明部分の背景色: ', bgColorBox]),
                    makeNoWrapSpan([resetTrimButton]),
                ]);
                container.appendChild(p);
                p.querySelectorAll('input, button').forEach(function (el) {
                    el.addEventListener('change', function () {
                        requestUpdateTrimCanvas();
                        requestQuantize();
                    });
                    el.addEventListener('input', function () {
                        requestUpdateTrimCanvas();
                        requestQuantize();
                    });
                });
            }
            {
                trimCanvas.style.maxWidth = '100%';
                trimCanvas.style.boxSizing = 'border-box';
                trimCanvas.style.backgroundColor = '#444';
                p = makeParagraph([trimCanvas]);
                p.style.textAlign = 'center';
                container.appendChild(p);
            }
            {
                p = makeParagraph([
                    makeSectionLabel('色調補正'),
                    makeNoWrapSpan(['ガンマ: ', gammaBox, '%']),
                    makeNoWrapSpan(['明度: ', brightnessBox, '%']),
                    makeNoWrapSpan(['コントラスト: ', contrastBox, '%']),
                    makeNoWrapSpan([invertBox.parentNode]),
                ]);
                container.appendChild(p);
                p.querySelectorAll('input, select').forEach(function (el) {
                    el.addEventListener('change', function () {
                        requestQuantize();
                    });
                    el.addEventListener('input', function () {
                        requestQuantize();
                    });
                });
            }
            {
                p = makeParagraph([
                    makeSectionLabel('出力サイズ'),
                    makeNoWrapSpan([widthBox, ' x ', heightBox, ' px']),
                    makeNoWrapSpan(['拡縮方法: ', scalingMethodBox]),
                ]);
                container.appendChild(p);
                p.querySelectorAll('input, select').forEach(function (el) {
                    el.addEventListener('change', function () {
                        requestQuantize();
                    });
                    el.addEventListener('input', function () {
                        requestQuantize();
                    });
                });
            }
            {
                p = makeParagraph([
                    makeSectionLabel('プリセット'),
                    '選んでください: ', document.createElement('br'), presetRgb565Be, ' ',
                    presetRgb332, ' ', presetBwVpLf, ' ', presetBwHpMf,
                    document.createElement('br'), '※選択すると以降の設定は上書きされます'
                ]);
                container.appendChild(p);
            }
            {
                p = makeParagraph([
                    makeSectionLabel('量子化'),
                    makeNoWrapSpan(['フォーマット: ', formatBox]),
                    makeNoWrapSpan(['ディザリング: ', ditherBox]),
                ]);
                container.appendChild(p);
                p.querySelectorAll('input, select').forEach(function (el) {
                    el.addEventListener('change', function () {
                        requestQuantize();
                    });
                    el.addEventListener('input', function () {
                        requestQuantize();
                    });
                });
            }
            {
                previewCanvas.style.maxWidth = '100%';
                previewCanvas.style.boxSizing = 'border-box';
                previewCanvas.style.border = '1px solid #444';
                previewCanvas.style.backgroundColor = '#444';
                quantizeErrorBox.style.color = 'red';
                quantizeErrorBox.style.display = 'none';
                p = makeParagraph([previewCanvas, quantizeErrorBox]);
                p.style.textAlign = 'center';
                container.appendChild(p);
            }
            {
                p = makeParagraph([
                    makeSectionLabel('エンコード'),
                    makeNoWrapSpan(['チャネル順: ', channelOrderBox]),
                    makeNoWrapSpan(['ピクセル順: ', pixelOrderBox]),
                    makeNoWrapSpan(['バイト順: ', byteOrderBox]),
                    makeNoWrapSpan(['パッキング方向: ', packingBox]),
                    makeNoWrapSpan(['アドレス方向: ', addressingBox]),
                ]);
                container.appendChild(p);
                p.querySelectorAll('input, select').forEach(function (el) {
                    el.addEventListener('change', function () {
                        requestGenerateCode();
                    });
                    el.addEventListener('input', function () {
                        requestGenerateCode();
                    });
                });
            }
            {
                p = makeParagraph([
                    makeSectionLabel('コード生成'), makeNoWrapSpan(['列数: ', codeColsBox]),
                    makeNoWrapSpan(['インデント: ', indentBox])
                ]);
                container.appendChild(p);
                p.querySelectorAll('input, select').forEach(function (el) {
                    el.addEventListener('change', function () {
                        requestGenerateCode();
                    });
                    el.addEventListener('input', function () {
                        requestGenerateCode();
                    });
                });
            }
            {
                p = makeParagraph([copyButton]);
                p.style.textAlign = 'right';
                container.appendChild(p);
            }
            {
                div = document.createElement('div');
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
            hiddenFileBox.addEventListener('change', function (e) {
                var input = e.target;
                if (input.files && input.files[0]) {
                    loadFile(input.files[0]);
                }
            });
            // ドラッグ & ドロップ
            dropTarget.addEventListener('dragover', function (e) {
                e.preventDefault();
            });
            dropTarget.addEventListener('dragleave', function (e) {
                e.preventDefault();
            });
            dropTarget.addEventListener('drop', function (e) {
                var e_2, _a;
                e.preventDefault();
                var items = e.dataTransfer.items;
                try {
                    for (var items_1 = __values(items), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
                        var item = items_1_1.value;
                        if (item.kind === 'file') {
                            loadFile(item.getAsFile());
                            break;
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            });
            // 貼り付け
            dropTarget.addEventListener('paste', function (e) {
                var e_3, _a;
                var items = e.clipboardData.items;
                try {
                    for (var items_2 = __values(items), items_2_1 = items_2.next(); !items_2_1.done; items_2_1 = items_2.next()) {
                        var item = items_2_1.value;
                        if (item.kind === 'file') {
                            loadFile(item.getAsFile());
                            break;
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (items_2_1 && !items_2_1.done && (_a = items_2.return)) _a.call(items_2);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            });
            // トリミング操作
            trimCanvas.addEventListener('pointermove', function (e) {
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
                }
                else {
                    var _a = trimViewToWorld(e.offsetX, e.offsetY), x = _a.x, y = _a.y;
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
            trimCanvas.addEventListener('pointerdown', function (e) {
                e.preventDefault();
                if (trimViewToNextState(e.offsetX, e.offsetY) != TrimState.IDLE) {
                    trimUiState = trimViewToNextState(e.offsetX, e.offsetY);
                    trimCanvas.style.cursor = 'grabbing';
                    trimCanvas.setPointerCapture(e.pointerId);
                }
            });
            trimCanvas.addEventListener('pointerup', function (e) {
                e.preventDefault();
                trimUiState = TrimState.IDLE;
                trimCanvas.style.cursor = 'default';
                trimCanvas.releasePointerCapture(e.pointerId);
                requestUpdateTrimCanvas();
            });
            resetTrimButton.addEventListener('click', function () {
                resetTrim();
            });
            // コードのコピー
            copyButton.addEventListener('click', function () {
                if (!arrayCode.textContent)
                    return;
                navigator.clipboard.writeText(arrayCode.textContent);
            });
            return [2 /*return*/];
        });
    });
} // main
function loadFile(file) {
    var reader = new FileReader();
    reader.onload = function (event) {
        var img = new Image();
        img.onload = function () {
            origCanvas.width = img.width;
            origCanvas.height = img.height;
            var ctx = origCanvas.getContext('2d', { willReadFrequently: true });
            ctx.clearRect(0, 0, img.width, img.height);
            ctx.drawImage(img, 0, 0);
            resetTrim();
            quantize();
            requestUpdateTrimCanvas();
        };
        if (typeof event.target.result === 'string') {
            img.src = event.target.result;
        }
        else {
            throw new Error('Invalid image data');
        }
    };
    reader.readAsDataURL(file);
}
// トリミングのリセット
function resetTrim() {
    trimL = 0;
    trimT = 0;
    trimR = origCanvas.width;
    trimB = origCanvas.height;
    requestUpdateTrimCanvas();
    requestQuantize();
}
// トリミングUIのビュー領域の取得
function getTrimViewArea() {
    var margin = 20;
    var canvasW = trimCanvas.width;
    var canvasH = trimCanvas.height;
    var viewX0 = canvasW / 2;
    var viewY0 = canvasH / 2;
    var viewW = canvasW - margin * 2;
    var viewH = canvasH - margin * 2;
    return new Rect(viewX0, viewY0, viewW, viewH);
}
// トリミングUIのワールド座標をビュー座標に変換
function trimWorldToView(x, y) {
    var view = getTrimViewArea();
    return new Point(view.x + (x - worldX0) * zoom, view.y + (y - worldY0) * zoom);
}
// トリミングUIのビュー座標をワールド座標に変換
function trimViewToWorld(x, y) {
    var view = getTrimViewArea();
    return new Point((x - view.x) / zoom + worldX0, (y - view.y) / zoom + worldY0);
}
// ポイントされているビュー座標からトリミングUIの次の状態を取得
function trimViewToNextState(x, y) {
    var _a = trimWorldToView(trimL, trimT), trimViewL = _a.x, trimViewT = _a.y;
    var _b = trimWorldToView(trimR, trimB), trimViewR = _b.x, trimViewB = _b.y;
    if (Math.abs(x - trimViewL) < 10)
        return TrimState.DRAG_LEFT;
    if (Math.abs(x - trimViewR) < 10)
        return TrimState.DRAG_RIGHT;
    if (Math.abs(y - trimViewT) < 10)
        return TrimState.DRAG_TOP;
    if (Math.abs(y - trimViewB) < 10)
        return TrimState.DRAG_BOTTOM;
    return TrimState.IDLE;
}
function requestUpdateTrimCanvas() {
    if (updateTrimCanvasTimeoutId >= 0)
        return;
    updateTrimCanvasTimeoutId = setTimeout(function () {
        updateTrimCanvas();
    }, 10);
}
function updateTrimCanvas() {
    if (updateTrimCanvasTimeoutId >= 0) {
        clearTimeout(updateTrimCanvasTimeoutId);
        updateTrimCanvasTimeoutId = -1;
    }
    var rect = container.getBoundingClientRect();
    trimCanvas.width = rect.width;
    trimCanvas.height = Math.ceil(rect.width / 2);
    var canvasW = trimCanvas.width;
    var canvasH = trimCanvas.height;
    var origW = origCanvas.width;
    var origH = origCanvas.height;
    var view = getTrimViewArea();
    if (trimUiState == TrimState.IDLE) {
        // ビューに触れていない間に座標系を調整
        var worldL = Math.min(trimL, 0);
        var worldR = Math.max(trimR, origW);
        var worldT = Math.min(trimT, 0);
        var worldB = Math.max(trimB, origH);
        var worldW = worldR - worldL;
        var worldH = worldB - worldT;
        worldX0 = (worldL + worldR) / 2;
        worldY0 = (worldT + worldB) / 2;
        var worldAspect = worldW / Math.max(1, worldH);
        var viewAspect = view.width / Math.max(1, view.height);
        if (worldAspect > viewAspect) {
            zoom = view.width / Math.max(1, worldW);
        }
        else {
            zoom = view.height / Math.max(1, worldH);
        }
    }
    var _a = trimWorldToView(trimL, trimT), trimViewL = _a.x, trimViewT = _a.y;
    var _b = trimWorldToView(trimR, trimB), trimViewR = _b.x, trimViewB = _b.y;
    var ctx = trimCanvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = bgColorBox.value;
    ctx.fillRect(trimViewL, trimViewT, trimViewR - trimViewL, trimViewB - trimViewT);
    // 画像描画
    {
        var dx = view.x - worldX0 * zoom;
        var dy = view.y - worldY0 * zoom;
        var dw = origCanvas.width * zoom;
        var dh = origCanvas.height * zoom;
        ctx.drawImage(origCanvas, dx, dy, dw, dh);
    }
    // トリミングのガイド線描画
    {
        var lineWidth = 3;
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
function loadPreset(name) {
    var e_4, _a;
    var PRESETS = {
        rgb565_be: { fmt: 'rgb565', chOrder: 'msbRed', byteOrder: 'be', addrDir: 'hori' },
        rgb332: { fmt: 'rgb332', chOrder: 'msbRed', addrDir: 'hori' },
        bw_vp_lf: { fmt: 'bw', pixOrder: 'lsb1st', packDir: 'vert', addrDir: 'hori' },
        bw_hp_mf: { fmt: 'bw', pixOrder: 'msb1st', packDir: 'hori', addrDir: 'hori' },
    };
    if (!(name in PRESETS)) {
        throw new Error("Unknown preset: ".concat(name));
    }
    try {
        for (var _b = __values(Object.entries(PRESETS[name])), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
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
                    throw new Error("Unknown key: ".concat(key));
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_4) throw e_4.error; }
    }
    requestQuantize();
}
function requestQuantize() {
    if (quantizeTimeoutId >= 0)
        return;
    quantizeTimeoutId = setTimeout(function () {
        quantize();
    }, 300);
}
function quantize() {
    if (quantizeTimeoutId >= 0) {
        clearTimeout(quantizeTimeoutId);
        quantizeTimeoutId = -1;
    }
    try {
        var origCtx = origCanvas.getContext('2d', { willReadFrequently: true });
        var srcW = Math.round(trimR - trimL);
        var srcH = Math.round(trimB - trimT);
        var outW = srcW;
        var outH = srcH;
        // 出力サイズ決定
        if (widthBox.value && heightBox.value) {
            outW = parseInt(widthBox.value);
            outH = parseInt(heightBox.value);
            widthBox.placeholder = '';
            heightBox.placeholder = '';
            scalingMethodBox.disabled = false;
        }
        else if (widthBox.value) {
            outW = parseInt(widthBox.value);
            outH = Math.ceil(srcH * (outW / srcW));
            widthBox.placeholder = '';
            heightBox.placeholder = '(' + outH + ')';
            scalingMethodBox.disabled = true;
        }
        else if (heightBox.value) {
            outH = parseInt(heightBox.value);
            outW = Math.ceil(srcW * (outH / srcH));
            widthBox.placeholder = '(' + outW + ')';
            heightBox.placeholder = '';
            scalingMethodBox.disabled = true;
        }
        else {
            if (outW > 256 || outH > 256) {
                var scale = Math.min(256 / outW, 256 / outH);
                outW = Math.floor(outW * scale);
                outH = Math.floor(outH * scale);
            }
            widthBox.placeholder = '(' + outW + ')';
            heightBox.placeholder = '(' + outH + ')';
            scalingMethodBox.disabled = true;
        }
        // トリミング + リサイズの適用
        {
            var outCtx = previewCanvas.getContext('2d', { willReadFrequently: true });
            previewCanvas.width = outW;
            previewCanvas.height = outH;
            // 背景色の適用
            outCtx.fillStyle = bgColorBox.value;
            outCtx.fillRect(0, 0, outW, outH);
            {
                // トリミング + リサイズ
                var srcX0 = (trimL + trimR) / 2;
                var srcY0 = (trimT + trimB) / 2;
                var srcAspect = srcW / srcH;
                var outAspect = outW / outH;
                var scaleX = void 0, scaleY = void 0;
                switch (scalingMethodBox.value) {
                    case 'zoom':
                        if (srcAspect > outAspect) {
                            scaleX = scaleY = outH / srcH;
                        }
                        else {
                            scaleX = scaleY = outW / srcW;
                        }
                        break;
                    case 'fit':
                        if (srcAspect > outAspect) {
                            scaleX = scaleY = outW / srcW;
                        }
                        else {
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
                var dx = outW / 2 + (trimL - srcX0) * scaleX;
                var dy = outH / 2 + (trimT - srcY0) * scaleY;
                var dw = srcW * scaleX;
                var dh = srcH * scaleY;
                outCtx.drawImage(origCanvas, trimL, trimT, srcW, srcH, dx, dy, dw, dh);
            }
        }
        var fmt = new ImageFormat();
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
        // 量子化の適用
        {
            var previewCtx = previewCanvas.getContext('2d', { willReadFrequently: true });
            var previewImageData = previewCtx.getImageData(0, 0, outW, outH);
            var srcRgbData = previewImageData.data;
            var previewData = new Uint8Array(srcRgbData.length);
            var numPixels = outW * outH;
            var numChannels = fmt.colorSpace === ColorSpace.GRAYSCALE ? 1 : 3;
            var normChannels = [];
            var outData = [];
            for (var i = 0; i < numChannels; i++) {
                normChannels.push(new Float32Array(numPixels));
                outData.push(new Uint8Array(numPixels));
            }
            // 正規化
            var grayMin = 255;
            var grayMax = 0;
            var grayAvg = 0;
            for (var i = 0; i < numPixels; i++) {
                var r = srcRgbData[i * 4] / 255;
                var g = srcRgbData[i * 4 + 1] / 255;
                var b = srcRgbData[i * 4 + 2] / 255;
                var gray = 0.299 * r + 0.587 * g + 0.114 * b;
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
                grayAvg += gray;
                grayMin = Math.min(grayMin, gray);
                grayMax = Math.max(grayMax, gray);
            }
            grayAvg /= numPixels;
            // ガンマ決定
            var gamma = 1;
            if (gammaBox.value) {
                gamma = parseFloat(gammaBox.value) / 100;
                gammaBox.placeholder = '';
            }
            gamma = Math.max(0.01, Math.min(5, gamma));
            gammaBox.placeholder = '(' + Math.round(gamma * 100) + ')';
            // 明度決定
            var brightness = 1;
            if (brightnessBox.value) {
                brightness = parseFloat(brightnessBox.value) / 100;
                brightnessBox.placeholder = '';
            }
            else {
                if (grayAvg > 0)
                    brightness = 0.5 / grayAvg;
            }
            brightness = Math.max(0.01, Math.min(10, brightness));
            brightnessBox.placeholder = '(' + Math.round(brightness * 100) + ')';
            // コントラスト決定
            var contrast = 1;
            if (contrastBox.value) {
                contrast = parseFloat(contrastBox.value) / 100;
                contrastBox.placeholder = '';
            }
            else {
                if (grayMax > grayMin)
                    contrast = 1 / (grayMax - grayMin);
            }
            contrast = Math.max(0.01, Math.min(10, contrast));
            contrastBox.placeholder = '(' + Math.round(contrast * 100) + ')';
            var invert = invertBox.checked;
            var diffusion = ditherBox.value === 'diffusion';
            // 明度・コントラスト・階調反転適用
            for (var ch = 0; ch < numChannels; ch++) {
                for (var i = 0; i < numPixels; i++) {
                    var val = normChannels[ch][i];
                    val = Math.pow(val, 1 / gamma);
                    val = ((val * brightness) - 0.5) * contrast + 0.5;
                    if (invert)
                        val = 1 - val;
                    normChannels[ch][i] = val;
                }
            }
            // 量子化
            for (var ch = 0; ch < numChannels; ch++) {
                var norm = normChannels[ch];
                var range = (1 << fmt.channelDepth[ch]) - 1;
                for (var y = 0; y < outH; y++) {
                    for (var x = 0; x < outW; x++) {
                        var i = (y * outW + x);
                        var normIn = norm[i];
                        // 量子化
                        var out = Math.round(range * Math.max(0, Math.min(1, normIn)));
                        var normOut = out / range;
                        outData[ch][i] = out;
                        // プレビューの色生成
                        if (fmt.colorSpace === ColorSpace.GRAYSCALE) {
                            previewData[i * 4] = previewData[i * 4 + 1] =
                                previewData[i * 4 + 2] = Math.round(out * 255 / range);
                        }
                        else {
                            previewData[i * 4 + ch] = Math.round(out * 255 / range);
                        }
                        var error = normIn - normOut;
                        error *= 0.99; // 減衰
                        if (-0.01 < error && error < 0.01) {
                            // 小さな誤差は無視する
                            error = 0;
                        }
                        if (diffusion && error != 0) {
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
                        } // if diffusion
                    } // for x
                } // for y
            } // for ch
            // アルファチャンネル
            for (var i = 0; i < numPixels; i++) {
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
            var borderWidth = 1;
            var rect = container.getBoundingClientRect();
            var viewW = rect.width - (borderWidth * 2);
            var viewH = Math.ceil(viewW / 2);
            var zoom_1 = Math.max(1, Math.floor(Math.min(viewW / outW, viewH / outH)));
            previewCanvas.style.width = "".concat(outW * zoom_1 + (borderWidth * 2), "px");
            previewCanvas.style.height = 'auto';
            previewCanvas.style.imageRendering = 'pixelated';
        }
    }
    catch (error) {
        previewCanvas.style.display = 'none';
        arrayCode.style.display = 'none';
        quantizeErrorBox.style.display = 'inline';
        quantizeErrorBox.textContent = error.message;
    }
}
function requestGenerateCode() {
    if (generateCodeTimeoutId !== -1) {
        clearTimeout(generateCodeTimeoutId);
    }
    generateCodeTimeoutId = setTimeout(function () {
        generateCode();
        generateCodeTimeoutId = -1;
    }, 300);
}
function generateCode() {
    if (!imageCacheData) {
        arrayCode.textContent = '';
        arrayCode.style.display = 'block';
        codeGenErrorBox.style.display = 'none';
        return;
    }
    try {
        // チャネル順
        var msbRed = channelOrderBox.value == 'msbRed';
        // ピクセルオーダー
        var msb1st = pixelOrderBox.value === 'msb1st';
        // パッキング方向
        var vertPack = packingBox.value === 'vert';
        // アドレッシング
        var vertAddr = addressingBox.value === 'vert';
        // バイトオーダー
        var bigEndian = byteOrderBox.value === 'be';
        // ピクセルあたりのビット数
        var numChannels = imageCacheData.length;
        var bitsPerPixel = 0;
        for (var i = 0; i < numChannels; i++) {
            bitsPerPixel += imageCacheFormat.channelDepth[i];
        }
        // エンコードパラメータ
        var pixelsPerPack = Math.max(1, Math.floor(8 / bitsPerPixel));
        var bytesPerPack = Math.ceil(bitsPerPixel / 8);
        var packWidth = vertPack ? 1 : pixelsPerPack;
        var packHeight = vertPack ? pixelsPerPack : 1;
        // 1 チャネルのときはチャネル順指定無効
        channelOrderBox.disabled = (numChannels <= 1);
        // 1 byte/pack 以下のときはエンディアン指定無効
        byteOrderBox.disabled = (bytesPerPack <= 1);
        // 1 pixel/byte 以下のときはパッキング設定無効
        pixelOrderBox.disabled = (pixelsPerPack <= 1);
        packingBox.disabled = (pixelsPerPack <= 1);
        // 列数決定
        var arrayCols = 16;
        if (codeColsBox.value) {
            arrayCols = parseInt(codeColsBox.value);
            codeColsBox.placeholder = '';
        }
        else {
            codeColsBox.placeholder = '(' + arrayCols + ')';
        }
        // インデント決定
        var indent = '  ';
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
        var width = previewCanvas.width;
        var height = previewCanvas.height;
        var cols = Math.ceil(width / packWidth);
        var rows = Math.ceil(height / packHeight);
        var numPacks = cols * rows;
        var arrayData = new Uint8Array(numPacks * bytesPerPack);
        // 配列化
        var byteIndex = 0;
        for (var packIndex = 0; packIndex < numPacks; packIndex++) {
            var xCoarse = void 0, yCoarse = void 0;
            if (vertAddr) {
                xCoarse = packWidth * Math.floor(packIndex / rows);
                yCoarse = packHeight * (packIndex % rows);
            }
            else {
                xCoarse = packWidth * (packIndex % cols);
                yCoarse = packHeight * Math.floor(packIndex / cols);
            }
            // パッキング
            var packData = 0;
            var pixPos = msb1st ? (bitsPerPixel * pixelsPerPack) : 0;
            for (var yFine = 0; yFine < packHeight; yFine++) {
                for (var xFine = 0; xFine < packWidth; xFine++) {
                    var x = xCoarse + xFine;
                    var y = yCoarse + yFine;
                    // ピクセルのエンコード
                    var pixData = 0;
                    var chPos = msbRed ? bitsPerPixel : 0;
                    for (var ch = 0; ch < numChannels; ch++) {
                        var val = imageCacheData[ch][y * width + x];
                        var chBits = imageCacheFormat.channelDepth[ch];
                        if (msbRed) {
                            chPos -= chBits;
                            pixData |= val << chPos;
                        }
                        else {
                            pixData |= val << chPos;
                            chPos += chBits;
                        }
                    } // for ch
                    if (msb1st) {
                        pixPos -= bitsPerPixel;
                        packData |= pixData << pixPos;
                    }
                    else {
                        packData |= pixData << pixPos;
                        pixPos += bitsPerPixel;
                    }
                } // for xFine
            } // for yFine
            // バイト単位に変換
            for (var j = 0; j < bytesPerPack; j++) {
                if (bigEndian) {
                    arrayData[byteIndex++] =
                        (packData >> ((bytesPerPack - 1) * 8)) & 0xFF;
                    packData <<= 8;
                }
                else {
                    arrayData[byteIndex++] = packData & 0xFF;
                    packData >>= 8;
                }
            }
        } // for packIndex
        // コード生成
        var code = '';
        code += "// ".concat(width, "x").concat(height, "px, ").concat(imageCacheFormat.toString(), "\n");
        {
            code += "// ";
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
            code += "".concat(vertAddr ? 'Vertical' : 'Horizontal', " Adressing\n");
        }
        code += "// ".concat(arrayData.length, " Bytes\n");
        code += 'const uint8_t imageArray[] = {\n';
        for (var i = 0; i < arrayData.length; i++) {
            if (i % arrayCols == 0)
                code += indent;
            code += '0x' + arrayData[i].toString(16).padStart(2, '0') + ',';
            if ((i + 1) % arrayCols == 0 || i + 1 == arrayData.length) {
                code += '\n';
            }
            else {
                code += ' ';
            }
        }
        code += '};';
        arrayCode.textContent = code;
        arrayCode.style.display = 'block';
        codeGenErrorBox.style.display = 'none';
    }
    catch (error) {
        arrayCode.style.display = 'none';
        codeGenErrorBox.textContent = error.message;
        codeGenErrorBox.style.display = 'block';
    }
}
document.addEventListener('DOMContentLoaded', function (e) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, main()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
