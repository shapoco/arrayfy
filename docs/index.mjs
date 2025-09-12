//#region src/Debug.ts
var StopWatch = class {
	lastTime;
	constructor(report) {
		this.report = report;
		this.lastTime = performance.now();
		this.report = report;
	}
	lap(label) {
		const now = performance.now();
		const elapsed = now - this.lastTime;
		if (this.report) console.log(`${elapsed.toFixed(1)} ms: ${label}`);
		this.lastTime = now;
		return elapsed;
	}
};

//#endregion
//#region src/CodeGen.ts
let CodeUnit = /* @__PURE__ */ function(CodeUnit$1) {
	CodeUnit$1[CodeUnit$1["ELEMENTS"] = 0] = "ELEMENTS";
	CodeUnit$1[CodeUnit$1["ARRAY_DEF"] = 1] = "ARRAY_DEF";
	CodeUnit$1[CodeUnit$1["FILE"] = 2] = "FILE";
	return CodeUnit$1;
}({});
let Indent = /* @__PURE__ */ function(Indent$1) {
	Indent$1[Indent$1["TAB"] = 0] = "TAB";
	Indent$1[Indent$1["SPACE_X2"] = 1] = "SPACE_X2";
	Indent$1[Indent$1["SPACE_X4"] = 2] = "SPACE_X4";
	return Indent$1;
}({});
var Code = class {
	name = "";
	code = "";
	numLines = 0;
};
var CodeGenArgs = class {
	name = "";
	src = null;
	blobs = [];
	codeUnit = CodeUnit.FILE;
	indent = Indent.SPACE_X2;
	arrayCols = 16;
	codes = [];
};
var StringBuilder = class {
	buff = [];
	ptr = 0;
	constructor(length = 0) {
		this.length = length;
		this.buff = Array(length);
		this.clear();
	}
	push(s) {
		if (this.ptr >= this.length) {
			this.length = Math.floor(this.length * 1.5) + 10;
			const newBuff = Array(this.length);
			for (let i = 0; i < this.ptr; i++) newBuff[i] = this.buff[i];
			this.buff = newBuff;
			console.warn("StringBuilder: buffer resized to " + this.length);
		}
		this.buff[this.ptr++] = s;
	}
	join(sep) {
		return this.buff.join(sep);
	}
	clear() {
		this.ptr = 0;
		for (let i = 0; i < this.length; i++) this.buff[i] = "";
	}
	numLines() {
		let n = 0;
		for (let i = 0; i < this.ptr; i++) if (this.buff[i].endsWith("\n")) n++;
		return n;
	}
};
function generate(args) {
	const sw = new StopWatch(false);
	let indent = "  ";
	switch (args.indent) {
		case Indent.SPACE_X2:
			indent = "  ";
			break;
		case Indent.SPACE_X4:
			indent = "    ";
			break;
		case Indent.TAB:
			indent = "	";
			break;
		default: throw new Error("Unknown indent type");
	}
	let hexTable = [];
	for (let i = 0; i < 256; i++) hexTable.push(`0x${i.toString(16).padStart(2, "0")},`);
	let buffLen = 100;
	for (let blob of args.blobs) {
		const len = blob.array.length;
		buffLen += 10 + len * 2 + Math.ceil(len / args.arrayCols) * 2;
	}
	const buff = new StringBuilder(buffLen);
	if (args.codeUnit >= CodeUnit.FILE) {
		buff.push(`#pragma once\n`);
		buff.push(`\n`);
		buff.push(`#include <stdint.h>\n`);
		buff.push(`\n`);
	}
	for (let iBlob = 0; iBlob < args.blobs.length; iBlob++) {
		const blob = args.blobs[iBlob];
		const array = blob.array;
		let arrayName;
		if (args.blobs.length <= 1) arrayName = args.name;
		else arrayName = args.name + "_" + blob.name;
		if (args.codeUnit >= CodeUnit.ARRAY_DEF) {
			const lines = blob.comment.trimEnd().split("\n");
			for (let line of lines) buff.push(`// ${line}\n`);
			buff.push(`const uint8_t ${arrayName}[] = {\n`);
		}
		for (let i = 0; i < array.length; i++) {
			if (i % args.arrayCols == 0) buff.push(indent);
			buff.push(hexTable[array[i]]);
			if ((i + 1) % args.arrayCols == 0 || i + 1 == array.length) buff.push("\n");
			else buff.push(" ");
		}
		if (args.codeUnit >= CodeUnit.ARRAY_DEF) buff.push("};\n");
		const lastBlob = iBlob + 1 >= args.blobs.length;
		if (args.codeUnit < CodeUnit.FILE || lastBlob) {
			const code = new Code();
			if (args.codeUnit >= CodeUnit.FILE) code.name = args.name + ".h";
			else code.name = args.name + "_" + blob.name + ".h";
			code.code = buff.join("");
			code.numLines = buff.numLines();
			args.codes.push(code);
			if (!lastBlob) buff.clear();
		}
	}
	sw.lap("CodeGen.generate()");
}

//#endregion
//#region src/Utils.ts
function clip(min, max, val) {
	if (val < min) return min;
	if (val > max) return max;
	return val;
}
function intCeil(val, unit) {
	return Math.ceil(val / unit) * unit;
}

//#endregion
//#region src/Colors.ts
var HslRange = class {
	hMin = 0;
	hRange = 1;
	sMin = 0;
	sMax = 1;
	lMin = 0;
	lMax = 1;
};
function hexStrToRgb(hex) {
	if (hex.startsWith("#")) hex = hex.slice(1);
	if (hex.length === 3) {
		const r = parseInt(hex[0] + hex[0], 16);
		const g = parseInt(hex[1] + hex[1], 16);
		const b = parseInt(hex[2] + hex[2], 16);
		return r | g << 8 | b << 16;
	} else if (hex.length == 6) {
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		return r | g << 8 | b << 16;
	} else throw new Error("Invalid hex color");
}
function rgbToHexStr(rgb) {
	const { r, g, b } = rgbU32ToU8(rgb);
	const chVals = [
		r,
		g,
		b
	];
	let longFormat = false;
	for (let i = 0; i < 3; i++) {
		const hi = chVals[i] >> 4;
		const lo = chVals[i] & 15;
		if (hi != lo) {
			longFormat = true;
			break;
		}
	}
	if (longFormat) return "#" + r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0");
	else return "#" + (r >> 4).toString(16) + (g >> 4).toString(16) + (b >> 4).toString(16);
}
function rgbU32ToU8(color) {
	const r = color & 255;
	const g = color >> 8 & 255;
	const b = color >> 16 & 255;
	return {
		r,
		g,
		b
	};
}
function rgbU32ToF32(color) {
	const r = (color & 255) / 255;
	const g = (color >> 8 & 255) / 255;
	const b = (color >> 16 & 255) / 255;
	return {
		r,
		g,
		b
	};
}
function grayscale(r, g, b) {
	return .299 * r + .587 * g + .114 * b;
}
function grayscaleArrayF32(data, offset) {
	return grayscale(data[offset], data[offset + 1], data[offset + 2]);
}
function grayscaleArrayU8(data, offset) {
	return grayscale(data[offset], data[offset + 1], data[offset + 2]);
}
function rgbToHslArrayF32(src, srcOffset, dest, destOffset, numPixels) {
	for (let i = 0; i < numPixels; i++) {
		const r = src[srcOffset];
		const g = src[srcOffset + 1];
		const b = src[srcOffset + 2];
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		let h = 0, s = 0, l = (max + min) / 2;
		if (max != min) {
			const d = max - min;
			s = d;
			switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				case b:
					h = (r - g) / d + 4;
					break;
			}
		}
		h /= 6;
		dest[destOffset] = h;
		dest[destOffset + 1] = s;
		dest[destOffset + 2] = l;
		srcOffset += 3;
		destOffset += 3;
	}
}
function hslToRgbArrayF32(src, srcOffset, dest, destOffset, numPixels) {
	for (let i = 0; i < numPixels; i++) {
		let h = src[srcOffset];
		let s = src[srcOffset + 1];
		let l = src[srcOffset + 2];
		let r, g, b;
		if (s == 0) r = g = b = l;
		else {
			const p = s / 2;
			const max = l + p;
			const min = l - p;
			h -= Math.floor(h);
			h *= 6;
			if (h < 1) {
				r = max;
				g = min + (max - min) * h;
				b = min;
			} else if (h < 2) {
				r = min + (max - min) * (2 - h);
				g = max;
				b = min;
			} else if (h < 3) {
				r = min;
				g = max;
				b = min + (max - min) * (h - 2);
			} else if (h < 4) {
				r = min;
				g = min + (max - min) * (4 - h);
				b = max;
			} else if (h < 5) {
				r = min + (max - min) * (h - 4);
				g = min;
				b = max;
			} else {
				r = max;
				g = min;
				b = min + (max - min) * (6 - h);
			}
		}
		dest[destOffset] = clip(0, 1, r);
		dest[destOffset + 1] = clip(0, 1, g);
		dest[destOffset + 2] = clip(0, 1, b);
		srcOffset += 3;
		destOffset += 3;
	}
}
function hueWrap(hue) {
	return hue - Math.floor(hue);
}
function hueAdd(hue, add) {
	return hueWrap(hue + add);
}
function hueDiff(hue1, hue2) {
	const d = hueWrap(hue1 - hue2);
	if (d < .5) return d;
	else return d - 1;
}
function hueClip(min, range, hue) {
	const radius = range / 2;
	const center = hueAdd(min, radius);
	const d = hueDiff(hue, center);
	if (d < -radius) return hueAdd(center, -radius);
	else if (d > radius) return hueAdd(center, radius);
	else return hue;
}
function dot(a, ia, b, ib) {
	return a[ia + 0] * b[ib + 0] + a[ia + 1] * b[ib + 1] + a[ia + 2] * b[ib + 2];
}
function transformColor(mat, v, iv) {
	const r = dot(mat, 0, v, iv + 0) + mat[3];
	const g = dot(mat, 4, v, iv + 0) + mat[7];
	const b = dot(mat, 8, v, iv + 0) + mat[11];
	v[iv + 0] = clip(0, 1, r);
	v[iv + 1] = clip(0, 1, g);
	v[iv + 2] = clip(0, 1, b);
}

//#endregion
//#region src/Blobs.ts
var ArrayBlob = class {
	array;
	comment = "";
	constructor(name, size) {
		this.name = name;
		this.size = size;
		this.size = size;
		this.array = new Uint8Array(size);
	}
};

//#endregion
//#region src/Encoder.ts
let PackUnit = /* @__PURE__ */ function(PackUnit$1) {
	PackUnit$1[PackUnit$1["UNPACKED"] = 0] = "UNPACKED";
	PackUnit$1[PackUnit$1["PIXEL"] = 1] = "PIXEL";
	PackUnit$1[PackUnit$1["ALIGNMENT"] = 2] = "ALIGNMENT";
	return PackUnit$1;
}({});
let PlaneType = /* @__PURE__ */ function(PlaneType$1) {
	PlaneType$1[PlaneType$1["DIRECT"] = 0] = "DIRECT";
	PlaneType$1[PlaneType$1["INDEX_MATCH"] = 1] = "INDEX_MATCH";
	return PlaneType$1;
}({});
let AlignBoundary = /* @__PURE__ */ function(AlignBoundary$1) {
	AlignBoundary$1[AlignBoundary$1["NIBBLE"] = 4] = "NIBBLE";
	AlignBoundary$1[AlignBoundary$1["BYTE_1"] = 8] = "BYTE_1";
	AlignBoundary$1[AlignBoundary$1["BYTE_2"] = 16] = "BYTE_2";
	AlignBoundary$1[AlignBoundary$1["BYTE_3"] = 24] = "BYTE_3";
	AlignBoundary$1[AlignBoundary$1["BYTE_4"] = 32] = "BYTE_4";
	return AlignBoundary$1;
}({});
var FieldLayout = class {
	srcChannel = 0;
	pos = 0;
	width = 0;
};
var PlaneOutput = class {
	fields = [];
	pixelStride = 0;
	pixelsPerFrag = 0;
	bytesPerFrag = 0;
	alignRequired = false;
	blob = null;
};
var PlaneArgs = class {
	id = "";
	type = PlaneType.DIRECT;
	indexMatchValue = 0;
	postInvert = false;
	farPixelFirst = false;
	bigEndian = false;
	packUnit = PackUnit.PIXEL;
	vertPack = false;
	alignBoundary = AlignBoundary.BYTE_1;
	alignLeft = false;
	vertAddr = false;
	output = new PlaneOutput();
};
var EncodeArgs = class {
	src = null;
	alphaFirst = false;
	colorDescending = false;
	planes = [];
};
function encode(args) {
	const sw = new StopWatch(false);
	const fmt = args.src.format;
	for (let plane of args.planes) {
		const out = plane.output;
		let alphaField = null;
		if (fmt.hasAlpha) {
			alphaField = new FieldLayout();
			alphaField.srcChannel = fmt.numColorChannels;
			alphaField.width = fmt.alphaBits;
		}
		switch (plane.type) {
			case PlaneType.DIRECT:
				if (alphaField && args.alphaFirst) out.fields.push(alphaField);
				if (fmt.isIndexed) {
					const field = new FieldLayout();
					field.srcChannel = 0;
					field.width = fmt.indexBits;
					out.fields.push(field);
				} else for (let ch = 0; ch < fmt.numColorChannels; ch++) {
					const field = new FieldLayout();
					if (args.colorDescending) field.srcChannel = fmt.numColorChannels - 1 - ch;
					else field.srcChannel = ch;
					field.width = fmt.colorBits[field.srcChannel];
					out.fields.push(field);
				}
				if (alphaField && !args.alphaFirst) out.fields.push(alphaField);
				break;
			case PlaneType.INDEX_MATCH:
				{
					const field = new FieldLayout();
					field.width = 1;
					out.fields.push(field);
				}
				break;
			default: throw new Error("Unsupported filter mode");
		}
		if (out.fields.length == 0) throw new Error("内部エラー: フィールドが定義されていません。");
		const numCh = out.fields.length;
		if (plane.packUnit == PackUnit.UNPACKED) {
			let maxChBits = 0;
			for (const field of out.fields) if (maxChBits < field.width) maxChBits = field.width;
			const chStride = intCeil(maxChBits, plane.alignBoundary);
			for (let ch = 0; ch < numCh; ch++) {
				const field = out.fields[ch];
				field.pos = ch * chStride;
				out.alignRequired ||= chStride != field.width;
				if (plane.alignLeft) field.pos += chStride - field.width;
			}
			out.pixelStride = chStride * numCh;
			out.bytesPerFrag = Math.ceil(out.pixelStride / 8);
			out.pixelsPerFrag = 1;
		} else {
			let pixBits = 0;
			for (const field of out.fields) {
				field.pos = pixBits;
				pixBits += field.width;
			}
			switch (plane.packUnit) {
				case PackUnit.PIXEL:
					out.pixelStride = intCeil(pixBits, plane.alignBoundary);
					out.pixelsPerFrag = Math.max(1, Math.floor(8 / out.pixelStride));
					out.bytesPerFrag = Math.ceil(out.pixelStride / 8);
					out.alignRequired = out.pixelStride != pixBits;
					if (plane.alignLeft) for (const field of out.fields) field.pos += out.pixelStride - pixBits;
					break;
				case PackUnit.ALIGNMENT:
					if (pixBits > plane.alignBoundary) throw new Error("アライメント境界より大きなピクセルをパッキングできません。");
					out.pixelStride = pixBits;
					out.pixelsPerFrag = Math.floor(plane.alignBoundary / pixBits);
					const fragBits = pixBits * out.pixelsPerFrag;
					const fragStride = Math.ceil(fragBits / plane.alignBoundary) * plane.alignBoundary;
					out.bytesPerFrag = Math.ceil(fragStride / 8);
					out.alignRequired = fragStride != fragBits;
					if (plane.alignLeft) for (const field of out.fields) field.pos += fragStride - fragBits;
					break;
				default: throw new Error("Unsupported PackUnit");
			}
		}
	}
	const src = args.src;
	for (let plane of args.planes) {
		const out = plane.output;
		const numCh = out.fields.length;
		if (!(out.pixelsPerFrag >= 1)) throw new Error("内部エラー: フラグメントあたりのピクセル数が不正です。");
		if (!(out.bytesPerFrag >= 1)) throw new Error("内部エラー: フラグメントあたりのバイト数が不正です。");
		const fragWidth = plane.vertPack ? 1 : out.pixelsPerFrag;
		const fragHeight = plane.vertPack ? out.pixelsPerFrag : 1;
		const fragSize = fragWidth * fragHeight;
		const cols = Math.ceil(src.width / fragWidth);
		const rows = Math.ceil(src.height / fragHeight);
		const numFrags = cols * rows;
		out.blob = new ArrayBlob(plane.id, numFrags * out.bytesPerFrag);
		const array = out.blob.array;
		let iByte = 0;
		for (let iFrag = 0; iFrag < numFrags; iFrag++) {
			let xCoarse, yCoarse;
			if (plane.vertAddr) {
				xCoarse = fragWidth * Math.floor(iFrag / rows);
				yCoarse = fragHeight * (iFrag % rows);
			} else {
				xCoarse = fragWidth * (iFrag % cols);
				yCoarse = fragHeight * Math.floor(iFrag / cols);
			}
			let fragData = 0;
			for (let iSrc = 0; iSrc < fragSize; iSrc++) {
				const iDest = plane.farPixelFirst ? fragSize - 1 - iSrc : iSrc;
				const xFine = iSrc % fragWidth;
				const yFine = Math.floor(iSrc / fragWidth);
				const x = xCoarse + xFine;
				const y = yCoarse + yFine;
				if (y < src.height && x < src.width) {
					const pixOffset = out.pixelStride * iDest;
					switch (plane.type) {
						case PlaneType.DIRECT:
							for (const field of out.fields) {
								const chData = src.data[field.srcChannel][y * src.width + x];
								const shift = pixOffset + field.pos;
								fragData |= chData << shift;
							}
							break;
						case PlaneType.INDEX_MATCH:
							{
								const chData = src.data[0][y * src.width + x];
								let match = chData == plane.indexMatchValue;
								if (plane.postInvert) match = !match;
								if (match) fragData |= 1 << pixOffset + out.fields[0].pos;
							}
							break;
						default: throw new Error("Unsupported filter mode");
					}
				}
			}
			const fragBits = out.bytesPerFrag * 8;
			for (let j = 0; j < out.bytesPerFrag; j++) if (plane.bigEndian) {
				array[iByte++] = fragData >> fragBits - 8 & 255;
				fragData <<= 8;
			} else {
				array[iByte++] = fragData & 255;
				fragData >>= 8;
			}
		}
		{
			let buff = [];
			buff.push(`${src.width}x${src.height}px, ${fmt.toString()}\n`);
			if (plane.type == PlaneType.INDEX_MATCH) {
				buff.push(`Plane "${plane.id}", color index=${plane.indexMatchValue}`);
				if (plane.postInvert) buff.push(`, Inverted`);
				buff.push(`\n`);
			}
			if (numCh > 1) {
				let chOrderStr = "";
				for (let i = 0; i < numCh; i++) {
					const field = out.fields[i];
					if (i > 0) chOrderStr += ":";
					chOrderStr += fmt.channelName(field.srcChannel);
				}
				buff.push(chOrderStr + ", ");
			}
			if (out.pixelsPerFrag > 1) {
				buff.push((plane.farPixelFirst ? "MSB" : "LSB") + " First, ");
				buff.push((plane.vertPack ? "Vertical" : "Horizontal") + " Packing, ");
			}
			if (out.bytesPerFrag > 1) buff.push((plane.bigEndian ? "Big" : "Little") + " Endian, ");
			buff.push(`${plane.vertAddr ? "Vertical" : "Horizontal"} Adressing\n`);
			buff.push(`${array.length} Bytes\n`);
			out.blob.comment = buff.join("");
		}
	}
	sw.lap("Encoder.encode()");
}

