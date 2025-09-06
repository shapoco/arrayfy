export class ArrayBlob {
  public array: Uint8Array;
  public comment: string = '';
  constructor(public name: string, public size: number) {
    this.size = size;
    this.array = new Uint8Array(size);
  }
}
