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
	name;
	code;
	numLines;
};
var Args$1 = class {
	src;
	blobs;
	codeUnit;
	indent;
	arrayCols;
	codes = [];
};
function generate(args) {
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
	let codeBuff = [];
	if (args.codeUnit >= CodeUnit.FILE) {
		codeBuff.push(`#pragma once\n`);
		codeBuff.push(`\n`);
		codeBuff.push(`#include <stdint.h>\n`);
		codeBuff.push(`\n`);
	}
	args.src.format;
	for (let blob of args.blobs) {
		const array = blob.array;
		if (args.codeUnit >= CodeUnit.ARRAY_DEF) {
			const lines = blob.comment.trimEnd().split("\n");
			for (let line of lines) codeBuff.push(`// ${line}\n`);
			codeBuff.push(`const uint8_t ${blob.name}[] = {\n`);
		}
		let hexTable = [];
		for (let i = 0; i < 256; i++) hexTable.push("0x" + i.toString(16).padStart(2, "0") + ",");
		for (let i = 0; i < array.length; i++) {
			if (i % args.arrayCols == 0) codeBuff.push(indent);
			codeBuff.push(hexTable[array[i]]);
			if ((i + 1) % args.arrayCols == 0 || i + 1 == array.length) codeBuff.push("\n");
			else codeBuff.push(" ");
		}
		if (args.codeUnit >= CodeUnit.ARRAY_DEF) codeBuff.push("};\n");
	}
	const code = new Code();
	code.name = "Image Data";
	code.code = codeBuff.join("");
	let numLines = 0;
	for (let s of codeBuff) if (s.endsWith("\n")) numLines++;
	code.numLines = numLines;
	args.codes.push(code);
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
//#region src/Encoder.ts
let PackUnit = /* @__PURE__ */ function(PackUnit$1) {
	PackUnit$1[PackUnit$1["UNPACKED"] = 0] = "UNPACKED";
	PackUnit$1[PackUnit$1["PIXEL"] = 1] = "PIXEL";
	PackUnit$1[PackUnit$1["ALIGNMENT"] = 2] = "ALIGNMENT";
	return PackUnit$1;
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
	srcChannel;
	pos;
	width;
};
var PlaneOutput = class {
	fields = [];
	pixelStride;
	pixelsPerFrag;
	bytesPerFrag;
	alignRequired;
	blob;
};
var PlaneArgs = class {
	farPixelFirst;
	bigEndian;
	packUnit;
	vertPack;
	alignBoundary;
	alignLeft;
	vertAddr;
	output = new PlaneOutput();
};
var ImageArgs = class {
	src;
	alphaFirst;
	colorDescending;
	planes = [];
};
function encode(args) {
	const fmt = args.src.format;
	let alphaField = null;
	if (fmt.hasAlpha) {
		alphaField = new FieldLayout();
		alphaField.srcChannel = fmt.numColorChannels;
		alphaField.width = fmt.alphaBits;
	}
	if (alphaField && args.alphaFirst) args.planes[0].output.fields.push(alphaField);
	for (let ch = 0; ch < fmt.numColorChannels; ch++) {
		const field = new FieldLayout();
		if (args.colorDescending) field.srcChannel = fmt.numColorChannels - 1 - ch;
		else field.srcChannel = ch;
		field.width = fmt.colorBits[field.srcChannel];
		args.planes[0].output.fields.push(field);
	}
	if (alphaField && !args.alphaFirst) args.planes[0].output.fields.push(alphaField);
	for (let plane of args.planes) {
		const out = plane.output;
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
		const fragWidth = plane.vertPack ? 1 : out.pixelsPerFrag;
		const fragHeight = plane.vertPack ? out.pixelsPerFrag : 1;
		const fragSize = fragWidth * fragHeight;
		const cols = Math.ceil(src.width / fragWidth);
		const rows = Math.ceil(src.height / fragHeight);
		const numFrags = cols * rows;
		out.blob = new ArrayBlob("imageArray", numFrags * out.bytesPerFrag);
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
					for (const field of out.fields) {
						const chData = src.data[field.srcChannel][y * src.width + x];
						const shift = pixOffset + field.pos;
						fragData |= chData << shift;
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
			buff.push(`${args.src.width}x${args.src.height}px, ${fmt.toString()}\n`);
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
	PixelFormat$1[PixelFormat$1["RGB555"] = 4] = "RGB555";
	PixelFormat$1[PixelFormat$1["RGB444"] = 5] = "RGB444";
	PixelFormat$1[PixelFormat$1["RGB332"] = 6] = "RGB332";
	PixelFormat$1[PixelFormat$1["RGB111"] = 7] = "RGB111";
	PixelFormat$1[PixelFormat$1["GRAY4"] = 8] = "GRAY4";
	PixelFormat$1[PixelFormat$1["GRAY2"] = 9] = "GRAY2";
	PixelFormat$1[PixelFormat$1["BW"] = 10] = "BW";
	return PixelFormat$1;
}({});
var PixelFormatInfo = class {
	colorSpace;
	colorBits;
	alphaBits = 0;
	constructor(fmt) {
		switch (fmt) {
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
			case PixelFormat.RGB555:
				this.colorSpace = ColorSpace.RGB;
				this.colorBits = [
					5,
					5,
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
			default: throw new Error("Unknown image format");
		}
	}
	toString() {
		switch (this.colorSpace) {
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
var NormalizedImage = class {
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
//#region src/Palettes.ts
let RoundMethod = /* @__PURE__ */ function(RoundMethod$1) {
	RoundMethod$1[RoundMethod$1["NEAREST"] = 0] = "NEAREST";
	RoundMethod$1[RoundMethod$1["EQUAL_DIVISION"] = 1] = "EQUAL_DIVISION";
	return RoundMethod$1;
}({});
let DitherMethod = /* @__PURE__ */ function(DitherMethod$1) {
	DitherMethod$1[DitherMethod$1["NONE"] = 0] = "NONE";
	DitherMethod$1[DitherMethod$1["DIFFUSION"] = 1] = "DIFFUSION";
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
};

//#endregion
//#region src/Preproc.ts
let AlphaProc = /* @__PURE__ */ function(AlphaProc$1) {
	AlphaProc$1[AlphaProc$1["KEEP"] = 0] = "KEEP";
	AlphaProc$1[AlphaProc$1["FILL"] = 1] = "FILL";
	AlphaProc$1[AlphaProc$1["BINARIZE"] = 2] = "BINARIZE";
	AlphaProc$1[AlphaProc$1["SET_KEY_COLOR"] = 3] = "SET_KEY_COLOR";
	return AlphaProc$1;
}({});
let ScalingMethod = /* @__PURE__ */ function(ScalingMethod$1) {
	ScalingMethod$1[ScalingMethod$1["ZOOM"] = 0] = "ZOOM";
	ScalingMethod$1[ScalingMethod$1["FIT"] = 1] = "FIT";
	ScalingMethod$1[ScalingMethod$1["STRETCH"] = 2] = "STRETCH";
	return ScalingMethod$1;
}({});
var Args = class {
	srcData;
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
	outImage;
	colorSpace;
	scalingMethod = ScalingMethod.ZOOM;
	alphaProc = AlphaProc.KEEP;
	alphaThresh = 128;
	keyColor = 0;
	keyTolerance = 0;
	backColor = 0;
	hue = 0;
	saturation = 1;
	lightness = 1;
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
	invert;
};
function process(args) {
	let src = args.srcData;
	{
		const { data, rect } = trim(src, args.srcSize, args.trimRect, args.outSize, args.scalingMethod);
		src = data;
		args.trimRect = rect;
	}
	if (args.alphaProc == AlphaProc.SET_KEY_COLOR) applyKeyColor(src, args.srcSize, args.keyColor, args.keyTolerance);
	const trimSize = {
		width: args.trimRect.width,
		height: args.trimRect.height
	};
	const resized = resize(src, trimSize, args.outSize);
	const img = normalize(resized, args.outSize, args.colorSpace);
	if (args.alphaProc == AlphaProc.BINARIZE) binarizeAlpha(img, args.alphaThresh / 255);
	else if (args.alphaProc == AlphaProc.FILL) fillBackground(img, args.backColor);
	applyHSL(img, args.hue, args.saturation, args.lightness);
	args.gamma = correctGamma(img, args.gamma);
	args.brightness = offsetBrightness(img, args.brightness);
	args.contrast = correctContrast(img, args.contrast);
	if (args.invert) for (let i = 0; i < img.color.length; i++) img.color[i] = 1 - img.color[i];
	args.outImage = img;
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
				destW = Math.max(1, Math.round(destH * outW / outH));
				destX += Math.round((trimRect.width - destW) / 2);
			} else if (outAspect < trimAspect) {
				destH = Math.max(1, Math.round(destW * outH / outW));
				destY += Math.round((trimRect.height - destH) / 2);
			}
		}
	}
	const out = new Uint8Array(trimW * trimH * 4);
	const srcStride = srcW * 4;
	const destStride = trimW * 4;
	for (let i = 0; i < destH; i++) {
		const srcY = trimY + i;
		if (srcY < 0 || srcH <= srcY) continue;
		let iSrc = srcY * srcStride + trimX * 4;
		let iDest = (destY + i) * destStride + destX * 4;
		for (let j = 0; j < destW; j++) {
			const srcX = trimX + j;
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
	const keyR = key & 255;
	const keyG = key >> 8 & 255;
	const keyB = key >> 16 & 255;
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
function resize(src, srcSize, outSize) {
	let srcW = srcSize.width;
	let srcH = srcSize.height;
	const outW = outSize.width;
	const outH = outSize.height;
	const srcStride = srcW * 4;
	if (srcW == outW && srcH == outH) return src;
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
function applyHSL(img, h, s, l) {
	const numPixels = img.width * img.height;
	switch (img.colorSpace) {
		case ColorSpace.GRAYSCALE:
			if (l == 1) return;
			for (let i = 0; i < numPixels; i++) img.color[i] = clip(0, 1, img.color[i] * l);
			break;
		case ColorSpace.RGB:
			{
				if (h == 0 && s == 1 && l == 1) return;
				const hsl = new Float32Array(3);
				for (let i = 0; i < numPixels; i++) {
					rgbToHsl(img.color, i * 3, hsl, 0);
					const hMod = hsl[0] + h;
					hsl[0] = hMod - Math.floor(hMod);
					hsl[1] = clip(0, 1, hsl[1] * s);
					hsl[2] = clip(0, 1, hsl[2] * l);
					hslToRgb(hsl, 0, img.color, i * 3);
				}
			}
			break;
		default: throw new Error("Invalid color space");
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
	const backR = (color & 255) / 255;
	const backG = (color >> 8 & 255) / 255;
	const backB = (color >> 16 & 255) / 255;
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
function grayscale(r, g, b) {
	return .299 * r + .587 * g + .114 * b;
}
function grayscaleArrayF32(data, offset) {
	return grayscale(data[offset], data[offset + 1], data[offset + 2]);
}
function grayscaleArrayU8(data, offset) {
	return grayscale(data[offset], data[offset + 1], data[offset + 2]);
}
function rgbToHsl(src, srcOffset, dest, destOffset) {
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
}
function hslToRgb(src, srcOffset, dest, destOffset) {
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
	dest[destOffset] = r;
	dest[destOffset + 1] = g;
	dest[destOffset + 2] = b;
}

//#endregion
//#region src/Reducer.ts
var Arguments = class {
	src;
	colorDitherMethod = DitherMethod.NONE;
	alphaDitherMethod = DitherMethod.NONE;
	palette;
	format;
	output;
};
function reduce(args) {
	const norm = args.src;
	const outW = norm.width;
	const outH = norm.height;
	outW * outH;
	const fmt = args.format;
	fmt.numTotalChannels;
	const numColCh = fmt.numColorChannels;
	const palette = args.palette;
	args.output = new ReducedImage(outW, outH, fmt, palette);
	const outData = args.output.data;
	const alpErrDiffuse = args.alphaDitherMethod == DitherMethod.DIFFUSION;
	const colErrDiffuse = args.colorDitherMethod == DitherMethod.DIFFUSION;
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
		if (alpErrDiffuse && fmt.hasAlpha) diffuseError(norm, true, alpErr, x, y, fwd);
		if (colErrDiffuse && !transparent) diffuseError(norm, false, colErr, x, y, fwd);
	}
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
//#region src/main.ts
var TrimState = /* @__PURE__ */ function(TrimState$1) {
	TrimState$1[TrimState$1["IDLE"] = 0] = "IDLE";
	TrimState$1[TrimState$1["DRAG_TOP"] = 1] = "DRAG_TOP";
	TrimState$1[TrimState$1["DRAG_RIGHT"] = 2] = "DRAG_RIGHT";
	TrimState$1[TrimState$1["DRAG_BOTTOM"] = 3] = "DRAG_BOTTOM";
	TrimState$1[TrimState$1["DRAG_LEFT"] = 4] = "DRAG_LEFT";
	return TrimState$1;
}(TrimState || {});
var ChannelOrder = /* @__PURE__ */ function(ChannelOrder$1) {
	ChannelOrder$1[ChannelOrder$1["RGBA"] = 0] = "RGBA";
	ChannelOrder$1[ChannelOrder$1["BGRA"] = 1] = "BGRA";
	ChannelOrder$1[ChannelOrder$1["ARGB"] = 2] = "ARGB";
	ChannelOrder$1[ChannelOrder$1["ABGR"] = 3] = "ABGR";
	return ChannelOrder$1;
}(ChannelOrder || {});
var StopWatch = class {
	lastTime;
	constructor(report) {
		this.report = report;
		this.lastTime = performance.now();
		this.report = report;
	}
	lap(label) {
		const now = performance.now();
		if (this.report) console.log(`${(now - this.lastTime).toFixed(1)} ms: ${label}`);
		this.lastTime = now;
	}
};
var Preset = class {
	channelOrder = ChannelOrder.ARGB;
	farPixelFirst = false;
	bigEndian = false;
	packUnit = PackUnit.PIXEL;
	vertPack = false;
	alignBoundary = AlignBoundary.BYTE_1;
	alignLeft = false;
	vertAddr = false;
	constructor(label, description, format, ops = {}) {
		this.label = label;
		this.description = description;
		this.format = format;
		for (const k of Object.keys(ops)) {
			if (!(k in this)) throw new Error(`Unknown property '${k}'`);
			this[k] = ops[k];
		}
	}
};
let presets = {
	argb8888_le: new Preset("ARGB8888-LE", "透明度付きフルカラー。\nLovyanGFX の pushAlphaImage 関数向け。", PixelFormat.RGBA8888, { channelOrder: ChannelOrder.ARGB }),
	rgb888_be: new Preset("RGB888-BE", "フルカラー。24bit 液晶用。", PixelFormat.RGB888, {
		channelOrder: ChannelOrder.ARGB,
		bigEndian: true
	}),
	rgb666_be_ra: new Preset("RGB666-BE-RA", "各バイトにチャネルを下位詰めで配置した RGB666。LovyanGFX 用。", PixelFormat.RGB666, {
		channelOrder: ChannelOrder.ARGB,
		packUnit: PackUnit.UNPACKED,
		bigEndian: true
	}),
	rgb666_be_la: new Preset("RGB666-BE-LA", "各バイトにチャネルを上位詰めで配置した RGB666。低レベル API の 18bit モード用。", PixelFormat.RGB666, {
		channelOrder: ChannelOrder.ARGB,
		packUnit: PackUnit.UNPACKED,
		alignLeft: true,
		bigEndian: true
	}),
	rgb565_be: new Preset("RGB565-BE", "ハイカラー。\n各種 GFX ライブラリでの使用を含め、\n組み込み用途で一般的な形式。", PixelFormat.RGB565, { bigEndian: true }),
	rgb444_be: new Preset("RGB444-BE", "ST7789 の 12bit モード用の形式。", PixelFormat.RGB444, {
		packUnit: PackUnit.ALIGNMENT,
		farPixelFirst: true,
		bigEndian: true,
		alignBoundary: AlignBoundary.BYTE_3
	}),
	rgb332: new Preset("RGB332", "各種 GFX ライブラリ用。", PixelFormat.RGB332),
	rgb111_ra: new Preset("RGB111", "ILI9488 の 8 色モード用。", PixelFormat.RGB111, {
		packUnit: PackUnit.ALIGNMENT,
		farPixelFirst: true
	}),
	bw_hscan: new Preset("白黒 横スキャン", "各種 GFX ライブラリ用。", PixelFormat.BW, {
		packUnit: PackUnit.ALIGNMENT,
		farPixelFirst: true
	}),
	bw_vpack: new Preset("白黒 縦パッキング", "SPI/I2C ドライバを使用して\nSSD1306/1309 等の白黒ディスプレイに直接転送するための形式。", PixelFormat.BW, {
		packUnit: PackUnit.ALIGNMENT,
		vertPack: true
	})
};
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
	for (const { value, label } of items) {
		const option = document.createElement("option");
		option.value = value.toString();
		option.textContent = label;
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
function makeSampleImageButton(url) {
	const button = document.createElement("button");
	button.classList.add("sampleImageButton");
	button.style.backgroundImage = `url(${url})`;
	button.addEventListener("click", () => {
		loadFromString(url);
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
		if (trimViewToNextState(e.offsetX, e.offsetY) != TrimState.IDLE) {
			const y = e.offsetY;
			let val;
			if (textBox.value.trim()) val = parseFloat(textBox.value.trim());
			else val = parseFloat(textBox.placeholder.replaceAll(/[\(\)]/g, "").trim());
			val = Math.round(val / step) * step;
			upDownButton.dataset.dragStartY = y.toString();
			upDownButton.dataset.dragStartVal = val.toString();
			upDownButton.style.cursor = "grabbing";
			upDownButton.setPointerCapture(e.pointerId);
		}
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
const dropTarget = document.createElement("div");
const hiddenFileBox = document.createElement("input");
const pasteTarget = document.createElement("input");
const origCanvas = document.createElement("canvas");
const resetTrimButton = makeButton("範囲をリセット");
const alphaProcBox = makeSelectBox([
	{
		value: AlphaProc.KEEP,
		label: "変更しない"
	},
	{
		value: AlphaProc.FILL,
		label: "背景色を指定"
	},
	{
		value: AlphaProc.BINARIZE,
		label: "二値化"
	},
	{
		value: AlphaProc.SET_KEY_COLOR,
		label: "抜き色指定"
	}
], AlphaProc.KEEP);
const backColorBox = makeTextBox("#00F");
const keyColorBox = makeTextBox("#00F");
const keyToleranceBox = makeTextBox("0", "(auto)", 5);
const alphaThreshBox = makeTextBox("128", "(auto)", 5);
const trimCanvas = document.createElement("canvas");
const hueBox = makeTextBox("0", "(0)", 4);
const saturationBox = makeTextBox("100", "(100)", 4);
const lightnessBox = makeTextBox("100", "(100)", 4);
const gammaBox = makeTextBox("1", "(auto)", 4);
const brightnessBox = makeTextBox("0", "(auto)", 5);
const contrastBox = makeTextBox("100", "(auto)", 5);
const invertBox = makeCheckBox("階調反転");
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
		value: PixelFormat.RGB555,
		label: "RGB555"
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
	}
], PixelFormat.RGB565);
const widthBox = makeTextBox("", "(auto)", 4);
const heightBox = makeTextBox("", "(auto)", 4);
const scalingMethodBox = makeSelectBox([
	{
		value: ScalingMethod.ZOOM,
		label: "ズーム"
	},
	{
		value: ScalingMethod.FIT,
		label: "フィット"
	},
	{
		value: ScalingMethod.STRETCH,
		label: "ストレッチ"
	}
], ScalingMethod.ZOOM);
const colorDitherBox = makeSelectBox([{
	value: DitherMethod.NONE,
	label: "なし"
}, {
	value: DitherMethod.DIFFUSION,
	label: "誤差拡散"
}], DitherMethod.NONE);
const alphaDitherBox = makeSelectBox([{
	value: DitherMethod.NONE,
	label: "なし"
}, {
	value: DitherMethod.DIFFUSION,
	label: "誤差拡散"
}], DitherMethod.NONE);
const roundMethodBox = makeSelectBox([{
	value: RoundMethod.NEAREST,
	label: "最も近い輝度"
}, {
	value: RoundMethod.EQUAL_DIVISION,
	label: "均等割り"
}], RoundMethod.NEAREST);
const previewCanvas = document.createElement("canvas");
const quantizeErrorBox = document.createElement("span");
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
const structCanvas = document.createElement("canvas");
const structErrorBox = makeParagraph();
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
const codeBox = document.createElement("pre");
const showCodeLink = document.createElement("a");
showCodeLink.href = "#";
showCodeLink.textContent = "表示する";
const codeHiddenBox = makeParagraph([
	"生成されたコードが非常に長いので非表示になっています",
	document.createElement("br"),
	showCodeLink
]);
codeHiddenBox.classList.add("codeHiddenBox");
codeHiddenBox.style.textAlign = "center";
showCodeLink.addEventListener("click", (e) => {
	e.preventDefault();
	show(codeBox);
	hide(codeHiddenBox);
});
const codeErrorBox = makeParagraph();
codeErrorBox.style.textAlign = "center";
codeErrorBox.style.color = "red";
const copyButton = makeButton("コードをコピー");
let container;
let updateTrimCanvasTimeoutId = -1;
let quantizeTimeoutId = -1;
let generateCodeTimeoutId = -1;
let worldX0 = 0, worldY0 = 0, zoom = 1;
let trimL = 0, trimT = 0, trimR = 1, trimB = 1;
let trimUiState = TrimState.IDLE;
let reducedImage = null;
let trimCanvasWidth = 800;
let trimCanvasHeight = 400;
let previewCanvasWidth = 800;
let previewCanvasHeight = 400;
async function onLoad() {
	container = document.querySelector("#arrayfyContainer");
	{
		dropTarget.classList.add("dropTarget");
		dropTarget.innerHTML = "ドロップして読み込む";
		document.body.appendChild(dropTarget);
		hide(dropTarget);
		hiddenFileBox.type = "file";
		hiddenFileBox.accept = "image/*";
		hiddenFileBox.style.display = "none";
		const fileBrowseButton = makeButton("ファイルを選択");
		fileBrowseButton.addEventListener("click", () => {
			hiddenFileBox.click();
		});
		pasteTarget.type = "text";
		pasteTarget.style.textAlign = "center";
		pasteTarget.style.width = "8em";
		pasteTarget.placeholder = "ここに貼り付け";
		container.appendChild(makeSection(makeFloatList([
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
		], false)));
	}
	{
		const pPresetButtons = makeParagraph();
		for (const id in presets) pPresetButtons.appendChild(makePresetButton(id, presets[id]));
		const pNote = makeParagraph([
			"白黒ディスプレイについては、各種 GFX ライブラリを使用して描画する場合は横スキャンを選択してください。",
			"I2C や SPI ドライバを用いて直接転送する場合はディスプレイの仕様に従ってください。",
			"SSD1306/1309 など一部のディスプレイでは縦パッキングされたデータが必要です。"
		]);
		pNote.style.fontSize = "smaller";
		container.appendChild(makeSection([
			makeFloatList([makeHeader("プリセット"), makeNowrap("選んでください: ")]),
			pPresetButtons,
			pNote
		]));
	}
	{
		const showProButton = document.createElement("a");
		const hideProButton = document.createElement("a");
		showProButton.textContent = "上級者向け設定を表示する";
		showProButton.href = "#";
		hideProButton.textContent = "上級者向け設定を隠す";
		hideProButton.href = "#";
		showProButton.addEventListener("click", (e) => {
			e.preventDefault();
			showPro();
			history.replaceState(null, "", "#detail");
		});
		hideProButton.addEventListener("click", (e) => {
			e.preventDefault();
			hidePro();
			history.replaceState(null, "", "#");
		});
		const section = makeSection([basic(showProButton), pro(hideProButton)]);
		section.style.textAlign = "center";
		section.style.padding = "5px 0";
		container.appendChild(section);
	}
	{
		trimCanvas.style.width = "100%";
		trimCanvas.style.height = "400px";
		trimCanvas.style.boxSizing = "border-box";
		trimCanvas.style.border = "solid 1px #444";
		trimCanvas.style.backgroundImage = "url(./img/checker.png)";
		const pCanvas = makeParagraph(trimCanvas);
		pCanvas.style.textAlign = "center";
		container.appendChild(pro(makeSection([makeFloatList([makeHeader("トリミング"), tip(resetTrimButton, "トリミングしていない状態に戻します。")]), pCanvas])));
	}
	{
		const section = pro(makeSection(makeFloatList([
			makeHeader("透過色"),
			tip(["透過色の扱い: ", alphaProcBox], "入力画像に対する透過色の取り扱いを指定します。"),
			tip(["背景色: ", backColorBox], "画像の透明部分をこの色で塗り潰して不透明化します。"),
			tip(["キーカラー: ", keyColorBox], "透明にしたい色を指定します。"),
			tip(["許容誤差: ", upDown(keyToleranceBox, 0, 255, 1)], "キーカラーからの許容誤差を指定します。"),
			tip(["閾値: ", upDown(alphaThreshBox, 0, 255, 1)], "透明にするかどうかの閾値を指定します。")
		])));
		container.appendChild(section);
		alphaProcBox.addEventListener("change", onAlphaProcChanged);
		onAlphaProcChanged();
		section.querySelectorAll("input, select").forEach((el) => {
			el.addEventListener("change", () => {
				requestUpdateTrimCanvas();
				requestQuantize();
			});
			el.addEventListener("input", () => {
				requestUpdateTrimCanvas();
				requestQuantize();
			});
		});
	}
	{
		const section = pro(makeSection(makeFloatList([
			makeHeader("色調補正"),
			tip([
				"色相: ",
				upDown(hueBox, -360, 360, 5),
				"°"
			], "デフォルトは 0° です。"),
			tip([
				"彩度: ",
				upDown(saturationBox, 0, 200, 1),
				"%"
			], "デフォルトは 100% です。"),
			tip([
				"明度: ",
				upDown(lightnessBox, 0, 200, 1),
				"%"
			], "デフォルトは 100% です。"),
			tip(["ガンマ: ", upDown(gammaBox, .1, 2, .1)], "デフォルトは 1.0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。"),
			tip(["輝度: ", upDown(brightnessBox, -255, 255, 8)], "デフォルトは 0 です。\n空欄にすると、輝度 50% を中心にバランスが取れるように自動調整します。"),
			tip([
				"コントラスト: ",
				upDown(contrastBox, 0, 200, 1),
				"%"
			], "デフォルトは 100% です。\n空欄にすると、階調が失われない範囲でダイナミックレンジが最大となるように自動調整します。"),
			tip([invertBox.parentElement], "各チャネルの値を大小反転します。")
		])));
		container.appendChild(section);
		section.querySelectorAll("input, select").forEach((el) => {
			el.addEventListener("change", () => {
				requestQuantize();
			});
			el.addEventListener("input", () => {
				requestQuantize();
			});
		});
	}
	{
		const section = makeSection(makeFloatList([
			makeHeader("出力サイズ"),
			tip([
				upDown(widthBox, 1, 1024, 1),
				" x ",
				upDown(heightBox, 1, 1024, 1),
				" px"
			], "片方を空欄にすると他方はアスペクト比に基づいて自動的に決定されます。"),
			tip(["拡縮方法: ", scalingMethodBox], "トリミングサイズと出力サイズが異なる場合の拡縮方法を指定します。")
		]));
		container.appendChild(section);
		section.querySelectorAll("input, select").forEach((el) => {
			el.addEventListener("change", () => {
				requestQuantize();
			});
			el.addEventListener("input", () => {
				requestQuantize();
			});
		});
	}
	{
		previewCanvas.style.backgroundImage = "url(./img/checker.png)";
		quantizeErrorBox.style.color = "red";
		hide(previewCanvas);
		hide(quantizeErrorBox);
		const pCanvas = makeParagraph([previewCanvas, quantizeErrorBox]);
		pCanvas.style.height = "400px";
		pCanvas.style.background = "#444";
		pCanvas.style.border = "solid 1px #444";
		pCanvas.style.textAlign = "center";
		container.appendChild(pCanvas);
		const section = makeSection([makeFloatList([
			makeHeader("減色"),
			pro(tip(["フォーマット: ", pixelFormatBox], "ピクセルフォーマットを指定します。")),
			pro(tip(["丸め方法: ", roundMethodBox], "パレットから色を選択する際の戦略を指定します。\nディザリングを行う場合はあまり関係ありません。")),
			tip(["ディザリング: ", colorDitherBox], "あえてノイズを加えることでできるだけ元画像の色を再現します。"),
			pro(tip(["透明度のディザ: ", alphaDitherBox], "あえてノイズを加えることでできるだけ元画像の透明度を再現します。"))
		]), pCanvas]);
		container.appendChild(section);
		section.querySelectorAll("input, select").forEach((el) => {
			el.addEventListener("change", () => {
				requestQuantize();
			});
			el.addEventListener("input", () => {
				requestQuantize();
			});
		});
	}
	{
		structCanvas.style.maxWidth = "100%";
		structErrorBox.style.textAlign = "center";
		structErrorBox.style.color = "red";
		hide(structErrorBox);
		const pCanvas = makeParagraph([structCanvas, structErrorBox]);
		pCanvas.style.textAlign = "center";
		const section = makeSection([makeFloatList([
			makeHeader("エンコード"),
			basic(makeSpan("このフォーマットで生成されます:")),
			pro(tip(["パッキング単位: ", packUnitBox], "パッキングの単位を指定します。")),
			pro(tip([vertPackBox.parentElement], "複数ピクセルをパッキングする場合に、縦方向にパッキングします。\nSSD1306/1309 などの一部の白黒ディスプレイに\n直接転送可能なデータを生成する場合はチェックします。")),
			pro(tip([vertAddrBox.parentElement], "アドレスを縦方向にインクリメントする場合にチェックします。")),
			pro(tip(["チャネル順: ", channelOrderBox], "RGB のチャネルを並べる順序を指定します。")),
			pro(tip(["ピクセル順: ", farPixelFirstBox], "バイト内のピクセルの順序を指定します。")),
			pro(tip(["アライメント境界: ", alignBoundaryBox], "アライメントの境界を指定します。")),
			pro(tip([leftAlignBox.parentElement], "フィールドをアライメント境界内で左詰めします。")),
			pro(tip([bigEndianBox.parentElement], "ピクセル内のバイトの順序を指定します。"))
		]), pCanvas]);
		container.appendChild(section);
		section.querySelectorAll("input, select").forEach((el) => {
			el.addEventListener("change", () => {
				requestGenerateCode();
			});
			el.addEventListener("input", () => {
				requestGenerateCode();
			});
		});
	}
	{
		hide(codeHiddenBox);
		hide(codeErrorBox);
		const section = makeSection([
			makeFloatList([
				makeHeader("コード生成"),
				tip(["生成範囲: ", codeUnitBox], "生成するコードの範囲を指定します。"),
				tip(["列数: ", codeColsBox], "1 行に詰め込む要素数を指定します。"),
				tip(["インデント: ", indentBox], "インデントの形式とサイズを指定します。"),
				copyButton
			]),
			codeBox,
			codeHiddenBox,
			codeErrorBox
		]);
		container.appendChild(section);
		const buttonParent = parentLiOf(copyButton);
		buttonParent.style.float = "right";
		buttonParent.style.marginRight = "0";
		buttonParent.style.paddingRight = "0";
		buttonParent.style.borderRight = "none";
		section.querySelectorAll("input, select").forEach((el) => {
			el.addEventListener("change", () => {
				requestGenerateCode();
			});
			el.addEventListener("input", () => {
				requestGenerateCode();
			});
		});
	}
	hiddenFileBox.addEventListener("change", async (e) => {
		const input = e.target;
		if (input.files && input.files[0]) await loadFromFile(input.files[0]);
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
			await loadFromFile(item.getAsFile());
			break;
		}
	});
	pasteTarget.addEventListener("paste", async (e) => {
		if (!e.clipboardData) return;
		const items = e.clipboardData.items;
		for (const item of items) if (item.kind === "file") {
			e.preventDefault();
			e.stopPropagation();
			await loadFromFile(item.getAsFile());
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
		requestUpdateTrimCanvas();
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
	copyButton.addEventListener("click", () => {
		if (!codeBox.textContent) return;
		navigator.clipboard.writeText(codeBox.textContent);
	});
	if (window.location.hash === "#detail") showPro();
	else hidePro();
	await loadFromString("./img/sample/gradient.png");
	onRelayout();
}
function onAlphaProcChanged() {
	hide(parentLiOf(backColorBox));
	hide(parentLiOf(keyColorBox));
	hide(parentLiOf(keyToleranceBox));
	hide(parentLiOf(alphaThreshBox));
	const alphaProc = parseInt(alphaProcBox.value);
	switch (alphaProc) {
		case AlphaProc.FILL:
			show(parentLiOf(backColorBox));
			break;
		case AlphaProc.SET_KEY_COLOR:
			show(parentLiOf(keyColorBox));
			show(parentLiOf(keyToleranceBox));
			break;
		case AlphaProc.BINARIZE:
			show(parentLiOf(alphaThreshBox));
			break;
	}
}
function showPro() {
	document.querySelectorAll(".professional").forEach((el) => {
		show(el);
		onRelayout();
	});
	document.querySelectorAll(".basic").forEach((el) => {
		hide(el);
		onRelayout();
	});
	updateTrimCanvas();
}
function hidePro() {
	document.querySelectorAll(".professional").forEach((el) => {
		hide(el);
	});
	document.querySelectorAll(".basic").forEach((el) => {
		show(el);
	});
}
async function loadFromFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = async (e) => {
			if (e.target && typeof e.target.result === "string") await loadFromString(e.target.result);
			else throw new Error("Invalid image data");
			resolve();
		};
		reader.onerror = (e) => {
			reject(/* @__PURE__ */ new Error("Failed to read file"));
		};
		reader.readAsDataURL(file);
	});
}
async function loadFromString(s) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			origCanvas.width = img.width;
			origCanvas.height = img.height;
			const ctx = origCanvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) {
				reject(/* @__PURE__ */ new Error("Failed to get canvas context"));
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
			reject(/* @__PURE__ */ new Error("Failed to load image"));
		};
		img.src = s;
	});
}
function resetTrim() {
	trimL = 0;
	trimT = 0;
	trimR = origCanvas.width;
	trimB = origCanvas.height;
	requestUpdateTrimCanvas();
	requestQuantize();
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
	origCanvas.width;
	origCanvas.height;
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
		const lineWidth = 3;
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
	requestQuantize();
}
function requestQuantize() {
	if (quantizeTimeoutId >= 0) return;
	quantizeTimeoutId = setTimeout(() => {
		convert();
	}, 100);
}
function convert() {
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
		{
			let args = new Args();
			args.colorSpace = fmt.colorSpace;
			{
				const srcW = origCanvas.width;
				const srcH = origCanvas.height;
				args.srcSize.width = srcW;
				args.srcSize.height = srcH;
				const origCtx = origCanvas.getContext("2d", { willReadFrequently: true });
				if (!origCtx) throw new Error("Failed to get canvas context");
				const origImageData = origCtx.getImageData(0, 0, srcW, srcH);
				const origData = new Uint8Array(srcW * srcH * 4);
				for (let i = 0; i < origImageData.data.length; i++) origData[i] = origImageData.data[i];
				args.srcData = origData;
			}
			{
				const trimW = Math.round(trimR - trimL);
				const trimH = Math.round(trimB - trimT);
				outW = trimW;
				outH = trimH;
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
				if (outW < 1 || outH < 1) throw new Error("サイズは正の値で指定してください");
				if (outW * outH > 1024 * 1024) throw new Error("画像が大きすぎます");
				widthBox.placeholder = "(" + outW + ")";
				heightBox.placeholder = "(" + outH + ")";
				args.trimRect.x = trimL;
				args.trimRect.y = trimT;
				args.trimRect.width = trimW;
				args.trimRect.height = trimH;
				args.outSize.width = outW;
				args.outSize.height = outH;
				args.scalingMethod = parseInt(scalingMethodBox.value);
			}
			args.alphaProc = parseInt(alphaProcBox.value);
			args.alphaThresh = parseInt(alphaThreshBox.value);
			if (keyColorBox.value) args.keyColor = hexToRgb(keyColorBox.value);
			if (keyToleranceBox.value) args.keyTolerance = parseInt(keyToleranceBox.value);
			if (backColorBox.value) args.backColor = hexToRgb(backColorBox.value);
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
			setVisible(parentLiOf(hueBox), fmt.numColorChannels > 1);
			setVisible(parentLiOf(saturationBox), fmt.numColorChannels > 1);
			process(args);
			norm = args.outImage;
			gammaBox.placeholder = `(${args.gamma.value.toFixed(2)})`;
			brightnessBox.placeholder = `(${Math.round(args.brightness.value * 255)})`;
			contrastBox.placeholder = `(${Math.round(args.contrast.value * 100)})`;
		}
		{
			let maxChannelDepth = 0;
			let roundMethod = RoundMethod.NEAREST;
			for (const depth of fmt.colorBits) if (depth > maxChannelDepth) maxChannelDepth = depth;
			if (maxChannelDepth > 1) {
				show(parentLiOf(roundMethodBox));
				roundMethod = parseInt(roundMethodBox.value);
			} else hide(parentLiOf(roundMethodBox));
			const numPixels = outW * outH;
			fmt.numTotalChannels;
			fmt.numColorChannels;
			let minColBits = 999;
			for (const bits of fmt.colorBits) if (bits < minColBits) minColBits = bits;
			const colReduce = minColBits < 8;
			const alpReduce = fmt.hasAlpha && fmt.alphaBits < 8;
			const colDither = colReduce ? parseInt(colorDitherBox.value) : DitherMethod.NONE;
			const alpDither = alpReduce ? parseInt(alphaDitherBox.value) : DitherMethod.NONE;
			setVisible(parentLiOf(colorDitherBox), colReduce);
			setVisible(parentLiOf(alphaDitherBox), alpReduce);
			const palette = new FixedPalette(fmt.colorBits, roundMethod);
			const args = new Arguments();
			args.src = norm;
			args.format = fmt;
			args.palette = palette;
			args.colorDitherMethod = colDither;
			args.alphaDitherMethod = alpDither;
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
			hide(quantizeErrorBox);
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
			previewCanvas.style.imageRendering = "pixelated";
		}
		swDetail.lap("Fix Preview Size");
	} catch (error) {
		hide(previewCanvas);
		hide(codeBox);
		hide(codeHiddenBox);
		show(quantizeErrorBox);
		quantizeErrorBox.textContent = `${error.stack}`;
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
		codeBox.textContent = "";
		show(codeBox);
		hide(codeHiddenBox);
		hide(codeErrorBox);
		return;
	}
	let blobs = [];
	try {
		const args = new ImageArgs();
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
		const plane = new PlaneArgs();
		plane.farPixelFirst = parseInt(farPixelFirstBox.value) == 1;
		plane.bigEndian = bigEndianBox.checked;
		plane.packUnit = parseInt(packUnitBox.value);
		plane.vertPack = vertPackBox.checked;
		plane.alignBoundary = parseInt(alignBoundaryBox.value);
		plane.alignLeft = leftAlignBox.checked;
		plane.vertAddr = vertAddrBox.checked;
		args.planes.push(plane);
		encode(args);
		for (const plane$1 of args.planes) blobs.push(plane$1.output.blob);
		setVisible(parentLiOf(leftAlignBox), plane.output.alignRequired);
		setVisible(parentLiOf(channelOrderBox), plane.output.fields.length > 1);
		setVisible(parentLiOf(farPixelFirstBox), plane.output.pixelsPerFrag > 1);
		setVisible(parentLiOf(vertPackBox), plane.output.pixelsPerFrag > 1);
		setVisible(parentLiOf(bigEndianBox), plane.output.bytesPerFrag > 1);
		{
			const fmt = args.src.format;
			const out = plane.output;
			out.fields.length;
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
						const iByte = plane.bigEndian ? out.bytesPerFrag - 1 - ib : ib;
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
			let rgbColors;
			switch (fmt.colorSpace) {
				case ColorSpace.GRAYSCALE:
					rgbColors = ["rgba(255,255,255,0.8)"];
					break;
				case ColorSpace.RGB:
					rgbColors = [
						"rgba(255,128,128,0.8)",
						"rgba(128,255,128,0.8)",
						"rgba(128,160,255,0.8)",
						"rgba(192,128,255,0.8)"
					];
					break;
				default: throw new Error("Unknown color space");
			}
			for (let ip = 0; ip < out.pixelsPerFrag; ip++) {
				const iPix = plane.farPixelFirst ? out.pixelsPerFrag - 1 - ip : ip;
				for (const field of out.fields) {
					const r = pad + tableW - (ip * out.pixelStride + field.pos) * colW;
					const w = field.width * colW;
					const x = r - w;
					const y = pad + tableH - rowH;
					ctx.fillStyle = rgbColors[field.srcChannel];
					ctx.fillRect(x, y, w, rowH);
					ctx.strokeStyle = "#000";
					ctx.strokeRect(x, y, w, rowH);
					ctx.fillStyle = "#000";
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					const label = fmt.channelName(field.srcChannel) + (out.pixelsPerFrag > 1 ? iPix : "");
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
		structErrorBox.textContent = `${error.stack}`;
		codeBox.textContent = "";
		show(codeBox);
		hide(codeHiddenBox);
		hide(codeErrorBox);
		return;
	}
	try {
		const args = new Args$1();
		args.src = reducedImage;
		args.blobs = blobs;
		args.codeUnit = parseInt(codeUnitBox.value);
		args.indent = parseInt(indentBox.value);
		args.arrayCols = Math.max(1, parseInt(codeColsBox.value));
		generate(args);
		const code = args.codes[0];
		codeBox.textContent = code.code;
		if (code.numLines < 1e3) {
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
		codeBox.textContent = "";
		show(codeBox);
		hide(codeHiddenBox);
		hide(codeErrorBox);
	}
	swDetail.lap("UI Update");
}
function hexToRgb(hex) {
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