//#endregion
//#region src/Images.ts
let ColorSpace = /* @__PURE__ */ function(ColorSpace$1) {
	ColorSpace$1[ColorSpace$1["GRAYSCALE"] = 0] = "GRAYSCALE";
	ColorSpace$1[ColorSpace$1["RGB"] = 1] = "RGB";
	return ColorSpace$1;
}({});
let PixelFormat = /* @__PURE__ */ function(PixelFormat$1) {
	PixelFormat$1[PixelFormat$1["RGBA8888"] = 0] = "RGBA8888";
	PixelFormat$1[PixelFormat$1["RGB888"] = 1] = "RGB888";
	PixelFormat$1[PixelFormat$1["RGB666"] = 2] = "RGB666";
	PixelFormat$1[PixelFormat$1["RGB565"] = 3] = "RGB565";
	PixelFormat$1[PixelFormat$1["RGB444"] = 4] = "RGB444";
	PixelFormat$1[PixelFormat$1["RGB332"] = 5] = "RGB332";
	PixelFormat$1[PixelFormat$1["RGB111"] = 6] = "RGB111";
	PixelFormat$1[PixelFormat$1["GRAY4"] = 7] = "GRAY4";
	PixelFormat$1[PixelFormat$1["GRAY2"] = 8] = "GRAY2";
	PixelFormat$1[PixelFormat$1["BW"] = 9] = "BW";
	PixelFormat$1[PixelFormat$1["I2_RGB888"] = 10] = "I2_RGB888";
	return PixelFormat$1;
}({});
let ChannelOrder = /* @__PURE__ */ function(ChannelOrder$1) {
	ChannelOrder$1[ChannelOrder$1["RGBA"] = 0] = "RGBA";
	ChannelOrder$1[ChannelOrder$1["BGRA"] = 1] = "BGRA";
	ChannelOrder$1[ChannelOrder$1["ARGB"] = 2] = "ARGB";
	ChannelOrder$1[ChannelOrder$1["ABGR"] = 3] = "ABGR";
	return ChannelOrder$1;
}({});
var PixelFormatInfo = class {
	colorSpace;
	colorBits;
	alphaBits = 0;
	indexBits = 0;
	constructor(id) {
		this.id = id;
		switch (id) {
			case PixelFormat.RGBA8888:
				this.colorSpace = ColorSpace.RGB;
				this.colorBits = [
					8,
					8,
					8
				];
				this.alphaBits = 8;
				break;
			case PixelFormat.RGB888:
				this.colorSpace = ColorSpace.RGB;
				this.colorBits = [
					8,
					8,
					8
				];
				break;
			case PixelFormat.RGB666:
				this.colorSpace = ColorSpace.RGB;
				this.colorBits = [
					6,
					6,
					6
				];
				break;
			case PixelFormat.RGB565:
				this.colorSpace = ColorSpace.RGB;
				this.colorBits = [
					5,
					6,
					5
				];
				break;
			case PixelFormat.RGB444:
				this.colorSpace = ColorSpace.RGB;
				this.colorBits = [
					4,
					4,
					4
				];
				break;
			case PixelFormat.RGB332:
				this.colorSpace = ColorSpace.RGB;
				this.colorBits = [
					3,
					3,
					2
				];
				break;
			case PixelFormat.RGB111:
				this.colorSpace = ColorSpace.RGB;
				this.colorBits = [
					1,
					1,
					1
				];
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
			case PixelFormat.I2_RGB888:
				this.colorSpace = ColorSpace.RGB;
				this.colorBits = [
					8,
					8,
					8
				];
				this.indexBits = 2;
				break;
			default: throw new Error("Unknown image format");
		}
	}
	toString() {
		if (this.isIndexed) return "Indexed" + this.indexBits;
		else switch (this.colorSpace) {
			case ColorSpace.GRAYSCALE: if (this.colorBits[0] == 1) return "B/W";
			else return "Gray" + this.colorBits[0];
			case ColorSpace.RGB: if (this.hasAlpha) return "RGBA" + this.colorBits.join("") + this.alphaBits.toString();
			else return "RGB" + this.colorBits.join("");
			default: throw new Error("Unknown color space");
		}
	}
	get hasAlpha() {
		return this.alphaBits > 0;
	}
	get isIndexed() {
		return this.indexBits > 0;
	}
	get numTotalChannels() {
		return this.colorBits.length + (this.hasAlpha ? 1 : 0);
	}
	get numColorChannels() {
		return this.colorBits.length;
	}
	channelName(i) {
		switch (this.colorSpace) {
			case ColorSpace.GRAYSCALE: return "V";
			case ColorSpace.RGB: return "RGBA".slice(i, i + 1);
			default: throw new Error("Unknown color space");
		}
	}
};
var NormalizedImage = class NormalizedImage {
	color;
	alpha;
	numColorChannels;
	constructor(width, height, colorSpace) {
		this.width = width;
		this.height = height;
		this.colorSpace = colorSpace;
		switch (colorSpace) {
			case ColorSpace.GRAYSCALE:
				this.numColorChannels = 1;
				break;
			case ColorSpace.RGB:
				this.numColorChannels = 3;
				break;
			default: throw new Error("Invalid color space");
		}
		this.color = new Float32Array(width * height * this.numColorChannels);
		this.alpha = new Float32Array(width * height);
	}
	clone() {
		const img = new NormalizedImage(this.width, this.height, this.colorSpace);
		img.color.set(this.color);
		img.alpha.set(this.alpha);
		return img;
	}
};
var ReducedImage = class {
	data;
	tmp;
	constructor(width, height, format, palette) {
		this.width = width;
		this.height = height;
		this.format = format;
		this.palette = palette;
		const numPixels = width * height;
		const numAllCh = format.numTotalChannels;
		this.data = [];
		for (let i = 0; i < numAllCh; i++) this.data.push(new Uint8Array(numPixels));
		this.tmp = new Uint8Array(format.numTotalChannels);
	}
	getPreviewImage(dest) {
		const numAllCh = this.format.numTotalChannels;
		const numColCh = this.format.numColorChannels;
		const alpOutMax = this.format.hasAlpha ? (1 << this.format.alphaBits) - 1 : 1;
		for (let i = 0; i < this.width * this.height; i++) {
			for (let ch = 0; ch < numAllCh; ch++) this.tmp[ch] = this.data[ch][i];
			this.palette.extract(this.tmp, 0, dest, i * 4);
			if (this.format.hasAlpha) dest[i * 4 + 3] = Math.round(this.tmp[numColCh] * 255 / alpOutMax);
			else dest[i * 4 + 3] = 255;
		}
	}
};

//#endregion
//#region src/Configs.ts
function makeDirectPlane(id = "color") {
	return {
		planeType: PlaneType.DIRECT,
		id,
		matchIndex: -1,
		matchInvert: false
	};
}
function makeIndexMatch(index, id, invert = false) {
	return {
		planeType: PlaneType.INDEX_MATCH,
		id,
		matchIndex: index,
		matchInvert: invert
	};
}
const defaultConfig = {
	label: "default",
	description: "default",
	format: PixelFormat.RGBA8888,
	channelOrder: ChannelOrder.ARGB,
	farPixelFirst: false,
	bigEndian: false,
	packUnit: PackUnit.PIXEL,
	vertPack: false,
	alignBoundary: AlignBoundary.BYTE_1,
	alignLeft: false,
	vertAddr: false,
	palette: new Uint32Array(),
	planeCfgs: [makeDirectPlane()]
};
const argb8888_le = (function() {
	let p = { ...defaultConfig };
	p.label = "ARGB8888-LE";
	p.description = "透明度付きフルカラー。";
	p.format = PixelFormat.RGBA8888;
	p.channelOrder = ChannelOrder.ARGB;
	return p;
})();
const rgb888_be = (function() {
	let p = { ...defaultConfig };
	p.label = "RGB888-BE";
	p.description = "フルカラー。24bit 液晶用。";
	p.format = PixelFormat.RGB888;
	p.channelOrder = ChannelOrder.ARGB;
	p.bigEndian = true;
	return p;
})();
const rgb666_be_ra = (function() {
	let p = { ...defaultConfig };
	p.label = "RGB666-BE-RA";
	p.description = "各バイトにチャネルを下位詰めで配置した RGB666。LovyanGFX 用。";
	p.format = PixelFormat.RGB666;
	p.channelOrder = ChannelOrder.ARGB;
	p.packUnit = PackUnit.UNPACKED;
	p.bigEndian = true;
	return p;
})();
const rgb666_be_la = (function() {
	let p = { ...defaultConfig };
	p.label = "RGB666-BE-LA";
	p.description = "各バイトにチャネルを上位詰めで配置した RGB666。低レベル API の 18bit モード用。";
	p.format = PixelFormat.RGB666;
	p.channelOrder = ChannelOrder.ARGB;
	p.packUnit = PackUnit.UNPACKED;
	p.alignLeft = true;
	p.bigEndian = true;
	return p;
})();
const rgb565_be = (function() {
	let p = { ...defaultConfig };
	p.label = "RGB565-BE";
	p.description = "ハイカラー。\n各種 GFX ライブラリでの使用を含め、\n組み込み用途で一般的な形式。";
	p.format = PixelFormat.RGB565;
	p.channelOrder = ChannelOrder.ARGB;
	p.bigEndian = true;
	return p;
})();
const rgb444_be = (function() {
	let p = { ...defaultConfig };
	p.label = "RGB444-BE";
	p.description = "ST7789 の 12bit モード用の形式。";
	p.format = PixelFormat.RGB444;
	p.packUnit = PackUnit.ALIGNMENT;
	p.farPixelFirst = true;
	p.bigEndian = true;
	p.alignBoundary = AlignBoundary.BYTE_3;
	return p;
})();
const rgb332 = (function() {
	let p = { ...defaultConfig };
	p.label = "RGB332";
	p.description = "各種 GFX ライブラリ用。";
	p.format = PixelFormat.RGB332;
	return p;
})();
const rgb111_ra = (function() {
	let p = { ...defaultConfig };
	p.label = "RGB111";
	p.description = "ILI9488 の 8 色モード用。";
	p.format = PixelFormat.RGB111;
	p.packUnit = PackUnit.ALIGNMENT;
	p.farPixelFirst = true;
	return p;
})();
const bw_hscan = (function() {
	let p = { ...defaultConfig };
	p.label = "白黒 横スキャン";
	p.description = "各種 GFX ライブラリ用。";
	p.format = PixelFormat.BW;
	p.packUnit = PackUnit.ALIGNMENT;
	p.farPixelFirst = true;
	return p;
})();
const bw_vpack = (function() {
	let p = { ...defaultConfig };
	p.label = "白黒 縦パッキング";
	p.description = "SPI/I2C ドライバを使用して\nSSD1306/1309 等の白黒ディスプレイに直接転送するための形式。";
	p.format = PixelFormat.BW;
	p.packUnit = PackUnit.ALIGNMENT;
	p.vertPack = true;
	return p;
})();
const epd_kwr = (function() {
	let p = { ...defaultConfig };
	p.label = "黒白赤 (2plane)";
	p.description = "3色電子ペーパー向けの形式。";
	p.format = PixelFormat.I2_RGB888;
	p.packUnit = PackUnit.ALIGNMENT;
	p.farPixelFirst = true;
	p.palette = new Uint32Array([
		hexStrToRgb("#000"),
		hexStrToRgb("#FFF"),
		hexStrToRgb("#F00")
	]);
	p.planeCfgs = [makeIndexMatch(1, "white"), makeIndexMatch(2, "red")];
	return p;
})();
const epd_kwry = (function() {
	let p = { ...defaultConfig };
	p.label = "黒白赤黄 (2bpp)";
	p.description = "4色電子ペーパー向けの形式。";
	p.format = PixelFormat.I2_RGB888;
	p.packUnit = PackUnit.ALIGNMENT;
	p.farPixelFirst = true;
	p.palette = new Uint32Array([
		hexStrToRgb("#000"),
		hexStrToRgb("#FFF"),
		hexStrToRgb("#FF0"),
		hexStrToRgb("#F00")
	]);
	p.planeCfgs = [makeDirectPlane("index")];
	return p;
})();
const presets = {
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
	epd_kwry
};

