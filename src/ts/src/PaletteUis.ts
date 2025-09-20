import * as Colors from './Colors';
import {PixelFormatInfo} from './Images';
import * as Palettes from './Palettes';
import * as Ui from './Ui';

export type PaletteUiEntry = {
  color: number,
  enabled: boolean
};

const PADDING = 1;
const CELL_SIZE = 22;
const CELL_MARGIN = 3;
const CELL_STRIDE = CELL_SIZE + CELL_MARGIN;

const MIN_COLS = 4;
const MAX_COLS = 32;

export class PaletteUi {
  public container = document.createElement('div');
  private colorBox = Ui.makeTextBox('', '', 8);
  private enabledBox = Ui.makeCheckBox('有効');
  private canvas = document.createElement('canvas');
  private entries = new Array<PaletteUiEntry>(Palettes.MAX_PALETTE_SIZE);
  private size = 0;
  private renderTimeoutId: number|null = null;
  private cols = MAX_COLS;
  private rows = 1;
  private visible: boolean = false;
  private selIndex: number = -999;
  private paletteCache: Palettes.IndexedPalette|null = null;

  constructor() {
    this.canvas.style.width = '100%';
    this.queryRender();

    this.container.appendChild(Ui.makeFloatList([
      Ui.tip(['色: ', this.colorBox], '16進数で指定します。'),
      Ui.tip(
          [this.enabledBox.parentElement],
          'このエントリの使用可否を指定します。'),
    ]));
    this.container.appendChild(Ui.makeParagraph([this.canvas]));

    this.colorBox.addEventListener('change', () => {
      this.onColorBoxChange();
    });
    this.colorBox.addEventListener('input', () => {
      this.onColorBoxChange();
    });
    this.enabledBox.addEventListener('change', () => {
      if (this.selectedIndex < 0) return;
      this.entries[this.selectedIndex].enabled = this.enabledBox.checked;
      this.paletteCache = null;
      this.queryRender();
    });

    this.canvas.addEventListener('pointermove', (e) => {
      e.preventDefault();
      const pointedIndex = this.clientPosToIndex(e.offsetX, e.offsetY);
      this.canvas.style.cursor = pointedIndex >= 0 ? 'pointer' : 'default';
    });
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.selectedIndex = this.clientPosToIndex(e.offsetX, e.offsetY);
      this.queryRender();
    });

    this.selectedIndex = -1;
  }

  public getPalette(fmt: PixelFormatInfo): Palettes.IndexedPalette {
    if (!this.paletteCache) {
      const newPalette =
          new Palettes.IndexedPalette(fmt.colorBits, fmt.indexBits);
      const numColors = (1 << newPalette.indexBits);
      for (let i = 0; i < numColors; i++) {
        const entry = this.getEntry(i);
        const {r, g, b} = Colors.rgbU32ToF32(entry.color);
        newPalette.colors[i * 3 + 0] = r;
        newPalette.colors[i * 3 + 1] = g;
        newPalette.colors[i * 3 + 2] = b;
        newPalette.enabled[i] = entry.enabled;
      }
      this.paletteCache = newPalette;
    }
    return this.paletteCache;
  }

  public onColorBoxChange(): void {
    if (this.selectedIndex < 0) return;
    this.entries[this.selectedIndex].color =
        Colors.strToU32(this.colorBox.value);
    this.paletteCache = null;
    this.queryRender();
  }

  public setSize(size: number): void {
    if (this.size === size) return;
    if (size < 0 || size > this.entries.length) {
      throw new Error('Size out of range');
    }
    this.size = size;
    this.paletteCache = null;
    this.queryRender();
  }

  public clear(): void {
    for (let i = 0; i < this.entries.length; i++) {
      this.entries[i] = {color: 0, enabled: false};
    }
    this.paletteCache = null;
    this.queryRender();
  }

  public setEntry(index: number, entry: PaletteUiEntry): void {
    const old = this.entries[index];
    if (old.color === entry.color && old.enabled === entry.enabled) {
      return;
    }
    if (index < 0 || index >= this.size) {
      throw new Error('Index out of range');
    }
    this.entries[index] = entry;
    this.paletteCache = null;
    this.queryRender();
  }

  public getEntry(index: number): PaletteUiEntry {
    if (index < 0 || index >= this.size) {
      throw new Error('Index out of range');
    }
    return this.entries[index];
  }

  public get selectedIndex(): number {
    return this.selIndex;
  }

  public set selectedIndex(index: number) {
    if (this.selIndex === index) return;
    if (index >= this.size) {
      throw new Error('Index out of range');
    }
    this.selIndex = index;
    if (index >= 0) {
      this.colorBox.value = Colors.u32ToHexStr(this.entries[index].color);
      this.enabledBox.checked = this.entries[index].enabled;
      this.colorBox.disabled = false;
      this.enabledBox.disabled = false;
    } else {
      this.colorBox.value = '';
      this.enabledBox.checked = false;
      this.colorBox.disabled = true;
      this.enabledBox.disabled = true;
    }

    this.queryRender();
  }

  public clientPosToIndex(x: number, y: number): number {
    const col = Math.floor((x - PADDING) / CELL_STRIDE);
    const row = Math.floor((y - PADDING) / CELL_STRIDE);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return -1;
    }
    const subX = (x - PADDING) % CELL_STRIDE;
    const subY = (y - PADDING) % CELL_STRIDE;
    if (subX >= CELL_SIZE || subY >= CELL_SIZE) {
      return -1;
    }
    const index = row * this.cols + col;
    if (index >= this.size) {
      return -1;
    }
    return index;
  }

  public onRelayout(): void {
    this.queryRender();
  }

  public setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.visible = visible;
    Ui.setVisible(this.canvas, visible);
    if (visible) this.onRelayout();
  }

  public queryRender(): void {
    if (this.renderTimeoutId !== null) return;
    this.renderTimeoutId = window.setTimeout(() => {
      // requestAnimationFrame で遅延させないと
      // clientWidth が 0 になることがある
      window.requestAnimationFrame(() => this.render());
    }, 10);
  }

  public render(): void {
    this.renderTimeoutId = null;

    const canvasW = this.canvas.clientWidth;
    if (canvasW == 0) {
      // requestAnimationFrame で遅延させてもなお
      // clientWidth が 0 になることがある
      this.queryRender();
      return;
    }

    this.cols = MAX_COLS;
    while (this.cols * CELL_STRIDE - CELL_MARGIN + PADDING * 2 > canvasW &&
           this.cols > MIN_COLS) {
      this.cols = Math.floor(this.cols / 2);
    }

    if (this.size < this.cols) {
      this.cols = this.size;
      this.rows = 1;
    } else {
      this.rows = Math.ceil(this.size / this.cols);
    }

    const canvasH = this.rows * CELL_STRIDE - CELL_MARGIN + PADDING * 2;

    this.canvas.width = canvasW;
    this.canvas.height = canvasH;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasW, canvasH);

    for (let i = 0; i < this.size; i++) {
      const ix = i % this.cols;
      const iy = Math.floor(i / this.cols);
      const x = PADDING + ix * CELL_STRIDE;
      const y = PADDING + iy * CELL_STRIDE;

      const entry = this.entries[i];

      ctx.fillStyle = Colors.u32ToHexStr(entry.color);
      ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

      if (!entry.enabled) {
        const gray = Colors.grayscaleU32(entry.color);
        ctx.strokeStyle = gray < 128 ? '#fff' : '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
        ctx.moveTo(x + CELL_SIZE, y);
        ctx.lineTo(x, y + CELL_SIZE);
        ctx.stroke();
      }

      if (i == this.selIndex) {
        ctx.strokeStyle = Ui.selectedColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      } else {
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
      }
    }
  }
}
