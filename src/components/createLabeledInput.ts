import { createElement } from './createElement';

export function createLabeledInput({ container, labelText, placeHolder, initialValue, labelClasses = [], inputType = 'input', inputClasses = [], labelParent = false }: {
  container: HTMLElement,
  labelText: string | HTMLElement,
  placeHolder: string,
  initialValue?: string,
  labelClasses?: string[],
  inputType?: string,
  inputClasses?:string[],
  labelParent?: boolean
}) : HTMLInputElement {
  let identityLabel = null;
  if (typeof labelText === 'string')  {
    identityLabel = createElement({ container, type: 'label', classNames: labelClasses, innerHtml: labelText });
  } else {
    identityLabel = labelText;
  }
  const inputElement = createElement({ container: labelParent ? identityLabel : container, type: inputType, classNames: inputClasses }) as HTMLInputElement;
  inputElement.placeholder = placeHolder;
  if (initialValue) {
    inputElement.value = initialValue;
  }

  return inputElement;
}