//#endregion
//#region src/Palettes.ts
let RoundMethod = /* @__PURE__ */ function(RoundMethod$1) {
	RoundMethod$1[RoundMethod$1["NEAREST"] = 0] = "NEAREST";
	RoundMethod$1[RoundMethod$1["EQUAL_DIVISION"] = 1] = "EQUAL_DIVISION";
	return RoundMethod$1;
}({});
let DitherMethod = /* @__PURE__ */ function(DitherMethod$1) {
	DitherMethod$1[DitherMethod$1["NONE"] = 0] = "NONE";
	DitherMethod$1[DitherMethod$1["DIFFUSION"] = 1] = "DIFFUSION";
	DitherMethod$1[DitherMethod$1["PATTERN_GRAY"] = 2] = "PATTERN_GRAY";
	return DitherMethod$1;
}({});
var Palette = class {};
var FixedPalette = class extends Palette {
	inMin;
	inMax;
	outMax;
	constructor(channelBits, roundMethod) {
		super();
		this.channelBits = channelBits;
		this.roundMethod = roundMethod;
		this.inMin = new Float32Array(channelBits.length);
		this.inMax = new Float32Array(channelBits.length);
		this.outMax = new Uint8Array(channelBits.length);
		const equDiv = roundMethod == RoundMethod.EQUAL_DIVISION;
		for (let ch = 0; ch < channelBits.length; ch++) {
			const numLevel = 1 << channelBits[ch];
			this.inMin[ch] = equDiv ? 1 / (numLevel * 2) : 0;
			this.inMax[ch] = equDiv ? (numLevel * 2 - 1) / (numLevel * 2) : 1;
			this.outMax[ch] = numLevel - 1;
		}
	}
	get numColors() {
		let n = 1;
		for (let ch = 0; ch < this.channelBits.length; ch++) n *= 1 << this.channelBits[ch];
		return n;
	}
	reduce(src, srcOffset, dest, destOffset, error) {
		for (let ch = 0; ch < this.channelBits.length; ch++) {
			const inNorm = src[srcOffset + ch];
			const inMod = clip(0, 1, (inNorm - this.inMin[ch]) / (this.inMax[ch] - this.inMin[ch]));
			const out = Math.round(this.outMax[ch] * inMod);
			dest[destOffset + ch] = out;
			const outNorm = out / this.outMax[ch];
			error[ch] = inNorm - outNorm;
		}
	}
	extract(src, srcOffset, dest, destOffset) {
		switch (this.channelBits.length) {
			case 1:
				const gray = Math.round(src[srcOffset] * 255 / this.outMax[0]);
				for (let ch = 0; ch < 3; ch++) dest[destOffset + ch] = gray;
				break;
			case 3:
				for (let ch = 0; ch < 3; ch++) dest[destOffset + ch] = Math.round(src[srcOffset + ch] * 255 / this.outMax[ch]);
				break;
			default: throw new Error("Invalid channel number");
		}
	}
	getHslRange() {
		return {
			hMin: 0,
			hRange: 1,
			sMin: 0,
			sMax: 1,
			lMin: 0,
			lMax: 1
		};
	}
	getAverageStep() {
		const avgStep = new Float32Array(this.channelBits.length);
		for (let ch = 0; ch < this.channelBits.length; ch++) {
			const numLevel = 1 << this.channelBits[ch];
			avgStep[ch] = 1 / (numLevel - 1);
		}
		return avgStep;
	}
};
var IndexedPalette = class extends Palette {
	colors;
	enabled;
	constructor(channelBits, indexBits) {
		super();
		this.channelBits = channelBits;
		this.indexBits = indexBits;
		const numColors = 1 << indexBits;
		this.colors = new Float32Array(numColors * channelBits.length);
		this.enabled = new Array(numColors).fill(false);
	}
	get numColors() {
		return 1 << this.indexBits;
	}
	reduce(src, srcOffset, dest, destOffset, error) {
		const numCh = this.channelBits.length;
		let bestIdx = 0;
		let bestDist = Number.MAX_VALUE;
		for (let i = 0; i < 1 << this.indexBits; i++) {
			if (!this.enabled[i]) continue;
			let dist = 0;
			for (let ch = 0; ch < numCh; ch++) {
				const diff = src[srcOffset + ch] - this.colors[i * numCh + ch];
				dist += diff * diff;
			}
			if (dist < bestDist) {
				bestDist = dist;
				bestIdx = i;
			}
		}
		dest[destOffset] = bestIdx;
		for (let ch = 0; ch < numCh; ch++) {
			const outNorm = this.colors[bestIdx * numCh + ch];
			error[ch] = src[srcOffset + ch] - outNorm;
		}
	}
	extract(src, srcOffset, dest, destOffset) {
		switch (this.channelBits.length) {
			case 1:
				const gray = Math.round(this.colors[src[srcOffset]] * 255);
				for (let ch = 0; ch < 3; ch++) dest[destOffset + ch] = gray;
				break;
			case 3:
				for (let ch = 0; ch < 3; ch++) dest[destOffset + ch] = Math.round(this.colors[src[srcOffset] * 3 + ch] * 255);
				break;
			default: throw new Error("Invalid channel number");
		}
	}
	getHslRange() {
		const numColors = this.numColors;
		let rgbCenter = new Float32Array([
			0,
			0,
			0
		]);
		for (let i = 0; i < numColors; i++) {
			rgbCenter[0] += this.colors[i * 3 + 0];
			rgbCenter[1] += this.colors[i * 3 + 1];
			rgbCenter[2] += this.colors[i * 3 + 2];
		}
		rgbCenter[0] /= numColors;
		rgbCenter[1] /= numColors;
		rgbCenter[2] /= numColors;
		let hslCenter = new Float32Array(3);
		rgbToHslArrayF32(rgbCenter, 0, hslCenter, 0, 1);
		const centerH = hslCenter[0];
		const hsl = new Float32Array(this.colors.length);
		rgbToHslArrayF32(this.colors, 0, hsl, 0, numColors);
		let hDistMin = 0, hDistMax = 0, sMin = 1, sMax = 0, lMin = 1, lMax = 0;
		for (let i = 0; i < numColors; i++) {
			const h = hsl[i * 3 + 0];
			const s = hsl[i * 3 + 1];
			const l = hsl[i * 3 + 2];
			if (s > 0) {
				const hDist = hueDiff(h, centerH);
				if (hDist < hDistMin) hDistMin = hDist;
				if (hDist > hDistMax) hDistMax = hDist;
			}
			if (s < sMin) sMin = s;
			if (s > sMax) sMax = s;
			if (l < lMin) lMin = l;
			if (l > lMax) lMax = l;
		}
		const hMin = hueAdd(centerH, hDistMin);
		const hRange = hDistMax - hDistMin;
		return {
			hMin,
			hRange,
			sMin,
			sMax,
			lMin,
			lMax
		};
	}
	getAverageStep() {
		const avgStep = new Float32Array(this.channelBits.length);
		for (let ch = 0; ch < this.channelBits.length; ch++) {
			let levels = [];
			for (let i = 0; i < this.numColors; i++) {
				if (!this.enabled[i]) continue;
				const v = this.colors[i * this.channelBits.length + ch];
				if (!levels.includes(v)) levels.push(v);
			}
			levels.sort((a, b) => a - b);
			let stepSum = 0;
			for (let i = 1; i < levels.length; i++) stepSum += levels[i] - levels[i - 1];
			avgStep[ch] = stepSum / Math.max(1, levels.length - 1);
		}
		return avgStep;
	}
};

//#endregion
//#region src/Preproc.ts
let AlphaMode = /* @__PURE__ */ function(AlphaMode$1) {
	AlphaMode$1[AlphaMode$1["KEEP"] = 0] = "KEEP";
	AlphaMode$1[AlphaMode$1["FILL"] = 1] = "FILL";
	AlphaMode$1[AlphaMode$1["BINARIZE"] = 2] = "BINARIZE";
	AlphaMode$1[AlphaMode$1["SET_KEY_COLOR"] = 3] = "SET_KEY_COLOR";
	return AlphaMode$1;
}({});
let ColorSpaceReductionMode = /* @__PURE__ */ function(ColorSpaceReductionMode$1) {
	ColorSpaceReductionMode$1[ColorSpaceReductionMode$1["NONE"] = 0] = "NONE";
	ColorSpaceReductionMode$1[ColorSpaceReductionMode$1["CLIP"] = 1] = "CLIP";
	ColorSpaceReductionMode$1[ColorSpaceReductionMode$1["FOLD"] = 2] = "FOLD";
	ColorSpaceReductionMode$1[ColorSpaceReductionMode$1["TRANSFORM"] = 3] = "TRANSFORM";
	return ColorSpaceReductionMode$1;
}({});
var PreProcArgs = class {
	src = null;
	alphaProc = AlphaMode.KEEP;
	alphaThresh = 128;
	backColor = 0;
	hue = 0;
	saturation = 1;
	lightness = 1;
	csrMode = ColorSpaceReductionMode.NONE;
	csrHslRange = new HslRange();
	csrHueTolerance = 60 / 360;
	csrTransformMatrix = new Float32Array(12);
	gamma = {
		value: 1,
		automatic: true
	};
	brightness = {
		value: 0,
		automatic: true
	};
	contrast = {
		value: 0,
		automatic: true
	};
	invert = false;
	out = new NormalizedImage(0, 0, ColorSpace.RGB);
};
function process(args) {
	const sw = new StopWatch(false);
	const img = args.src.clone();
	if (args.alphaProc == AlphaMode.BINARIZE) binarizeAlpha(img, args.alphaThresh / 255);
	else if (args.alphaProc == AlphaMode.FILL) fillBackground(img, args.backColor);
	correctHSL(img, args.hue, args.saturation, args.lightness);
	args.gamma = correctGamma(img, args.gamma);
	args.brightness = offsetBrightness(img, args.brightness);
	args.contrast = correctContrast(img, args.contrast);
	if (args.invert) for (let i = 0; i < img.color.length; i++) img.color[i] = 1 - img.color[i];
	switch (args.csrMode) {
		case ColorSpaceReductionMode.CLIP:
			clipColorSpace(img, args.csrHslRange, args.csrHueTolerance);
			break;
		case ColorSpaceReductionMode.FOLD:
			foldColorSpace(img, args.csrHslRange);
			break;
		case ColorSpaceReductionMode.TRANSFORM:
			transformColorSpace(img, args.csrTransformMatrix);
			break;
	}
	args.out = img;
	sw.lap("PreProc.process()");
}
function correctHSL(img, hShift, sCoeff, lCoeff) {
	const numPixels = img.width * img.height;
	switch (img.colorSpace) {
		case ColorSpace.GRAYSCALE:
			if (lCoeff == 1) return;
			for (let i = 0; i < numPixels; i++) img.color[i] = clip(0, 1, img.color[i] * lCoeff);
			break;
		case ColorSpace.RGB:
			{
				if (hShift == 0 && sCoeff == 1 && lCoeff == 1) return;
				const hsl = new Float32Array(numPixels * 3);
				rgbToHslArrayF32(img.color, 0, hsl, 0, numPixels);
				for (let i = 0; i < numPixels; i++) {
					hsl[i * 3 + 0] = hueAdd(hsl[i * 3 + 0], hShift);
					hsl[i * 3 + 1] = clip(0, 1, hsl[i * 3 + 1] * sCoeff);
					hsl[i * 3 + 2] = clip(0, 1, hsl[i * 3 + 2] * lCoeff);
				}
				hslToRgbArrayF32(hsl, 0, img.color, 0, numPixels);
			}
			break;
		default: throw new Error("Invalid color space");
	}
}
function clipColorSpace(img, hslRange, hueTolerance) {
	const hMin = hueWrap(hslRange.hMin);
	const hRange = clip(0, 1, hslRange.hRange);
	const sMin = clip(0, 1, hslRange.sMin);
	const sMax = clip(sMin, 1, hslRange.sMax);
	const lMin = clip(0, 1, hslRange.lMin);
	const lMax = clip(lMin, 1, hslRange.lMax);
	const hReduction = hRange < .99999;
	const sReduction = sMin != 0 || sMax != 1;
	const lReduction = lMin != 0 || lMax != 1;
	const hslReduction = hReduction || sReduction || lReduction;
	const numPixels = img.width * img.height;
	switch (img.colorSpace) {
		case ColorSpace.GRAYSCALE:
			if (!lReduction) return;
			for (let i = 0; i < numPixels; i++) img.color[i] = clip(lMin, lMax, img.color[i]);
			break;
		case ColorSpace.RGB:
			{
				if (!hslReduction) return;
				const hsl = new Float32Array(numPixels * 3);
				rgbToHslArrayF32(img.color, 0, hsl, 0, numPixels);
				for (let i = 0; i < numPixels; i++) {
					let h = hsl[i * 3 + 0];
					let s = hsl[i * 3 + 1];
					let l = hsl[i * 3 + 2];
					const hClipped = hueClip(hMin, hRange, h);
					const hDiff = Math.abs(hueDiff(hClipped, h));
					if (hDiff >= hueTolerance) s = 0;
					else s *= 1 - hDiff / hueTolerance;
					hsl[i * 3 + 0] = hClipped;
					hsl[i * 3 + 1] = clip(sMin, sMax, s);
					hsl[i * 3 + 2] = clip(lMin, lMax, l);
				}
				hslToRgbArrayF32(hsl, 0, img.color, 0, numPixels);
			}
			break;
		default: throw new Error("Invalid color space");
	}
}
function foldColorSpace(img, hslRange) {
	const hMin = hueWrap(hslRange.hMin);
	const hRange = clip(0, 1, hslRange.hRange);
	const sMin = clip(0, 1, hslRange.sMin);
	const sMax = clip(sMin, 1, hslRange.sMax);
	const lMin = clip(0, 1, hslRange.lMin);
	const lMax = clip(lMin, 1, hslRange.lMax);
	const hReduction = hRange < .99999;
	const sReduction = sMin != 0 || sMax != 1;
	const lReduction = lMin != 0 || lMax != 1;
	const hslReduction = hReduction || sReduction || lReduction;
	const numPixels = img.width * img.height;
	switch (img.colorSpace) {
		case ColorSpace.GRAYSCALE:
			if (!lReduction) return;
			for (let i = 0; i < numPixels; i++) {
				let l = img.color[i];
				l = lMin + (l - lMin) * (lMax - lMin);
				img.color[i] = clip(0, 1, l);
			}
			break;
		case ColorSpace.RGB:
			{
				if (!hslReduction) return;
				const hHalfRange = hRange / 2;
				const hCenter = hueAdd(hMin, hHalfRange);
				const hsl = new Float32Array(numPixels * 3);
				rgbToHslArrayF32(img.color, 0, hsl, 0, numPixels);
				for (let i = 0; i < numPixels; i++) {
					let h = hsl[i * 3 + 0];
					let s = hsl[i * 3 + 1];
					let l = hsl[i * 3 + 2];
					if (hHalfRange == 0) h = hMin;
					else {
						let hDist = hueDiff(h, hCenter);
						if (hDist < -hHalfRange || hHalfRange < hDist) {
							const sign = hDist < 0 ? -1 : 1;
							hDist = Math.abs(hDist);
							hDist = (.5 - hDist) / (.5 - hHalfRange);
							hDist *= sign * hHalfRange;
							h = hueAdd(hCenter, hDist);
						}
					}
					l = lMin + (l - lMin) * (lMax - lMin);
					s = sMin + (s - sMin) * (sMax - sMin);
					hsl[i * 3 + 0] = h;
					hsl[i * 3 + 1] = clip(0, 1, s);
					hsl[i * 3 + 2] = clip(0, 1, l);
				}
				hslToRgbArrayF32(hsl, 0, img.color, 0, numPixels);
			}
			break;
		default: throw new Error("Invalid color space");
	}
}
function transformColorSpace(img, matrix) {
	const numPixels = img.width * img.height;
	switch (img.colorSpace) {
		case ColorSpace.RGB:
			for (let i = 0; i < numPixels; i++) transformColor(matrix, img.color, i * 3);
			break;
		default: throw new Error("Invalid color space for transform");
	}
}
function makeHistogramF32(img, histogramSize) {
	const histogram = new Uint32Array(histogramSize);
	const numPixels = img.width * img.height;
	const numCh = img.numColorChannels;
	for (let i = 0; i < numPixels; i++) if (img.alpha[i] > 0) {
		const gray = grayscaleArrayF32(img.color, i * numCh);
		histogram[Math.round(gray * (histogramSize - 1))]++;
	}
	return histogram;
}
function determineGammaValue(img) {
	const HISTOGRAM_SIZE = 16;
	const histogram = makeHistogramF32(img, HISTOGRAM_SIZE);
	let min = .5;
	let max = 2;
	let gamma = 1;
	while (max - min > .01) {
		gamma = (min + max) / 2;
		let lo = 0, hi = 0;
		for (let i = 0; i < HISTOGRAM_SIZE; i++) {
			const val = Math.pow(i / (HISTOGRAM_SIZE - 1), 1 / gamma);
			if (val < .5) lo += histogram[i];
			else hi += histogram[i];
		}
		if (lo > hi) min = gamma;
		else max = gamma;
	}
	return gamma;
}
function binarizeAlpha(img, thresh) {
	const numPixels = img.width * img.height;
	for (let i = 0; i < numPixels; i++) img.alpha[i] = img.alpha[i] < thresh ? 0 : 1;
}
function fillBackground(img, color) {
	const numCh = img.numColorChannels;
	let bk = new Float32Array(numCh);
	const { r: backR, g: backG, b: backB } = rgbU32ToF32(color);
	switch (img.colorSpace) {
		case ColorSpace.GRAYSCALE:
			bk[0] = grayscale(backR, backG, backB);
			break;
		case ColorSpace.RGB:
			bk[0] = backR;
			bk[1] = backG;
			bk[2] = backB;
			break;
		default: throw new Error("Invalid color space");
	}
	const numPixels = img.width * img.height;
	for (let i = 0; i < numPixels; i++) {
		const a1 = img.alpha[i];
		const a0 = 1 - a1;
		for (let c = 0; c < numCh; c++) img.color[i * numCh + c] = bk[c] * a0 + img.color[i * numCh + c] * a1;
		img.alpha[i] = 1;
	}
}
function correctGamma(img, gamma) {
	if (gamma.automatic) gamma.value = determineGammaValue(img);
	gamma.value = clip(.01, 5, gamma.value);
	if (gamma.value != 1) for (let i = 0; i < img.color.length; i++) {
		const val = Math.pow(img.color[i], 1 / gamma.value);
		img.color[i] = val;
	}
	return gamma;
}
function offsetBrightness(img, param) {
	if (param.automatic) {
		const { min, max } = getColorMinMax(img);
		param.value = .5 - (min + max) / 2;
	}
	param.value = clip(-1, 1, param.value);
	if (param.value != 0) for (let i = 0; i < img.color.length; i++) img.color[i] = clip(0, 1, img.color[i] + param.value);
	return param;
}
function correctContrast(img, param) {
	if (param.automatic) {
		const { min, max } = getColorMinMax(img);
		const middle = (min + max) / 2;
		if (middle < .5 && min < middle) param.value = .5 / (middle - min);
		else if (middle > .5 && max > middle) param.value = .5 / (max - middle);
	}
	param.value = clip(.01, 10, param.value);
	if (param.value != 1) for (let i = 0; i < img.color.length; i++) img.color[i] = clip(0, 1, (img.color[i] - .5) * param.value + .5);
	return param;
}
function getColorMinMax(img) {
	const numPixels = img.width * img.height;
	const numCh = img.numColorChannels;
	let min = 9999;
	let max = -9999;
	for (let i = 0; i < numPixels; i++) if (img.alpha[i] > 0) {
		const gray = grayscaleArrayF32(img.color, i * numCh);
		min = Math.min(min, gray);
		max = Math.max(max, gray);
	}
	if (min <= max) return {
		min,
		max
	};
	else return {
		min: .5,
		max: .5
	};
}

