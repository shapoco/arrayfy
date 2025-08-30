var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var ArrayfyError = /** @class */ (function (_super) {
    __extends(ArrayfyError, _super);
    function ArrayfyError(element, message) {
        var _this = _super.call(this, message) || this;
        _this.element = element;
        _this.name = 'ArrayfyError';
        return _this;
    }
    return ArrayfyError;
}(Error));
var Preset = /** @class */ (function () {
    function Preset(label, description, format, ops) {
        var e_1, _a;
        if (ops === void 0) { ops = {}; }
        this.label = label;
        this.description = description;
        this.format = format;
        this.channelOrder = 2 /* ChannelOrder.ARGB */;
        this.pixelOrder = 0 /* PixelOrder.NEAR_FIRST */;
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
    argb8888_le: new Preset('ARGB8888-LE', '透明度付きフルカラー。\nLovyanGFX の pushAlphaImage 関数向け。', 0 /* PixelFormat.RGBA8888 */, {
        channelOrder: 2 /* ChannelOrder.ARGB */,
        byteOrder: 0 /* ByteOrder.LITTLE_ENDIAN */,
    }),
    rgb888_be: new Preset('RGB888-BE', 'フルカラー。24bit 液晶用。', 1 /* PixelFormat.RGB888 */, {
        channelOrder: 2 /* ChannelOrder.ARGB */,
        byteOrder: 1 /* ByteOrder.BIG_ENDIAN */,
    }),
    rgb666_be_ra: new Preset('RGB666-BE', '各バイトにチャネルを右詰で配置した RGB666。LovyanGFX 用。', 2 /* PixelFormat.RGB666 */, {
        channelOrder: 2 /* ChannelOrder.ARGB */,
        packUnit: 2 /* PackUnit.UNPACKED */,
        byteOrder: 1 /* ByteOrder.BIG_ENDIAN */,
    }),
    rgb565_be: new Preset('RGB565-BE', 'ハイカラー。\n各種 GFX ライブラリでの使用を含め、\n組み込み用途で一般的な形式。', 3 /* PixelFormat.RGB565 */, {
        byteOrder: 1 /* ByteOrder.BIG_ENDIAN */,
    }),
    rgb332: new Preset('RGB332', '各種 GFX ライブラリ用。', 5 /* PixelFormat.RGB332 */),
    bw_hscan: new Preset('白黒 横スキャン', '各種 GFX ライブラリ用。', 9 /* PixelFormat.BW */, {
        packUnit: 0 /* PackUnit.MULTI_PIXEL */,
        pixelOrder: 1 /* PixelOrder.FAR_FIRST */,
        packDir: 0 /* ScanDir.HORIZONTAL */,
    }),
    bw_vpack: new Preset('白黒 縦パッキング', 'SPI/I2C ドライバを使用して\nSSD1306/1309 等の白黒ディスプレイに直接転送するための形式。', 9 /* PixelFormat.BW */, {
        packUnit: 0 /* PackUnit.MULTI_PIXEL */,
        pixelOrder: 0 /* PixelOrder.NEAR_FIRST */,
        packDir: 1 /* ScanDir.VERTICAL */,
    }),
};
var PixelFormatInfo = /** @class */ (function () {
    function PixelFormatInfo(fmt) {
        this.alphaBits = 0;
        switch (fmt) {
            case 0 /* PixelFormat.RGBA8888 */:
                this.colorSpace = 1 /* ColorSpace.RGB */;
                this.colorBits = [8, 8, 8];
                this.alphaBits = 8;
                break;
            // case PixelFormat.RGBA4444:
            //   this.colorSpace = ColorSpace.RGB;
            //   this.colorBits = [4, 4, 4];
            //   this.alphaBits = 4;
            //   break;
            case 1 /* PixelFormat.RGB888 */:
                this.colorSpace = 1 /* ColorSpace.RGB */;
                this.colorBits = [8, 8, 8];
                break;
            case 2 /* PixelFormat.RGB666 */:
                this.colorSpace = 1 /* ColorSpace.RGB */;
                this.colorBits = [6, 6, 6];
                break;
            case 3 /* PixelFormat.RGB565 */:
                this.colorSpace = 1 /* ColorSpace.RGB */;
                this.colorBits = [5, 6, 5];
                break;
            case 4 /* PixelFormat.RGB555 */:
                this.colorSpace = 1 /* ColorSpace.RGB */;
                this.colorBits = [5, 5, 5];
                break;
            case 5 /* PixelFormat.RGB332 */:
                this.colorSpace = 1 /* ColorSpace.RGB */;
                this.colorBits = [3, 3, 2];
                break;
            case 6 /* PixelFormat.RGB111 */:
                this.colorSpace = 1 /* ColorSpace.RGB */;
                this.colorBits = [1, 1, 1];
                break;
            case 7 /* PixelFormat.GRAY4 */:
                this.colorSpace = 0 /* ColorSpace.GRAYSCALE */;
                this.colorBits = [4];
                break;
            case 8 /* PixelFormat.GRAY2 */:
                this.colorSpace = 0 /* ColorSpace.GRAYSCALE */;
                this.colorBits = [2];
                break;
            case 9 /* PixelFormat.BW */:
                this.colorSpace = 0 /* ColorSpace.GRAYSCALE */;
                this.colorBits = [1];
                break;
            default:
                throw new Error('Unknown image format');
        }
    }
    PixelFormatInfo.prototype.toString = function () {
        switch (this.colorSpace) {
            case 0 /* ColorSpace.GRAYSCALE */:
                if (this.colorBits[0] == 1) {
                    return 'B/W';
                }
                else {
                    return 'Gray' + this.colorBits[0];
                }
            case 1 /* ColorSpace.RGB */:
                if (this.hasAlpha) {
                    return 'RGBA' + this.colorBits.join('') + this.alphaBits.toString();
                }
                else {
                    return 'RGB' + this.colorBits.join('');
                }
            default:
                throw new Error('Unknown color space');
        }
    };
    Object.defineProperty(PixelFormatInfo.prototype, "hasAlpha", {
        get: function () {
            return this.alphaBits > 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PixelFormatInfo.prototype, "numTotalChannels", {
        get: function () {
            return this.colorBits.length + (this.hasAlpha ? 1 : 0);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PixelFormatInfo.prototype, "numColorChannels", {
        get: function () {
            return this.colorBits.length;
        },
        enumerable: false,
        configurable: true
    });
    PixelFormatInfo.prototype.channelName = function (i) {
        switch (this.colorSpace) {
            case 0 /* ColorSpace.GRAYSCALE */:
                return 'V';
            case 1 /* ColorSpace.RGB */:
                return 'RGBA'.slice(i, i + 1);
            default:
                throw new Error('Unknown color space');
        }
    };
    return PixelFormatInfo;
}());
var Palette = /** @class */ (function () {
    function Palette(channelBits, roundMethod) {
        this.channelBits = channelBits;
        this.roundMethod = roundMethod;
        this.inMin = new Float32Array(channelBits.length);
        this.inMax = new Float32Array(channelBits.length);
        this.outMax = new Uint8Array(channelBits.length);
        var equDiv = roundMethod == 1 /* RoundMethod.EQUAL_DIVISION */;
        for (var ch = 0; ch < channelBits.length; ch++) {
            var numLevel = 1 << channelBits[ch];
            this.inMin[ch] = equDiv ? (1 / (numLevel * 2)) : 0;
            this.inMax[ch] = equDiv ? ((numLevel * 2 - 1) / (numLevel * 2)) : 1;
            this.outMax[ch] = numLevel - 1;
        }
    }
    Palette.prototype.nearest = function (src, srcOffset, dest, destOffset, error) {
        for (var ch = 0; ch < this.channelBits.length; ch++) {
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
    function NormalizedImage(width, height, numColorChannels) {
        this.width = width;
        this.height = height;
        this.numColorChannels = numColorChannels;
        this.color = new Float32Array(width * height * numColorChannels);
        this.alpha = new Float32Array(width * height);
        for (var i = 0; i < this.alpha.length; i++) {
            this.alpha[i] = 1;
        }
    }
    NormalizedImage.prototype.getColorMinMax = function () {
        var min = Infinity;
        var max = -Infinity;
        var numColCh = this.numColorChannels;
        for (var i = 0; i < this.alpha.length; i++) {
            if (this.alpha[i] == 0)
                continue;
            var value = this.color[i * numColCh];
            if (value < min)
                min = value;
            if (value > max)
                max = value;
        }
        return [min, max];
    };
    NormalizedImage.prototype.diffuseColorError = function (error, x, y, forward) {
        this.diffuseError(this.color, this.numColorChannels, error, x, y, forward);
    };
    NormalizedImage.prototype.diffuseAlphaError = function (error, x, y, forward) {
        this.diffuseError(this.alpha, 1, error, x, y, forward);
    };
    NormalizedImage.prototype.diffuseError = function (target, numCh, error, x, y, forward) {
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
            }
            else {
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
function basic(elem) {
    elem.classList.add('basic');
    return elem;
}
function pro(elem) {
    elem.classList.add('professional');
    return elem;
}
function show(elem) {
    elem.classList.remove('hidden');
    return elem;
}
function hide(elem) {
    elem.classList.add('hidden');
    return elem;
}
function setVisible(elem, visible) {
    return visible ? show(elem) : hide(elem);
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
function parentLiOf(child) {
    var parent = child;
    while (parent && parent.tagName !== 'LI') {
        parent = parent.parentElement;
    }
    return parent;
}
var dropTarget = document.createElement('div');
var hiddenFileBox = document.createElement('input');
var pasteTarget = document.createElement('input');
var origCanvas = document.createElement('canvas');
var preModCanvas = document.createElement('canvas');
var resetTrimButton = makeButton('範囲をリセット');
var alphaProcBox = makeSelectBox([
    { value: 0 /* AlphaProc.KEEP */, label: '変更しない' },
    { value: 1 /* AlphaProc.FILL */, label: '不透明化' },
    { value: 2 /* AlphaProc.BINARIZE */, label: '二値化' },
    { value: 3 /* AlphaProc.SET_KEY_COLOR */, label: '抜き色指定' },
], 0 /* AlphaProc.KEEP */);
var bgColorBox = makeTextBox('#000');
var keyColorBox = makeTextBox('#0F0');
var keyToleranceBox = makeTextBox('0', '(auto)', 5);
var alphaThreshBox = makeTextBox('128', '(auto)', 5);
var trimCanvas = document.createElement('canvas');
var gammaBox = makeTextBox('1', '(auto)', 4);
var brightnessBox = makeTextBox('0', '(auto)', 5);
var contrastBox = makeTextBox('100', '(auto)', 5);
var invertBox = makeCheckBox('階調反転');
var pixelFormatBox = makeSelectBox([
    { value: 0 /* PixelFormat.RGBA8888 */, label: 'RGBA8888' },
    //{value: PixelFormat.RGBA4444, label: 'RGBA4444'},
    { value: 1 /* PixelFormat.RGB888 */, label: 'RGB888' },
    { value: 2 /* PixelFormat.RGB666 */, label: 'RGB666' },
    { value: 3 /* PixelFormat.RGB565 */, label: 'RGB565' },
    { value: 4 /* PixelFormat.RGB555 */, label: 'RGB555' },
    { value: 5 /* PixelFormat.RGB332 */, label: 'RGB332' },
    { value: 6 /* PixelFormat.RGB111 */, label: 'RGB111' },
    { value: 7 /* PixelFormat.GRAY4 */, label: 'Gray4' },
    { value: 8 /* PixelFormat.GRAY2 */, label: 'Gray2' },
    { value: 9 /* PixelFormat.BW */, label: 'B/W' },
], 3 /* PixelFormat.RGB565 */);
var widthBox = makeTextBox('', '(auto)', 4);
var heightBox = makeTextBox('', '(auto)', 4);
var scalingMethodBox = makeSelectBox([
    { value: 0 /* ScalingMethod.ZOOM */, label: 'ズーム' },
    { value: 1 /* ScalingMethod.FIT */, label: 'フィット' },
    { value: 2 /* ScalingMethod.STRETCH */, label: 'ストレッチ' },
], 0 /* ScalingMethod.ZOOM */);
var colorDitherBox = makeSelectBox([
    { value: 0 /* DitherMethod.NONE */, label: 'なし' },
    { value: 1 /* DitherMethod.DIFFUSION */, label: '誤差拡散' },
], 0 /* DitherMethod.NONE */);
var alphaDitherBox = makeSelectBox([
    { value: 0 /* DitherMethod.NONE */, label: 'なし' },
    { value: 1 /* DitherMethod.DIFFUSION */, label: '誤差拡散' },
], 0 /* DitherMethod.NONE */);
var roundMethodBox = makeSelectBox([
    { value: 0 /* RoundMethod.NEAREST */, label: '最も近い輝度' },
    { value: 1 /* RoundMethod.EQUAL_DIVISION */, label: '均等割り' },
], 0 /* RoundMethod.NEAREST */);
var previewCanvas = document.createElement('canvas');
var quantizeErrorBox = document.createElement('span');
var channelOrderBox = makeSelectBox([
    { value: 0 /* ChannelOrder.RGBA */, label: 'RGBA' },
    { value: 1 /* ChannelOrder.BGRA */, label: 'BGRA' },
    { value: 2 /* ChannelOrder.ARGB */, label: 'ARGB' },
    { value: 3 /* ChannelOrder.ABGR */, label: 'ABGR' },
], 0 /* ChannelOrder.RGBA */);
var pixelOrderBox = makeSelectBox([
    { value: 1 /* PixelOrder.FAR_FIRST */, label: '上位から' },
    { value: 0 /* PixelOrder.NEAR_FIRST */, label: '下位から' },
], 1 /* PixelOrder.FAR_FIRST */);
var byteOrderBox = makeSelectBox([
    { value: 0 /* ByteOrder.LITTLE_ENDIAN */, label: 'Little Endian' },
    { value: 1 /* ByteOrder.BIG_ENDIAN */, label: 'Big Endian' },
], 1 /* ByteOrder.BIG_ENDIAN */);
var packUnitBox = makeSelectBox([
    { value: 2 /* PackUnit.UNPACKED */, label: 'アンパックド' },
    { value: 1 /* PackUnit.PIXEL */, label: '1 ピクセル' },
    { value: 0 /* PackUnit.MULTI_PIXEL */, label: '複数ピクセル' },
], 1 /* PackUnit.PIXEL */);
var packDirBox = makeSelectBox([
    { value: 0 /* ScanDir.HORIZONTAL */, label: '横' },
    { value: 1 /* ScanDir.VERTICAL */, label: '縦' },
], 0 /* ScanDir.HORIZONTAL */);
var alignBoundaryBox = makeSelectBox([
    { value: 8 /* AlignBoundary.BYTE */, label: 'バイト' },
    { value: 4 /* AlignBoundary.NIBBLE */, label: 'ニブル' },
], 8 /* AlignBoundary.BYTE */);
var alignDirBox = makeSelectBox([
    { value: 0 /* AlignDir.HIGHER */, label: '上位詰め' },
    { value: 1 /* AlignDir.LOWER */, label: '下位詰め' },
], 1 /* AlignDir.LOWER */);
var addressingBox = makeSelectBox([
    { value: 0 /* ScanDir.HORIZONTAL */, label: '水平' },
    { value: 1 /* ScanDir.VERTICAL */, label: '垂直' },
], 0 /* ScanDir.HORIZONTAL */);
var structCanvas = document.createElement('canvas');
var structErrorBox = makeParagraph();
var codeUnitBox = makeSelectBox([
    { value: 2 /* CodeUnit.FILE */, label: 'ファイル全体' },
    { value: 1 /* CodeUnit.ARRAY_DEF */, label: '配列定義' },
    { value: 0 /* CodeUnit.ELEMENTS */, label: '要素のみ' },
], 2 /* CodeUnit.FILE */);
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
var codeErrorBox = makeParagraph();
var copyButton = makeButton('コードをコピー');
var container = null;
var updateTrimCanvasTimeoutId = -1;
var quantizeTimeoutId = -1;
var generateCodeTimeoutId = -1;
var worldX0 = 0, worldY0 = 0, zoom = 1;
var trimL = 0, trimT = 0, trimR = 1, trimB = 1;
var trimUiState = 0 /* TrimState.IDLE */;
var imageCacheFormat = new PixelFormatInfo(3 /* PixelFormat.RGB565 */);
var imageCacheData = [null, null, null, null];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        function updateVisibility() {
            parentLiOf(bgColorBox).style.display = 'none';
            parentLiOf(keyColorBox).style.display = 'none';
            parentLiOf(keyToleranceBox).style.display = 'none';
            parentLiOf(alphaThreshBox).style.display = 'none';
            var alphaProc = parseInt(alphaProcBox.value);
            switch (alphaProc) {
                case 1 /* AlphaProc.FILL */:
                    parentLiOf(bgColorBox).style.display = 'inline-block';
                    break;
                case 3 /* AlphaProc.SET_KEY_COLOR */:
                    parentLiOf(keyColorBox).style.display = 'inline-block';
                    parentLiOf(keyToleranceBox).style.display = 'inline-block';
                    break;
                case 2 /* AlphaProc.BINARIZE */:
                    parentLiOf(alphaThreshBox).style.display = 'inline-block';
                    break;
            }
        }
        var fileBrowseButton, pPresetButtons, id, pNote, showProButton, hideProButton, section, pCanvas, section, section, section, pCanvas, section, pCanvas, section, section;
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
                            '白黒ディスプレイについては、各種 GFX ライブラリを使用して描画する場合は横スキャンを選択してください。',
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
                        showProButton = document.createElement('a');
                        hideProButton = document.createElement('a');
                        showProButton.textContent = '上級者向け設定を表示する';
                        showProButton.href = '#detail';
                        hideProButton.textContent = '上級者向け設定を隠す';
                        hideProButton.href = '#';
                        showProButton.addEventListener('click', showPro);
                        hideProButton.addEventListener('click', hidePro);
                        section = makeSection([basic(showProButton), pro(hideProButton)]);
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
                        pCanvas = makeParagraph(trimCanvas);
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
                        section = pro(makeSection(makeFloatList(([
                            makeHeader('透過色'),
                            tip(['透過色の扱い: ', alphaProcBox], '入力画像に対する透過色の取り扱いを指定します。'),
                            tip(['背景色: ', bgColorBox], '画像の透明部分をこの色で塗り潰して不透明化します。'),
                            tip(['キーカラー: ', keyColorBox], '透明にしたい色を指定します。'),
                            tip(['許容誤差: ', keyToleranceBox], 'キーカラーからの許容誤差を指定します。'),
                            tip(['閾値: ', alphaThreshBox], '透明にするかどうかの閾値を指定します。'),
                        ]))));
                        container.appendChild(section);
                        alphaProcBox.addEventListener('change', updateVisibility);
                        updateVisibility();
                        section.querySelectorAll('input, select').forEach(function (el) {
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
                        section = pro(makeSection(makeFloatList([
                            makeHeader('色調補正'),
                            tip(['ガンマ: ', gammaBox], 'デフォルトは 1.0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。'),
                            tip(['輝度オフセット: ', brightnessBox], 'デフォルトは 0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。'),
                            tip(['コントラスト: ', contrastBox, '%'], 'デフォルトは 100% です。\n空欄にすると、階調が失われない範囲でダイナミックレンジが最大となるように自動調整します。'),
                            tip([invertBox.parentNode], '各チャネルの値を大小反転します。'),
                        ])));
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
                                pro(tip(['フォーマット: ', pixelFormatBox], 'ピクセルフォーマットを指定します。')),
                                pro(tip(['丸め方法: ', roundMethodBox], 'パレットから色を選択する際の戦略を指定します。\nディザリングを行う場合はあまり関係ありません。')),
                                tip(['ディザリング: ', colorDitherBox], 'あえてノイズを加えることでできるだけ元画像の色を再現します。'),
                                pro(tip(['透明度のディザ: ', alphaDitherBox], 'あえてノイズを加えることでできるだけ元画像の透明度を再現します。')),
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
                    {
                        structCanvas.style.maxWidth = '100%';
                        structErrorBox.style.textAlign = 'center';
                        structErrorBox.style.color = 'red';
                        structErrorBox.style.display = 'none';
                        pCanvas = makeParagraph([structCanvas, structErrorBox]);
                        pCanvas.style.textAlign = 'center';
                        section = makeSection([
                            makeFloatList([
                                makeHeader('エンコード'),
                                basic(makeSpan('このフォーマットで生成されます:')),
                                pro(tip(['パッキング単位: ', packUnitBox], 'パッキングの単位を指定します。')),
                                pro(tip(['パッキング方向: ', packDirBox], '複数ピクセルをパッキングする場合に、どの方向にパッキングするかを指定します。\n' +
                                    '多くの場合横ですが、SSD1306/1309 などの一部の白黒ディスプレイに\n' +
                                    '直接転送可能なデータを生成する場合は縦を指定してください。')),
                                pro(tip(['アドレス方向: ', addressingBox], 'アドレスのインクリメント方向を指定します。\n通常は水平です。')),
                                pro(tip(['チャネル順: ', channelOrderBox], 'RGB のチャネルを並べる順序を指定します。')),
                                pro(tip(['ピクセル順: ', pixelOrderBox], 'バイト内のピクセルの順序を指定します。')),
                                pro(tip(['アライメント境界: ', alignBoundaryBox], 'アライメントの境界を指定します。')),
                                pro(tip(['アライメント方向: ', alignDirBox], 'アライメントの方向を指定します。')),
                                pro(tip(['バイト順: ', byteOrderBox], 'ピクセル内のバイトの順序を指定します。')),
                            ]),
                            pCanvas,
                        ]);
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
                        codeErrorBox.style.textAlign = 'center';
                        codeErrorBox.style.color = 'red';
                        codeErrorBox.style.display = 'none';
                        section = makeSection([
                            makeFloatList([
                                makeHeader('コード生成'),
                                tip(['生成範囲: ', codeUnitBox], '生成するコードの範囲を指定します。'),
                                tip(['列数: ', codeColsBox], '1 行に詰め込む要素数を指定します。'),
                                tip(['インデント: ', indentBox], 'インデントの形式とサイズを指定します。'),
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
                    if (window.location.hash === '#detail') {
                        showPro();
                    }
                    else {
                        hidePro();
                    }
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
function showPro() {
    document.querySelectorAll('.professional').forEach(function (el) {
        show(el);
    });
    document.querySelectorAll('.basic').forEach(function (el) {
        hide(el);
    });
    updateTrimCanvas();
}
function hidePro() {
    document.querySelectorAll('.professional').forEach(function (el) {
        hide(el);
    });
    document.querySelectorAll('.basic').forEach(function (el) {
        show(el);
    });
}
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
        var worldL = trimL; // Math.min(trimL, 0);
        var worldR = trimR; // Math.max(trimR, origW);
        var worldT = trimT; // Math.min(trimT, 0);
        var worldB = trimB; // Math.max(trimB, origH);
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
    var e_6, _a, e_7, _b;
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
            show(parentLiOf(scalingMethodBox));
        }
        else if (widthBox.value) {
            outW = parseInt(widthBox.value);
            outH = Math.ceil(srcH * (outW / srcW));
            hide(parentLiOf(scalingMethodBox));
        }
        else if (heightBox.value) {
            outH = parseInt(heightBox.value);
            outW = Math.ceil(srcW * (outH / srcH));
            hide(parentLiOf(scalingMethodBox));
        }
        else {
            if (outW > 256 || outH > 256) {
                var scale = Math.min(256 / outW, 256 / outH);
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
        var alphaProc = parseInt(alphaProcBox.value);
        var alphaThresh = parseInt(alphaThreshBox.value) / 255;
        preModCanvas.width = origCanvas.width;
        preModCanvas.height = origCanvas.height;
        if (alphaProc == 3 /* AlphaProc.SET_KEY_COLOR */) {
            // 抜き色の処理
            var keyCol = hexToRgb(keyColorBox.value);
            var keyR = (keyCol >> 24) & 255;
            var keyG = (keyCol >> 16) & 255;
            var keyB = (keyCol >> 8) & 255;
            var keyTol = parseInt(keyToleranceBox.value);
            var origCtx_1 = origCanvas.getContext('2d', { willReadFrequently: true });
            var origImageData = origCtx_1.getImageData(0, 0, origCanvas.width, origCanvas.height);
            var origData = origImageData.data;
            var modImageData = new ImageData(preModCanvas.width, preModCanvas.height);
            var modData = modImageData.data;
            for (var i = 0; i < origData.length; i += 4) {
                var r = origData[i];
                var g = origData[i + 1];
                var b = origData[i + 2];
                var a = origData[i + 3];
                var d = Math.abs(r - keyR) + Math.abs(g - keyG) + Math.abs(b - keyB);
                if (d <= keyTol) {
                    a = 0;
                }
                modData[i] = r;
                modData[i + 1] = g;
                modData[i + 2] = b;
                modData[i + 3] = a;
            }
            var origModCtx = preModCanvas.getContext('2d', { willReadFrequently: true });
            origModCtx.putImageData(modImageData, 0, 0);
        }
        else {
            var modCtx = preModCanvas.getContext('2d', { willReadFrequently: true });
            modCtx.clearRect(0, 0, preModCanvas.width, preModCanvas.height);
            modCtx.drawImage(origCanvas, 0, 0);
        }
        // トリミング + リサイズの適用
        {
            var outCtx = previewCanvas.getContext('2d', { willReadFrequently: true });
            previewCanvas.width = outW;
            previewCanvas.height = outH;
            if (alphaProc == 1 /* AlphaProc.FILL */) {
                // 背景色の適用
                outCtx.fillStyle = bgColorBox.value;
                outCtx.fillRect(0, 0, outW, outH);
            }
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
                outCtx.drawImage(preModCanvas, trimL, trimT, srcW, srcH, dx, dy, dw, dh);
            }
        }
        var fmt = new PixelFormatInfo(parseInt(pixelFormatBox.value));
        var maxChannelDepth = 0;
        var roundMethod = 0 /* RoundMethod.NEAREST */;
        try {
            for (var _c = __values(fmt.colorBits), _d = _c.next(); !_d.done; _d = _c.next()) {
                var depth = _d.value;
                if (depth > maxChannelDepth) {
                    maxChannelDepth = depth;
                }
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_6) throw e_6.error; }
        }
        if (maxChannelDepth > 1) {
            show(parentLiOf(roundMethodBox));
            roundMethod = parseInt(roundMethodBox.value);
        }
        else {
            // 均等割りはチャンネル深度が2以上でないと意味がないので無効化
            hide(parentLiOf(roundMethodBox));
        }
        var norm = new NormalizedImage(outW, outH, fmt.colorBits.length);
        // 量子化の適用
        {
            var previewCtx = previewCanvas.getContext('2d', { willReadFrequently: true });
            var previewImageData = previewCtx.getImageData(0, 0, outW, outH);
            var srcRgbData = previewImageData.data;
            var previewData = new Uint8Array(srcRgbData.length);
            var numPixels = outW * outH;
            var numAllCh = fmt.numTotalChannels;
            var numColCh = fmt.numColorChannels;
            var outData = [];
            for (var i = 0; i < numAllCh; i++) {
                outData.push(new Uint8Array(numPixels));
            }
            // 正規化 + 自動ガンマ補正用の値収集
            var HISTOGRAM_SIZE = 16;
            var histogram = new Uint32Array(HISTOGRAM_SIZE);
            for (var i = 0; i < numPixels; i++) {
                var r = srcRgbData[i * 4] / 255;
                var g = srcRgbData[i * 4 + 1] / 255;
                var b = srcRgbData[i * 4 + 2] / 255;
                var a = srcRgbData[i * 4 + 3] / 255;
                var gray = 0.299 * r + 0.587 * g + 0.114 * b;
                histogram[Math.round(gray * (HISTOGRAM_SIZE - 1))]++;
                switch (fmt.colorSpace) {
                    case 0 /* ColorSpace.GRAYSCALE */:
                        norm.color[i * numColCh] = gray;
                        break;
                    case 1 /* ColorSpace.RGB */:
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
                    for (var i = 0; i < norm.color.length; i++) {
                        var val = Math.pow(norm.color[i], 1 / gamma);
                        norm.color[i] = val;
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
                    var _e = __read(norm.getColorMinMax(), 2), chMin = _e[0], chMax = _e[1];
                    brightness = 0.5 - (chMin + chMax) / 2;
                }
                brightness = clip(-1, 1, brightness);
                brightnessBox.placeholder = '(' + Math.round(brightness * 255) + ')';
                if (brightness != 0) {
                    for (var i = 0; i < norm.color.length; i++) {
                        norm.color[i] = clip(0, 1, norm.color[i] + brightness);
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
                    var _f = __read(norm.getColorMinMax(), 2), chMin = _f[0], chMax = _f[1];
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
                    for (var i = 0; i < norm.color.length; i++) {
                        norm.color[i] = clip(0, 1, (norm.color[i] - 0.5) * contrast + 0.5);
                    }
                }
            }
            // 階調反転
            if (invertBox.checked) {
                for (var i = 0; i < norm.color.length; i++) {
                    norm.color[i] = 1 - norm.color[i];
                }
            }
            // プレビューのアルファチャンネルを初期化
            for (var i = 0; i < numPixels; i++) {
                previewData[i * 4 + 3] = 255;
            }
            // 減色方法の決定
            var minColBits = 999;
            try {
                for (var _g = __values(fmt.colorBits), _h = _g.next(); !_h.done; _h = _g.next()) {
                    var bits = _h.value;
                    if (bits < minColBits)
                        minColBits = bits;
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
                }
                finally { if (e_7) throw e_7.error; }
            }
            var colReduce = (minColBits < 8);
            var alpReduce = fmt.hasAlpha && (fmt.alphaBits < 8);
            var colDither = colReduce ? parseInt(colorDitherBox.value) : 0 /* DitherMethod.NONE */;
            var alpDither = alpReduce ? parseInt(alphaDitherBox.value) : 0 /* DitherMethod.NONE */;
            setVisible(parentLiOf(colorDitherBox), colReduce);
            setVisible(parentLiOf(alphaDitherBox), alpReduce);
            // 量子化
            var colErrDiffuse = colReduce && colDither === 1 /* DitherMethod.DIFFUSION */;
            var alpErrDiffuse = alpReduce && alpDither === 1 /* DitherMethod.DIFFUSION */;
            var colPalette = new Palette(fmt.colorBits, roundMethod);
            var alpOutMax = (1 << fmt.alphaBits) - 1;
            var colOut = new Uint8Array(numColCh);
            var colErr = new Float32Array(numColCh);
            var alpErr = new Float32Array(1);
            for (var y = 0; y < outH; y++) {
                for (var ix = 0; ix < outW; ix++) {
                    // 誤差拡散をジグザグに行うため
                    // ライン毎にスキャン方向を変える
                    var fwd = y % 2 == 0;
                    var x = fwd ? ix : (outW - 1 - ix);
                    var iPix = (y * outW + x);
                    // アルファチャンネルの値を算出
                    var transparent = false;
                    var alpOut = alpOutMax;
                    if (fmt.hasAlpha) {
                        var alpNormIn = norm.alpha[iPix];
                        if (alphaProc == 2 /* AlphaProc.BINARIZE */) {
                            alpOut = alpNormIn < alphaThresh ? 0 : alpOutMax;
                            alpErr[0] = 0;
                        }
                        else {
                            alpOut = Math.round(alpNormIn * alpOutMax);
                            var alpNormOut = alpOut / alpOutMax;
                            alpErr[0] = alpNormIn - alpNormOut;
                        }
                        transparent = alpOut == 0;
                    }
                    // パレットから最も近い色を選択
                    colPalette.nearest(norm.color, iPix * numColCh, colOut, 0, colErr);
                    // 出力
                    for (var ch = 0; ch < numColCh; ch++) {
                        outData[ch][iPix] = colOut[ch];
                    }
                    if (fmt.hasAlpha) {
                        outData[numColCh][iPix] = alpOut;
                    }
                    // プレビュー用の色生成
                    if (fmt.colorSpace === 0 /* ColorSpace.GRAYSCALE */) {
                        var gray = Math.round(colOut[0] * 255 / colPalette.outMax[0]);
                        for (var ch = 0; ch < 3; ch++) {
                            previewData[iPix * 4 + ch] = gray;
                        }
                    }
                    else {
                        for (var ch = 0; ch < 3; ch++) {
                            var outMax = colPalette.outMax[ch];
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
                } // for ix
            } // for y
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
function generateCode() {
    if (!imageCacheData) {
        codeBox.textContent = '';
        codeBox.style.display = 'block';
        codeErrorBox.style.display = 'none';
        return;
    }
    try {
        var channelData = imageCacheData;
        var fmt = imageCacheFormat;
        var chOrder = parseInt(channelOrderBox.value);
        var msb1st = parseInt(pixelOrderBox.value) == 1 /* PixelOrder.FAR_FIRST */;
        var bigEndian = parseInt(byteOrderBox.value) == 1 /* ByteOrder.BIG_ENDIAN */;
        var packUnit = parseInt(packUnitBox.value);
        var vertPack = parseInt(packDirBox.value) == 1 /* ScanDir.VERTICAL */;
        var alignBoundary = parseInt(alignBoundaryBox.value);
        var alignLeft = parseInt(alignDirBox.value) == 0 /* AlignDir.HIGHER */;
        var vertAddr = parseInt(addressingBox.value) == 1 /* ScanDir.VERTICAL */;
        var numCh = fmt.numTotalChannels;
        var chMap = void 0;
        switch (fmt.colorSpace) {
            case 0 /* ColorSpace.GRAYSCALE */:
                chMap = new Int32Array([0]);
                break;
            case 1 /* ColorSpace.RGB */:
                if (fmt.hasAlpha) {
                    switch (chOrder) {
                        case 0 /* ChannelOrder.RGBA */:
                            chMap = new Int32Array([3, 2, 1, 0]);
                            break;
                        case 1 /* ChannelOrder.BGRA */:
                            chMap = new Int32Array([3, 0, 1, 2]);
                            break;
                        case 2 /* ChannelOrder.ARGB */:
                            chMap = new Int32Array([2, 1, 0, 3]);
                            break;
                        case 3 /* ChannelOrder.ABGR */:
                            chMap = new Int32Array([0, 1, 2, 3]);
                            break;
                        default:
                            throw new Error('Unsupported channel order');
                    }
                }
                else {
                    switch (chOrder) {
                        case 0 /* ChannelOrder.RGBA */:
                        case 2 /* ChannelOrder.ARGB */:
                            chMap = new Int32Array([2, 1, 0]);
                            break;
                        case 1 /* ChannelOrder.BGRA */:
                        case 3 /* ChannelOrder.ABGR */:
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
        var chBits = new Int32Array(numCh);
        {
            var tmp = new Int32Array(numCh);
            for (var i = 0; i < fmt.numColorChannels; i++) {
                tmp[i] = fmt.colorBits[i];
            }
            if (fmt.hasAlpha) {
                tmp[fmt.numColorChannels] = fmt.alphaBits;
            }
            for (var i = 0; i < numCh; i++) {
                chBits[i] = tmp[chMap[i]];
            }
        }
        var chPos = new Uint8Array(numCh); // チャネル毎のビット位置
        var pixelStride = 0; // ピクセルあたりのビット数 (パディング含む)
        var pixelsPerFrag = 0; // フラグメントあたりのピクセル数
        var bytesPerFrag = 0; // フラグメントあたりのバイト数
        var alignRequired = false;
        if (packUnit == 2 /* PackUnit.UNPACKED */) {
            // 一番幅の広いチャネルに合わせてチャネル毎の幅を決定
            var maxChBits = 0;
            for (var i = 0; i < numCh; i++) {
                if (maxChBits < chBits[i]) {
                    maxChBits = chBits[i];
                }
            }
            var chStride = Math.ceil(maxChBits / alignBoundary) * alignBoundary;
            // 各チャネルのビット位置を算出
            for (var ch = 0; ch < numCh; ch++) {
                chPos[ch] = ch * chStride;
                alignRequired || (alignRequired = chStride != chBits[ch]);
                if (alignLeft) {
                    chPos[ch] += chStride - chBits[ch];
                }
            }
            pixelStride = chStride * numCh;
            bytesPerFrag = Math.ceil(pixelStride / 8);
            pixelsPerFrag = 1;
        }
        else {
            // 各チャネルのビット位置 (下位詰めの場合)
            var pixBits = 0;
            for (var ch = 0; ch < numCh; ch++) {
                chPos[ch] = pixBits;
                pixBits += chBits[ch];
            }
            switch (packUnit) {
                case 1 /* PackUnit.PIXEL */:
                    // ピクセル単位のパッキングの場合
                    pixelStride = Math.ceil(pixBits / alignBoundary) * alignBoundary;
                    pixelsPerFrag = Math.max(1, Math.floor(8 / pixelStride));
                    bytesPerFrag = Math.ceil(pixelStride / 8);
                    alignRequired = pixelStride != pixBits;
                    if (alignLeft) {
                        // 上位詰めの場合はチャネルのビット位置修正
                        for (var ch = 0; ch < numCh; ch++) {
                            chPos[ch] += pixelStride - pixBits;
                        }
                    }
                    break;
                case 0 /* PackUnit.MULTI_PIXEL */:
                    // 複数ピクセルをパッキングする場合
                    if (pixBits > alignBoundary / 2) {
                        throw new ArrayfyError(packUnitBox, 'アライメント境界の半分より大きなピクセルを複数パッキングできません。');
                    }
                    pixelStride = pixBits;
                    pixelsPerFrag = Math.floor(8 / pixBits);
                    var fragBits = pixBits * pixelsPerFrag;
                    var fragStride = Math.ceil(fragBits / alignBoundary) * alignBoundary;
                    bytesPerFrag = Math.ceil(fragStride / 8);
                    alignRequired = fragStride != fragBits;
                    if (alignLeft) {
                        // 上位詰めの場合はチャネルビット位置に下駄を履かせる
                        for (var i = 0; i < numCh; i++) {
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
            var numCols = bytesPerFrag * 8;
            var numRows = 3;
            var colW = clip(20, 40, Math.round(800 / numCols));
            var rowH = 30;
            var tableW = numCols * colW;
            var tableH = numRows * rowH;
            var pad = 10;
            structCanvas.width = tableW + pad * 2;
            structCanvas.height = tableH + pad * 2;
            var ctx = structCanvas.getContext('2d');
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
            for (var i = 0; i <= numCols; i++) {
                var x = pad + i * colW;
                ctx.beginPath();
                if (i % 8 == 0) {
                    ctx.moveTo(x, pad);
                }
                else {
                    ctx.moveTo(x, pad + rowH);
                }
                ctx.lineTo(x, pad + tableH);
                ctx.stroke();
                if (i < numCols) {
                    var iBit = (numCols - 1 - i) % 8;
                    ctx.fillText(iBit.toString(), x + colW / 2, pad + rowH + rowH / 2);
                    if (iBit == 3) {
                        var ib = Math.floor((numCols - 1 - i) / 8);
                        var iByte_1 = bigEndian ? (bytesPerFrag - 1 - ib) : ib;
                        ctx.fillText('Byte' + iByte_1.toString(), x, pad + rowH / 2);
                    }
                }
            }
            // 横の罫線
            for (var i = 0; i <= numRows; i++) {
                ctx.beginPath();
                ctx.moveTo(pad, pad + i * rowH);
                ctx.moveTo(pad, pad + i * rowH);
                ctx.lineTo(pad + tableW, pad + i * rowH);
                ctx.stroke();
            }
            // 各チャネルの色
            var rgbColors = void 0;
            switch (fmt.colorSpace) {
                case 0 /* ColorSpace.GRAYSCALE */:
                    rgbColors = ['rgba(255,255,255,0.8)'];
                    break;
                case 1 /* ColorSpace.RGB */:
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
            for (var ip = 0; ip < pixelsPerFrag; ip++) {
                var iPix = msb1st ? (pixelsPerFrag - 1 - ip) : ip;
                for (var ch = 0; ch < numCh; ch++) {
                    var r = pad + tableW - (ip * pixelStride + chPos[ch]) * colW;
                    var w = chBits[ch] * colW;
                    var x = r - w;
                    var y = pad + tableH - rowH;
                    ctx.fillStyle = rgbColors[chMap[ch]];
                    ctx.fillRect(x, y, w, rowH);
                    ctx.strokeStyle = '#000';
                    ctx.strokeRect(x, y, w, rowH);
                    ctx.fillStyle = '#000';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    var label = fmt.channelName(chMap[ch]) + (pixelsPerFrag > 1 ? iPix : '');
                    var mtx = ctx.measureText(label);
                    ctx.fillText(label, x + w / 2, y + rowH / 2);
                }
            }
        }
        // エンコードパラメータ
        var fragWidth = vertPack ? 1 : pixelsPerFrag;
        var fragHeight = vertPack ? pixelsPerFrag : 1;
        var width = previewCanvas.width;
        var height = previewCanvas.height;
        var cols = Math.ceil(width / fragWidth);
        var rows = Math.ceil(height / fragHeight);
        var numPacks = cols * rows;
        var arrayData = new Uint8Array(numPacks * bytesPerFrag);
        var iByte = 0;
        // フラグメントループ
        for (var fragIndex = 0; fragIndex < numPacks; fragIndex++) {
            var xCoarse = void 0, yCoarse = void 0;
            if (vertAddr) {
                xCoarse = fragWidth * Math.floor(fragIndex / rows);
                yCoarse = fragHeight * (fragIndex % rows);
            }
            else {
                xCoarse = fragWidth * (fragIndex % cols);
                yCoarse = fragHeight * Math.floor(fragIndex / cols);
            }
            // ピクセルループ
            var fragData = 0;
            var ip = 0;
            for (var yFine = 0; yFine < fragHeight; yFine++) {
                for (var xFine = 0; xFine < fragWidth; xFine++) {
                    var x = xCoarse + xFine;
                    var y = yCoarse + yFine;
                    if (y < height && x < width) {
                        // チャネルループ
                        var iPix = msb1st ? (pixelsPerFrag - 1 - ip) : ip;
                        var pixOffset = pixelStride * iPix;
                        for (var ch = 0; ch < numCh; ch++) {
                            var chData = channelData[chMap[ch]][y * width + x];
                            var shift = pixOffset + chPos[ch];
                            fragData |= chData << shift;
                        } // for ch
                    }
                    ip++;
                } // for xFine
            } // for yFine
            // バイト単位に変換
            var fragBits = bytesPerFrag * 8;
            for (var j = 0; j < bytesPerFrag; j++) {
                if (bigEndian) {
                    arrayData[iByte++] = (fragData >> (fragBits - 8)) & 0xFF;
                    fragData <<= 8;
                }
                else {
                    arrayData[iByte++] = fragData & 0xFF;
                    fragData >>= 8;
                }
            }
        } // for packIndex
        try {
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
            var codeUnit = parseInt(codeUnitBox.value);
            // コード生成
            var code = '';
            if (codeUnit >= 2 /* CodeUnit.FILE */) {
                code += "#pragma once\n";
                code += "\n";
                code += "#include <stdint.h>\n";
                code += "\n";
            }
            if (codeUnit >= 1 /* CodeUnit.ARRAY_DEF */) {
                code += "// ".concat(width, "x").concat(height, "px, ").concat(imageCacheFormat.toString(), "\n");
                code += "// ";
                if (numCh > 1) {
                    var chOrderStr = '';
                    for (var i = 0; i < numCh; i++) {
                        if (i > 0)
                            chOrderStr += ':';
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
                code += "".concat(vertAddr ? 'Vertical' : 'Horizontal', " Adressing\n");
                code += "// ".concat(arrayData.length, " Bytes\n");
                code += 'const uint8_t imageArray[] = {\n';
            }
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
            if (codeUnit >= 1 /* CodeUnit.ARRAY_DEF */) {
                code += '};\n';
            }
            codeBox.textContent = code;
            codeBox.style.display = 'block';
            codeErrorBox.style.display = 'none';
        }
        catch (error) {
            codeBox.style.display = 'none';
            codeErrorBox.textContent = error.message;
            codeErrorBox.style.display = 'block';
        }
        structCanvas.style.display = 'inline-block';
        structErrorBox.style.display = 'none';
    }
    catch (error) {
        codeBox.textContent = '';
        codeBox.style.display = 'block';
        codeErrorBox.style.display = 'none';
        structCanvas.style.display = 'none';
        structErrorBox.textContent = error.message;
        structErrorBox.style.display = 'block';
    }
}
function clip(min, max, val) {
    if (val < min)
        return min;
    if (val > max)
        return max;
    return val;
}
function hexToRgb(hex) {
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }
    if (hex.length === 3) {
        var r = parseInt(hex[0] + hex[0], 16);
        var g = parseInt(hex[1] + hex[1], 16);
        var b = parseInt(hex[2] + hex[2], 16);
        return (r << 24) | (g << 16) | (b << 8) | 255;
    }
    else if (hex.length == 6) {
        var r = parseInt(hex.slice(0, 2), 16);
        var g = parseInt(hex.slice(2, 4), 16);
        var b = parseInt(hex.slice(4, 6), 16);
        return (r << 24) | (g << 16) | (b << 8) | 255;
    }
    else {
        throw new Error('Invalid hex color');
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
window.addEventListener('resize', function (e) {
    requestUpdateTrimCanvas();
});
