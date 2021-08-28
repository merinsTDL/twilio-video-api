import { createButton } from './button';
import { createDiv } from './createDiv';

import jss from '../jss'

// Create your style.
const style = {
  roomHeaderDiv: {
    all: 'flex'
  },
  displayContents: {
    display: 'contents'
  },
  legendStyle: {
    'text-align': 'left',
    'background-color': 'black',
    color: 'white',
    padding: "3px 6px"
  },
  collapsedStyle: {
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

export function createCollapsibleDiv_old({ container, headerText, divClass } : {
  container: HTMLElement,
  headerText: string,
  divClass: string[] | string
}) : { innerDiv: HTMLDivElement, outerDiv: HTMLDivElement } {
  const collapsibleDiv = createDiv(container, ['collapsible']);
  const headerDiv = createDiv(collapsibleDiv, sheet.classes.roomHeaderDiv);
  const innerDiv = createDiv(collapsibleDiv, divClass);
  let display = 'none';
  const showHideButton = createButton(`- ${headerText}`, headerDiv, () => {
    if (innerDiv.style.display === 'none') {
      innerDiv.style.display = display;
      showHideButton.text(`- ${headerText}`);
    } else {
      display = innerDiv.style.display;
      innerDiv.style.display = 'none';
      showHideButton.text(`+ ${headerText}`);
    }
  });
  return {
    innerDiv,
    outerDiv: collapsibleDiv
  };
}

export function createCollapsibleDiv({ container, headerText, divClass } : {
  container: HTMLElement,
  headerText: string,
  divClass: string[] | string
}) : { innerDiv: HTMLDivElement, outerDiv: HTMLFieldSetElement } {

  const divClasses = Array.isArray(divClass) ? divClass : [divClass];
  const { fieldset: collapsibleDiv, legend } = createFieldSet({ container, headerText, divClasses, legendClasses: [sheet.classes.legendStyle]});
  let display = 'none';
  legend.addEventListener('click', () => {
    if (innerDiv.style.display === 'none') {
      // show
      innerDiv.style.display = display;
      collapsibleDiv.classList.remove(sheet.classes.collapsedStyle);
      collapsibleDiv.classList.add(...divClasses);

    } else {
      // hide
      display = innerDiv.style.display;
      innerDiv.style.display = 'none';
      collapsibleDiv.classList.remove(...divClasses);
      collapsibleDiv.classList.add(sheet.classes.collapsedStyle);
    }
  })
  const innerDiv = createDiv(collapsibleDiv, [sheet.classes.displayContents]);
  return {
    innerDiv,
    outerDiv: collapsibleDiv
  };
}

export function createFieldSet({ container, headerText, divClasses, legendClasses = [] } : {
  container: HTMLElement,
  headerText: string,
  divClasses: string[],
  legendClasses?: string[],
}): { fieldset: HTMLFieldSetElement; legend: HTMLLegendElement; }  {
  const fieldset = document.createElement('fieldset');
  const legend = document.createElement("legend");
  legend.innerHTML = headerText;
  legend.classList.add(...legendClasses);
  fieldset.appendChild(legend);
  container.appendChild(fieldset);
  fieldset.classList.add(...divClasses);
  return { fieldset, legend };
}