//#endregion
//#region src/Reducer.ts
const ditherPattern = new Float32Array([
	.5 / 16 - .5,
	8.5 / 16 - .5,
	2.5 / 16 - .5,
	10.5 / 16 - .5,
	12.5 / 16 - .5,
	4.5 / 16 - .5,
	14.5 / 16 - .5,
	6.5 / 16 - .5,
	3.5 / 16 - .5,
	11.5 / 16 - .5,
	1.5 / 16 - .5,
	9.5 / 16 - .5,
	15.5 / 16 - .5,
	7.5 / 16 - .5,
	13.5 / 16 - .5,
	5.5 / 16 - .5
]);
const DEFAULT_DITHER_STRENGTH = .8;
var Arguments = class {
	src = null;
	colorDitherMethod = DitherMethod.NONE;
	alphaDitherMethod = DitherMethod.NONE;
	colorDitherStrength = DEFAULT_DITHER_STRENGTH;
	alphaDitherStrength = DEFAULT_DITHER_STRENGTH;
	palette = null;
	format = null;
	output = null;
};
function reduce(args) {
	const sw = new StopWatch(false);
	const norm = args.src;
	const outW = norm.width;
	const outH = norm.height;
	const fmt = args.format;
	const numColCh = fmt.numColorChannels;
	const palette = args.palette;
	args.output = new ReducedImage(outW, outH, fmt, palette);
	const outData = args.output.data;
	const alpErrDiffuse = args.alphaDitherMethod == DitherMethod.DIFFUSION;
	const colErrDiffuse = args.colorDitherMethod == DitherMethod.DIFFUSION;
	if (args.colorDitherMethod == DitherMethod.PATTERN_GRAY) {
		const step = palette.getAverageStep();
		for (let y = 0; y < outH; y++) {
			const iPixelStep = y * outW * numColCh;
			const iPatStep = y % 4 * 4;
			for (let x = 0; x < outW; x++) {
				const iPixel = iPixelStep + x * numColCh;
				const iPat = iPatStep + x % 4;
				for (let ch = 0; ch < numColCh; ch++) {
					const s = step[ch];
					let v = norm.color[iPixel + ch];
					v += s * ditherPattern[iPat] * args.colorDitherStrength;
					norm.color[iPixel + ch] = clip(0, 1, v);
				}
			}
		}
	}
	const alpOutMax = (1 << fmt.alphaBits) - 1;
	const colOut = new Uint8Array(numColCh);
	const colErr = new Float32Array(numColCh);
	const alpErr = new Float32Array(1);
	for (let y = 0; y < outH; y++) for (let ix = 0; ix < outW; ix++) {
		const fwd = y % 2 == 0;
		const x = fwd ? ix : outW - 1 - ix;
		const iPix = y * outW + x;
		let transparent = false;
		let alpOut = alpOutMax;
		if (fmt.hasAlpha) {
			const alpNormIn = norm.alpha[iPix];
			alpOut = Math.round(alpNormIn * alpOutMax);
			const alpNormOut = alpOut / alpOutMax;
			alpErr[0] = alpNormIn - alpNormOut;
			transparent = alpOut == 0;
		}
		palette.reduce(norm.color, iPix * numColCh, colOut, 0, colErr);
		for (let ch = 0; ch < numColCh; ch++) outData[ch][iPix] = colOut[ch];
		if (fmt.hasAlpha) outData[numColCh][iPix] = alpOut;
		if (alpErrDiffuse && fmt.hasAlpha) {
			if (args.alphaDitherStrength < 1) alpErr[0] *= args.alphaDitherStrength;
			diffuseError(norm, true, alpErr, x, y, fwd);
		}
		if (colErrDiffuse && !transparent) {
			if (args.colorDitherStrength < 1) for (let ch = 0; ch < numColCh; ch++) colErr[ch] *= args.colorDitherStrength;
			diffuseError(norm, false, colErr, x, y, fwd);
		}
	}
	sw.lap("Reducer.reduce()");
}
function diffuseError(img, alpha, error, x, y, forward) {
	const target = alpha ? img.alpha : img.color;
	const numCh = alpha ? 1 : img.numColorChannels;
	const w = img.width;
	const h = img.height;
	const stride = img.width * numCh;
	for (let ch = 0; ch < numCh; ch++) {
		const i = y * stride + x * numCh + ch;
		const e = error[ch];
		if (e == 0) continue;
		if (forward) {
			if (x < w - 1) target[i + numCh] += e * 7 / 16;
			if (y < h - 1) {
				if (x > 0) target[i + stride - numCh] += e * 3 / 16;
				target[i + stride] += e * 5 / 16;
				if (x < w - 1) target[i + stride + numCh] += e * 1 / 16;
			}
		} else {
			if (x > 0) target[i - numCh] += e * 7 / 16;
			if (y < h - 1) {
				if (x < w - 1) target[i + stride + numCh] += e * 3 / 16;
				target[i + stride] += e * 5 / 16;
				if (x > 0) target[i + stride - numCh] += e * 1 / 16;
			}
		}
	}
}

