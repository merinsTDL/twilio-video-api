import { createButton } from './button';
import { createDiv } from './createDiv';

import jss from '../jss'

const style = {
  innerDiv_off: {
    'max-height': 0,
    'max-width': 0,
    transition: 'all 200ms ease-in-out',
    overflow: 'hidden',
  },
  innerDiv_on: {
    'max-height': '1500px',
    transition: 'all 200ms ease-in-out',
    padding: 0,
  },
  legendStyle: {
    'white-space': 'nowrap',
    overflow: 'hidden',
    'text-align': 'left',
    'background-color': 'darkslategray',
    color: 'white',
    padding: "3px 6px"
  },
  outerDiv_on: {
    padding: 0,
  },
  outerDiv_off: {
    width:0,
    border: 'none',
    padding: 0,
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

export function createCollapsibleDiv({ container, headerText, divClass, startHidden = false } : {
  container: HTMLElement,
  headerText: string,
  divClass: string[] | string,
  startHidden?: boolean
}) : { innerDiv: HTMLDivElement, outerDiv: HTMLFieldSetElement } {

  // NOTE: on safari - if the fieldset is styled with display:flex, the legend onClick does not work.
  // we need to remove the display flex from the
  const { fieldset: collapsibleDiv, legend } = createFieldSet({ container, headerText: `- ${headerText}`, divClasses:[sheet.classes.outerDiv_on], legendClasses: [sheet.classes.legendStyle]});
  const divClasses = Array.isArray(divClass) ? [...divClass] : [divClass];
  divClasses.push(sheet.classes.innerDiv_on);
  const innerDiv = createDiv(collapsibleDiv, divClasses);

  let originalInnerDisplayStyle = innerDiv.style.display;
  legend.addEventListener('click', () => {
    const wasVisible = innerDiv.classList.contains(sheet.classes.innerDiv_on);
    legend.innerHTML = `${wasVisible ? '+' : '-'} ${headerText}`;
    innerDiv.classList.toggle(sheet.classes.innerDiv_on);
    innerDiv.classList.toggle(sheet.classes.innerDiv_off);
    collapsibleDiv.classList.toggle(sheet.classes.outerDiv_off);
    collapsibleDiv.classList.toggle(sheet.classes.outerDiv_on);
    // if (!wasVisible) {
    //   innerDiv.style.display = originalInnerDisplayStyle;
    // }
    innerDiv.addEventListener('animationend', () => {
      // if (wasVisible) {
      //   innerDiv.style.display = "none";
      // }
    });

    // display cannot be set in css, because original css may overwrite it.
    // innerDiv.style.display = wasVisible ? 'none' : originalInnerDisplayStyle;
  });

  if (startHidden) {
    setTimeout(() => legend.click());
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

