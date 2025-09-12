export class StopWatch {
  lastTime: number;
  constructor(public report: boolean) {
    this.lastTime = performance.now();
    this.report = report;
  }

  lap(label: string): number {
    const now = performance.now();
    const elapsed = now - this.lastTime;
    if (this.report) {
      console.log(`${elapsed.toFixed(1)} ms: ${label}`);
    }
    this.lastTime = now;
    return elapsed;
  }
}