//#endregion
//#region src/Resizer.ts
let ScalingMethod = /* @__PURE__ */ function(ScalingMethod$1) {
	ScalingMethod$1[ScalingMethod$1["ZOOM"] = 0] = "ZOOM";
	ScalingMethod$1[ScalingMethod$1["FIT"] = 1] = "FIT";
	ScalingMethod$1[ScalingMethod$1["STRETCH"] = 2] = "STRETCH";
	return ScalingMethod$1;
}({});
let InterpMethod = /* @__PURE__ */ function(InterpMethod$1) {
	InterpMethod$1[InterpMethod$1["NEAREST_NEIGHBOR"] = 0] = "NEAREST_NEIGHBOR";
	InterpMethod$1[InterpMethod$1["AVERAGE"] = 1] = "AVERAGE";
	return InterpMethod$1;
}({});
var ResizeArgs = class {
	srcData = new Uint8Array(0);
	srcSize = {
		width: 0,
		height: 0
	};
	trimRect = {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	outSize = {
		width: 0,
		height: 0
	};
	colorSpace = ColorSpace.RGB;
	scalingMethod = ScalingMethod.ZOOM;
	interpMethod = InterpMethod.NEAREST_NEIGHBOR;
	applyKeyColor = false;
	keyColor = 0;
	keyTolerance = 0;
	out = null;
};
function resize(args) {
	const sw = new StopWatch(false);
	let src = args.srcData;
	{
		const { data, rect } = trim(src, args.srcSize, args.trimRect, args.outSize, args.scalingMethod);
		src = data;
		args.trimRect = rect;
	}
	if (args.applyKeyColor) applyKeyColor(src, args.srcSize, args.keyColor, args.keyTolerance);
	const trimSize = {
		width: args.trimRect.width,
		height: args.trimRect.height
	};
	let resized = src;
	if (trimSize.width != args.outSize.width || trimSize.height != args.outSize.height) switch (args.interpMethod) {
		case InterpMethod.NEAREST_NEIGHBOR:
			resized = resizeWithNearestNeighbor(src, trimSize, args.outSize);
			break;
		case InterpMethod.AVERAGE:
			resized = resizeWithAverage(src, trimSize, args.outSize);
			break;
		default: throw new Error("Invalid interpolation method");
	}
	args.out = normalize(resized, args.outSize, args.colorSpace);
	sw.lap("Resizer.resize()");
}
function trim(src, srcSize, trimRect, outSize, scalingMethod) {
	const srcW = srcSize.width;
	const srcH = srcSize.height;
	const outW = outSize.width;
	const outH = outSize.height;
	let trimX = trimRect.x;
	let trimY = trimRect.y;
	let trimW = trimRect.width;
	let trimH = trimRect.height;
	let destX = 0;
	let destY = 0;
	let destW = trimW;
	let destH = trimH;
	if (srcW < 1 || srcH < 1 || trimW < 1 || trimH < 1 || outW < 1 || outH < 1) throw new Error("画像サイズは正の値でなければなりません");
	{
		const outAspect = outW / outH;
		const trimAspect = trimW / trimH;
		if (scalingMethod == ScalingMethod.ZOOM) {
			if (outAspect > trimAspect) {
				trimH = Math.max(1, Math.round(trimW * outH / outW));
				trimY += Math.round((trimRect.height - trimH) / 2);
			} else if (outAspect < trimAspect) {
				trimW = Math.max(1, Math.round(trimH * outW / outH));
				trimX += Math.round((trimRect.width - trimW) / 2);
			}
		} else if (scalingMethod == ScalingMethod.FIT) {
			if (outAspect > trimAspect) {
				trimW = Math.max(1, Math.round(trimH * outW / outH));
				destW = trimRect.width;
				destX = Math.round((trimW - trimRect.width) / 2);
			} else if (outAspect < trimAspect) {
				trimH = Math.max(1, Math.round(trimW * outH / outW));
				destH = trimRect.height;
				destY = Math.round((trimH - trimRect.height) / 2);
			}
		}
	}
	const out = new Uint8Array(trimW * trimH * 4);
	const srcStride = srcW * 4;
	const destStride = trimW * 4;
	for (let y = 0; y < destH; y++) {
		const srcY = trimY + y;
		if (srcY < 0 || srcH <= srcY) continue;
		let iSrc = srcY * srcStride + trimX * 4;
		let iDest = (destY + y) * destStride + destX * 4;
		for (let x = 0; x < destW; x++) {
			const srcX = trimX + x;
			if (0 <= srcX && srcX < srcW) for (let c = 0; c < 4; c++) out[iDest++] = src[iSrc++];
			else {
				iDest += 4;
				iSrc += 4;
			}
		}
	}
	trimRect.x = trimX;
	trimRect.y = trimY;
	trimRect.width = trimW;
	trimRect.height = trimH;
	return {
		data: out,
		rect: trimRect
	};
}
function applyKeyColor(data, size, key, tol) {
	const { r: keyR, g: keyG, b: keyB } = rgbU32ToU8(key);
	for (let y = 0; y < size.height; y++) {
		let i = y * size.width * 4;
		for (let x = 0; x < size.width; x++, i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			data[i + 3];
			const d = Math.abs(r - keyR) + Math.abs(g - keyG) + Math.abs(b - keyB);
			if (d <= tol) {
				data[i] = 0;
				data[i + 1] = 0;
				data[i + 2] = 0;
				data[i + 3] = 0;
			}
		}
	}
}
function resizeWithNearestNeighbor(src, srcSize, outSize) {
	const srcW = srcSize.width;
	const srcH = srcSize.height;
	const outW = outSize.width;
	const outH = outSize.height;
	const srcStride = srcW * 4;
	const outStride = outW * 4;
	const out = new Uint8Array(outStride * outH);
	for (let outY = 0; outY < outH; outY++) {
		const srcY = outH <= 1 ? 0 : Math.floor(outY * (srcH - 1) / (outH - 1));
		let iDest = outY * outStride;
		for (let outX = 0; outX < outW; outX++) {
			const srcX = outW <= 1 ? 0 : Math.floor(outX * (srcW - 1) / (outW - 1));
			const iSrc = srcY * srcStride + srcX * 4;
			for (let c = 0; c < 4; c++) out[iDest++] = src[iSrc + c];
		}
	}
	return out;
}
function resizeWithAverage(src, srcSize, outSize) {
	let srcW = srcSize.width;
	let srcH = srcSize.height;
	const outW = outSize.width;
	const outH = outSize.height;
	const srcStride = srcW * 4;
	let preW = outW;
	while (preW * 2 < srcW) preW *= 2;
	const preStride = preW * 4;
	const pre = new Uint8Array(preStride * srcH);
	for (let srcY = 0; srcY < srcH; srcY++) {
		let iDest = srcY * preStride;
		if (preW == srcW) {
			let iSrc = srcY * srcStride;
			for (let i = 0; i < preW * 4; i++) pre[iDest++] = src[iSrc++];
		} else {
			const iSrcOffset = srcY * srcStride;
			for (let destX = 0; destX < preW; destX++, iDest += 4) {
				const srcFracX = destX * (srcW - 1) / (preW - 1);
				let srcIntX = Math.floor(srcFracX);
				let coeff = srcFracX - srcIntX;
				if (srcIntX >= srcW - 1) {
					srcIntX -= 1;
					coeff = 1;
				}
				let iSrc = iSrcOffset + srcIntX * 4;
				blend(src, iSrc, iSrc + 4, pre, iDest, coeff);
			}
		}
	}
	while (preW > outW) {
		preW = Math.round(preW / 2);
		for (let y = 0; y < srcH; y++) {
			let iDest = y * preStride;
			let iSrc = y * preStride;
			for (let x = 0; x < preW; x++, iDest += 4, iSrc += 8) blend(pre, iSrc, iSrc + 4, pre, iDest, .5);
		}
	}
	if (srcH == outH && preStride == outW * 4) return pre;
	let postH = outH;
	while (postH * 2 < srcH) postH *= 2;
	const postStride = outW * 4;
	const post = new Uint8Array(postStride * postH);
	for (let destY = 0; destY < postH; destY++) {
		let iDest = destY * postStride;
		if (postH == srcH) {
			let iSrc = destY * preStride;
			for (let i = 0; i < postStride; i++) post[iDest++] = pre[iSrc++];
		} else {
			const srcFracY = destY * (srcH - 1) / (postH - 1);
			let srcIntY = Math.floor(srcFracY);
			let coeff = srcFracY - srcIntY;
			if (srcIntY >= srcH - 1) {
				srcIntY -= 1;
				coeff = 1;
			}
			let iSrc = srcIntY * preStride;
			for (let destX = 0; destX < outW; destX++, iDest += 4, iSrc += 4) blend(pre, iSrc, iSrc + preStride, post, iDest, coeff);
		}
	}
	while (postH > outH) {
		postH = Math.round(postH / 2);
		for (let y = 0; y < postH; y++) {
			let iDest = y * postStride;
			let iSrc = y * postStride * 2;
			for (let x = 0; x < outW; x++, iDest += 4, iSrc += 4) blend(post, iSrc, iSrc + postStride, post, iDest, .5);
		}
	}
	if (postH == outH) return post;
	else {
		const ret = new Uint8Array(outW * outH * 4);
		for (let i = 0; i < ret.length; i++) ret[i] = post[i];
		return ret;
	}
}
function blend(src, si0, si1, dest, di, coeff1) {
	let coeff0 = 1 - coeff1;
	const a0 = src[si0 + 3];
	const a1 = src[si1 + 3];
	const a = a0 * coeff0 + a1 * coeff1;
	coeff0 *= a0 / 255;
	coeff1 *= a1 / 255;
	if (coeff0 + coeff1 > 0) {
		const norm = 1 / (coeff0 + coeff1);
		coeff0 *= norm;
		coeff1 *= norm;
	}
	for (let c = 0; c < 3; c++) {
		const m = src[si0++] * coeff0 + src[si1++] * coeff1;
		dest[di++] = clip(0, 255, Math.round(m));
	}
	dest[di] = clip(0, 255, Math.round(a));
}
function normalize(data, size, colorSpace) {
	const numPixels = size.width * size.height;
	const img = new NormalizedImage(size.width, size.height, colorSpace);
	for (let i = 0; i < numPixels; i++) {
		switch (colorSpace) {
			case ColorSpace.GRAYSCALE:
				img.color[i] = grayscaleArrayU8(data, i * 4) / 255;
				break;
			case ColorSpace.RGB:
				img.color[i * 3 + 0] = data[i * 4 + 0] / 255;
				img.color[i * 3 + 1] = data[i * 4 + 1] / 255;
				img.color[i * 3 + 2] = data[i * 4 + 2] / 255;
				break;
			default: throw new Error("Invalid color space");
		}
		img.alpha[i] = data[i * 4 + 3] / 255;
	}
	return img;
}

//#endregion
//#region src/Ui.ts
function toElementArray(children) {
	if (children == null) return [];
	if (!Array.isArray(children)) children = [children];
	for (let i = 0; i < children.length; i++) if (typeof children[i] === "string") children[i] = document.createTextNode(children[i]);
	else if (children[i] instanceof Node) {} else throw new Error("Invalid child element");
	return children;
}
function makeSection(children = []) {
	const div = document.createElement("div");
	div.classList.add("propertySection");
	toElementArray(children).forEach((child) => div.appendChild(child));
	return div;
}
function makeFloatList(children = [], sep = true) {
	const ul = document.createElement("ul");
	toElementArray(children).forEach((child) => {
		if (!child.classList) child = makeSpan(child);
		const li = document.createElement("li");
		li.appendChild(child);
		if (sep && child.classList && !child.classList.contains("sectionHeader")) li.style.marginRight = "20px";
		ul.appendChild(li);
	});
	return ul;
}
function makeGroup(children = []) {
	const div = document.createElement("div");
	div.classList.add("group");
	toElementArray(children).forEach((child) => div.appendChild(child));
	return div;
}
function makeGroupTitle(children = []) {
	const div = document.createElement("div");
	div.classList.add("groupTitle");
	toElementArray(children).forEach((child) => div.appendChild(child));
	return div;
}
function makeGroupBody(children = []) {
	const div = document.createElement("div");
	div.classList.add("groupBody");
	toElementArray(children).forEach((child) => div.appendChild(child));
	return div;
}
function makeParagraph(children = []) {
	const p = document.createElement("p");
	toElementArray(children).forEach((child) => p.appendChild(child));
	return p;
}
function makeSpan(children = []) {
	const span = document.createElement("span");
	toElementArray(children).forEach((child) => span.appendChild(child));
	return span;
}
function makeNowrap(children = []) {
	const span = document.createElement("span");
	span.classList.add("nowrap");
	toElementArray(children).forEach((child) => span.appendChild(child));
	return span;
}
function makeHeader(text) {
	const span = document.createElement("span");
	span.classList.add("sectionHeader");
	span.textContent = text;
	return span;
}
function makeTextBox(value = "", placeholder = "", maxLength = 100) {
	const input = document.createElement("input");
	input.type = "text";
	input.value = value;
	input.placeholder = placeholder;
	input.style.width = "60px";
	input.style.textAlign = "right";
	input.maxLength = maxLength;
	input.inputMode = "decimal";
	input.addEventListener("focus", () => input.select());
	return input;
}
function makeSelectBox(items, defaultValue) {
	const select = document.createElement("select");
	for (const item of items) {
		const option = document.createElement("option");
		option.value = item.value.toString();
		option.textContent = item.label;
		if (item.tip) option.title = item.tip;
		select.appendChild(option);
	}
	select.value = defaultValue.toString();
	return select;
}
function makeCheckBox(labelText) {
	const label = document.createElement("label");
	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	label.appendChild(checkbox);
	label.appendChild(document.createTextNode(labelText));
	return checkbox;
}
function makeButton(text = "") {
	const button = document.createElement("button");
	button.textContent = text;
	return button;
}
function basic(elem) {
	elem.classList.add("basic");
	return elem;
}
function pro(elem) {
	elem.classList.add("professional");
	return elem;
}
function show(elem) {
	elem.classList.remove("hidden");
	return elem;
}
function hide(elem) {
	elem.classList.add("hidden");
	return elem;
}
function setVisible(elem, visible) {
	return visible ? show(elem) : hide(elem);
}
function tip(children, text) {
	let target;
	if (children instanceof HTMLElement) target = children;
	else target = makeSpan(children);
	if (text) target.title = text;
	return target;
}
function parentLiOf(child) {
	let parent = child;
	while (parent && parent.tagName !== "LI") parent = parent.parentElement;
	return parent;
}
function upDown(elem, min, max, step) {
	const upDownButton = makeButton("");
	upDownButton.classList.add("upDown");
	upDownButton.tabIndex = -1;
	const textBox = elem;
	upDownButton.addEventListener("pointermove", (e) => {
		e.preventDefault();
		if (upDownButton.dataset.dragStartY && upDownButton.dataset.dragStartVal) {
			const y = e.offsetY;
			const startY = parseFloat(upDownButton.dataset.dragStartY);
			const startVal = parseFloat(upDownButton.dataset.dragStartVal);
			const n = (max - min) / step;
			let deltaY = Math.round((y - startY) * n / 512);
			let val = clip(min, max, startVal - deltaY * step);
			textBox.value = (Math.round(val * 100) / 100).toString();
			textBox.dispatchEvent(new Event("change"));
		}
	});
	upDownButton.addEventListener("pointerdown", (e) => {
		e.preventDefault();
		const y = e.offsetY;
		let val;
		if (textBox.value.trim()) val = parseFloat(textBox.value.trim());
		else val = parseFloat(textBox.placeholder.replaceAll(/[\(\)]/g, "").trim());
		val = Math.round(val / step) * step;
		upDownButton.dataset.dragStartY = y.toString();
		upDownButton.dataset.dragStartVal = val.toString();
		upDownButton.style.cursor = "grabbing";
		upDownButton.setPointerCapture(e.pointerId);
	});
	upDownButton.addEventListener("pointerup", (e) => {
		e.preventDefault();
		delete upDownButton.dataset.dragStartY;
		delete upDownButton.dataset.dragStartVal;
		upDownButton.style.cursor = "ns-resize";
		upDownButton.releasePointerCapture(e.pointerId);
	});
	upDownButton.addEventListener("touchstart", (e) => e.preventDefault());
	upDownButton.addEventListener("touchmove", (e) => e.preventDefault());
	upDownButton.addEventListener("touchend", (e) => e.preventDefault());
	return makeSpan([textBox, upDownButton]);
}

//#endregion
//#region src/main.ts
var TrimState = /* @__PURE__ */ function(TrimState$1) {
	TrimState$1[TrimState$1["IDLE"] = 0] = "IDLE";
	TrimState$1[TrimState$1["DRAG_TOP"] = 1] = "DRAG_TOP";
	TrimState$1[TrimState$1["DRAG_RIGHT"] = 2] = "DRAG_RIGHT";
	TrimState$1[TrimState$1["DRAG_BOTTOM"] = 3] = "DRAG_BOTTOM";
	TrimState$1[TrimState$1["DRAG_LEFT"] = 4] = "DRAG_LEFT";
	return TrimState$1;
}(TrimState || {});
var PlaneUi = class {
	container = document.createElement("div");
	planeTypeBox = makeSelectBox([{
		value: PlaneType.DIRECT,
		label: "直接出力",
		tip: "ピクセルデータをそのまま出力します。"
	}, {
		value: PlaneType.INDEX_MATCH,
		label: "色番号を指定",
		tip: "指定した色番号に一致するピクセルを抽出します。"
	}], PlaneType.DIRECT);
	matchIndexBox = makeTextBox("0", "", 4);
	matchInvertBox = makeCheckBox("反転");
	ul = makeFloatList([
		tip(["種類: ", this.planeTypeBox], "プレーンの種類を指定します。"),
		tip(["色番号: ", this.matchIndexBox], "抽出する色番号を指定します。"),
		tip(["反転: ", this.matchInvertBox], "抽出結果を反転します。")
	]);
	constructor(config) {
		this.config = config;
		this.container.appendChild(this.ul);
		this.planeTypeBox.value = config.planeType.toString();
		this.matchIndexBox.value = config.matchIndex.toString();
		this.matchInvertBox.checked = config.matchInvert;
		this.container.querySelectorAll("input, select").forEach((el) => {
			el.addEventListener("change", () => {
				requestGenerateCode();
			});
			el.addEventListener("input", () => {
				requestGenerateCode();
			});
		});
	}
	dispose() {
		this.container.remove();
	}
};
function makeSampleImageButton(url) {
	const fileName = url.split("/").pop() || DEFAULT_INPUT_FILE_NAME;
	const button = document.createElement("button");
	button.classList.add("sampleImageButton");
	button.style.backgroundImage = `url(${url})`;
	button.addEventListener("click", () => {
		loadFromString(fileName, url);
	});
	button.textContent = "";
	return button;
}
function makePresetButton(id, preset) {
	const button = document.createElement("button");
	button.dataset.presetName = id;
	button.classList.add("presetButton");
	const img = document.createElement("img");
	img.src = `img/preset/${id}.svg`;
	button.appendChild(img);
	button.appendChild(document.createElement("br"));
	button.appendChild(document.createTextNode(preset.label));
	button.title = preset.description;
	button.addEventListener("click", () => loadPreset(preset));
	return button;
}
const dropTarget = document.createElement("div");
dropTarget.classList.add("dropTarget");
dropTarget.innerHTML = "ドロップして読み込む";
document.body.appendChild(dropTarget);
hide(dropTarget);
const fileBrowseButton = makeButton("ファイルを選択");
const hiddenFileBox = document.createElement("input");
hiddenFileBox.type = "file";
hiddenFileBox.accept = "image/*";
hiddenFileBox.style.display = "none";
fileBrowseButton.addEventListener("click", () => {
	hiddenFileBox.click();
});
const pasteTarget = document.createElement("input");
pasteTarget.type = "text";
pasteTarget.style.textAlign = "center";
pasteTarget.style.width = "8em";
pasteTarget.placeholder = "ここに貼り付け";
const fileSection = makeSection(makeFloatList([
	makeHeader("入力画像"),
	"画像をドロップ、",
	makeSpan([pasteTarget, "、"]),
	makeSpan(["または ", fileBrowseButton]),
	makeSpan([
		"（サンプル: ",
		makeSampleImageButton("./img/sample/gradient.png"),
		makeSampleImageButton("./img/sample/forest-path.jpg"),
		makeSampleImageButton("./img/sample/rgb-chan.png"),
		makeSampleImageButton("./img/sample/rgb-chan-tp.png"),
		"）"
	])
], false));
const pPresetButtons = makeParagraph();
for (const id in presets) pPresetButtons.appendChild(makePresetButton(id, presets[id]));
const presetSection = makeSection([makeFloatList([makeHeader("プリセット"), makeNowrap("選んでください: ")]), pPresetButtons]);
const proModeCheckBox = makeCheckBox("上級者向け設定を表示する");
proModeCheckBox.addEventListener("change", onProModeChanged);
function onProModeChanged() {
	const pro$1 = proModeCheckBox.checked;
	history.replaceState(null, "", pro$1 ? "#detail" : "#");
	document.querySelectorAll(".professional").forEach((el) => {
		setVisible(el, pro$1);
		onRelayout();
	});
	document.querySelectorAll(".basic").forEach((el) => {
		setVisible(el, !pro$1);
		onRelayout();
	});
	updateTrimCanvas();
}
const proModeSection = makeSection(makeFloatList([makeHeader("編集モード"), proModeCheckBox.parentElement]));
let origCanvas = document.createElement("canvas");
const resetTrimButton = makeButton("範囲をリセット");
const rotateRightButton = makeButton("90° 回転");
const trimCanvas = document.createElement("canvas");
trimCanvas.style.width = "100%";
trimCanvas.style.height = "400px";
trimCanvas.style.boxSizing = "border-box";
trimCanvas.style.border = "solid 1px #444";
trimCanvas.style.backgroundImage = "url(./img/checker.png)";
const pTrimCanvas = makeParagraph(trimCanvas);
pTrimCanvas.style.textAlign = "center";
const trimSection = makeSection([makeFloatList([
	makeHeader("トリミング"),
	tip(resetTrimButton, "トリミングしていない状態に戻します。"),
	tip(rotateRightButton, "画像を右に 90° 回転します。")
]), pTrimCanvas]);
const alphaModeBox = makeSelectBox([
	{
		value: AlphaMode.KEEP,
		label: "変更しない"
	},
	{
		value: AlphaMode.FILL,
		label: "背景色を指定"
	},
	{
		value: AlphaMode.BINARIZE,
		label: "二値化"
	},
	{
		value: AlphaMode.SET_KEY_COLOR,
		label: "抜き色指定"
	}
], AlphaMode.KEEP);
const backColorBox = makeTextBox("#00F");
const keyColorBox = makeTextBox("#00F");
const keyToleranceBox = makeTextBox("0", "(auto)", 5);
const alphaThreshBox = makeTextBox("128", "(auto)", 5);
const alphaSection = pro(makeSection(makeFloatList([
	makeHeader("透過色"),
	tip(["透過色の扱い: ", alphaModeBox], "入力画像に対する透過色の取り扱いを指定します。"),
	tip(["背景色: ", backColorBox], "画像の透明部分をこの色で塗り潰して不透明化します。"),
	tip(["キーカラー: ", keyColorBox], "透明にしたい色を指定します。"),
	tip(["許容誤差: ", upDown(keyToleranceBox, 0, 255, 1)], "キーカラーからの許容誤差を指定します。"),
	tip(["閾値: ", upDown(alphaThreshBox, 0, 255, 1)], "透明にするかどうかの閾値を指定します。")
])));
const hueBox = makeTextBox("0", "(0)", 4);
const saturationBox = makeTextBox("100", "(100)", 4);
const lightnessBox = makeTextBox("100", "(100)", 4);
const gammaBox = makeTextBox("1", "(auto)", 4);
const brightnessBox = makeTextBox("0", "(auto)", 5);
const contrastBox = makeTextBox("100", "(auto)", 5);
const invertBox = makeCheckBox("階調反転");
const colorCorrectSection = makeSection(makeFloatList([
	makeHeader("色調補正"),
	pro(tip([
		"色相: ",
		upDown(hueBox, -360, 360, 5),
		"°"
	], "デフォルトは 0° です。")),
	tip([
		"彩度: ",
		upDown(saturationBox, 0, 200, 5),
		"%"
	], "デフォルトは 100% です。"),
	pro(tip([
		"明度: ",
		upDown(lightnessBox, 0, 200, 5),
		"%"
	], "デフォルトは 100% です。")),
	tip(["ガンマ: ", upDown(gammaBox, .1, 2, .05)], "デフォルトは 1.0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。"),
	pro(tip(["輝度: ", upDown(brightnessBox, -255, 255, 8)], "デフォルトは 0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。")),
	tip([
		"コントラスト: ",
		upDown(contrastBox, 0, 200, 5),
		"%"
	], "デフォルトは 100% です。\n空欄にすると、階調が失われない範囲でダイナミックレンジが最大となるように自動調整します。"),
	pro(tip([invertBox.parentElement], "各チャネルの値を大小反転します。"))
]));
const widthBox = makeTextBox("", "(auto)", 4);
const heightBox = makeTextBox("", "(auto)", 4);
const relaxSizeLimitBox = makeCheckBox("サイズ制限緩和");
const scalingMethodBox = makeSelectBox([
	{
		value: ScalingMethod.ZOOM,
		label: "ズーム",
		tip: "アスペクト比を維持したまま、出力画像に余白が出ないように画像をズームします。"
	},
	{
		value: ScalingMethod.FIT,
		label: "フィット",
		tip: "アスペクト比を維持したまま、画像全体が出力画像に収まるようにズームします。"
	},
	{
		value: ScalingMethod.STRETCH,
		label: "ストレッチ",
		tip: "アスペクト比を無視して、出力画像に合わせて画像を引き伸ばします。"
	}
], ScalingMethod.ZOOM);
const interpMethodBox = makeSelectBox([{
	value: InterpMethod.NEAREST_NEIGHBOR,
	label: "なし",
	tip: "ニアレストネイバー法で補間します。"
}, {
	value: InterpMethod.AVERAGE,
	label: "高精度",
	tip: "各出力画素に関係する入力画素を全て平均します。"
}], InterpMethod.AVERAGE);
const resizeSection = makeSection(makeFloatList([
	makeHeader("出力サイズ"),
	tip([
		"サイズ: ",
		upDown(widthBox, 1, 1024, 1),
		" x ",
		upDown(heightBox, 1, 1024, 1),
		" px"
	], "片方を空欄にすると他方はアスペクト比に基づいて自動的に決定されます。"),
	tip([relaxSizeLimitBox.parentElement], "出力サイズの制限を緩和します。処理が重くなる可能性があります。"),
	tip(["拡縮方法: ", scalingMethodBox], "トリミングサイズと出力サイズが異なる場合の拡縮方法を指定します。"),
	pro(tip(["補間方法: ", interpMethodBox], "拡縮時の補間方法を指定します。"))
]));
hide(parentLiOf(relaxSizeLimitBox));
const csrModeBox = makeSelectBox([
	{
		value: ColorSpaceReductionMode.NONE,
		label: "縮退しない",
		tip: "元の色を保ったまま減色を行います。誤差拡散と組み合わせると不自然になることがあります。"
	},
	{
		value: ColorSpaceReductionMode.CLIP,
		label: "切り捨てる",
		tip: "新しい色空間で表現できない色は彩度を下げて灰色にします。"
	},
	{
		value: ColorSpaceReductionMode.FOLD,
		label: "折り畳む",
		tip: "新しい色空間で表現できない色は色相環上で折り返して空間内に収めます。"
	},
	{
		value: ColorSpaceReductionMode.TRANSFORM,
		label: "圧縮する",
		tip: "元の色空間全体を変形してパレットの空間内に収まるようにします。"
	}
], ColorSpaceReductionMode.FOLD);
const csrHueToleranceBox = makeTextBox("60", "(60)", 4);
const paletteTable = document.createElement("table");
const paletteSection = makeSection([makeFloatList([
	makeHeader("パレット"),
	tip(["色空間の縮退方法: ", csrModeBox], "パレット内の色で表現できない色の扱いを指定します。"),
	tip([
		"許容誤差: ",
		upDown(csrHueToleranceBox, 0, 180, 5),
		"°"
	], "新しい色空間の外側をどこまで空間内に丸めるかを色相の角度で指定します。")
]), pro(paletteTable)]);
const pixelFormatBox = makeSelectBox([
	{
		value: PixelFormat.RGBA8888,
		label: "RGBA8888"
	},
	{
		value: PixelFormat.RGB888,
		label: "RGB888"
	},
	{
		value: PixelFormat.RGB666,
		label: "RGB666"
	},
	{
		value: PixelFormat.RGB565,
		label: "RGB565"
	},
	{
		value: PixelFormat.RGB444,
		label: "RGB444"
	},
	{
		value: PixelFormat.RGB332,
		label: "RGB332"
	},
	{
		value: PixelFormat.RGB111,
		label: "RGB111"
	},
	{
		value: PixelFormat.GRAY4,
		label: "Gray4"
	},
	{
		value: PixelFormat.GRAY2,
		label: "Gray2"
	},
	{
		value: PixelFormat.BW,
		label: "B/W"
	},
	{
		value: PixelFormat.I2_RGB888,
		label: "Index2"
	}
], PixelFormat.RGB565);
const colorDitherMethodBox = makeSelectBox([
	{
		value: DitherMethod.NONE,
		label: "なし"
	},
	{
		value: DitherMethod.DIFFUSION,
		label: "誤差拡散"
	},
	{
		value: DitherMethod.PATTERN_GRAY,
		label: "パターン"
	}
], DitherMethod.NONE);
const colorDitherStrengthBox = makeTextBox("80", `(${DEFAULT_DITHER_STRENGTH * 100})`, 4);
const alphaDitherMethodBox = makeSelectBox([
	{
		value: DitherMethod.NONE,
		label: "なし"
	},
	{
		value: DitherMethod.DIFFUSION,
		label: "誤差拡散"
	},
	{
		value: DitherMethod.PATTERN_GRAY,
		label: "パターン"
	}
], DitherMethod.NONE);
const alphaDitherStrengthBox = makeTextBox("80", `(${DEFAULT_DITHER_STRENGTH * 100})`, 4);
const roundMethodBox = makeSelectBox([{
	value: RoundMethod.NEAREST,
	label: "近似値",
	tip: "元の色の輝度値に最も近い色を選択します。"
}, {
	value: RoundMethod.EQUAL_DIVISION,
	label: "均等割り",
	tip: "色の範囲を均等に分割します。"
}], RoundMethod.NEAREST);
const previewCanvas = document.createElement("canvas");
const reductionErrorBox = document.createElement("span");
previewCanvas.style.backgroundImage = "url(./img/checker.png)";
reductionErrorBox.style.color = "red";
hide(previewCanvas);
hide(reductionErrorBox);
const pPreviewCanvas = makeParagraph([previewCanvas, reductionErrorBox]);
pPreviewCanvas.style.height = "400px";
pPreviewCanvas.style.background = "#444";
pPreviewCanvas.style.border = "solid 1px #444";
pPreviewCanvas.style.textAlign = "center";
const colorReductionSection = makeSection([makeFloatList([
	makeHeader("減色"),
	pro(tip(["フォーマット: ", pixelFormatBox], "ピクセルフォーマットを指定します。")),
	pro(tip(["丸め方法: ", roundMethodBox], "パレットから色を選択する際の戦略を指定します。\nディザリングを行う場合はあまり関係ありません。")),
	tip(["ディザ: ", colorDitherMethodBox], "あえてノイズを加えることでできるだけ元画像の色を再現します。"),
	tip([
		"強度: ",
		upDown(colorDitherStrengthBox, 0, 100, 10),
		"%"
	], "ディザリングの強度を指定します。"),
	pro(tip(["透明度のディザ: ", alphaDitherMethodBox], "あえてノイズを加えることでできるだけ元画像の透明度を再現します。")),
	pro(tip([
		"強度: ",
		upDown(alphaDitherStrengthBox, 0, 100, 10),
		"%"
	], "透明度に対するディザリングの強度を指定します。"))
]), pPreviewCanvas]);
const channelOrderBox = makeSelectBox([
	{
		value: ChannelOrder.RGBA,
		label: "RGBA"
	},
	{
		value: ChannelOrder.BGRA,
		label: "BGRA"
	},
	{
		value: ChannelOrder.ARGB,
		label: "ARGB"
	},
	{
		value: ChannelOrder.ABGR,
		label: "ABGR"
	}
], ChannelOrder.RGBA);
const farPixelFirstBox = makeSelectBox([{
	value: 1,
	label: "上位から"
}, {
	value: 0,
	label: "下位から"
}], 1);
const bigEndianBox = makeCheckBox("ビッグエンディアン");
const packUnitBox = makeSelectBox([
	{
		value: PackUnit.UNPACKED,
		label: "アンパックド"
	},
	{
		value: PackUnit.PIXEL,
		label: "1 ピクセル"
	},
	{
		value: PackUnit.ALIGNMENT,
		label: "アライメント境界"
	}
], PackUnit.PIXEL);
const vertPackBox = makeCheckBox("縦パッキング");
const alignBoundaryBox = makeSelectBox([
	{
		value: AlignBoundary.NIBBLE,
		label: "ニブル"
	},
	{
		value: AlignBoundary.BYTE_1,
		label: "1 バイト"
	},
	{
		value: AlignBoundary.BYTE_2,
		label: "2 バイト"
	},
	{
		value: AlignBoundary.BYTE_3,
		label: "3 バイト"
	},
	{
		value: AlignBoundary.BYTE_4,
		label: "4 バイト"
	}
], AlignBoundary.BYTE_1);
const leftAlignBox = makeCheckBox("左詰め");
const vertAddrBox = makeCheckBox("垂直スキャン");
const planeSelectBox = makeSelectBox([{
	value: 0,
	label: "プレーン0"
}], 0);
const planeGroupBody = makeGroupBody();
const planeGroupBox = makeGroup([makeGroupTitle([planeSelectBox]), planeGroupBody]);
planeSelectBox.addEventListener("change", onSelectedPlaneChanged);
const structCanvas = document.createElement("canvas");
structCanvas.style.maxWidth = "100%";
const structErrorBox = makeParagraph();
structErrorBox.style.textAlign = "center";
structErrorBox.style.color = "red";
hide(structErrorBox);
const pStructCanvas = makeParagraph([structCanvas, structErrorBox]);
pStructCanvas.style.textAlign = "center";
const encodeSection = makeSection([
	makeFloatList([
		makeHeader("エンコード"),
		basic(makeSpan("この構造で生成されます:")),
		pro(tip(["パッキング単位: ", packUnitBox], "パッキングの単位を指定します。")),
		pro(tip([vertPackBox.parentElement], "複数ピクセルをパッキングする場合に、縦方向にパッキングします。\nSSD1306/1309 などの一部の白黒ディスプレイに\n直接転送可能なデータを生成する場合はチェックします。")),
		pro(tip([vertAddrBox.parentElement], "アドレスを縦方向にインクリメントする場合にチェックします。")),
		pro(tip(["チャネル順: ", channelOrderBox], "RGB のチャネルを並べる順序を指定します。")),
		pro(tip(["ピクセル順: ", farPixelFirstBox], "バイト内のピクセルの順序を指定します。")),
		pro(tip(["アライメント境界: ", alignBoundaryBox], "アライメントの境界を指定します。")),
		pro(tip([leftAlignBox.parentElement], "フィールドをアライメント境界内で左詰めします。")),
		pro(tip([bigEndianBox.parentElement], "ピクセル内のバイトの順序を指定します。"))
	]),
	pro(planeGroupBox),
	pStructCanvas
]);
const codeUnitBox = makeSelectBox([
	{
		value: CodeUnit.FILE,
		label: "ファイル全体"
	},
	{
		value: CodeUnit.ARRAY_DEF,
		label: "配列定義"
	},
	{
		value: CodeUnit.ELEMENTS,
		label: "要素のみ"
	}
], CodeUnit.FILE);
const codeColsBox = makeSelectBox([
	{
		value: 8,
		label: "8"
	},
	{
		value: 16,
		label: "16"
	},
	{
		value: 32,
		label: "32"
	}
], 16);
const indentBox = makeSelectBox([
	{
		value: Indent.SPACE_X2,
		label: "スペース x2"
	},
	{
		value: Indent.SPACE_X4,
		label: "スペース x4"
	},
	{
		value: Indent.TAB,
		label: "タブ"
	}
], Indent.SPACE_X2);
const codePlaneContainer = document.createElement("div");
const showCodeLink = document.createElement("a");
showCodeLink.href = "#";
showCodeLink.textContent = "表示する";
const codeErrorBox = makeParagraph();
codeErrorBox.style.textAlign = "center";
codeErrorBox.style.color = "red";
hide(codeErrorBox);
const codeGenSection = makeSection([
	makeFloatList([
		makeHeader("コード生成"),
		tip(["生成範囲: ", codeUnitBox], "生成するコードの範囲を指定します。"),
		tip(["列数: ", codeColsBox], "1 行に詰め込む要素数を指定します。"),
		tip(["インデント: ", indentBox], "インデントの形式とサイズを指定します。")
	]),
	codePlaneContainer,
	codeErrorBox
]);
let container;
let updateTrimCanvasTimeoutId = -1;
let quantizeTimeoutId = -1;
let generateCodeTimeoutId = -1;
let worldX0 = 0, worldY0 = 0, zoom = 1;
let trimL = 0, trimT = 0, trimR = 1, trimB = 1;
let trimUiState = TrimState.IDLE;
let normImageCache = null;
let paletteColor = new Uint32Array(256);
let paletteEnabled = new Array(256).fill(false);
let reducedImage = null;
let trimCanvasWidth = 800;
let trimCanvasHeight = 400;
let previewCanvasWidth = 800;
let previewCanvasHeight = 400;
let planeUis = {};
let keepShowLongCode = false;
const DEFAULT_INPUT_FILE_NAME = "imageArray";
let inputFileName = DEFAULT_INPUT_FILE_NAME;
async function onLoad() {
	container = document.querySelector("#arrayfyContainer");
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
	alphaModeBox.addEventListener("change", onAlphaProcChanged);
	onAlphaProcChanged();
	const resizeSections = [
		trimSection,
		resizeSection,
		alphaSection
	];
	for (const section of resizeSections) section.querySelectorAll("input, select").forEach((el) => {
		el.addEventListener("change", () => {
			normImageCache = null;
			requestColorReduction();
		});
		el.addEventListener("input", () => {
			normImageCache = null;
			requestColorReduction();
		});
	});
	const colorReductionSections = [
		colorCorrectSection,
		paletteSection,
		colorReductionSection
	];
	for (const section of colorReductionSections) section.querySelectorAll("input, select").forEach((el) => {
		el.addEventListener("change", () => {
			requestColorReduction();
		});
		el.addEventListener("input", () => {
			requestColorReduction();
		});
	});
	const codeGenSections = [encodeSection, codeGenSection];
	for (const section of codeGenSections) section.querySelectorAll("input, select").forEach((el) => {
		el.addEventListener("change", () => {
			requestGenerateCode();
		});
		el.addEventListener("input", () => {
			requestGenerateCode();
		});
	});
	hiddenFileBox.addEventListener("change", async (e) => {
		const input = e.target;
		if (input.files && input.files[0]) await loadFromFile(input.files[0].name, input.files[0]);
	});
	document.body.addEventListener("dragover", (e) => {
		if (!e.dataTransfer) return;
		const items = e.dataTransfer.items;
		for (const item of items) if (item.kind === "file") {
			e.preventDefault();
			e.stopPropagation();
			show(dropTarget);
			break;
		}
	});
	dropTarget.addEventListener("dragleave", (e) => {
		e.preventDefault();
		e.stopPropagation();
		hide(dropTarget);
	});
	dropTarget.addEventListener("drop", async (e) => {
		if (!e.dataTransfer) return;
		hide(dropTarget);
		const items = e.dataTransfer.items;
		for (const item of items) if (item.kind === "file") {
			e.preventDefault();
			e.stopPropagation();
			const file = item.getAsFile();
			await loadFromFile(file.name, file);
			break;
		}
	});
	pasteTarget.addEventListener("paste", async (e) => {
		if (!e.clipboardData) return;
		const items = e.clipboardData.items;
		for (const item of items) if (item.kind === "file") {
			e.preventDefault();
			e.stopPropagation();
			const file = item.getAsFile();
			await loadFromFile(file.name, file);
			break;
		}
	});
	pasteTarget.addEventListener("input", (e) => {
		e.preventDefault();
		e.stopPropagation();
		pasteTarget.value = "";
	});
	pasteTarget.addEventListener("change", (e) => {
		e.preventDefault();
		e.stopPropagation();
		pasteTarget.value = "";
	});
	trimCanvas.addEventListener("pointermove", (e) => {
		e.preventDefault();
		if (trimUiState == TrimState.IDLE) switch (trimViewToNextState(e.offsetX, e.offsetY)) {
			case TrimState.DRAG_LEFT:
				trimCanvas.style.cursor = "w-resize";
				break;
			case TrimState.DRAG_TOP:
				trimCanvas.style.cursor = "n-resize";
				break;
			case TrimState.DRAG_RIGHT:
				trimCanvas.style.cursor = "e-resize";
				break;
			case TrimState.DRAG_BOTTOM:
				trimCanvas.style.cursor = "s-resize";
				break;
			default:
				trimCanvas.style.cursor = "default";
				break;
		}
		else {
			let { x, y } = trimViewToWorld(e.offsetX, e.offsetY);
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
	trimCanvas.addEventListener("pointerdown", (e) => {
		e.preventDefault();
		if (trimViewToNextState(e.offsetX, e.offsetY) != TrimState.IDLE) {
			trimUiState = trimViewToNextState(e.offsetX, e.offsetY);
			trimCanvas.style.cursor = "grabbing";
			trimCanvas.setPointerCapture(e.pointerId);
		}
	});
	trimCanvas.addEventListener("pointerup", (e) => {
		e.preventDefault();
		trimUiState = TrimState.IDLE;
		trimCanvas.style.cursor = "default";
		trimCanvas.releasePointerCapture(e.pointerId);
		setTrimRect(trimL, trimT, trimR, trimB, true);
	});
	trimCanvas.addEventListener("touchstart", (e) => {
		e.preventDefault();
	});
	trimCanvas.addEventListener("touchmove", (e) => {
		e.preventDefault();
	});
	trimCanvas.addEventListener("touchend", (e) => {
		e.preventDefault();
	});
	resetTrimButton.addEventListener("click", () => {
		resetTrim();
	});
	rotateRightButton.addEventListener("click", () => {
		rotate();
	});
	proModeCheckBox.checked = window.location.hash === "#detail";
	onProModeChanged();
	loadPreset(presets.rgb565_be);
	await loadFromString("gradient", "./img/sample/gradient.png");
	onRelayout();
}
function onAlphaProcChanged() {
	hide(parentLiOf(backColorBox));
	hide(parentLiOf(keyColorBox));
	hide(parentLiOf(keyToleranceBox));
	hide(parentLiOf(alphaThreshBox));
	const alphaProc = parseInt(alphaModeBox.value);
	switch (alphaProc) {
		case AlphaMode.FILL:
			show(parentLiOf(backColorBox));
			break;
		case AlphaMode.SET_KEY_COLOR:
			show(parentLiOf(keyColorBox));
			show(parentLiOf(keyToleranceBox));
			break;
		case AlphaMode.BINARIZE:
			show(parentLiOf(alphaThreshBox));
			break;
	}
}
async function loadFromFile(name, file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = async (e) => {
			if (e.target && typeof e.target.result === "string") await loadFromString(name, e.target.result);
			else throw new Error("Invalid image data");
			resolve();
		};
		reader.onerror = (e) => {
			reject(/* @__PURE__ */ new Error("Failed to read file"));
		};
		reader.readAsDataURL(file);
	});
}
async function loadFromString(fileName, blobStr) {
	inputFileName = DEFAULT_INPUT_FILE_NAME;
	normImageCache = null;
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			inputFileName = fileName;
			origCanvas.width = img.width;
			origCanvas.height = img.height;
			const ctx = origCanvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) {
				reject(/* @__PURE__ */ new Error("Failed to get canvas context"));
				return;
			}
			ctx.clearRect(0, 0, img.width, img.height);
			ctx.drawImage(img, 0, 0);
			keepShowLongCode = false;
			resetTrim(true);
			reduceColor();
			requestUpdateTrimCanvas();
			resolve();
		};
		img.onerror = () => {
			reject(/* @__PURE__ */ new Error("Failed to load image"));
		};
		img.src = blobStr;
	});
}
function resetTrim(forceUpdate = false) {
	setTrimRect(0, 0, origCanvas.width, origCanvas.height, forceUpdate);
}
function rotate() {
	const newTrimL = origCanvas.height - trimB;
	const newTrimT = trimL;
	const newTrimR = origCanvas.height - trimT;
	const newTrimB = trimR;
	setTrimRect(newTrimL, newTrimT, newTrimR, newTrimB, true);
	const tmpCanvas = document.createElement("canvas");
	tmpCanvas.width = origCanvas.height;
	tmpCanvas.height = origCanvas.width;
	const tmpCtx = tmpCanvas.getContext("2d", { willReadFrequently: true });
	if (!tmpCtx) throw new Error("Failed to get canvas context");
	tmpCtx.imageSmoothingEnabled = false;
	tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
	tmpCtx.translate(tmpCanvas.width / 2, tmpCanvas.height / 2);
	tmpCtx.rotate(Math.PI / 2);
	tmpCtx.drawImage(origCanvas, -origCanvas.width / 2, -origCanvas.height / 2);
	origCanvas = tmpCanvas;
	requestUpdateTrimCanvas();
	requestColorReduction();
}
function getTrimViewArea() {
	const margin = 20;
	const canvasW = trimCanvas.width;
	const canvasH = trimCanvas.height;
	const viewX0 = canvasW / 2;
	const viewY0 = canvasH / 2;
	const viewW = canvasW - margin * 2;
	const viewH = canvasH - margin * 2;
	return {
		x: viewX0,
		y: viewY0,
		width: viewW,
		height: viewH
	};
}
function trimWorldToView(x, y) {
	const view = getTrimViewArea();
	return {
		x: view.x + (x - worldX0) * zoom,
		y: view.y + (y - worldY0) * zoom
	};
}
function trimViewToWorld(x, y) {
	const view = getTrimViewArea();
	return {
		x: (x - view.x) / zoom + worldX0,
		y: (y - view.y) / zoom + worldY0
	};
}
function trimViewToNextState(x, y) {
	const { x: trimViewL, y: trimViewT } = trimWorldToView(trimL, trimT);
	const { x: trimViewR, y: trimViewB } = trimWorldToView(trimR, trimB);
	if (Math.abs(x - trimViewL) < 10) return TrimState.DRAG_LEFT;
	if (Math.abs(x - trimViewR) < 10) return TrimState.DRAG_RIGHT;
	if (Math.abs(y - trimViewT) < 10) return TrimState.DRAG_TOP;
	if (Math.abs(y - trimViewB) < 10) return TrimState.DRAG_BOTTOM;
	return TrimState.IDLE;
}
function setTrimRect(l, t, r, b, forceUpdate = false) {
	const changed = l != trimL || t != trimT || r != trimR || b != trimB;
	if (!changed && !forceUpdate) return;
	trimL = l;
	trimT = t;
	trimR = r;
	trimB = b;
	normImageCache = null;
	requestUpdateTrimCanvas();
	requestColorReduction();
}
function requestUpdateTrimCanvas() {
	if (updateTrimCanvasTimeoutId >= 0) return;
	updateTrimCanvasTimeoutId = setTimeout(() => {
		updateTrimCanvas();
	}, 10);
}
function updateTrimCanvas() {
	if (updateTrimCanvasTimeoutId >= 0) {
		clearTimeout(updateTrimCanvasTimeoutId);
		updateTrimCanvasTimeoutId = -1;
	}
	trimCanvas.width = trimCanvasWidth - 2;
	trimCanvas.height = trimCanvasHeight - 2;
	const canvasW = trimCanvas.width;
	const canvasH = trimCanvas.height;
	const view = getTrimViewArea();
	if (trimUiState == TrimState.IDLE) {
		const worldL = trimL;
		const worldR = trimR;
		const worldT = trimT;
		const worldB = trimB;
		const worldW = worldR - worldL;
		const worldH = worldB - worldT;
		worldX0 = (worldL + worldR) / 2;
		worldY0 = (worldT + worldB) / 2;
		const worldAspect = worldW / Math.max(1, worldH);
		const viewAspect = view.width / Math.max(1, view.height);
		if (worldAspect > viewAspect) zoom = view.width / Math.max(1, worldW);
		else zoom = view.height / Math.max(1, worldH);
	}
	const { x: trimViewL, y: trimViewT } = trimWorldToView(trimL, trimT);
	const { x: trimViewR, y: trimViewB } = trimWorldToView(trimR, trimB);
	const ctx = trimCanvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) throw new Error("Failed to get canvas context");
	ctx.clearRect(0, 0, canvasW, canvasH);
	{
		const dx = view.x - worldX0 * zoom;
		const dy = view.y - worldY0 * zoom;
		const dw = origCanvas.width * zoom;
		const dh = origCanvas.height * zoom;
		ctx.imageSmoothingEnabled = zoom < 3;
		ctx.drawImage(origCanvas, dx, dy, dw, dh);
		ctx.imageSmoothingEnabled = true;
	}
	{
		const lineWidth = 2;
		ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
		ctx.fillRect(trimViewL - lineWidth - 2, 0, lineWidth + 4, canvasH);
		ctx.fillRect(0, trimViewT - lineWidth - 2, canvasW, lineWidth + 4);
		ctx.fillRect(trimViewR - 2, 0, lineWidth + 4, canvasH);
		ctx.fillRect(0, trimViewB - 2, canvasW, lineWidth + 4);
		ctx.fillStyle = "#FFF";
		ctx.fillRect(trimViewL - lineWidth, 0, lineWidth, canvasH);
		ctx.fillRect(0, trimViewT - lineWidth, canvasW, lineWidth);
		ctx.fillRect(trimViewR, 0, lineWidth, canvasH);
		ctx.fillRect(0, trimViewB, canvasW, lineWidth);
	}
}
function loadPreset(preset) {
	pixelFormatBox.value = preset.format.toString();
	channelOrderBox.value = preset.channelOrder.toString();
	farPixelFirstBox.value = preset.farPixelFirst ? "1" : "0";
	bigEndianBox.checked = preset.bigEndian;
	packUnitBox.value = preset.packUnit.toString();
	vertPackBox.checked = preset.vertPack;
	alignBoundaryBox.value = preset.alignBoundary.toString();
	leftAlignBox.checked = preset.alignLeft;
	vertAddrBox.checked = preset.vertAddr;
	paletteTable.innerHTML = "";
	if (preset.palette) {
		for (let i = 0; i < 256; i++) if (i < preset.palette.length) {
			paletteColor[i] = preset.palette[i];
			paletteEnabled[i] = true;
		} else paletteEnabled[i] = false;
		const headerTr = document.createElement("tr");
		for (let i = 0; i < preset.palette.length; i++) {
			const th = document.createElement("th");
			th.textContent = i.toString();
			headerTr.appendChild(th);
		}
		const colorTr = document.createElement("tr");
		for (let i = 0; i < preset.palette.length; i++) {
			const { r, g, b } = rgbU32ToU8(preset.palette[i]);
			const colorStr = rgbToHexStr(preset.palette[i]);
			const td = document.createElement("td");
			td.textContent = colorStr;
			td.style.backgroundColor = colorStr;
			if (r + g + b < 384) td.style.color = "#FFF";
			else td.style.color = "#000";
			colorTr.appendChild(td);
		}
		paletteTable.appendChild(headerTr);
		paletteTable.appendChild(colorTr);
	}
	for (const [key, value] of Object.entries(planeUis)) value.dispose();
	planeUis = {};
	planeSelectBox.innerHTML = "";
	for (const planeCfg of preset.planeCfgs) {
		const planeUi = new PlaneUi(planeCfg);
		planeUis[planeCfg.id] = planeUi;
		hide(planeUi.container);
		planeGroupBody.appendChild(planeUi.container);
		const option = document.createElement("option");
		option.value = planeCfg.id;
		option.textContent = planeCfg.id + " プレーン";
		planeSelectBox.appendChild(option);
	}
	planeSelectBox.firstChild.selected = true;
	onSelectedPlaneChanged();
	requestColorReduction();
}
function onSelectedPlaneChanged() {
	for (const [key, value] of Object.entries(planeUis)) setVisible(value.container, key === planeSelectBox.value);
}
function requestColorReduction() {
	if (quantizeTimeoutId >= 0) return;
	quantizeTimeoutId = setTimeout(() => {
		reduceColor();
	}, 100);
}
function reduceColor() {
	reducedImage = null;
	if (quantizeTimeoutId >= 0) {
		clearTimeout(quantizeTimeoutId);
		quantizeTimeoutId = -1;
	}
	const swDetail = new StopWatch(false);
	try {
		let outW = -1, outH = -1;
		let norm;
		const fmt = new PixelFormatInfo(parseInt(pixelFormatBox.value));
		let roundMethod = RoundMethod.NEAREST;
		{
			let maxChannelDepth = 0;
			for (const depth of fmt.colorBits) if (depth > maxChannelDepth) maxChannelDepth = depth;
			if (maxChannelDepth > 1 && !fmt.isIndexed) {
				show(parentLiOf(roundMethodBox));
				roundMethod = parseInt(roundMethodBox.value);
			} else hide(parentLiOf(roundMethodBox));
		}
		let palette;
		if (fmt.isIndexed) {
			const indexedPalette = new IndexedPalette(fmt.colorBits, fmt.indexBits);
			palette = indexedPalette;
			const numColors = 1 << indexedPalette.indexBits;
			for (let i = 0; i < numColors; i++) {
				const { r, g, b } = rgbU32ToF32(paletteColor[i]);
				indexedPalette.colors[i * 3 + 0] = r;
				indexedPalette.colors[i * 3 + 1] = g;
				indexedPalette.colors[i * 3 + 2] = b;
				indexedPalette.enabled[i] = paletteEnabled[i];
			}
		} else palette = new FixedPalette(fmt.colorBits, roundMethod);
		const srcW = origCanvas.width;
		const srcH = origCanvas.height;
		const trimW = Math.round(trimR - trimL);
		const trimH = Math.round(trimB - trimT);
		outW = trimW;
		outH = trimH;
		{
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
			const resizing = outW != trimW || outH != trimH;
			setVisible(parentLiOf(scalingMethodBox), resizing && aspectChanged);
			setVisible(parentLiOf(interpMethodBox), resizing);
			widthBox.placeholder = "(" + outW + ")";
			heightBox.placeholder = "(" + outH + ")";
			if (outW < 1 || outH < 1) throw new Error("サイズは正の値で指定してください");
			if (relaxSizeLimitBox.checked) {
				if (outW * outH > 2048 * 2048) throw new Error("出力サイズが大きすぎます。");
			} else if (outW * outH > 1024 * 1024) {
				show(parentLiOf(relaxSizeLimitBox));
				throw new Error("出力サイズが大きすぎます。処理が重くなることを承知で制限を緩和するには「サイズ制限緩和」にチェックしてください。");
			}
		}
		if (normImageCache == null || normImageCache.width != outW || normImageCache.height != outH) {
			let args = new ResizeArgs();
			args.colorSpace = fmt.colorSpace;
			args.srcSize.width = srcW;
			args.srcSize.height = srcH;
			{
				const origCtx = origCanvas.getContext("2d", { willReadFrequently: true });
				if (!origCtx) throw new Error("Failed to get canvas context");
				const origImageData = origCtx.getImageData(0, 0, srcW, srcH);
				const origData = new Uint8Array(srcW * srcH * 4);
				for (let i = 0; i < origImageData.data.length; i++) origData[i] = origImageData.data[i];
				args.srcData = origData;
			}
			args.scalingMethod = parseInt(scalingMethodBox.value);
			if (trimUiState == TrimState.IDLE) args.interpMethod = parseInt(interpMethodBox.value);
			else args.interpMethod = InterpMethod.NEAREST_NEIGHBOR;
			args.trimRect.x = trimL;
			args.trimRect.y = trimT;
			args.trimRect.width = trimW;
			args.trimRect.height = trimH;
			args.outSize.width = outW;
			args.outSize.height = outH;
			args.applyKeyColor = parseInt(alphaModeBox.value) == AlphaMode.SET_KEY_COLOR;
			if (keyColorBox.value) args.keyColor = hexStrToRgb(keyColorBox.value);
			if (keyToleranceBox.value) args.keyTolerance = parseInt(keyToleranceBox.value);
			resize(args);
			normImageCache = args.out;
		}
		{
			let args = new PreProcArgs();
			args.src = normImageCache;
			args.alphaProc = parseInt(alphaModeBox.value);
			args.alphaThresh = parseInt(alphaThreshBox.value);
			if (backColorBox.value) args.backColor = hexStrToRgb(backColorBox.value);
			if (hueBox.value && fmt.numColorChannels > 1) args.hue = parseFloat(hueBox.value) / 360;
			if (saturationBox.value && fmt.numColorChannels > 1) args.saturation = parseFloat(saturationBox.value) / 100;
			if (lightnessBox.value) args.lightness = parseFloat(lightnessBox.value) / 100;
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
			setVisible(paletteSection, fmt.isIndexed);
			if (fmt.isIndexed) {
				args.csrMode = parseInt(csrModeBox.value);
				args.csrHslRange = palette.getHslRange();
				setVisible(parentLiOf(csrHueToleranceBox), args.csrMode == ColorSpaceReductionMode.CLIP);
				if (args.csrMode == ColorSpaceReductionMode.CLIP) args.csrHueTolerance = parseFloat(csrHueToleranceBox.value) / 360;
				else if (args.csrMode == ColorSpaceReductionMode.TRANSFORM) {
					const indexedPalette = palette;
					const numColors = 1 << indexedPalette.indexBits;
					const vecs = [
						[
							0,
							0,
							0
						],
						[
							1,
							0,
							0
						],
						[
							0,
							1,
							0
						],
						[
							0,
							0,
							1
						]
					];
					let remainingVecIndexes = {
						0: true,
						1: true,
						2: true,
						3: true
					};
					let mappedVecIndices = {};
					let mappedPalIndices = {};
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
								const dist = Math.abs(pr - vr) * .299 + Math.abs(pg - vg) * .587 + Math.abs(pb - vb) * .114;
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
						} else throw new Error("色空間の圧縮には 4 色以上のパレットが必要です");
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
						o2
					]);
					args.csrTransformMatrix = mat;
				}
			} else {
				args.csrMode = ColorSpaceReductionMode.NONE;
				hide(parentLiOf(csrHueToleranceBox));
			}
			setVisible(parentLiOf(hueBox), fmt.numColorChannels > 1);
			setVisible(parentLiOf(saturationBox), fmt.numColorChannels > 1);
			process(args);
			norm = args.out;
			gammaBox.placeholder = `(${args.gamma.value.toFixed(2)})`;
			brightnessBox.placeholder = `(${Math.round(args.brightness.value * 255)})`;
			contrastBox.placeholder = `(${Math.round(args.contrast.value * 100)})`;
		}
		{
			const numPixels = outW * outH;
			let minColBits = 999;
			for (const bits of fmt.colorBits) if (bits < minColBits) minColBits = bits;
			const colReduce = minColBits < 8 || fmt.isIndexed;
			const alpReduce = fmt.hasAlpha && fmt.alphaBits < 8;
			const colDither = colReduce ? parseInt(colorDitherMethodBox.value) : DitherMethod.NONE;
			const alpDither = alpReduce ? parseInt(alphaDitherMethodBox.value) : DitherMethod.NONE;
			setVisible(parentLiOf(colorDitherMethodBox), colReduce);
			setVisible(parentLiOf(alphaDitherMethodBox), alpReduce);
			setVisible(parentLiOf(colorDitherStrengthBox), colDither != DitherMethod.NONE);
			setVisible(parentLiOf(alphaDitherStrengthBox), alpDither != DitherMethod.NONE);
			const args = new Arguments();
			args.src = norm;
			args.format = fmt;
			args.palette = palette;
			args.colorDitherMethod = colDither;
			if (colorDitherStrengthBox.value) args.colorDitherStrength = parseFloat(colorDitherStrengthBox.value) / 100;
			args.alphaDitherMethod = alpDither;
			if (alphaDitherStrengthBox.value) args.alphaDitherStrength = parseFloat(alphaDitherStrengthBox.value) / 100;
			reduce(args);
			reducedImage = args.output;
			swDetail.lap("Quantization");
			{
				const previewData = new Uint8Array(numPixels * 4);
				reducedImage.getPreviewImage(previewData);
				previewCanvas.width = outW;
				previewCanvas.height = outH;
				const ctx = previewCanvas.getContext("2d", { willReadFrequently: true });
				if (!ctx) throw new Error("Failed to get canvas context");
				const previewImageData = ctx.getImageData(0, 0, outW, outH);
				previewImageData.data.set(previewData);
				ctx.putImageData(previewImageData, 0, 0);
			}
			show(previewCanvas);
			hide(reductionErrorBox);
			swDetail.lap("Update Preview");
			generateCode();
			swDetail.lap("Entire Code Generation");
		}
		{
			const borderWidth = 1;
			const viewW = previewCanvasWidth - borderWidth * 2;
			const viewH = previewCanvasHeight - borderWidth * 2;
			let zoom$1 = Math.min(viewW / outW, viewH / outH);
			if (zoom$1 >= 1) zoom$1 = Math.max(1, Math.floor(zoom$1));
			const canvasW = Math.round(outW * zoom$1);
			const canvasH = Math.round(outH * zoom$1);
			previewCanvas.style.width = `${canvasW}px`;
			previewCanvas.style.height = `${canvasH}px`;
			previewCanvas.style.marginTop = `${Math.floor((viewH - canvasH) / 2)}px`;
			previewCanvas.style.imageRendering = zoom$1 < 1 ? "auto" : "pixelated";
		}
		swDetail.lap("Fix Preview Size");
	} catch (error) {
		hide(previewCanvas);
		hide(codePlaneContainer);
		show(reductionErrorBox);
		if (error instanceof Error) reductionErrorBox.textContent = `${error.stack}`;
		else reductionErrorBox.textContent = String(error);
	}
}
function requestGenerateCode() {
	if (generateCodeTimeoutId !== -1) clearTimeout(generateCodeTimeoutId);
	generateCodeTimeoutId = setTimeout(() => {
		generateCode();
		generateCodeTimeoutId = -1;
	}, 100);
}
function generateCode() {
	const swDetail = new StopWatch(false);
	if (!reducedImage) {
		codeErrorBox.textContent = "まだコードは生成されていません。";
		show(codePlaneContainer);
		show(codeErrorBox);
		return;
	}
	let blobs = [];
	try {
		const args = new EncodeArgs();
		args.src = reducedImage;
		const chOrder = parseInt(channelOrderBox.value);
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
			default: throw new Error("Unsupported channel order");
		}
		for (const [id, planeUi] of Object.entries(planeUis)) {
			const plane = new PlaneArgs();
			plane.id = id;
			plane.type = parseInt(planeUi.planeTypeBox.value);
			const indexMatchMode = plane.type == PlaneType.INDEX_MATCH;
			if (indexMatchMode) {
				plane.indexMatchValue = parseInt(planeUi.matchIndexBox.value);
				plane.postInvert = planeUi.matchInvertBox.checked;
			}
			setVisible(parentLiOf(planeUi.matchIndexBox), indexMatchMode);
			setVisible(parentLiOf(planeUi.matchInvertBox), indexMatchMode);
			plane.farPixelFirst = parseInt(farPixelFirstBox.value) == 1;
			plane.bigEndian = bigEndianBox.checked;
			plane.packUnit = parseInt(packUnitBox.value);
			plane.vertPack = vertPackBox.checked;
			plane.alignBoundary = parseInt(alignBoundaryBox.value);
			plane.alignLeft = leftAlignBox.checked;
			plane.vertAddr = vertAddrBox.checked;
			args.planes.push(plane);
		}
		if (args.planes.length == 0) throw new Error("プレーンが定義されていません");
		encode(args);
		for (const plane of args.planes) blobs.push(plane.output.blob);
		const firstPlane = args.planes[0];
		setVisible(parentLiOf(leftAlignBox), firstPlane.output.alignRequired);
		setVisible(parentLiOf(channelOrderBox), firstPlane.output.fields.length > 1);
		setVisible(parentLiOf(farPixelFirstBox), firstPlane.output.pixelsPerFrag > 1);
		setVisible(parentLiOf(vertPackBox), firstPlane.output.pixelsPerFrag > 1);
		setVisible(parentLiOf(bigEndianBox), firstPlane.output.bytesPerFrag > 1);
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
			const ctx = structCanvas.getContext("2d");
			if (!ctx) throw new Error("Failed to get canvas context");
			ctx.fillStyle = "#FFF";
			ctx.fillRect(0, 0, structCanvas.width, structCanvas.height);
			ctx.font = "16px sans-serif";
			ctx.translate(.5, .5);
			ctx.fillStyle = "#888";
			ctx.fillRect(pad, pad + tableH - rowH, tableW, rowH);
			ctx.strokeStyle = "#000";
			ctx.fillStyle = "#000";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			for (let i = 0; i <= numCols; i++) {
				const x = pad + i * colW;
				ctx.beginPath();
				if (i % 8 == 0) ctx.moveTo(x, pad);
				else ctx.moveTo(x, pad + rowH);
				ctx.lineTo(x, pad + tableH);
				ctx.stroke();
				if (i < numCols) {
					const iBit = (numCols - 1 - i) % 8;
					ctx.fillText(iBit.toString(), x + colW / 2, pad + rowH + rowH / 2);
					if (iBit == 3) {
						const ib = Math.floor((numCols - 1 - i) / 8);
						const iByte = firstPlane.bigEndian ? out.bytesPerFrag - 1 - ib : ib;
						ctx.fillText("Byte" + iByte.toString(), x, pad + rowH / 2);
					}
				}
			}
			for (let i = 0; i <= numRows; i++) {
				ctx.beginPath();
				ctx.moveTo(pad, pad + i * rowH);
				ctx.moveTo(pad, pad + i * rowH);
				ctx.lineTo(pad + tableW, pad + i * rowH);
				ctx.stroke();
			}
			let cellColors;
			if (firstPlane.type == PlaneType.DIRECT && !fmt.isIndexed && fmt.colorSpace == ColorSpace.RGB) cellColors = [
				"rgba(255,128,128,0.8)",
				"rgba(128,255,128,0.8)",
				"rgba(128,160,255,0.8)",
				"rgba(192,128,255,0.8)"
			];
			else cellColors = ["rgba(255,255,255,0.8)"];
			for (let ip = 0; ip < out.pixelsPerFrag; ip++) {
				const iPix = firstPlane.farPixelFirst ? out.pixelsPerFrag - 1 - ip : ip;
				for (const field of out.fields) {
					const r = pad + tableW - (ip * out.pixelStride + field.pos) * colW;
					const w = field.width * colW;
					const x = r - w;
					const y = pad + tableH - rowH;
					ctx.fillStyle = cellColors[field.srcChannel];
					ctx.fillRect(x, y, w, rowH);
					ctx.strokeStyle = "#000";
					ctx.strokeRect(x, y, w, rowH);
					ctx.fillStyle = "#000";
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					let label;
					if (firstPlane.type == PlaneType.INDEX_MATCH) label = "C";
					else if (fmt.isIndexed) label = "Index";
					else label = fmt.channelName(field.srcChannel);
					if (out.pixelsPerFrag > 1) label += iPix.toString();
					ctx.measureText(label);
					ctx.fillText(label, x + w / 2, y + rowH / 2);
				}
			}
		}
		show(structCanvas);
		hide(structErrorBox);
	} catch (error) {
		hide(structCanvas);
		show(structErrorBox);
		if (error instanceof Error) structErrorBox.textContent = `${error.stack}`;
		else structErrorBox.textContent = String(error);
		codeErrorBox.textContent = "エンコードのエラーを解消してください。";
		hide(codePlaneContainer);
		show(codeErrorBox);
		return;
	}
	try {
		const args = new CodeGenArgs();
		args.name = inputFileName.split(".")[0].replaceAll(/[-\s]/g, "_");
		args.src = reducedImage;
		args.blobs = blobs;
		args.codeUnit = parseInt(codeUnitBox.value);
		args.indent = parseInt(indentBox.value);
		args.arrayCols = Math.max(1, parseInt(codeColsBox.value));
		generate(args);
		codePlaneContainer.innerHTML = "";
		for (const code of args.codes) {
			const copyButton = makeButton("コピー");
			copyButton.style.float = "right";
			const title = document.createElement("div");
			title.classList.add("codePlaneTitle");
			title.appendChild(document.createTextNode(code.name));
			title.appendChild(copyButton);
			const pre = document.createElement("pre");
			pre.textContent = code.code;
			const wrap = document.createElement("div");
			wrap.classList.add("codePlane");
			wrap.appendChild(title);
			wrap.appendChild(pre);
			if (code.numLines > 1e3 && !keepShowLongCode) {
				const showCodeLink$1 = document.createElement("a");
				showCodeLink$1.href = "#";
				showCodeLink$1.textContent = `表示する (${code.numLines} 行)`;
				const hiddenBox = document.createElement("div");
				hiddenBox.classList.add("codeHiddenBox");
				hiddenBox.style.textAlign = "center";
				hiddenBox.innerHTML = `コードが非常に長いため非表示になっています。<br>`;
				hiddenBox.appendChild(showCodeLink$1);
				hide(pre);
				wrap.appendChild(hiddenBox);
				showCodeLink$1.addEventListener("click", (e) => {
					e.preventDefault();
					keepShowLongCode = true;
					show(pre);
					hide(hiddenBox);
				});
			}
			codePlaneContainer.appendChild(wrap);
			copyButton.addEventListener("click", () => {
				if (!pre.textContent) return;
				navigator.clipboard.writeText(pre.textContent);
			});
		}
		show(codePlaneContainer);
		hide(codeErrorBox);
	} catch (error) {
		if (error instanceof Error) codeErrorBox.textContent = `${error.stack}`;
		else codeErrorBox.textContent = String(error);
		hide(codePlaneContainer);
		show(codeErrorBox);
	}
	swDetail.lap("UI Update");
}
function onRelayout() {
	{
		const rect = trimCanvas.getBoundingClientRect();
		trimCanvasWidth = rect.width;
		trimCanvasHeight = rect.height;
	}
	{
		const canvasParent = previewCanvas.parentElement;
		const rect = canvasParent.getBoundingClientRect();
		previewCanvasWidth = rect.width;
		previewCanvasHeight = rect.height;
	}
	requestUpdateTrimCanvas();
}
function main() {
	document.addEventListener("DOMContentLoaded", async (e) => {
		await onLoad();
	});
	window.addEventListener("resize", (e) => onRelayout());
}

//#endregion
//#region src/index.ts
main();

//#endregion
export {  };