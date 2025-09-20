import {NormalizedImage} from './Images';
import {Vec3} from './Math3D';
import {IndexedPalette} from './Palettes';
import {clip} from './Utils';
import {XorShift32} from './XorShifts';

export class KMeansArgs {
  public src: NormalizedImage|null = null;
  public indexBits: number = 4;
  public indexOffset: number = 0;
  public numColors: number = 16;
  public out: IndexedPalette|null = null;
  public channelBits: number[] = [8, 8, 8];
}

export function kMeansPlusPlus(args: KMeansArgs): void {
  const src = args.src as NormalizedImage;

  const nodes = src.collectCharacteristicColors(64).map((p) => p.color);

  const centers = new Array<Vec3>(args.numColors);
  centers.fill(new Vec3(0, 0, 0));
  if (nodes.length <= args.numColors) {
    // 抽出された色の数がパレットの大きさより小さい場合
    for (let i = 0; i < nodes.length; i++) {
      centers[i].copyFrom(nodes[i]);
    }
  } else {
    // K-Means++ の初期値選択アルゴリズムで初期セントロイドを選択する
    const centerNodeIndices: number[] = [];
    {
      const rng = new XorShift32();
      const centroidMark = new Map<number, boolean>();
      {
        const first = rng.nextU32() % nodes.length;
        centerNodeIndices.push(first);
        centroidMark.set(first, true);
      }

      const d = new Array(nodes.length);
      while (centerNodeIndices.length < args.numColors) {
        let distSqSum = 0;
        for (let i = 0; i < nodes.length; i++) {
          if (centroidMark.has(i)) {
            d[i] = 0;
          } else {
            const {index, distSq} =
                nearestCenterNode(nodes, centerNodeIndices, nodes[i]);
            d[i] = distSq;
            distSqSum += distSq;
          }
        }
        let r = rng.nextFloat() * distSqSum;
        for (let i = 0; i < nodes.length; i++) {
          if (d[i] == 0) continue;
          r -= d[i];
          if (r <= 0) {
            // console.log(`KMeans++ selected node: #${i} R=${(nodes[i] & 0xff)}
            // G=${
            //     (nodes[i] >> 8) & 0xff} B=${(nodes[i] >> 16) & 0xff}`);
            centerNodeIndices.push(i);
            centroidMark.set(i, true);
            break;
          }
        }
      }
    }

    for (let i = 0; i < args.numColors; i++) {
      const cIdx = centerNodeIndices[i];
      // console.log(`KMeans++ init color[${i}]: R=${(nodes[cIdx] & 0xff)} G=${
      //(nodes[cIdx] >> 8) & 0xff} B=${(nodes[cIdx] >> 16) & 0xff}`);
      centers[i].copyFrom(nodes[cIdx]);
    }

    const newCenters = new Array<Vec3>(args.numColors);
    newCenters.fill(new Vec3());

    const numNodes = new Array(args.numColors).fill(0);

    // K-Means 法でセントロイドを更新する
    const maxIters = 100;
    for (let iter = 0; iter < maxIters; iter++) {
      // 各ノードを最も近いセントロイドに割り当てる

      for (let i = 0; i < args.numColors; i++) {
        newCenters[i].set(0, 0, 0);
      }
      numNodes.fill(0);
      for (const node of nodes) {
        const {index: cIdx} = nearestCenter(centers, node);
        newCenters[cIdx].add(node);
        numNodes[cIdx]++;
      }
      for (let i = 0; i < args.numColors; i++) {
        newCenters[i].mul(1 / numNodes[i]);
      }

      let converged = true;
      for (let i = 0; i < args.numColors; i++) {
        const d = centers[i].dist(newCenters[i]);
        if (d >= 1e-5) converged = false;
        centers[i].copyFrom(newCenters[i]);
      }
      if (converged) break;
    }
  }

  const palette = new IndexedPalette(args.channelBits, args.indexBits);
  const numCh = args.channelBits.length;
  for (let i = 0; i < args.numColors; i++) {
    // console.log(`KMeans color[${i}]: R=${Math.round(centerR[i])} G=${
    //     Math.round(centerG[i])} B=${Math.round(centerB[i])}`);
    const r = clip(0, 1, centers[i].x);
    const g = clip(0, 1, centers[i].y);
    const b = clip(0, 1, centers[i].z);
    const idx = i + args.indexOffset;
    switch (numCh) {
      case 1:
        palette.colors[idx] = r;
        break;
      case 3:
        palette.colors[idx * numCh + 0] = r;
        palette.colors[idx * numCh + 1] = g;
        palette.colors[idx * numCh + 2] = b;
        break;
      default:
        throw new Error('Invalid number of channels');
    }
    palette.enabled[idx] = true;
  }
  args.out = palette;
}

function nearestCenterNode(
    nodes: Vec3[], centerNodeIndices: number[],
    target: Vec3): {index: number, distSq: number} {
  let bestIdx = -1;
  let bestDistSq = Number.MAX_VALUE;
  for (let i = 0; i < centerNodeIndices.length; i++) {
    const cIdx = centerNodeIndices[i];
    const distSq = nodes[cIdx].distSq(target);
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestIdx = cIdx;
    }
  }
  return {index: bestIdx, distSq: bestDistSq};
}

function nearestCenter(
    centers: Vec3[], target: Vec3): {index: number, distSq: number} {
  let bestIdx = -1;
  let bestDistSq = Number.MAX_VALUE;
  for (let i = 0; i < centers.length; i++) {
    const distSq = centers[i].distSq(target);
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestIdx = i;
    }
  }
  return {index: bestIdx, distSq: bestDistSq};
}
