import * as Debug from './Debug';
import {Point} from './Geometries';
import * as Math3D from './Math3D';
import {Box, Hit, Vec3} from './Math3D';

type ObjectId = number;

let nextId: ObjectId = 0;

function getNextId(): ObjectId {
  return nextId++;
}

export type Point3D = {
  x: number,
  y: number,
  z: number,
};

const OCTREE_DEPTH = 5;

class Vertex {
  public id: ObjectId = getNextId();

  constructor(public pos: Vec3) {}

  public distFromVert(p: Vec3): number {
    return this.pos.dist(p);
  }

  public distFromEdge(v0: Vertex, v1: Vertex): number {
    const edgeLen = v1.distFromVert(v0.pos);
    if (edgeLen < 1e-12) {
      return this.distFromVert(v0.pos);
    }

    const v10 = Math3D.subV(v1.pos, v0.pos);
    const vT0 = Math3D.subV(this.pos, v0.pos);
    const t = vT0.dot(v10) / edgeLen;
    if (t < 0) {
      return this.distFromVert(v0.pos);
    }
    if (t > 1) {
      return this.distFromVert(v1.pos);
    } else {
      // 点から辺への距離
      v10.mul(t);
      v10.add(v0.pos);
      return this.pos.dist(v10);
    }
  }
}

class Edge {
  public id: ObjectId = getNextId();

  constructor(
      public v0: Vertex, public v1: Vertex, public cwTriangle: Triangle,
      public ccwTriangle: Triangle) {}
}

class Triangle {
  public id: ObjectId = getNextId();

  constructor(public v0: Vertex, public v1: Vertex, public v2: Vertex) {}

  // 面からの距離 (負値: 裏, 0: 面上, 正値: 表)
  public distToVert(target: Vertex): number {
    const u = Math3D.subV(this.v1.pos, this.v0.pos);
    const v = Math3D.subV(this.v2.pos, this.v0.pos);
    const n = Math3D.crossV(u, v);
    const dN = n.len();
    if (dN < 1e-12) {
      // 面がつぶれている
      throw new Error('degenerate face');
    }
    n.mul(1 / dN);

    // 点から面への距離
    const dT = Math3D.subV(target.pos, this.v0.pos);
    return dT.dot(n);
  }
}

class OctreeNode {
  public children: OctreeNode[]|null = null;
  public uniform: boolean = false;
  public middle: Vec3 = new Vec3();
  public inside: boolean = false;
}

export class ConvexHull3D {
  public vertices: Array<Vertex> = [];
  public triangles: Record<ObjectId, Triangle> = {};
  public edges: Record<ObjectId, Edge> = {};
  public boundingBox: Math3D.Box = new Math3D.Box();
  public areaWeight: Vec3 = new Vec3();
  public octreeRoot: OctreeNode|null = null;
  public triangleIds: ObjectId[] = [];

