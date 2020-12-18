import { createElement } from './createElement';

export function createDiv(container: HTMLElement, divClass: string[] | string, id?: string): HTMLDivElement {
  divClass = Array.isArray(divClass) ? divClass : [divClass];
  return createElement({ container, type: 'div', classNames: divClass, id }) as HTMLDivElement;
}
