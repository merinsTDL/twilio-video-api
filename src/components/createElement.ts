export function createElement({ container, type, id, classNames, style }: {
  container: HTMLElement,
  type: string,
  id?: string
  classNames?: string[],
  style?: string
}): HTMLElement {
  const el = document.createElement(type);
  if (id) {
    el.id = id;
  }
  if (classNames) {
    el.classList.add(...classNames);
  }

  if (style) {
    el.setAttribute('style', style);
  }

  container.appendChild(el);
  return el;
}
