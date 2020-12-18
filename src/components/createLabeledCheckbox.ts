import { createElement } from './createElement';

export function createLabeledCheckbox({ container, labelText, id } : {
  container: HTMLElement,
  labelText: string,
  id: string,
}): HTMLInputElement {
  const checkbox = createElement({ container, type: 'input', id }) as HTMLInputElement;
  checkbox.setAttribute('type', 'checkbox');

  const label = createElement({ container, type: 'label' });
  label.innerHTML = labelText;
  label.setAttribute('for', id);
  return checkbox;
}
