import {ArrayBlob} from './Blobs';
import {ReducedImage} from './Images';

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
  public name: string;
  public code: string;
  public numLines: number;
}

export class CodeGenArgs {
  public name: string;
  public src: ReducedImage;
  // public encodeArgs: ImageArgs;
  public blobs: ArrayBlob[];
  public codeUnit: CodeUnit;
  public indent: Indent;
  public arrayCols: number;
  public codes: Code[] = [];
}

export function generate(args: CodeGenArgs): void {
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


  let codeBuff: string[] = [];
  if (args.codeUnit >= CodeUnit.FILE) {
    codeBuff.push(`#pragma once\n`);
    codeBuff.push(`\n`);
    codeBuff.push(`#include <stdint.h>\n`);
    codeBuff.push(`\n`);
  }

  const fmt = args.src.format;
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
        codeBuff.push(`// ${line}\n`);
      }
      codeBuff.push(`const uint8_t ${arrayName}[] = {\n`);
    }

    let hexTable: string[] = [];
    for (let i = 0; i < 256; i++) {
      hexTable.push('0x' + i.toString(16).padStart(2, '0') + ',');
    }
    for (let i = 0; i < array.length; i++) {
      if (i % args.arrayCols == 0) codeBuff.push(indent);
      codeBuff.push(hexTable[array[i]]);
      if ((i + 1) % args.arrayCols == 0 || i + 1 == array.length) {
        codeBuff.push('\n');
      } else {
        codeBuff.push(' ');
      }
    }

    if (args.codeUnit >= CodeUnit.ARRAY_DEF) {
      codeBuff.push('};\n');
    }

    if (args.codeUnit < CodeUnit.FILE || iBlob + 1 >= args.blobs.length) {
      const code = new Code();

      if (args.codeUnit >= CodeUnit.FILE) {
        code.name = args.name + '.h';
      } else {
        code.name = args.name + '_' + blob.name + '.h';
      }
      code.code = codeBuff.join('');
      let numLines = 0;
      for (let s of codeBuff) {
        if (s.endsWith('\n')) numLines++;
      }
      code.numLines = numLines;
      args.codes.push(code);

      codeBuff = [];
    }
  }
}