  constructor(public v: Float32Array) {
    for (let i = 0; i < v.length / 3; i++) {
      let conflict = false;
      const vNew = new Vec3(v[i * 3 + 0], v[i * 3 + 1], v[i * 3 + 2]);
      for (const vExist of this.vertices) {
        if (vNew.equals(vExist.pos)) {
          conflict = true;
          break;
        }
      }
      if (!conflict) {
        this.vertices.push(new Vertex(vNew));
      }
    }

    // 重心を求める
    const w = new Vec3();
    for (const v of this.vertices) {
      w.add(v.pos);
    }
    w.mul(1 / this.vertices.length);

    // 頂点を重心から遠い順に並べる
    let farthests: Vertex[];
    {
      const distW: Record<number, number> = {};
      for (let i = 0; i < this.vertices.length; i++) {
        distW[i] = this.vertices[i].distFromVert(w);
      }
      const farthestsIndex = Object.keys(distW).map((k) => parseInt(k, 10));
      farthestsIndex.sort((a, b) => distW[b] - distW[a]);
      farthests = farthestsIndex.map((i) => this.vertices[i]);
    }

    {
      // 初期の三角形を作成
      const v0 = farthests.shift() as Vertex;
      const v1 = this.farthestVertFromVert(v0) as Vertex;
      farthests.splice(farthests.indexOf(v1), 1);
      const v2 = this.farthestVertFromEdge(v0, v1) as Vertex;
      farthests.splice(farthests.indexOf(v2), 1);
      const t0 = new Triangle(v0, v1, v2);
      const t1 = new Triangle(v0, v2, v1);
      const e0 = new Edge(v0, v1, t0, t1);
      const e1 = new Edge(v1, v2, t0, t1);
      const e2 = new Edge(v2, v0, t0, t1);
      this.triangles[t0.id] = t0;
      this.triangles[t1.id] = t1;
      this.edges[e0.id] = e0;
      this.edges[e1.id] = e1;
      this.edges[e2.id] = e2;

      // 三角形の面上に無い面を追加して潰れていない四面体を形成
      const v3 = this.farthestVertFromTriangle(t0);
      if (v3) {
        farthests.splice(farthests.indexOf(v3), 1);
        this.addVert(v3);
      } else {
        // console.warn('all points are coplanar');
      }
    }

    // 凸包に頂点を追加していく
    while (farthests.length > 0) {
      const vNew = farthests.shift() as Vertex;
      this.addVert(vNew);
    }

    // 面IDリストをキャッシュ
    this.triangleIds = Object.keys(this.triangles).map((k) => parseInt(k, 10));

    this.calcBoundingBox();

    // 面積荷重平均をキャッシュ
    this.calcAreaWeight();

    // 内接球をキャッシュ
    this.buildOctree();
  }


  private addVert(vNew: Vertex) {
    // 表裏判定
    const fronts: Record<ObjectId, Triangle> = {};
    let allBack = true;
    for (const it in this.triangles) {
      const t = this.triangles[it];
      const side = t.distToVert(vNew);
      if (side > 1e-12) {
        allBack = false;
        fronts[it] = t;
      }
    }

    // 凸包の内側は無視
    if (allBack) {
      return;
    }

    // 地平線と削除される辺と頂点を検出し、新しい面を生成
    const borderEdgeIds: ObjectId[] = [];
    const borderVerts: Vertex[] = [];
    const delEdgeIds: ObjectId[] = [];
    const newTriangles: Triangle[] = [];
    const edgeFaceCcw: Record<ObjectId, Triangle> = {};
    const edgeFaceCw: Record<ObjectId, Triangle> = {};
    for (const ie in this.edges) {
      const e = this.edges[ie];
      const cwIsFront = e.cwTriangle.id in fronts;
      const ccwIsFront = e.ccwTriangle.id in fronts;
      if (cwIsFront != ccwIsFront) {
        // 稜線を検出
        borderEdgeIds.push(e.id);
        let newTriangle: Triangle;
        if (cwIsFront) {
          newTriangle = new Triangle(e.v0, e.v1, vNew);
          e.cwTriangle = newTriangle;
          if (false) {
            // todo: delete check code
            console.assert(!(e.v0.id in edgeFaceCw), 'FAIL1.1');
            console.assert(!(e.v1.id in edgeFaceCcw), 'FAIL1.2');
          }
          edgeFaceCw[e.v0.id] = newTriangle;
          edgeFaceCcw[e.v1.id] = newTriangle;
          borderVerts.push(e.v0);
        } else {
          newTriangle = new Triangle(e.v1, e.v0, vNew);
          e.ccwTriangle = newTriangle;
          if (false) {
            // todo: delete
            console.assert(!(e.v1.id in edgeFaceCw), 'FAIL2.1');
            console.assert(!(e.v0.id in edgeFaceCcw), 'FAIL2.2');
          }
          edgeFaceCw[e.v1.id] = newTriangle;
          edgeFaceCcw[e.v0.id] = newTriangle;
          borderVerts.push(e.v1);
        }
        newTriangles.push(newTriangle);
      } else if (cwIsFront && ccwIsFront) {
        // 新しい点から見て可視な面に挟まれた辺は削除
        delEdgeIds.push(e.id);
      }
    }

    // 古い面と辺を削除
    for (const it in fronts) {
      delete this.triangles[it];
    }
    for (const ie of delEdgeIds) {
      delete this.edges[ie];
    }

    // 新しい面を登録
    for (const f of newTriangles) {
      this.triangles[f.id] = f;
    }

    // 新しい辺を登録
    for (const v0 of borderVerts) {
      const faceCw = edgeFaceCw[v0.id];
      const faceCcw = edgeFaceCcw[v0.id];
      if (false) {
        // todo: delete
        console.assert(!!faceCw, 'FAIL3.1');
        console.assert(!!faceCcw, 'FAIL3.2');
      }
      const e = new Edge(vNew, v0, faceCw, faceCcw);
      this.edges[e.id] = e;
    }
  }

