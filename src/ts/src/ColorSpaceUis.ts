import * as Colors from './Colors';
import {Vec3} from './Math3D';
import * as Palettes from './Palettes';
import * as Ui from './Ui';
import {clip} from './Utils';

abstract class Object3D {
  constructor(public vertBuff: number[]) {}
  public zOffset = 0;
  public get zPos(): number {
    return this.onGetZPos() + this.zOffset;
  }
  protected abstract onGetZPos(): number;
  public abstract render(ctx: CanvasRenderingContext2D): void;
}

class Line3D extends Object3D {
  constructor(
      vertBuff: number[], public v0: number, public v1: number,
      public color: string) {
    super(vertBuff);
  }

  protected onGetZPos(): number {
    const z0 = this.vertBuff[this.v0 + 2];
    const z1 = this.vertBuff[this.v1 + 2];
    return (z0 + z1) / 2;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const x0 = this.vertBuff[this.v0 + 0];
    const y0 = this.vertBuff[this.v0 + 1];
    const x1 = this.vertBuff[this.v1 + 0];
    const y1 = this.vertBuff[this.v1 + 1];

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
}

class Dot3D extends Object3D {
  constructor(
      vertBuff: number[], public v: number, public square: boolean,
      public color: string, public size: number = 8) {
    super(vertBuff);
  }

  protected onGetZPos(): number {
    return this.vertBuff[this.v + 2];
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const x = this.vertBuff[this.v + 0];
    const y = this.vertBuff[this.v + 1];
    const r2 = this.size;
    const r = r2 / 2;
    if (this.square) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x - r - 1, y - r - 1, r2 + 2, r2 + 2);
      ctx.fillStyle = this.color;
      ctx.fillRect(x - r, y - r, r2, r2);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(x, y, r + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export class ColorSpaceUi {
  private canvas = document.createElement('canvas');
  public container = Ui.makeParagraph([this.canvas]);

  private paletteVerts: Float32Array = new Float32Array();
  private paletteEdgeVertIndices: Uint32Array = new Uint32Array();
  private paletteTriangleVertIndices: Uint32Array = new Uint32Array();

  private octreePoints: {point: Vec3, inside: boolean}[] = [];  // todo: delete
  private sampleColors: Vec3[] = [];

  private renderTimeoutId: number|null = null;

  private rotateX = Math.PI / 6;
  private rotateY = Math.PI / 6;

  private projectionMtx: number[] =
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

  private vertBuff: number[] = [];
  private vertBuffSize: number = 0;

  private objBuffs: (Object3D|null)[] = [];
  private objBuffsSize: number = 0;

  constructor() {
    this.canvas.width = 250;
    this.canvas.height = 250;
    this.queryRender();

    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointerup', (e) => {
      e.preventDefault();
      this.canvas.releasePointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (e.buttons != 1) return;
      e.preventDefault();
      this.rotateY += e.movementX * 0.01;
      this.rotateX += e.movementY * 0.01;
      this.rotateX = clip(-Math.PI / 2, Math.PI / 2, this.rotateX);
      this.queryRender();
    });

    this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
    this.canvas.addEventListener('touchend', (e) => e.preventDefault());
  }

  public setPalette(palette: Palettes.Palette): void {
    const {verts, ivEdges, ivTriangles} = palette.convexHull.getMesh();
    this.paletteVerts = verts;
    this.paletteEdgeVertIndices = ivEdges;
    this.paletteTriangleVertIndices = ivTriangles;
    this.queryRender();

    // todo: delete
    // this.octreePoints = palette.convexHull.dumpOctree();
  }

  public setSampleColors(colors: Vec3[]): void {
    this.sampleColors = colors;
    this.queryRender();
  }

  public queryRender(): void {
    if (this.renderTimeoutId !== null) return;
    this.renderTimeoutId = window.setTimeout(() => {
      // requestAnimationFrame で遅延させないと
      // clientWidth が 0 になることがある
      window.requestAnimationFrame(() => this.render());
    }, 10);
  }

  private render(): void {
    this.renderTimeoutId = null;

    this.vertBuffSize = 0;
    this.objBuffsSize = 0;
    this.objBuffs.fill(null);

    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvasW, canvasH);

    {
      const v000 = this.pushVert(0, 0, 0);
      const v001 = this.pushVert(1, 0, 0);
      const v010 = this.pushVert(0, 1, 0);
      const v011 = this.pushVert(1, 1, 0);
      const v100 = this.pushVert(0, 0, 1);
      const v101 = this.pushVert(1, 0, 1);
      const v110 = this.pushVert(0, 1, 1);
      const v111 = this.pushVert(1, 1, 1);
      const gray = '#444';
      this.pushLine(v001, v011, gray);
      this.pushLine(v001, v101, gray);
      this.pushLine(v010, v011, gray);
      this.pushLine(v010, v110, gray);
      this.pushLine(v011, v111, gray);
      this.pushLine(v100, v101, gray);
      this.pushLine(v100, v110, gray);
      this.pushLine(v101, v111, gray);
      this.pushLine(v110, v111, gray);
      this.pushLine(v000, v001, '#F00');
      this.pushLine(v000, v010, '#0F0');
      this.pushLine(v000, v100, '#00F');
    }

