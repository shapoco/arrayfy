import {clip} from './Utils';

export function toElementArray(children: any): HTMLElement[] {
  if (children == null) {
    return [];
  }
  if (!Array.isArray(children)) {
    children = [children];
  }
  for (let i = 0; i < children.length; i++) {
    if (typeof children[i] === 'string') {
      children[i] = document.createTextNode(children[i]);
    } else if (children[i] instanceof Node) {
      // Do nothing
    } else {
      throw new Error('Invalid child element');
    }
  }
  return children;
}

export function makeSection(children: any = []): HTMLDivElement {
  const div = document.createElement('div');
  div.classList.add('propertySection');
  toElementArray(children).forEach(child => div.appendChild(child));
  return div;
}

export function makeFloatList(
    children: any = [], sep: boolean = true): HTMLUListElement {
  const ul = document.createElement('ul');
  toElementArray(children).forEach(child => {
    if (!child.classList) {
      child = makeSpan(child);
    }

    const li = document.createElement('li');
    li.appendChild(child);
    if (sep && child.classList && !child.classList.contains('sectionHeader')) {
      li.style.marginRight = '20px';
    }
    ul.appendChild(li);
  });
  return ul;
}

export function makeGroup(children: any = []): HTMLDivElement {
  const div = document.createElement('div');
  div.classList.add('group');
  toElementArray(children).forEach(child => div.appendChild(child));
  return div;
}

export function makeGroupTitle(children: any = []): HTMLDivElement {
  const div = document.createElement('div');
  div.classList.add('groupTitle');
  toElementArray(children).forEach(child => div.appendChild(child));
  return div;
}

export function makeGroupBody(children: any = []): HTMLDivElement {
  const div = document.createElement('div');
  div.classList.add('groupBody');
  toElementArray(children).forEach(child => div.appendChild(child));
  return div;
}

export function makeDiv(children: any = []): HTMLDivElement {
  const p = document.createElement('div');
  toElementArray(children).forEach(child => p.appendChild(child));
  return p;
}

export function makeParagraph(children: any = []): HTMLParagraphElement {
  const p = document.createElement('p');
  toElementArray(children).forEach(child => p.appendChild(child));
  return p;
}

export function makeSpan(children: any = []): HTMLSpanElement {
  const span = document.createElement('span');
  toElementArray(children).forEach(child => span.appendChild(child));
  return span;
}

export function makeNowrap(children: any = []): HTMLSpanElement {
  const span = document.createElement('span');
  span.classList.add('nowrap');
  toElementArray(children).forEach(child => span.appendChild(child));
  return span;
}

export function makeHeader(text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.classList.add('sectionHeader');
  span.textContent = text;
  return span;
}

export function makeTextBox(
    value = '', placeholder = '', maxLength = 100): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.placeholder = placeholder;
  input.style.width = '60px';
  input.style.textAlign = 'right';
  input.maxLength = maxLength;
  input.inputMode = 'decimal';
  input.addEventListener('focus', () => input.select());
  return input;
}

export function makeSelectBox(
    items: {value: number, label: string, tip?: string}[],
    defaultValue: number): HTMLSelectElement {
  const select = document.createElement('select');
  for (const item of items) {
    const option = document.createElement('option');
    option.value = item.value.toString();
    option.textContent = item.label;
    if (item.tip) {
      option.title = item.tip;
    }
    select.appendChild(option);
  }
  select.value = defaultValue.toString();
  return select;
}

export function makeCheckBox(labelText: string): HTMLInputElement {
  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(labelText));
  return checkbox;
}

export function makeButton(text = ''): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  return button;
}

export function basic(elem: HTMLElement): HTMLElement {
  elem.classList.add('basic');
  return elem;
}

export function pro(elem: HTMLElement): HTMLElement {
  elem.classList.add('professional');
  return elem;
}

export function show(elem: HTMLElement): HTMLElement {
  elem.classList.remove('hidden');
  return elem;
}

export function hide(elem: HTMLElement): HTMLElement {
  elem.classList.add('hidden');
  return elem;
}

export function setVisible(elem: HTMLElement, visible: boolean): HTMLElement {
  return visible ? show(elem) : hide(elem);
}

export function tip(children: any, text: string): HTMLElement {
  let target: HTMLElement;
  if (children instanceof HTMLElement) {
    target = children;
  } else {
    target = makeSpan(children);
  }
  if (text) target.title = text;
  return target;
}

export function parentLiOf(child: HTMLElement): HTMLLIElement {
  let parent = child;
  while (parent && parent.tagName !== 'LI') {
    parent = parent.parentElement as HTMLElement;
  }
  return parent as HTMLLIElement;
}

export function upDown(
    elem: HTMLElement, min: number, max: number, step: number): HTMLElement {
  const upDownButton = makeButton('');
  upDownButton.classList.add('upDown');
  upDownButton.tabIndex = -1;

  const textBox = elem as HTMLInputElement;

  upDownButton.addEventListener('pointermove', (e) => {
    e.preventDefault();
    if (upDownButton.dataset.dragStartY && upDownButton.dataset.dragStartVal) {
      const y = e.offsetY;
      const startY = parseFloat(upDownButton.dataset.dragStartY);
      const startVal = parseFloat(upDownButton.dataset.dragStartVal);

      const n = (max - min) / step;
      let deltaY = Math.round((y - startY) * n / 512);

      let val = clip(min, max, startVal - deltaY * step);
      textBox.value = (Math.round(val * 100) / 100).toString();
      textBox.dispatchEvent(new Event('change'));
    }
  });

  upDownButton.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const y = e.offsetY;
    let val: number;
    if (textBox.value.trim()) {
      val = parseFloat(textBox.value.trim());
    } else {
      val = parseFloat(textBox.placeholder.replaceAll(/[\(\)]/g, '').trim());
    }
    val = Math.round(val / step) * step;
    upDownButton.dataset.dragStartY = y.toString();
    upDownButton.dataset.dragStartVal = val.toString();
    upDownButton.style.cursor = 'grabbing';
    upDownButton.setPointerCapture(e.pointerId);
  });

  upDownButton.addEventListener('pointerup', (e) => {
    e.preventDefault();
    delete upDownButton.dataset.dragStartY;
    delete upDownButton.dataset.dragStartVal;
    upDownButton.style.cursor = 'ns-resize';
    upDownButton.releasePointerCapture(e.pointerId);
  });
  upDownButton.addEventListener('touchstart', (e) => e.preventDefault());
  upDownButton.addEventListener('touchmove', (e) => e.preventDefault());
  upDownButton.addEventListener('touchend', (e) => e.preventDefault());

  return makeSpan([textBox, upDownButton]);
}
