export class XorShift32 {
  private x: number;
  private y: number;
  private z: number;
  private w: number;

  constructor(seed = 88675123) {
    this.x = 123456789;
    this.y = 362436069;
    this.z = 521288629;
    this.w = seed;
  }

  nextU32() {
    let t = this.x ^ (this.x << 11);
    this.x = this.y;
    this.y = this.z;
    this.z = this.w;
    return this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8));
  }

  nextFloat() {
    return (this.nextU32() >>> 0) / 0x100000000;
  }
}