  public getMesh():
      {verts: Float32Array, ivEdges: Uint32Array, ivTriangles: Uint32Array} {
    const verts = new Float32Array(this.vertices.length * 3);
    const ivEdges = new Uint32Array(Object.keys(this.edges).length * 2);
    const ivTriangles = new Uint32Array(Object.keys(this.triangles).length * 3);
    const vertIndices = new Map<ObjectId, number>();
    for (let i = 0; i < this.vertices.length; i++) {
      verts[i * 3 + 0] = this.vertices[i].pos.x;
      verts[i * 3 + 1] = this.vertices[i].pos.y;
      verts[i * 3 + 2] = this.vertices[i].pos.z;
      vertIndices.set(this.vertices[i].id, i * 3);
    }
    let edgeIndex = 0;
    for (const ie in this.edges) {
      const e = this.edges[ie];
      ivEdges[edgeIndex++] = vertIndices.get(e.v0.id) as number;
      ivEdges[edgeIndex++] = vertIndices.get(e.v1.id) as number;
    }
    let triIndex = 0;
    for (const it in this.triangles) {
      const t = this.triangles[it];
      ivTriangles[triIndex++] = vertIndices.get(t.v0.id) as number;
      ivTriangles[triIndex++] = vertIndices.get(t.v1.id) as number;
      ivTriangles[triIndex++] = vertIndices.get(t.v2.id) as number;
    }
    return {verts, ivEdges, ivTriangles};
  }

  private calcBoundingBox(): void {
    const min = new Vec3(
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY);
    const max = new Vec3(
        Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY);
    for (const v of this.vertices) {
      if (v.pos.x < min.x) min.x = v.pos.x;
      if (v.pos.y < min.y) min.y = v.pos.y;
      if (v.pos.z < min.z) min.z = v.pos.z;
      if (v.pos.x > max.x) max.x = v.pos.x;
      if (v.pos.y > max.y) max.y = v.pos.y;
      if (v.pos.z > max.z) max.z = v.pos.z;
    }
    this.boundingBox = new Math3D.Box(min, max);
    //console.log(`ConvexHull3D: bounding box: ${this.boundingBox.toString()}`);
  }

  // 頂点の分布の影響を受けない面積荷重平均
  private calcAreaWeight(): void {
    let areaSum = 0;
    const w = new Vec3();
    for (const it in this.triangles) {
      const t = this.triangles[it];
      const a = Math3D.subV(t.v1.pos, t.v0.pos);
      const b = Math3D.subV(t.v2.pos, t.v0.pos);
      const n = Math3D.crossV(a, b);
      const area = n.len() / 2;
      areaSum += area;
      w.x += area * (t.v0.pos.x + t.v1.pos.x + t.v2.pos.x) / 3;
      w.y += area * (t.v0.pos.y + t.v1.pos.y + t.v2.pos.y) / 3;
      w.z += area * (t.v0.pos.z + t.v1.pos.z + t.v2.pos.z) / 3;
    }
    w.mul(1 / areaSum);
    this.areaWeight = w;
  }

