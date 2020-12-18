import createButton from './button';
import { createDiv } from './createDiv';

export function createCollapsibleDiv({ container, headerText, divClass } : {
  container: HTMLElement,
  headerText: string,
  divClass: string[] | string
}) : HTMLDivElement {
  const collapsibleDiv = createDiv(container, ['collapsible']);
  const headerDiv = createDiv(collapsibleDiv, 'roomHeaderDiv');
  const innerDiv = createDiv(collapsibleDiv, divClass);
  let display = 'none';
  const showHideButton = createButton(`hide: ${headerText}`, headerDiv, () => {
    if (innerDiv.style.display === 'none') {
      innerDiv.style.display = display;
      showHideButton.text(`hide: ${headerText}`);
    } else {
      display = innerDiv.style.display;
      innerDiv.style.display = 'none';
      showHideButton.text(`show: ${headerText}`);
    }
  });
  return innerDiv;
}
