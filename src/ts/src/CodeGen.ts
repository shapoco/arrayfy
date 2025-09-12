import {ArrayBlob} from './Blobs';
import * as Debug from './Debug';
import {PixelFormat, PixelFormatInfo, ReducedImage} from './Images';

export const enum CodeUnit {
  // 小さい順にすること
  ELEMENTS,
  ARRAY_DEF,
  FILE,
}

export const enum Indent {
  TAB,
  SPACE_X2,
  SPACE_X4,
}

export class Code {
  public name: string = '';
  public code: string = '';
  public numLines: number = 0;
}

export class CodeGenArgs {
  public name: string = '';
  public src: ReducedImage|null = null;
  public blobs: ArrayBlob[] = [];
  public codeUnit: CodeUnit = CodeUnit.FILE;
  public indent: Indent = Indent.SPACE_X2;
  public arrayCols: number = 16;
  public codes: Code[] = [];
}

export class StringBuilder {
  buff: string[] = [];
  ptr: number = 0;

  constructor(public length: number = 0) {
    this.buff = Array<string>(length);
    this.clear();
  }

  public push(s: string): void {
    if (this.ptr >= this.length) {
      this.length = Math.floor(this.length * 1.5) + 10;
      const newBuff = Array<string>(this.length);
      for (let i = 0; i < this.ptr; i++) {
        newBuff[i] = this.buff[i];
      }
      this.buff = newBuff;
      console.warn('StringBuilder: buffer resized to ' + this.length);
    }
    this.buff[this.ptr++] = s;
  }

  public join(sep: string): string {
    return this.buff.join(sep);
  }

  public clear(): void {
    this.ptr = 0;
    for (let i = 0; i < this.length; i++) {
      this.buff[i] = '';
    }
  }

  public numLines(): number {
    let n = 0;
    for (let i = 0; i < this.ptr; i++) {
      if (this.buff[i].endsWith('\n')) n++;
    }
    return n;
  }
}

export function generate(args: CodeGenArgs): void {
  const sw = new Debug.StopWatch(false);

  // インデント決定
  let indent = '  ';
  switch (args.indent) {
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

  let hexTable: string[] = [];
  for (let i = 0; i < 256; i++) {
    hexTable.push(`0x${i.toString(16).padStart(2, '0')},`);
  }

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

    let arrayName: string;
    if (args.blobs.length <= 1) {
      arrayName = args.name;
    } else {
      arrayName = args.name + '_' + blob.name;
    }

    if (args.codeUnit >= CodeUnit.ARRAY_DEF) {
      const lines = blob.comment.trimEnd().split('\n');
      for (let line of lines) {
        buff.push(`// ${line}\n`);
      }
      buff.push(`const uint8_t ${arrayName}[] = {\n`);
    }

    for (let i = 0; i < array.length; i++) {
      if (i % args.arrayCols == 0) buff.push(indent);
      buff.push(hexTable[array[i]]);
      if ((i + 1) % args.arrayCols == 0 || i + 1 == array.length) {
        buff.push('\n');
      } else {
        buff.push(' ');
      }
    }

    if (args.codeUnit >= CodeUnit.ARRAY_DEF) {
      buff.push('};\n');
    }

    const lastBlob = (iBlob + 1 >= args.blobs.length);
    if (args.codeUnit < CodeUnit.FILE || lastBlob) {
      const code = new Code();

      if (args.codeUnit >= CodeUnit.FILE) {
        code.name = args.name + '.h';
      } else {
        code.name = args.name + '_' + blob.name + '.h';
      }
      code.code = buff.join('');
      code.numLines = buff.numLines();
      args.codes.push(code);

      if (!lastBlob) buff.clear();
    }
  }

  sw.lap('CodeGen.generate()');
}