  // 内外判定用の八分木を構築
  private buildOctree(): void {
    const sw = new Debug.StopWatch(false);

    this.insideCount = 0;  // todo: delete
    const corners: boolean[] = [];
    for (let i = 0; i < 8; i++) {
      const p = new Vec3();
      this.boundingBox.getCorner(i, p);
      corners.push(this.hitTest(p));
    }
    this.octreeRoot = this.buildOctreeRecursive(this.boundingBox, corners, 0);
    // console.log(`ConvexHull3D: inside count: ${this.insideCount}`);

    let numNodes = 0;
    let numInsideNodes = 0;
    let numOutsideNodes = 0;
    const countNodes = (node: OctreeNode) => {
      numNodes++;
      if (node.uniform) {
        console.assert(!node.children);
        if (node.inside) {
          numInsideNodes++;
        } else {
          numOutsideNodes++;
        }
      }
      if (node.children) {
        for (const c of node.children) {
          countNodes(c);
        }
      }
    };
    if (this.octreeRoot) {
      countNodes(this.octreeRoot);
    }
    //console.log(
    //    `octree nodes: ${numNodes}, inside: ${numInsideNodes}, outside: ${
    //        numOutsideNodes} ` +
    //    `(${
    //        (numInsideNodes * 100 / (numInsideNodes + numOutsideNodes))
    //            .toFixed(1)}%)`);

    sw.lap('ConvexHull3D.buildOctree()');
  }

  private buildOctreeRecursive(
      box: Box, cornerInsideFlags: boolean[], depth: number): OctreeNode {
    const node = new OctreeNode();

    // 8頂点の内外判定が全て同じなら終了
    let allSame = true;
    for (let i = 1; i < 8; i++) {
      if (cornerInsideFlags[0] !== cornerInsideFlags[i]) {
        allSame = false;
        break;
      }
    }
    if (allSame && depth > 0) {
      node.uniform = true;
      node.inside = cornerInsideFlags[0];
      return node;
    }

    // 8頂点の内外判定が異なる場合は分割
    if (depth < OCTREE_DEPTH - 1) {
      node.children = [];
      const x0 = box.v0.x;
      const y0 = box.v0.y;
      const z0 = box.v0.z;
      const x1 = box.v1.x;
      const y1 = box.v1.y;
      const z1 = box.v1.z;

      const w = this.areaWeight;
      node.middle = new Vec3();
      box.getCenter(node.middle);
      for (let iSubBox = 0; iSubBox < 8; iSubBox++) {
        const subBox = new Box();
        box.getSubBox(iSubBox, subBox, node.middle);
        const subFlags: boolean[] = [];
        for (let iCorner = 0; iCorner < 8; iCorner++) {
          const p = new Vec3();
          subBox.getCorner(iCorner, p);
          const pix = (p.x == x0) ? 0 : (p.x == x1) ? 1 : -1;
          const piy = (p.y == y0) ? 0 : (p.y == y1) ? 2 : -1;
          const piz = (p.z == z0) ? 0 : (p.z == z1) ? 4 : -1;
          if (pix >= 0 && piy >= 0 && piz >= 0) {
            subFlags.push(cornerInsideFlags[pix + piy + piz]);
          } else {
            subFlags.push(this.hitTest(p));
          }
        }
        node.children.push(
            this.buildOctreeRecursive(subBox, subFlags, depth + 1));
      }
    }
    return node;
  }

  private searchProfile(p: Vec3): boolean|null {
    if (!this.octreeRoot) return null;
    if (!this.boundingBox.contains(p)) return null;

    let box = this.boundingBox.clone();
    let node = this.octreeRoot;
    while (!node.uniform) {
      if (!node.children) {
        return null;
      }
      let ci = 0;
      if (p.x >= node.middle.x) ci |= 1;
      if (p.y >= node.middle.y) ci |= 2;
      if (p.z >= node.middle.z) ci |= 4;
      box.getSubBox(ci, box, node.middle);
      node = node.children[ci];
    }
    return node.inside;
  }

