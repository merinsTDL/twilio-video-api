import { createElement } from './createElement';

export function createLabeledCheckbox({ container, labelText, id } : {
  container: HTMLElement,
  labelText: string,
  id: string,
}): HTMLInputElement {

  const label = createElement({ container, type: 'label', innerHtml: labelText});
  label.setAttribute('for', id);

  const checkbox = createElement({ container: label, type: 'input', id }) as HTMLInputElement;
  checkbox.setAttribute('type', 'checkbox');

  return checkbox;
}
