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
    overflow: 'hidden',
    'text-align': 'left',
    'background-color': 'black',
    color: 'white',
    padding: "3px 6px"
  },
  nonCollapsedStyle: {
    // border: 'none',
    padding: 0,
  },
  collapsedStyle: {
    border: 'none',
    padding: 0,
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

export function createCollapsibleDiv_1({ container, headerText, divClass } : {
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

export function createCollapsibleDiv_2({ container, headerText, divClass, startHidden = false } : {
  container: HTMLElement,
  headerText: string,
  divClass: string[] | string,
  startHidden?: boolean
}) : { innerDiv: HTMLDivElement, outerDiv: HTMLFieldSetElement } {

  // NOTE: on safari - if the fieldset is styled with display:flex, the legend onClick does not work.
  // we need to remove the display flex from the
  const divClasses = Array.isArray(divClass) ? [...divClass, sheet.classes.nonCollapsedStyle] : [divClass, sheet.classes.nonCollapsedStyle];
  const { fieldset: collapsibleDiv, legend } = createFieldSet({ container, headerText, divClasses, legendClasses: [sheet.classes.legendStyle]});


  let innerDivDisplayStyle = 'none';
  legend.addEventListener('click', () => {
    console.log('makarand: click');
    if (innerDiv.style.display === 'none') {
      // show
      innerDiv.style.display = innerDivDisplayStyle;
      collapsibleDiv.classList.remove(sheet.classes.collapsedStyle);
      collapsibleDiv.classList.add(...divClasses);

    } else {
      // hide
      innerDivDisplayStyle = innerDiv.style.display;
      innerDiv.style.display = 'none';
      collapsibleDiv.classList.remove(...divClasses);
      collapsibleDiv.classList.add(sheet.classes.collapsedStyle);
    }
  })
  const innerDiv = createDiv(collapsibleDiv, [sheet.classes.displayContents]);
  innerDivDisplayStyle = innerDiv.style.display;
  if (startHidden) {
    legend.click();
  }
  return {
    innerDiv,
    outerDiv: collapsibleDiv
  };
}


export function createCollapsibleDiv({ container, headerText, divClass, startHidden = false } : {
  container: HTMLElement,
  headerText: string,
  divClass: string[] | string,
  startHidden?: boolean
}) : { innerDiv: HTMLDivElement, outerDiv: HTMLFieldSetElement } {

  // NOTE: on safari - if the fieldset is styled with display:flex, the legend onClick does not work.
  // we need to remove the display flex from the
  const divClasses = Array.isArray(divClass) ? [...divClass] : [divClass, sheet.classes.nonCollapsedStyle];
  const { fieldset: collapsibleDiv, legend } = createFieldSet({ container, headerText: `- ${headerText}`, divClasses:[sheet.classes.nonCollapsedStyle], legendClasses: [sheet.classes.legendStyle]});


  let innerDivDisplayStyle = 'none';
  legend.addEventListener('click', () => {
    console.log('makarand: click');
    if (innerDiv.style.display === 'none') {
      // show
      innerDiv.style.display = innerDivDisplayStyle;
      collapsibleDiv.classList.remove(sheet.classes.collapsedStyle);
      collapsibleDiv.classList.add(sheet.classes.nonCollapsedStyle);
      legend.innerHTML = `- ${headerText}`;
    } else {
      // hide
      innerDivDisplayStyle = innerDiv.style.display;
      innerDiv.style.display = 'none';
      collapsibleDiv.classList.remove(sheet.classes.nonCollapsedStyle);
      collapsibleDiv.classList.add(sheet.classes.collapsedStyle);
      legend.innerHTML = `+ ${headerText}`;
    }
  })
  const innerDiv = createDiv(collapsibleDiv, divClasses);
  innerDivDisplayStyle = innerDiv.style.display;
  if (startHidden) {
    legend.click();
  }
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