  private farthestVertFromVert(v0: Vertex): Vertex|null {
    let vBest: Vertex|null = null;
    let dBest = 0;
    for (const v of this.vertices) {
      if (v === v0) continue;
      const d = v0.distFromVert(v.pos);
      if (d > dBest) {
        dBest = d;
        vBest = v;
      }
    }
    return vBest;
  }

  private farthestVertFromEdge(v0: Vertex, v1: Vertex): Vertex|null {
    let vBest: Vertex|null = null;
    let dBest = 0;
    for (const v of this.vertices) {
      if (v === v0 || v === v1) continue;
      const d = v.distFromEdge(v0, v1);
      if (d > dBest) {
        dBest = d;
        vBest = v;
      }
    }
    return vBest;
  }

  private farthestVertFromTriangle(t: Triangle): Vertex|null {
    let vBest: Vertex|null = null;
    let dBest = 0;
    for (const v of this.vertices) {
      if (v === t.v0 || v === t.v1 || v === t.v2) continue;
      const d = Math.abs(t.distToVert(v));
      if (d > dBest) {
        dBest = d;
        vBest = v;
      }
    }
    return vBest;
  }

  public hitTest(p: Vec3, tolerance: number = 0): boolean {
    const w = this.areaWeight;
    const ret = this.intersectWithRay(p, Math3D.subV(w, p));
    if (ret.inside) {
      return true;
    } else if (
        ret.hit && ret.hit.result == Math3D.HitResult.HIT && ret.hit.point) {
      return ret.hit.point.dist(p) <= tolerance;
    }
    return false;
  }

  public dumpOctree(): {point: Vec3, inside: boolean}[] {
    const points: {point: Vec3, inside: boolean}[] = [];
    if (this.octreeRoot) {
      this.dumpOctreeRecursive(this.octreeRoot, this.boundingBox, points);
    }
    return points;
  }
  private dumpOctreeRecursive(node: OctreeNode, box: Box, points: {
    point: Vec3,
    inside: boolean
  }[]): void {
    if (node.uniform) {
      const p = new Vec3();
      box.getCenter(p);
      points.push({point: p, inside: node.inside});
    } else {
      if (node.children) {
        const subBox = new Box();
        for (let i = 0; i < 8; i++) {
          box.getSubBox(i, subBox, node.middle);
          this.dumpOctreeRecursive(node.children[i], subBox, points);
        }
      }
    }
  }

  public hitCount = 0;     // todo: delete
  public insideCount = 0;  // todo: delete
  public intersectWithRay(rayOrigin: Vec3, rayDir: Vec3):
      {inside: boolean, hit: Hit|null} {
    {
      const inside = this.searchProfile(rayOrigin);
      if (inside !== null) {
        this.hitCount++;
      }
      if (inside === true) {
        return {inside: true, hit: null};
      }
    }

    let bestHit = new Hit(Math3D.HitResult.NO_TRIANGLE);
    let bestTriangle: Triangle|null = null;
    for (const it of this.triangleIds) {
      const t = this.triangles[it];
      const p0 = t.v0.pos;
      const p1 = t.v1.pos;
      const p2 = t.v2.pos;
      const ret = Math3D.intersectWithTriangle(p0, p1, p2, rayOrigin, rayDir);
      if (ret.result > bestHit.result) {
        bestHit = ret;
        bestTriangle = t;
      }
      if (ret.result == Math3D.HitResult.HIT && ret.front) {
        bestHit = ret;
        bestTriangle = t;
        break;
      }
    }

    if (bestTriangle) {
      // ヒットした三角形は次回もヒットする可能性が高いので
      // 面IDリストの先頭に移動する
      const index = this.triangleIds.indexOf(bestTriangle.id);
      if (index >= 0) {
        this.triangleIds.splice(index, 1);
        this.triangleIds.unshift(bestTriangle.id);
      }
    }

    const inside =
        (bestHit.result == Math3D.HitResult.HIT) && bestHit.front === false;
    if (inside) this.insideCount++;
    return {inside, hit: bestHit};
  }
}
