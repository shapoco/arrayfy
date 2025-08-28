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
var Preset = /** @class */ (function () {
    function Preset(label, description, format, ops) {
        var e_1, _a;
        if (ops === void 0) { ops = {}; }
        this.label = label;
        this.description = description;
        this.format = format;
        this.channelOrder = 1 /* BitOrder.MSB_FIRST */;
        this.pixelOrder = 1 /* BitOrder.MSB_FIRST */;
        this.byteOrder = 1 /* ByteOrder.BIG_ENDIAN */;
        this.packUnit = 1 /* PackUnit.PIXEL */;
        this.packDir = 0 /* ScanDir.HORIZONTAL */;
        this.alignUnit = 8 /* AlignBoundary.BYTE */;
        this.alignDir = 1 /* AlignDir.LOWER */;
        this.addrDir = 0 /* ScanDir.HORIZONTAL */;
        try {
            for (var _b = __values(Object.keys(ops)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var k = _c.value;
                if (!(k in this)) {
                    throw new Error("Unknown property '".concat(k, "'"));
                }
                this[k] = ops[k];
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    return Preset;
}());
var presets = {
    // argb8888_be: new Preset(
    //    'ARGB8888',
    //    '透明度付きフルカラー。\n各種 GFX
    //    ライブラリで透明ピクセルを含む画像を扱う場合に。',
    //    PixelFormat.ARGB8888,
    //    {packUnit: PackUnit.UNPACKED},
    //    ),
    rgb888_be: new Preset('RGB888', 'フルカラー。24bit 液晶用。', 0 /* PixelFormat.RGB888 */, { packUnit: 2 /* PackUnit.UNPACKED */ }),
    rgb666_be: new Preset('RGB666', '18bit 液晶用。', 1 /* PixelFormat.RGB666 */, { packUnit: 2 /* PackUnit.UNPACKED */ }),
    rgb565_be: new Preset('RGB565', 'ハイカラー。\n各種 GFX ライブラリでの使用を含め、\n組み込み用途で一般的な形式。', 2 /* PixelFormat.RGB565 */),
    rgb332: new Preset('RGB332', '各種 GFX ライブラリ用。', 4 /* PixelFormat.RGB332 */),
    bw_hp_mf: new Preset('白黒 横パッキング', '各種 GFX ライブラリ用。', 8 /* PixelFormat.BW */, {
        packUnit: 0 /* PackUnit.FRAGMENT */,
        pixelOrder: 1 /* BitOrder.MSB_FIRST */,
        packDir: 0 /* ScanDir.HORIZONTAL */,
    }),
    bw_vp_lf: new Preset('白黒 縦パッキング', 'SPI/I2C ドライバを使用して\nSSD1306/1309 等の白黒ディスプレイに直接転送可能。', 8 /* PixelFormat.BW */, {
        packUnit: 0 /* PackUnit.FRAGMENT */,
        pixelOrder: 0 /* BitOrder.LSB_FIRST */,
        packDir: 1 /* ScanDir.VERTICAL */,
    }),
};
var PixelFormatInfo = /** @class */ (function () {
    function PixelFormatInfo(fmt) {
        switch (fmt) {
            case 0 /* PixelFormat.RGB888 */:
                this.colorSpace = 1 /* ColorSpace.RGB */;
                this.channelBits = [8, 8, 8];
                break;
            case 1 /* PixelFormat.RGB666 */:
                this.colorSpace = 1 /* ColorSpace.RGB */;
                this.channelBits = [6, 6, 6];
                break;
            case 2 /* PixelFormat.RGB565 */:
                this.colorSpace = 1 /* ColorSpace.RGB */;
                this.channelBits = [5, 6, 5];
                break;
            case 3 /* PixelFormat.RGB555 */:
                this.colorSpace = 1 /* ColorSpace.RGB */;
                this.channelBits = [5, 5, 5];
                break;
            case 4 /* PixelFormat.RGB332 */:
                this.colorSpace = 1 /* ColorSpace.RGB */;
                this.channelBits = [3, 3, 2];
                break;
            case 5 /* PixelFormat.RGB111 */:
                this.colorSpace = 1 /* ColorSpace.RGB */;
                this.channelBits = [1, 1, 1];
                break;
            case 6 /* PixelFormat.GRAY4 */:
                this.colorSpace = 0 /* ColorSpace.GRAYSCALE */;
                this.channelBits = [4];
                break;
            case 7 /* PixelFormat.GRAY2 */:
                this.colorSpace = 0 /* ColorSpace.GRAYSCALE */;
                this.channelBits = [2];
                break;
            case 8 /* PixelFormat.BW */:
                this.colorSpace = 0 /* ColorSpace.GRAYSCALE */;
                this.channelBits = [1];
                break;
            default:
                throw new Error('Unknown image format');
        }
    }
    PixelFormatInfo.prototype.toString = function () {
        var ret = '';
        switch (this.colorSpace) {
            case 0 /* ColorSpace.GRAYSCALE */:
                if (this.channelBits[0] == 1) {
                    return 'B/W';
                }
                else {
                    return 'Gray' + this.channelBits[0];
                }
            case 1 /* ColorSpace.RGB */:
                return 'RGB' + this.channelBits.join('');
            default:
                throw new Error('Unknown color space');
        }
    };
    Object.defineProperty(PixelFormatInfo.prototype, "numChannels", {
        get: function () {
            return this.channelBits.length;
        },
        enumerable: false,
        configurable: true
    });
    return PixelFormatInfo;
}());
var Palette = /** @class */ (function () {
    function Palette(format, roundMethod) {
        this.format = format;
        this.roundMethod = roundMethod;
        this.inMin = new Float32Array(format.numChannels);
        this.inMax = new Float32Array(format.numChannels);
        this.outMax = new Uint8Array(format.numChannels);
        var equDiv = roundMethod == 1 /* RoundMethod.EQUAL_DIVISION */;
        for (var ch = 0; ch < format.numChannels; ch++) {
            var numLevel = 1 << format.channelBits[ch];
            this.inMin[ch] = equDiv ? (1 / (numLevel * 2)) : 0;
            this.inMax[ch] = equDiv ? ((numLevel * 2 - 1) / (numLevel * 2)) : 1;
            this.outMax[ch] = numLevel - 1;
        }
    }
    Palette.prototype.nearest = function (src, srcOffset, dest, destOffset, error) {
        for (var ch = 0; ch < this.format.numChannels; ch++) {
            var inNorm = src[srcOffset + ch];
            var inMod = clip(0, 1, (inNorm - this.inMin[ch]) / (this.inMax[ch] - this.inMin[ch]));
            var out = Math.round(this.outMax[ch] * inMod);
            dest[destOffset + ch] = out;
            var outNorm = out / this.outMax[ch];
            error[ch] = inNorm - outNorm;
        }
    };
    return Palette;
}());
var NormalizedImage = /** @class */ (function () {
    function NormalizedImage(format, palette, width, height, data) {
        this.format = format;
        this.palette = palette;
        this.width = width;
        this.height = height;
        this.data = data;
    }
    NormalizedImage.prototype.getMinMax = function () {
        var min = Infinity;
        var max = -Infinity;
        for (var i = 0; i < this.data.length; i++) {
            var value = this.data[i];
            if (value < min)
                min = value;
            if (value > max)
                max = value;
        }
        return [min, max];
    };
    NormalizedImage.prototype.diffuseError = function (error, x, y, forward) {
        var numCh = this.format.numChannels;
        var w = this.width;
        var h = this.height;
        var stride = this.width * numCh;
        for (var ch = 0; ch < numCh; ch++) {
            var i = y * stride + x * numCh + ch;
            var e = error[ch];
            if (e == 0)
                continue;
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
            }
            else {
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
    };
    return NormalizedImage;
}());
function toElementArray(children) {
    if (children == null) {
        return [];
    }
    if (!Array.isArray(children)) {
        children = [children];
    }
    for (var i = 0; i < children.length; i++) {
        if (typeof children[i] === 'string') {
            children[i] = document.createTextNode(children[i]);
        }
        else if (children[i] instanceof Node) {
            // Do nothing
        }
        else {
            throw new Error('Invalid child element');
        }
    }
    return children;
}
function makeSection(children) {
    if (children === void 0) { children = []; }
    var div = document.createElement('div');
    div.classList.add('propertySection');
    toElementArray(children).forEach(function (child) { return div.appendChild(child); });
    return div;
}
function makeFloatList(children, sep) {
    if (children === void 0) { children = []; }
    if (sep === void 0) { sep = true; }
    var ul = document.createElement('ul');
    toElementArray(children).forEach(function (child) {
        if (!child.classList) {
            child = makeSpan(child);
        }
        var li = document.createElement('li');
        li.appendChild(child);
        if (sep && child.classList && !child.classList.contains('sectionHeader')) {
            li.style.marginRight = '20px';
        }
        ul.appendChild(li);
    });
    return ul;
}
function makeParagraph(children) {
    if (children === void 0) { children = []; }
    var p = document.createElement('p');
    toElementArray(children).forEach(function (child) { return p.appendChild(child); });
    return p;
}
function makeSpan(children) {
    if (children === void 0) { children = []; }
    var span = document.createElement('span');
    toElementArray(children).forEach(function (child) { return span.appendChild(child); });
    return span;
}
function makeNowrap(children) {
    if (children === void 0) { children = []; }
    var span = document.createElement('span');
    span.classList.add('nowrap');
    toElementArray(children).forEach(function (child) { return span.appendChild(child); });
    return span;
}
function tip(children, text) {
    var target;
    if (children instanceof HTMLElement) {
        target = children;
    }
    else {
        target = makeSpan(children);
    }
    if (text)
        target.title = text;
    return target;
}
function makeHeader(text) {
    var span = document.createElement('span');
    span.classList.add('sectionHeader');
    span.textContent = text;
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
function makeSelectBox(items, defaultValue) {
    var e_2, _a;
    var select = document.createElement('select');
    try {
        for (var items_1 = __values(items), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
            var _b = items_1_1.value, value = _b.value, label = _b.label;
            var option = document.createElement('option');
            option.value = value.toString();
            option.textContent = label;
            select.appendChild(option);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    select.value = defaultValue.toString();
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
function makeSampleImageButton(url) {
    var button = document.createElement('button');
    button.classList.add('sampleImageButton');
    button.style.backgroundImage = "url(".concat(url, ")");
    button.addEventListener('click', function () {
        loadFromString(url);
    });
    button.textContent = '';
    return button;
}
function makePresetButton(id, preset) {
    var button = document.createElement('button');
    button.dataset.presetName = id;
    button.classList.add('presetButton');
    var img = document.createElement('img');
    img.src = "img/preset/".concat(id, ".svg");
    button.appendChild(img);
    button.appendChild(document.createElement('br'));
    button.appendChild(document.createTextNode(preset.label));
    button.title = preset.description;
    button.addEventListener('click', function () { return loadPreset(preset); });
    return button;
}
var dropTarget = document.createElement('div');
var hiddenFileBox = document.createElement('input');
var pasteTarget = document.createElement('input');
var origCanvas = document.createElement('canvas');
var bgColorBox = makeTextBox('#000');
var resetTrimButton = makeButton('範囲をリセット');
var trimCanvas = document.createElement('canvas');
var gammaBox = makeTextBox('1', '(auto)', 4);
var brightnessBox = makeTextBox('0', '(auto)', 5);
var contrastBox = makeTextBox('100', '(auto)', 5);
var invertBox = makeCheckBox('階調反転');
var pixelFormatBox = makeSelectBox([
    //{value: PixelFormat.ARGB8888, label: 'ARGB8888'},
    { value: 0 /* PixelFormat.RGB888 */, label: 'RGB888' },
    { value: 1 /* PixelFormat.RGB666 */, label: 'RGB666' },
    { value: 2 /* PixelFormat.RGB565 */, label: 'RGB565' },
    { value: 3 /* PixelFormat.RGB555 */, label: 'RGB555' },
    { value: 4 /* PixelFormat.RGB332 */, label: 'RGB332' },
    { value: 5 /* PixelFormat.RGB111 */, label: 'RGB111' },
    { value: 6 /* PixelFormat.GRAY4 */, label: 'Gray4' },
    { value: 7 /* PixelFormat.GRAY2 */, label: 'Gray2' },
    { value: 8 /* PixelFormat.BW */, label: 'B/W' },
], 2 /* PixelFormat.RGB565 */);
var widthBox = makeTextBox('', '(auto)', 4);
var heightBox = makeTextBox('', '(auto)', 4);
var scalingMethodBox = makeSelectBox([
    { value: 0 /* ScalingMethod.ZOOM */, label: 'ズーム' },
    { value: 1 /* ScalingMethod.FIT */, label: 'フィット' },
    { value: 2 /* ScalingMethod.STRETCH */, label: 'ストレッチ' },
], 0 /* ScalingMethod.ZOOM */);
var ditherBox = makeSelectBox([
    { value: 0 /* DitherMethod.NONE */, label: 'なし' },
    { value: 1 /* DitherMethod.DIFFUSION */, label: '誤差拡散' },
], 1 /* DitherMethod.DIFFUSION */);
var roundMethodBox = makeSelectBox([
    { value: 0 /* RoundMethod.NEAREST */, label: '最も近い輝度' },
    { value: 1 /* RoundMethod.EQUAL_DIVISION */, label: '均等割り' },
], 0 /* RoundMethod.NEAREST */);
var previewCanvas = document.createElement('canvas');
var quantizeErrorBox = document.createElement('span');
var channelOrderBox = makeSelectBox([
    { value: 0 /* BitOrder.LSB_FIRST */, label: '下位から' },
    { value: 1 /* BitOrder.MSB_FIRST */, label: '上位から' },
], 1 /* BitOrder.MSB_FIRST */);
var pixelOrderBox = makeSelectBox([
    { value: 0 /* BitOrder.LSB_FIRST */, label: '下位から' },
    { value: 1 /* BitOrder.MSB_FIRST */, label: '上位から' },
], 1 /* BitOrder.MSB_FIRST */);
var byteOrderBox = makeSelectBox([
    { value: 0 /* ByteOrder.LITTLE_ENDIAN */, label: 'Little Endian' },
    { value: 1 /* ByteOrder.BIG_ENDIAN */, label: 'Big Endian' },
], 1 /* ByteOrder.BIG_ENDIAN */);
var packUnitBox = makeSelectBox([
    { value: 0 /* PackUnit.FRAGMENT */, label: '複数ピクセル' },
    { value: 1 /* PackUnit.PIXEL */, label: '単一ピクセル' },
    { value: 2 /* PackUnit.UNPACKED */, label: 'アンパックド' },
], 1 /* PackUnit.PIXEL */);
var packDirBox = makeSelectBox([
    { value: 0 /* ScanDir.HORIZONTAL */, label: '横' },
    { value: 1 /* ScanDir.VERTICAL */, label: '縦' },
], 0 /* ScanDir.HORIZONTAL */);
var alignBoundaryBox = makeSelectBox([
    { value: 8 /* AlignBoundary.BYTE */, label: 'バイト' },
], 8 /* AlignBoundary.BYTE */);
var alignDirBox = makeSelectBox([
    { value: 1 /* AlignDir.LOWER */, label: '右詰め' },
    { value: 0 /* AlignDir.HIGHER */, label: '左詰め' },
], 1 /* AlignDir.LOWER */);
var addressingBox = makeSelectBox([
    { value: 0 /* ScanDir.HORIZONTAL */, label: '水平' },
    { value: 1 /* ScanDir.VERTICAL */, label: '垂直' },
], 0 /* ScanDir.HORIZONTAL */);
var codeColsBox = makeSelectBox([
    { value: 8, label: '8' },
    { value: 16, label: '16' },
    { value: 32, label: '32' },
], 16);
var indentBox = makeSelectBox([
    { value: 1 /* Indent.SPACE_X2 */, label: 'スペース x2' },
    { value: 2 /* Indent.SPACE_X4 */, label: 'スペース x4' },
    { value: 0 /* Indent.TAB */, label: 'タブ' },
], 1 /* Indent.SPACE_X2 */);
var codeBox = document.createElement('pre');
var codeGenErrorBox = document.createElement('p');
var copyButton = makeButton('コードをコピー');
var container = null;
var updateTrimCanvasTimeoutId = -1;
var quantizeTimeoutId = -1;
var generateCodeTimeoutId = -1;
var worldX0 = 0, worldY0 = 0, zoom = 1;
var trimL = 0, trimT = 0, trimR = 1, trimB = 1;
var trimUiState = 0 /* TrimState.IDLE */;
var imageCacheFormat = new PixelFormatInfo(2 /* PixelFormat.RGB565 */);
var imageCacheData = [null, null, null, null];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var fileBrowseButton, pPresetButtons, id, pNote, pCanvas, section, p, section, pCanvas, section, section, section;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
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
                        fileBrowseButton = makeButton('ファイルを選択');
                        fileBrowseButton.addEventListener('click', function () {
                            hiddenFileBox.click();
                        });
                        pasteTarget.type = 'text';
                        pasteTarget.style.textAlign = 'center';
                        pasteTarget.style.width = '8em';
                        pasteTarget.placeholder = 'ここに貼り付け';
                        container.appendChild(makeSection(makeFloatList([
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
                        ], false)));
                    }
                    {
                        pPresetButtons = makeParagraph();
                        for (id in presets) {
                            pPresetButtons.appendChild(makePresetButton(id, presets[id]));
                        }
                        pNote = makeParagraph([
                            '白黒ディスプレイについては、各種 GFX ライブラリを使用して描画する場合は横パッキングを選択してください。',
                            'I2C や SPI ドライバを用いて直接転送する場合はディスプレイの仕様に従ってください。',
                            'SSD1306/1309 など一部のディスプレイでは縦パッキングされたデータが必要です。',
                        ]);
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
                        pCanvas = makeParagraph(trimCanvas);
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
                        section = makeSection(makeFloatList(([
                            makeHeader('透過色'),
                            tip(['塗りつぶす: ', bgColorBox], '画像の透明部分をこの色で塗り潰して不透明化します。'),
                        ])));
                        container.appendChild(section);
                        section.querySelectorAll('input, button').forEach(function (el) {
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
                        p = makeSection(makeFloatList([
                            makeHeader('色調補正'),
                            tip(['ガンマ: ', gammaBox], 'デフォルトは 1.0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。'),
                            tip(['輝度オフセット: ', brightnessBox], 'デフォルトは 0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。'),
                            tip(['コントラスト: ', contrastBox, '%'], 'デフォルトは 100% です。\n空欄にすると、階調が失われない範囲でダイナミックレンジが最大となるように自動調整します。'),
                            tip([invertBox.parentNode], '各チャネルの値を大小反転します。'),
                        ]));
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
                        section = makeSection(makeFloatList([
                            makeHeader('出力サイズ'),
                            tip([widthBox, ' x ', heightBox, ' px'], '片方を空欄にすると他方はアスペクト比に基づいて自動的に決定されます。'),
                            tip(['拡縮方法: ', scalingMethodBox], 'トリミングサイズと出力サイズが異なる場合の拡縮方法を指定します。'),
                        ]));
                        container.appendChild(section);
                        section.querySelectorAll('input, select').forEach(function (el) {
                            el.addEventListener('change', function () {
                                requestQuantize();
                            });
                            el.addEventListener('input', function () {
                                requestQuantize();
                            });
                        });
                    }
                    {
                        previewCanvas.style.backgroundImage = 'url(./img/checker.png)';
                        previewCanvas.style.display = 'none';
                        quantizeErrorBox.style.color = 'red';
                        quantizeErrorBox.style.display = 'none';
                        pCanvas = makeParagraph([previewCanvas, quantizeErrorBox]);
                        pCanvas.style.height = '400px';
                        pCanvas.style.background = '#444';
                        pCanvas.style.border = 'solid 1px #444';
                        pCanvas.style.textAlign = 'center';
                        container.appendChild(pCanvas);
                        section = makeSection([
                            makeFloatList([
                                makeHeader('量子化'),
                                tip(['フォーマット: ', pixelFormatBox], 'ピクセルフォーマットを指定します。'),
                                tip(['丸め方法: ', roundMethodBox], 'パレットから色を選択する際の戦略を指定します。\nディザリングを行う場合はあまり関係ありません。'),
                                tip(['ディザリング: ', ditherBox], 'あえてノイズを加えることでできるだけ元画像の輝度を再現します。'),
                            ]),
                            pCanvas,
                        ]);
                        container.appendChild(section);
                        section.querySelectorAll('input, select').forEach(function (el) {
                            el.addEventListener('change', function () {
                                requestQuantize();
                            });
                            el.addEventListener('input', function () {
                                requestQuantize();
                            });
                        });
                    }
                    { }
                    {
                        section = makeSection(makeFloatList([
                            makeHeader('エンコード'),
                            tip(['チャネル順: ', channelOrderBox], 'RGB のチャネルを並べる順序を指定します。\n上位からであることが多いです。'),
                            tip(['ピクセル順: ', pixelOrderBox], 'バイト内のピクセルの順序を指定します。\n横パッキングでは上位から、縦パッキングでは下位からであることが多いです。'),
                            tip(['バイト順: ', byteOrderBox], 'ピクセル内のバイトの順序を指定します。\nGFX ライブラリなどでは BigEndian であることが多いです。'),
                            tip(['パッキング単位: ', packUnitBox], 'パッキングの単位を指定します。\n1 チャネルが 8 bit の倍数の場合は出力に影響しません。'),
                            tip(['パッキング方向: ', packDirBox], 'ピクセルをどの方向にパッキングするかを指定します。\n' +
                                '多くの場合横ですが、SSD1306/1309 などの一部の白黒ディスプレイに\n' +
                                '直接転送可能なデータを生成する場合は縦を指定してください。'),
                            tip(['アライメント境界: ', alignBoundaryBox], 'アライメントの境界を指定します。\nパッキングの単位が 8 bit の倍数の場合は出力に影響しません。'),
                            tip(['アライメント方向: ', alignDirBox], 'アライメントの方向を指定します。\nパッキングの単位が 8 bit の倍数の場合は出力に影響しません。'),
                            tip(['アドレス方向: ', addressingBox], 'アドレスのインクリメント方向を指定します。\n通常は水平です。'),
                        ]));
                        container.appendChild(section);
                        section.querySelectorAll('input, select').forEach(function (el) {
                            el.addEventListener('change', function () {
                                requestGenerateCode();
                            });
                            el.addEventListener('input', function () {
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
                        section = makeSection([
                            makeFloatList([
                                makeHeader('コード生成'),
                                tip(['列数: ', codeColsBox], '1 行に詰め込む要素数を指定します。'),
                                tip(['インデント: ', indentBox], 'インデントの形式とサイズを指定します。'),
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
                        section.querySelectorAll('input, select').forEach(function (el) {
                            el.addEventListener('change', function () {
                                requestGenerateCode();
                            });
                            el.addEventListener('input', function () {
                                requestGenerateCode();
                            });
                        });
                    }
                    // ファイル選択
                    hiddenFileBox.addEventListener('change', function (e) { return __awaiter(_this, void 0, void 0, function () {
                        var input;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    input = e.target;
                                    if (!(input.files && input.files[0])) return [3 /*break*/, 2];
                                    return [4 /*yield*/, loadFromFile(input.files[0])];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    }); });
                    // ドラッグ & ドロップ
                    document.body.addEventListener('dragover', function (e) {
                        var e_3, _a;
                        e.preventDefault();
                        e.stopPropagation();
                        var items = e.dataTransfer.items;
                        try {
                            for (var items_2 = __values(items), items_2_1 = items_2.next(); !items_2_1.done; items_2_1 = items_2.next()) {
                                var item = items_2_1.value;
                                if (item.kind === 'file') {
                                    dropTarget.style.display = 'block';
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
                    dropTarget.addEventListener('dragleave', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        dropTarget.style.display = 'none';
                    });
                    dropTarget.addEventListener('drop', function (e) { return __awaiter(_this, void 0, void 0, function () {
                        var items, items_3, items_3_1, item, e_4_1;
                        var e_4, _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    e.preventDefault();
                                    e.stopPropagation();
                                    dropTarget.style.display = 'none';
                                    items = e.dataTransfer.items;
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 6, 7, 8]);
                                    items_3 = __values(items), items_3_1 = items_3.next();
                                    _b.label = 2;
                                case 2:
                                    if (!!items_3_1.done) return [3 /*break*/, 5];
                                    item = items_3_1.value;
                                    if (!(item.kind === 'file')) return [3 /*break*/, 4];
                                    return [4 /*yield*/, loadFromFile(item.getAsFile())];
                                case 3:
                                    _b.sent();
                                    return [3 /*break*/, 5];
                                case 4:
                                    items_3_1 = items_3.next();
                                    return [3 /*break*/, 2];
                                case 5: return [3 /*break*/, 8];
                                case 6:
                                    e_4_1 = _b.sent();
                                    e_4 = { error: e_4_1 };
                                    return [3 /*break*/, 8];
                                case 7:
                                    try {
                                        if (items_3_1 && !items_3_1.done && (_a = items_3.return)) _a.call(items_3);
                                    }
                                    finally { if (e_4) throw e_4.error; }
                                    return [7 /*endfinally*/];
                                case 8: return [2 /*return*/];
                            }
                        });
                    }); });
                    // 貼り付け
                    pasteTarget.addEventListener('paste', function (e) { return __awaiter(_this, void 0, void 0, function () {
                        var items, items_4, items_4_1, item, e_5_1;
                        var e_5, _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    items = e.clipboardData.items;
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 6, 7, 8]);
                                    items_4 = __values(items), items_4_1 = items_4.next();
                                    _b.label = 2;
                                case 2:
                                    if (!!items_4_1.done) return [3 /*break*/, 5];
                                    item = items_4_1.value;
                                    if (!(item.kind === 'file')) return [3 /*break*/, 4];
                                    return [4 /*yield*/, loadFromFile(item.getAsFile())];
                                case 3:
                                    _b.sent();
                                    return [3 /*break*/, 5];
                                case 4:
                                    items_4_1 = items_4.next();
                                    return [3 /*break*/, 2];
                                case 5: return [3 /*break*/, 8];
                                case 6:
                                    e_5_1 = _b.sent();
                                    e_5 = { error: e_5_1 };
                                    return [3 /*break*/, 8];
                                case 7:
                                    try {
                                        if (items_4_1 && !items_4_1.done && (_a = items_4.return)) _a.call(items_4);
                                    }
                                    finally { if (e_5) throw e_5.error; }
                                    return [7 /*endfinally*/];
                                case 8: return [2 /*return*/];
                            }
                        });
                    }); });
                    pasteTarget.addEventListener('input', function (e) {
                        pasteTarget.value = '';
                    });
                    pasteTarget.addEventListener('change', function (e) {
                        pasteTarget.value = '';
                    });
                    // トリミング操作
                    trimCanvas.addEventListener('pointermove', function (e) {
                        e.preventDefault();
                        if (trimUiState == 0 /* TrimState.IDLE */) {
                            switch (trimViewToNextState(e.offsetX, e.offsetY)) {
                                case 4 /* TrimState.DRAG_LEFT */:
                                    trimCanvas.style.cursor = 'w-resize';
                                    break;
                                case 1 /* TrimState.DRAG_TOP */:
                                    trimCanvas.style.cursor = 'n-resize';
                                    break;
                                case 2 /* TrimState.DRAG_RIGHT */:
                                    trimCanvas.style.cursor = 'e-resize';
                                    break;
                                case 3 /* TrimState.DRAG_BOTTOM */:
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
                                case 4 /* TrimState.DRAG_LEFT */:
                                    trimL = Math.min(x, trimR - 1);
                                    break;
                                case 1 /* TrimState.DRAG_TOP */:
                                    trimT = Math.min(y, trimB - 1);
                                    break;
                                case 2 /* TrimState.DRAG_RIGHT */:
                                    trimR = Math.max(x, trimL + 1);
                                    break;
                                case 3 /* TrimState.DRAG_BOTTOM */:
                                    trimB = Math.max(y, trimT + 1);
                                    break;
                            }
                            requestUpdateTrimCanvas();
                            requestQuantize();
                        }
                    });
                    trimCanvas.addEventListener('pointerdown', function (e) {
                        e.preventDefault();
                        if (trimViewToNextState(e.offsetX, e.offsetY) != 0 /* TrimState.IDLE */) {
                            trimUiState = trimViewToNextState(e.offsetX, e.offsetY);
                            trimCanvas.style.cursor = 'grabbing';
                            trimCanvas.setPointerCapture(e.pointerId);
                        }
                    });
                    trimCanvas.addEventListener('pointerup', function (e) {
                        e.preventDefault();
                        trimUiState = 0 /* TrimState.IDLE */;
                        trimCanvas.style.cursor = 'default';
                        trimCanvas.releasePointerCapture(e.pointerId);
                        requestUpdateTrimCanvas();
                    });
                    trimCanvas.addEventListener('touchstart', function (e) {
                        e.preventDefault();
                    });
                    trimCanvas.addEventListener('touchmove', function (e) {
                        e.preventDefault();
                    });
                    trimCanvas.addEventListener('touchend', function (e) {
                        e.preventDefault();
                    });
                    resetTrimButton.addEventListener('click', function () {
                        resetTrim();
                    });
                    // コードのコピー
                    copyButton.addEventListener('click', function () {
                        if (!codeBox.textContent)
                            return;
                        navigator.clipboard.writeText(codeBox.textContent);
                    });
                    // サンプルのロード
                    return [4 /*yield*/, loadFromString('./img/sample/gradient.png')];
                case 1:
                    // サンプルのロード
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
} // main
function loadFromFile(file) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var reader = new FileReader();
                    reader.onload = function (e) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!(typeof e.target.result === 'string')) return [3 /*break*/, 2];
                                    return [4 /*yield*/, loadFromString(e.target.result)];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 3];
                                case 2: throw new Error('Invalid image data');
                                case 3:
                                    resolve();
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    reader.onerror = function (e) {
                        reject(new Error('Failed to read file'));
                    };
                    reader.readAsDataURL(file);
                })];
        });
    });
}
function loadFromString(s) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
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
                        resolve();
                    };
                    img.onerror = function () {
                        reject(new Error('Failed to load image'));
                    };
                    img.src = s;
                })];
        });
    });
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
    return { x: viewX0, y: viewY0, width: viewW, height: viewH };
}
// トリミングUIのワールド座標をビュー座標に変換
function trimWorldToView(x, y) {
    var view = getTrimViewArea();
    return {
        x: view.x + (x - worldX0) * zoom,
        y: view.y + (y - worldY0) * zoom,
    };
}
// トリミングUIのビュー座標をワールド座標に変換
function trimViewToWorld(x, y) {
    var view = getTrimViewArea();
    return {
        x: (x - view.x) / zoom + worldX0,
        y: (y - view.y) / zoom + worldY0,
    };
}
// ポイントされているビュー座標からトリミングUIの次の状態を取得
function trimViewToNextState(x, y) {
    var _a = trimWorldToView(trimL, trimT), trimViewL = _a.x, trimViewT = _a.y;
    var _b = trimWorldToView(trimR, trimB), trimViewR = _b.x, trimViewB = _b.y;
    if (Math.abs(x - trimViewL) < 10)
        return 4 /* TrimState.DRAG_LEFT */;
    if (Math.abs(x - trimViewR) < 10)
        return 2 /* TrimState.DRAG_RIGHT */;
    if (Math.abs(y - trimViewT) < 10)
        return 1 /* TrimState.DRAG_TOP */;
    if (Math.abs(y - trimViewB) < 10)
        return 3 /* TrimState.DRAG_BOTTOM */;
    return 0 /* TrimState.IDLE */;
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
    // キャンバスの論理サイズを見かけ上のサイズに合わせる
    // ただし枠線は含めない
    var rect = trimCanvas.getBoundingClientRect();
    trimCanvas.width = rect.width - 2;
    trimCanvas.height = rect.height - 2;
    var canvasW = trimCanvas.width;
    var canvasH = trimCanvas.height;
    var origW = origCanvas.width;
    var origH = origCanvas.height;
    var view = getTrimViewArea();
    if (trimUiState == 0 /* TrimState.IDLE */) {
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
function loadPreset(preset) {
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
function requestQuantize() {
    if (quantizeTimeoutId >= 0)
        return;
    quantizeTimeoutId = setTimeout(function () {
        quantize();
    }, 300);
}
function quantize() {
    var e_6, _a;
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
            scalingMethodBox.disabled = false;
        }
        else if (widthBox.value) {
            outW = parseInt(widthBox.value);
            outH = Math.ceil(srcH * (outW / srcW));
            scalingMethodBox.disabled = true;
        }
        else if (heightBox.value) {
            outH = parseInt(heightBox.value);
            outW = Math.ceil(srcW * (outH / srcH));
            scalingMethodBox.disabled = true;
        }
        else {
            if (outW > 256 || outH > 256) {
                var scale = Math.min(256 / outW, 256 / outH);
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
                switch (parseInt(scalingMethodBox.value)) {
                    case 0 /* ScalingMethod.ZOOM */:
                        if (srcAspect > outAspect) {
                            scaleX = scaleY = outH / srcH;
                        }
                        else {
                            scaleX = scaleY = outW / srcW;
                        }
                        break;
                    case 1 /* ScalingMethod.FIT */:
                        if (srcAspect > outAspect) {
                            scaleX = scaleY = outW / srcW;
                        }
                        else {
                            scaleX = scaleY = outH / srcH;
                        }
                        break;
                    case 2 /* ScalingMethod.STRETCH */:
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
        var fmt = new PixelFormatInfo(parseInt(pixelFormatBox.value));
        var maxChannelDepth = 0;
        var roundMethod = 0 /* RoundMethod.NEAREST */;
        try {
            for (var _b = __values(fmt.channelBits), _c = _b.next(); !_c.done; _c = _b.next()) {
                var depth = _c.value;
                if (depth > maxChannelDepth) {
                    maxChannelDepth = depth;
                }
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_6) throw e_6.error; }
        }
        if (maxChannelDepth > 1) {
            roundMethodBox.disabled = false;
            roundMethod = parseInt(roundMethodBox.value);
        }
        else {
            // 均等割りはチャンネル深度が2以上でないと意味がないので無効化
            roundMethodBox.disabled = true;
        }
        var palette = new Palette(fmt, roundMethod);
        var normData = new Float32Array(outW * outH * fmt.numChannels);
        var norm = new NormalizedImage(fmt, palette, outW, outH, normData);
        // 量子化の適用
        {
            var previewCtx = previewCanvas.getContext('2d', { willReadFrequently: true });
            var previewImageData = previewCtx.getImageData(0, 0, outW, outH);
            var srcRgbData = previewImageData.data;
            var previewData = new Uint8Array(srcRgbData.length);
            var numPixels = outW * outH;
            var numCh = fmt.colorSpace === 0 /* ColorSpace.GRAYSCALE */ ? 1 : 3;
            var outData = [];
            for (var i = 0; i < numCh; i++) {
                outData.push(new Uint8Array(numPixels));
            }
            // 正規化 + 自動ガンマ補正用の値収集
            var HISTOGRAM_SIZE = 16;
            var histogram = new Uint32Array(HISTOGRAM_SIZE);
            for (var i = 0; i < numPixels; i++) {
                var r = srcRgbData[i * 4] / 255;
                var g = srcRgbData[i * 4 + 1] / 255;
                var b = srcRgbData[i * 4 + 2] / 255;
                var gray = 0.299 * r + 0.587 * g + 0.114 * b;
                histogram[Math.round(gray * (HISTOGRAM_SIZE - 1))]++;
                switch (fmt.colorSpace) {
                    case 0 /* ColorSpace.GRAYSCALE */:
                        norm.data[i * numCh] = gray;
                        break;
                    case 1 /* ColorSpace.RGB */:
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
                var gamma = 1;
                if (gammaBox.value) {
                    gamma = parseFloat(gammaBox.value);
                    gammaBox.placeholder = '';
                }
                else {
                    gamma = correctGamma(histogram);
                }
                gamma = clip(0.01, 5, gamma);
                gammaBox.placeholder = '(' + Math.round(gamma * 100) / 100 + ')';
                if (gamma != 1) {
                    for (var i = 0; i < norm.data.length; i++) {
                        var val = Math.pow(norm.data[i], 1 / gamma);
                        norm.data[i] = val;
                    }
                }
            }
            // 輝度補正
            {
                var brightness = 0;
                if (brightnessBox.value) {
                    brightness = parseFloat(brightnessBox.value) / 255;
                    brightnessBox.placeholder = '';
                }
                else {
                    var _d = __read(norm.getMinMax(), 2), chMin = _d[0], chMax = _d[1];
                    brightness = 0.5 - (chMin + chMax) / 2;
                }
                brightness = clip(-1, 1, brightness);
                brightnessBox.placeholder = '(' + Math.round(brightness * 255) + ')';
                if (brightness != 0) {
                    for (var i = 0; i < norm.data.length; i++) {
                        norm.data[i] = clip(0, 1, norm.data[i] + brightness);
                    }
                }
            }
            // コントラスト補正
            {
                var contrast = 1;
                if (contrastBox.value) {
                    contrast = parseFloat(contrastBox.value) / 100;
                    contrastBox.placeholder = '';
                }
                else {
                    var _e = __read(norm.getMinMax(), 2), chMin = _e[0], chMax = _e[1];
                    var middle = (chMin + chMax) / 2;
                    if (middle < 0.5 && chMin < middle) {
                        contrast = 0.5 / (middle - chMin);
                    }
                    else if (middle > 0.5 && chMax > middle) {
                        contrast = 0.5 / (chMax - middle);
                    }
                }
                contrast = clip(0.01, 10, contrast);
                contrastBox.placeholder = '(' + Math.round(contrast * 100) + ')';
                if (contrast != 1) {
                    for (var i = 0; i < norm.data.length; i++) {
                        norm.data[i] = clip(0, 1, (norm.data[i] - 0.5) * contrast + 0.5);
                    }
                }
            }
            // 階調反転
            if (invertBox.checked) {
                for (var i = 0; i < norm.data.length; i++) {
                    norm.data[i] = 1 - norm.data[i];
                }
            }
            // 量子化
            var diffusion = parseInt(ditherBox.value) === 1 /* DitherMethod.DIFFUSION */;
            var palette_1 = new Palette(fmt, roundMethod);
            var out = new Uint8Array(numCh);
            var error = new Float32Array(numCh);
            for (var y = 0; y < outH; y++) {
                for (var ix = 0; ix < outW; ix++) {
                    // 誤差拡散をジグザグに行うため
                    // ライン毎にスキャン方向を変える
                    var fwd = y % 2 == 0;
                    var x = fwd ? ix : (outW - 1 - ix);
                    // パレットから最も近い色を選択
                    var iPix = (y * outW + x);
                    palette_1.nearest(norm.data, iPix * numCh, out, 0, error);
                    // 出力
                    for (var ch = 0; ch < numCh; ch++) {
                        outData[ch][iPix] = out[ch];
                    }
                    // プレビュー用の色生成
                    if (fmt.colorSpace === 0 /* ColorSpace.GRAYSCALE */) {
                        var gray = Math.round(out[0] * 255 / palette_1.outMax[0]);
                        for (var ch = 0; ch < 3; ch++) {
                            previewData[iPix * 4 + ch] = gray;
                        }
                    }
                    else {
                        for (var ch = 0; ch < 3; ch++) {
                            var outMax = palette_1.outMax[ch];
                            previewData[iPix * 4 + ch] = Math.round(out[ch] * 255 / outMax);
                        }
                    }
                    if (diffusion) {
                        // 誤差拡散
                        norm.diffuseError(error, x, y, fwd);
                    }
                } // for ix
            } // for y
            // プレビューを不透明化
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
            var rect = previewCanvas.parentElement.getBoundingClientRect();
            var viewW = rect.width - (borderWidth * 2);
            var viewH = rect.height - (borderWidth * 2);
            var zoom_1 = Math.min(viewW / outW, viewH / outH);
            if (zoom_1 >= 1) {
                zoom_1 = Math.max(1, Math.floor(zoom_1));
            }
            var canvasW = Math.round(outW * zoom_1);
            var canvasH = Math.round(outH * zoom_1);
            previewCanvas.style.width = "".concat(canvasW, "px");
            previewCanvas.style.height = "".concat(canvasH, "px");
            previewCanvas.style.marginTop = "".concat(Math.floor((viewH - canvasH) / 2), "px");
            previewCanvas.style.imageRendering = 'pixelated';
        }
    }
    catch (error) {
        previewCanvas.style.display = 'none';
        codeBox.style.display = 'none';
        quantizeErrorBox.style.display = 'inline';
        quantizeErrorBox.textContent = error.message;
    }
}
function correctGamma(histogram) {
    var N = histogram.length;
    var min = 0.5;
    var max = 2;
    var gamma;
    while (max - min > 0.01) {
        gamma = (min + max) / 2;
        var lo = 0, hi = 0;
        for (var i = 0; i < N; i++) {
            var val = Math.pow(i / (N - 1), 1 / gamma);
            if (val < 0.5) {
                lo += histogram[i];
            }
            else {
                hi += histogram[i];
            }
        }
        if (lo > hi) {
            min = gamma;
        }
        else {
            max = gamma;
        }
    }
    return gamma;
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
function align(data, width, boundary, alignLeft) {
    var outWidth = Math.ceil(width / boundary) * boundary;
    if (alignLeft) {
        data <<= outWidth - width;
    }
    return [data, outWidth];
}
function generateCode() {
    var _a, _b, _c;
    if (!imageCacheData) {
        codeBox.textContent = '';
        codeBox.style.display = 'block';
        codeGenErrorBox.style.display = 'none';
        return;
    }
    try {
        var msbRed = parseInt(channelOrderBox.value) == 1 /* BitOrder.MSB_FIRST */;
        var msb1st = parseInt(pixelOrderBox.value) == 1 /* BitOrder.MSB_FIRST */;
        var bigEndian = parseInt(byteOrderBox.value) == 1 /* ByteOrder.BIG_ENDIAN */;
        var packUnit = parseInt(packUnitBox.value);
        var vertPack = parseInt(packDirBox.value) == 1 /* ScanDir.VERTICAL */;
        var alignBoundary = parseInt(alignBoundaryBox.value);
        var alignLeft = parseInt(alignDirBox.value) == 0 /* AlignDir.HIGHER */;
        var vertAddr = parseInt(addressingBox.value) == 1 /* ScanDir.VERTICAL */;
        // ピクセルあたりのビット数
        var numChannels = imageCacheData.length;
        var bitsPerPixel = 0;
        for (var i = 0; i < numChannels; i++) {
            bitsPerPixel += imageCacheFormat.channelBits[i];
        }
        // エンコードパラメータ
        var pixelsPerPack = Math.max(1, Math.floor(8 / bitsPerPixel));
        var bytesPerPack = Math.ceil(bitsPerPixel / 8);
        var fragWidth = vertPack ? 1 : pixelsPerPack;
        var fragHeight = vertPack ? pixelsPerPack : 1;
        // 1 チャネルのときはチャネル順指定無効
        channelOrderBox.disabled = (numChannels <= 1);
        // 1 byte/pack 以下のときはエンディアン指定無効
        byteOrderBox.disabled = (bytesPerPack <= 1);
        // 1 pixel/byte 以下のときはパッキング設定無効
        pixelOrderBox.disabled = (pixelsPerPack <= 1);
        packDirBox.disabled = (pixelsPerPack <= 1);
        // 列数決定
        var arrayCols = parseInt(codeColsBox.value);
        // インデント決定
        var indent = '  ';
        switch (parseInt(indentBox.value)) {
            case 1 /* Indent.SPACE_X2 */:
                indent = '  ';
                break;
            case 2 /* Indent.SPACE_X4 */:
                indent = '    ';
                break;
            case 0 /* Indent.TAB */:
                indent = '\t';
                break;
            default:
                throw new Error('Unknown indent type');
        }
        var width = previewCanvas.width;
        var height = previewCanvas.height;
        var cols = Math.ceil(width / fragWidth);
        var rows = Math.ceil(height / fragHeight);
        var numPacks = cols * rows;
        var arrayData = new Uint8Array(numPacks * bytesPerPack);
        // 配列化
        var byteIndex = 0;
        // パック単位
        for (var packIndex = 0; packIndex < numPacks; packIndex++) {
            var xCoarse = void 0, yCoarse = void 0;
            if (vertAddr) {
                xCoarse = fragWidth * Math.floor(packIndex / rows);
                yCoarse = fragHeight * (packIndex % rows);
            }
            else {
                xCoarse = fragWidth * (packIndex % cols);
                yCoarse = fragHeight * Math.floor(packIndex / cols);
            }
            // ピクセル単位
            var fragData = 0;
            var fragBits = 0;
            for (var yFine = 0; yFine < fragHeight; yFine++) {
                for (var xFine = 0; xFine < fragWidth; xFine++) {
                    var x = xCoarse + xFine;
                    var y = yCoarse + yFine;
                    // ピクセルのエンコード
                    var pixData = 0;
                    var pixBits = 0;
                    for (var ch = 0; ch < numChannels; ch++) {
                        var chData = 0;
                        if (y < height && x < width) {
                            chData = imageCacheData[ch][y * width + x];
                        }
                        var chBits = imageCacheFormat.channelBits[ch];
                        if (packUnit == 2 /* PackUnit.UNPACKED */) {
                            _a = __read(align(chData, chBits, alignBoundary, alignLeft), 2), chData = _a[0], chBits = _a[1];
                        }
                        if (msbRed) {
                            pixData <<= chBits;
                            pixData |= chData;
                        }
                        else {
                            pixData |= chData << pixBits;
                        }
                        pixBits += chBits;
                    } // for ch
                    if (packUnit == 1 /* PackUnit.PIXEL */) {
                        _b = __read(align(pixData, pixBits, alignBoundary, alignLeft), 2), pixData = _b[0], pixBits = _b[1];
                    }
                    if (msb1st) {
                        fragData <<= pixBits;
                        fragData |= pixData;
                    }
                    else {
                        fragData |= pixData << fragBits;
                    }
                    fragBits += pixBits;
                } // for xFine
            } // for yFine
            if (packUnit == 0 /* PackUnit.FRAGMENT */) {
                _c = __read(align(fragData, fragBits, alignBoundary, alignLeft), 2), fragData = _c[0], fragBits = _c[1];
            }
            if (fragBits % 8 != 0) {
                throw new Error("Invalid fragment fields");
            }
            // バイト単位に変換
            for (var j = 0; j < fragBits / 8; j++) {
                if (bigEndian) {
                    arrayData[byteIndex++] = (fragData >> (fragBits - 8)) & 0xFF;
                    fragData <<= 8;
                }
                else {
                    arrayData[byteIndex++] = fragData & 0xFF;
                    fragData >>= 8;
                }
            }
        } // for packIndex
        // コード生成
        var code = '';
        code += "#pragma once\n";
        code += "\n";
        code += "#include <stdint.h>\n";
        code += "\n";
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
            if (!packDirBox.disabled) {
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
        codeBox.textContent = code;
        codeBox.style.display = 'block';
        codeGenErrorBox.style.display = 'none';
    }
    catch (error) {
        codeBox.style.display = 'none';
        codeGenErrorBox.textContent = error.message;
        codeGenErrorBox.style.display = 'block';
    }
}
function clip(min, max, val) {
    if (val < min)
        return min;
    if (val > max)
        return max;
    return val;
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
window.addEventListener('resize', function (e) {
    requestUpdateTrimCanvas();
});