    for (let i = 0; i < this.paletteVerts.length / 3; i++) {
      const x = this.paletteVerts[i * 3 + 0];
      const y = this.paletteVerts[i * 3 + 1];
      const z = this.paletteVerts[i * 3 + 2];
      const v = this.pushVert(x, y, z);
      const r = clip(0, 255, Math.round(x * 255));
      const g = clip(0, 255, Math.round(y * 255));
      const b = clip(0, 255, Math.round(z * 255));
      this.pushDot(v, true, Colors.u32ToHexStr((b << 16) | (g << 8) | r))
          .zOffset = 0.01;
    }

    // for (let i = 0; i < this.paletteTriangleVertIndices.length; i += 3) {
    //   const iv0 = this.paletteTriangleVertIndices[i + 0];
    //   const iv1 = this.paletteTriangleVertIndices[i + 1];
    //   const iv2 = this.paletteTriangleVertIndices[i + 2];
    //   ctx.lineWidth = 1;
    //   ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    //   this.pushLine(ctx, this.paletteVerts, iv0, iv1);
    //   this.pushLine(ctx, this.paletteVerts, iv1, iv2);
    //   this.pushLine(ctx, this.paletteVerts, iv2, iv0);
    //
    //   // 面の法線ベクトルを描画 (デバッグ用)
    //   // this.drawNormal(ctx, iv0, iv1, iv2);
    // }

    for (let i = 0; i < this.paletteEdgeVertIndices.length; i += 2) {
      const x0 = this.paletteVerts[this.paletteEdgeVertIndices[i + 0] + 0];
      const y0 = this.paletteVerts[this.paletteEdgeVertIndices[i + 0] + 1];
      const z0 = this.paletteVerts[this.paletteEdgeVertIndices[i + 0] + 2];
      const x1 = this.paletteVerts[this.paletteEdgeVertIndices[i + 1] + 0];
      const y1 = this.paletteVerts[this.paletteEdgeVertIndices[i + 1] + 1];
      const z1 = this.paletteVerts[this.paletteEdgeVertIndices[i + 1] + 2];
      const v0 = this.pushVert(x0, y0, z0);
      const v1 = this.pushVert(x1, y1, z1);
      this.pushLine(v0, v1, 'rgba(255,255,255,0.5)');
    }

    // サンプル色を描画
    for (let i = 0; i < this.sampleColors.length; i++) {
      const c = this.sampleColors[i];
      const v = this.pushVert(c.x, c.y, c.z);
      const r = clip(0, 255, Math.round(c.x * 255));
      const g = clip(0, 255, Math.round(c.y * 255));
      const b = clip(0, 255, Math.round(c.z * 255));
      const colorStr = Colors.u32ToHexStr((b << 16) | (g << 8) | r);
      this.pushDot(v, false, colorStr, 4);
    }

    // todo: delete
    // 八分木の点群を描画
    for (let i = 0; i < this.octreePoints.length; i++) {
      const p = this.octreePoints[i];
      const v = this.pushVert(p.point.x, p.point.y, p.point.z);
      this.pushDot(
          v, false, p.inside ? 'rgba(0,255,0,0.5)' : 'rgba(255,0,0,0.5)', 2);
    }

    // 頂点を投影
    this.prepareProjectionMatrix();
    for (let i = 0; i < this.vertBuffSize; i += 3) {
      this.project3D(this.vertBuff, i);
    }

    if (this.objBuffsSize < this.objBuffs.length) {
      this.objBuffs = this.objBuffs.slice(0, this.objBuffsSize);
    }

    // オブジェクトを遠い順に並べる (Zソート法)
    this.objBuffs.sort((a, b) => (a as Object3D).zPos - (b as Object3D).zPos);

    // 描画
    for (let i = 0; i < this.objBuffsSize; i++) {
      (this.objBuffs[i] as Object3D).render(ctx);
    }
  }

  private pushVert(x: number, y: number, z: number): number {
    const ret = this.vertBuffSize;
    if (this.vertBuffSize + 3 <= this.vertBuff.length) {
      this.vertBuff[this.vertBuffSize++] = x;
      this.vertBuff[this.vertBuffSize++] = y;
      this.vertBuff[this.vertBuffSize++] = z;
    } else {
      this.vertBuff.push(x);
      this.vertBuff.push(y);
      this.vertBuff.push(z);
      this.vertBuffSize += 3;
    }
    return ret;
  }

  private pushObj(obj: Object3D): number {
    const ret = this.objBuffsSize;
    if (this.objBuffsSize + 1 <= this.objBuffs.length) {
      this.objBuffs[this.objBuffsSize++] = obj;
    } else {
      this.objBuffs.push(obj);
      this.objBuffsSize += 1;
    }
    return ret;
  }

