import {clip} from './Utils';

export class Vec3 {
  constructor(
      public x: number = 0, public y: number = 0, public z: number = 0) {}

  public equals(b: Vec3): boolean {
    return this.x == b.x && this.y == b.y && this.z == b.z;
  }

  public set(x: number, y: number, z: number): void {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  public copyFrom(b: Vec3): void {
    this.x = b.x;
    this.y = b.y;
    this.z = b.z;
  }

  public clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  public add(b: Vec3): void {
    this.x += b.x;
    this.y += b.y;
    this.z += b.z;
  }

  public sub(b: Vec3): void {
    this.x -= b.x;
    this.y -= b.y;
    this.z -= b.z;
  }

  public mul(b: number): void {
    this.x *= b;
    this.y *= b;
    this.z *= b;
  }

  public dot(b: Vec3): number {
    return this.x * b.x + this.y * b.y + this.z * b.z;
  }

  public cross(b: Vec3): void {
    const x = this.y * b.z - this.z * b.y;
    const y = this.z * b.x - this.x * b.z;
    const z = this.x * b.y - this.y * b.x;
    this.x = x;
    this.y = y;
    this.z = z;
  }

  public len(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  public norm(): Vec3 {
    const l = this.len();
    if (l > 0) {
      this.mul(1 / l);
    } else {
      throw new Error('zero length vector');
    }
    return this;
  }

  public distSq(b: Vec3): number {
    const dx = this.x - b.x;
    const dy = this.y - b.y;
    const dz = this.z - b.z;
    return dx * dx + dy * dy + dz * dz;
  }

  public dist(b: Vec3): number {
    const dx = this.x - b.x;
    const dy = this.y - b.y;
    const dz = this.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  public angleAndAxisTo(b: Vec3): {axis: Vec3, angle: number} {
    const nA = this.clone();
    const nB = b.clone();
    nA.norm();
    nB.norm();
    const d = clip(-1, 1, nA.dot(nB));
    const angle = Math.acos(d);
    const axis = nA.clone();
    axis.cross(nB);
    if (axis.len() == 0) {
      nB.set(1, 0, 0);
      axis.copyFrom(nA);
      axis.cross(nB);
      if (axis.len() == 0) {
        nB.set(0, 1, 0);
        axis.copyFrom(nA);
        axis.cross(nB);
      }
    }
    axis.norm();
    return {axis, angle};
  }

  public toString(): string {
    return `(${this.x.toFixed(3)}, ${this.y.toFixed(3)}, ${this.z.toFixed(3)})`;
  }
}

export class Mat43 {
  public m = new Array<number>(12);

  constructor(
      m00: number = 1, m01: number = 0, m02: number = 0, m03: number = 0,
      m10: number = 0, m11: number = 1, m12: number = 0, m13: number = 0,
      m20: number = 0, m21: number = 0, m22: number = 1, m23: number = 0) {
    let i = 0;
    this.m[i++] = m00;
    this.m[i++] = m01;
    this.m[i++] = m02;
    this.m[i++] = m03;
    this.m[i++] = m10;
    this.m[i++] = m11;
    this.m[i++] = m12;
    this.m[i++] = m13;
    this.m[i++] = m20;
    this.m[i++] = m21;
    this.m[i++] = m22;
    this.m[i++] = m23;
  }

  public copyFrom(b: Mat43): void {
    for (let i = 0; i < 12; i++) {
      this.m[i] = b.m[i];
    }
  }

  public invert(): void {
    const a00 = this.m[0], a01 = this.m[1], a02 = this.m[2], a03 = this.m[3];
    const a10 = this.m[4], a11 = this.m[5], a12 = this.m[6], a13 = this.m[7];
    const a20 = this.m[8], a21 = this.m[9], a22 = this.m[10], a23 = this.m[11];

    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;

    // Calculate the determinant
    let det = b00 * a22 - b01 * a21 + b03 * a20;

    if (!det) {
      throw new Error('行列が特異です');
    }
    det = 1.0 / det;

    let i = 0;
    this.m[i++] = (a11 * a22 - a12 * a21) * det;
    this.m[i++] = (a02 * a21 - a01 * a22) * det;
    this.m[i++] = b03 * det;
    this.m[i++] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    this.m[i++] = (a12 * a20 - a10 * a22) * det;
    this.m[i++] = (a00 * a22 - a02 * a20) * det;
    this.m[i++] = b01 * det;
    this.m[i++] = (a20 * a22 - a22 * b02 - a23 * b01) * det;
    this.m[i++] = (a10 * a21 - a11 * a20) * det;
    this.m[i++] = (a01 * a20 - a00 * a21) * det;
    this.m[i++] = b00 * det;
    this.m[i++] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  }

  public det(): number {
    const a00 = this.m[0], a01 = this.m[1], a02 = this.m[2];
    const a10 = this.m[4], a11 = this.m[5], a12 = this.m[6];
    const a20 = this.m[8], a21 = this.m[9], a22 = this.m[10];
    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b03 = a01 * a12 - a02 * a11;
    return b00 * a22 - b01 * a21 + b03 * a20;
  }

  public mulM(b: Mat43): void {
    const a00 = this.m[0], a01 = this.m[1], a02 = this.m[2], a03 = this.m[3];
    const a10 = this.m[4], a11 = this.m[5], a12 = this.m[6], a13 = this.m[7];
    const a20 = this.m[8], a21 = this.m[9], a22 = this.m[10], a23 = this.m[11];
    const b00 = b.m[0], b01 = b.m[1], b02 = b.m[2], b03 = b.m[3];
    const b10 = b.m[4], b11 = b.m[5], b12 = b.m[6], b13 = b.m[7];
    const b20 = b.m[8], b21 = b.m[9], b22 = b.m[10], b23 = b.m[11];
    let i = 0;
    this.m[i++] = a00 * b00 + a01 * b10 + a02 * b20;
    this.m[i++] = a00 * b01 + a01 * b11 + a02 * b21;
    this.m[i++] = a00 * b02 + a01 * b12 + a02 * b22;
    this.m[i++] = a00 * b03 + a01 * b13 + a02 * b23 + a03;
    this.m[i++] = a10 * b00 + a11 * b10 + a12 * b20;
    this.m[i++] = a10 * b01 + a11 * b11 + a12 * b21;
    this.m[i++] = a10 * b02 + a11 * b12 + a12 * b22;
    this.m[i++] = a10 * b03 + a11 * b13 + a12 * b23 + a13;
    this.m[i++] = a20 * b00 + a21 * b10 + a22 * b20;
    this.m[i++] = a20 * b01 + a21 * b11 + a22 * b21;
    this.m[i++] = a20 * b02 + a21 * b12 + a22 * b22;
    this.m[i++] = a20 * b03 + a21 * b13 + a22 * b23 + a23;
  }

  public mulV(v: Vec3): void {
    const vx = v.x;
    const vy = v.y;
    const vz = v.z;
    v.x = this.m[0] * vx + this.m[1] * vy + this.m[2] * vz + this.m[3];
    v.y = this.m[4] * vx + this.m[5] * vy + this.m[6] * vz + this.m[7];
    v.z = this.m[8] * vx + this.m[9] * vy + this.m[10] * vz + this.m[11];
  }

  public translate(tx: number, ty: number, tz: number): void {
    this.m[3] += this.m[0] * tx + this.m[1] * ty + this.m[2] * tz;
    this.m[7] += this.m[4] * tx + this.m[5] * ty + this.m[6] * tz;
    this.m[11] += this.m[8] * tx + this.m[9] * ty + this.m[10] * tz;
  }

  public scale(sx: number, sy: number, sz: number): void {
    this.m[0] *= sx;
    this.m[1] *= sy;
    this.m[2] *= sz;
    this.m[4] *= sx;
    this.m[5] *= sy;
    this.m[6] *= sz;
    this.m[8] *= sx;
    this.m[9] *= sy;
    this.m[10] *= sz;
  }

  public rotate(axis: Vec3, angle: number): void {
    this.mulM(makeRotationMatrix(axis, angle));
  }
}

export class Box {
  constructor(public v0: Vec3 = new Vec3(), public v1: Vec3 = new Vec3()) {}

  public clone(): Box {
    return new Box(this.v0.clone(), this.v1.clone());
  }

  public contains(v: Vec3): boolean {
    return (
        this.v0.x <= v.x && v.x <= this.v1.x && this.v0.y <= v.y &&
        v.y <= this.v1.y && this.v0.z <= v.z && v.z <= this.v1.z);
  }
  public getCorner(i: number, ret: Vec3): void {
    ret.x = ((i & 1) != 0) ? this.v1.x : this.v0.x;
    ret.y = ((i & 2) != 0) ? this.v1.y : this.v0.y;
    ret.z = ((i & 4) != 0) ? this.v1.z : this.v0.z;
  }

  public getCenter(ret: Vec3): void {
    ret.x = (this.v0.x + this.v1.x) / 2;
    ret.y = (this.v0.y + this.v1.y) / 2;
    ret.z = (this.v0.z + this.v1.z) / 2;
  }

  public getSubBox(i: number, ret: Box, middle: Vec3|null = null): void {
    const x0 = this.v0.x;
    const y0 = this.v0.y;
    const z0 = this.v0.z;
    const x1 = this.v1.x;
    const y1 = this.v1.y;
    const z1 = this.v1.z;
    let xM: number, yM: number, zM: number;
    if (middle) {
      xM = middle.x;
      yM = middle.y;
      zM = middle.z;
    } else {
      xM = (x0 + x1) / 2;
      yM = (y0 + y1) / 2;
      zM = (z0 + z1) / 2;
    }
    switch (i) {
      case 0:
        ret.v0.set(x0, y0, z0);
        ret.v1.set(xM, yM, zM);
        break;
      case 1:
        ret.v0.set(xM, y0, z0);
        ret.v1.set(x1, yM, zM);
        break;
      case 2:
        ret.v0.set(x0, yM, z0);
        ret.v1.set(xM, y1, zM);
        break;
      case 3:
        ret.v0.set(xM, yM, z0);
        ret.v1.set(x1, y1, zM);
        break;
      case 4:
        ret.v0.set(x0, y0, zM);
        ret.v1.set(xM, yM, z1);
        break;
      case 5:
        ret.v0.set(xM, y0, zM);
        ret.v1.set(x1, yM, z1);
        break;
      case 6:
        ret.v0.set(x0, yM, zM);
        ret.v1.set(xM, y1, z1);
        break;
      case 7:
        ret.v0.set(xM, yM, zM);
        ret.v1.set(x1, y1, z1);
        break;
      default:
        throw new Error('Box.getSubBox: i must be 0-7');
    }
  }

  public toString(): string {
    return `[${this.v0.toString()} - ${this.v1.toString()}]`;
  }
}

export enum HitResult {
  NO_TRIANGLE = 0,
  BEHIND_OF_RAY = 1,
  PARALLEL = 2,
  OUTSIDE_OF_TRIANGLE = 3,
  HIT = 4,
}

export class Hit {
  constructor(
      public result: HitResult, public point?: Vec3, public front?: boolean) {}
}

export function addV(a: Vec3, b: Vec3): Vec3 {
  const ret = a.clone();
  ret.add(b);
  return ret;
}

export function subV(a: Vec3, b: Vec3): Vec3 {
  const ret = a.clone();
  ret.sub(b);
  return ret;
}

export function crossV(a: Vec3, b: Vec3): Vec3 {
  const ret = a.clone();
  ret.cross(b);
  return ret;
}

export function makeTranslationMatrix(
    tx: number, ty: number, tz: number): Mat43 {
  return new Mat43(1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz);
}

export function makeScalingMatrix(sx: number, sy: number, sz: number): Mat43 {
  return new Mat43(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0);
}

export function makeRotationMatrix(axis: Vec3, angle: number): Mat43 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  const x = axis.x;
  const y = axis.y;
  const z = axis.z;
  return new Mat43(
      t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0, t * x * y + s * z,
      t * y * y + c, t * y * z - s * x, 0, t * x * z - s * y, t * y * z + s * x,
      t * z * z + c, 0);
}

export function makeTransformer(xAxis: Vec3, yAxis: Vec3, zAxis: Vec3): Mat43 {
  return new Mat43(
      xAxis.x, yAxis.x, zAxis.x, 0, xAxis.y, yAxis.y, zAxis.y, 0, xAxis.z,
      yAxis.z, zAxis.z, 0);
}

export function projectPointToLine(
    linePoint0: Vec3, linePoint1: Vec3, p: Vec3): Vec3 {
  const lineDir = subV(linePoint1, linePoint0).norm();
  const v = subV(p, linePoint0);
  const d = v.dot(lineDir);
  lineDir.mul(d);
  lineDir.add(linePoint0);
  return lineDir;
}

export function projectPointToPlane(
    planePoint0: Vec3, planePoint1: Vec3, planePoint2: Vec3, p: Vec3): Vec3 {
  const v0 = subV(planePoint1, planePoint0);
  const v1 = subV(planePoint2, planePoint0);
  const n = crossV(v0, v1).norm();
  const v = subV(p, planePoint0);
  const d = v.dot(n);
  if (d <= 1e-12) {
    throw new Error('projectPointToPlane: zero plane normal');
  }
  n.mul(d);
  return subV(p, n);
}

const vw0 = new Vec3();
const vw1 = new Vec3();
const vw2 = new Vec3();
const vw3 = new Vec3();
const vw4 = new Vec3();
const vw5 = new Vec3();
const vw6 = new Vec3();
const vw7 = new Vec3();
export function intersectWithTriangle(
    pt0: Vec3, pt1: Vec3, pt2: Vec3, rayOrig: Vec3, rayDir: Vec3): Hit {
  const v0 = subV(pt1, pt0);
  const v1 = subV(pt2, pt0);
  const n = crossV(v0, v1);
  const nLen = n.len();
  if (nLen == 0) return new Hit(HitResult.NO_TRIANGLE);
  n.mul(1 / nLen);

  const d = n.dot(rayDir);
  if (Math.abs(d) < 1e-6) {
    return new Hit(HitResult.PARALLEL);
  }
  const v = subV(rayOrig, pt0);
  const t = -n.dot(v) / d;
  if (t < 0) {
    return new Hit(HitResult.BEHIND_OF_RAY);
  }
  const q = rayDir.clone();
  q.mul(t);
  q.add(rayOrig);

  // inside-out test
  const c0 = subV(q, pt0);
  const c1 = subV(q, pt1);
  const c2 = subV(q, pt2);
  const n0 = crossV(v0, c0);
  const n1 = crossV(subV(pt2, pt1), c1);
  const n2 = crossV(subV(pt0, pt2), c2);
  if (n0.dot(n) >= 0 && n1.dot(n) >= 0 && n2.dot(n) >= 0) {
    return new Hit(HitResult.HIT, q, d < 0);
  } else {
    return new Hit(HitResult.OUTSIDE_OF_TRIANGLE);
  }
}
