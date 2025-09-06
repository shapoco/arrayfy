
export function clip(min: number, max: number, val: number): number {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}

export function intCeil(val: number, unit: number): number {
  return Math.ceil(val / unit) * unit;
}