  private drawNormal(
      ctx: CanvasRenderingContext2D, iv0: number, iv1: number,
      iv2: number): void {
    const x0 = this.paletteVerts[iv0 + 0];
    const y0 = this.paletteVerts[iv0 + 1];
    const z0 = this.paletteVerts[iv0 + 2];
    const x1 = this.paletteVerts[iv1 + 0];
    const y1 = this.paletteVerts[iv1 + 1];
    const z1 = this.paletteVerts[iv1 + 2];
    const x2 = this.paletteVerts[iv2 + 0];
    const y2 = this.paletteVerts[iv2 + 1];
    const z2 = this.paletteVerts[iv2 + 2];
    const ux = x1 - x0;
    const uy = y1 - y0;
    const uz = z1 - z0;
    const vx = x2 - x0;
    const vy = y2 - y0;
    const vz = z2 - z0;
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len > 1e-6) {
      nx /= len;
      ny /= len;
      nz /= len;
    }
    const normalEdge = new Float32Array(6);
    normalEdge[0] = (x0 + x1 + x2) / 3;
    normalEdge[1] = (y0 + y1 + y2) / 3;
    normalEdge[2] = (z0 + z1 + z2) / 3;
    normalEdge[3] = normalEdge[0] + nx * 0.2;
    normalEdge[4] = normalEdge[1] + ny * 0.2;
    normalEdge[5] = normalEdge[2] + nz * 0.2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    // this.pushLine(ctx, normalEdge, 0, 3);
  }

  private pushLine(iv0: number, iv1: number, color: string): Line3D {
    const obj = new Line3D(this.vertBuff, iv0, iv1, color);
    this.pushObj(obj);
    return obj;
  }

  public pushDot(iv: number, square: boolean, color: string, size: number = 8):
      Dot3D {
    const obj = new Dot3D(this.vertBuff, iv, square, color, size);
    this.pushObj(obj);
    return obj;
  }

  private translateMatrix(tx: number, ty: number, tz: number): void {
    const mtx = [1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz, 0, 0, 0, 1];
    this.projectionMtx = this.multMatrix(mtx, this.projectionMtx);
  }

  private scaleMatrix(sx: number, sy: number, sz: number): void {
    const mtx = [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
    this.projectionMtx = this.multMatrix(mtx, this.projectionMtx);
  }

  private rotateMatrix(
      xAxis: number, yAxis: number, zAxis: number, radian: number): void {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    const t = 1 - c;

    const mtx = [
      t * xAxis * xAxis + c, t * xAxis * yAxis - s * zAxis,
      t * xAxis * zAxis + s * yAxis, 0, t * xAxis * yAxis + s * zAxis,
      t * yAxis * yAxis + c, t * yAxis * zAxis - s * xAxis, 0,
      t * xAxis * zAxis - s * yAxis, t * yAxis * zAxis + s * xAxis,
      t * zAxis * zAxis + c, 0, 0, 0, 0, 1
    ];

    this.projectionMtx = this.multMatrix(mtx, this.projectionMtx);
  }

  private multMatrix(a: number[], b: number[]): number[] {
    const result = new Array(16).fill(0);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        for (let k = 0; k < 4; k++) {
          result[row * 4 + col] += a[row * 4 + k] * b[k * 4 + col];
        }
      }
    }
    return result;
  }

  private prepareProjectionMatrix(): void {
    this.projectionMtx = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    this.translateMatrix(-0.5, -0.5, -0.5);
    this.rotateMatrix(0, 1, 0, this.rotateY);
    this.rotateMatrix(1, 0, 0, this.rotateX);
    this.translateMatrix(0, 0, -3);

    if (false) {
      // 透視投影
      const fov = 45 * Math.PI / 180;  // in radians
      const aspect = this.canvas.width / this.canvas.height;
      const near = 0.1;
      const far = 100;
      const f = 1.0 / Math.tan(fov / 2);
      const projMtx = [
        f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far),
        (2 * far * near) / (near - far), 0, 0, -1, 0
      ];
      this.projectionMtx = this.multMatrix(projMtx, this.projectionMtx);
      this.scaleMatrix(1.25, 1.25, 1);
    }

    this.scaleMatrix(this.canvas.width / 2, -this.canvas.height / 2, 1);
    this.translateMatrix(this.canvas.width / 2, this.canvas.height / 2, 0);
  }

  private project3D(vertBuff: number[], index: number): void {
    const x = vertBuff[index + 0];
    const y = vertBuff[index + 1];
    const z = vertBuff[index + 2];
    const [m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44] =
        this.projectionMtx;
    const w = m41 * x + m42 * y + m43 * z + m44;
    vertBuff[index + 0] = (m11 * x + m12 * y + m13 * z + m14) / w;
    vertBuff[index + 1] = (m21 * x + m22 * y + m23 * z + m24) / w;
    vertBuff[index + 2] = (m31 * x + m32 * y + m33 * z + m34) / w;
  }
}
