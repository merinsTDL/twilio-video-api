import { createElement } from './createElement';

import jss from '../jss'

// Create your style.
const style = {
  labeledStat: {
    background: 'solid green 2px',
    margin: '2px'
  },
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

export interface ILabeledStat {
  setText: (text: string) => void;
};

export function createLabeledStat({ container, label, id, valueMapper } : {
  container: HTMLElement,
  label: string,
  id? : string,
  valueMapper?: (text: string) => string|undefined
}) {
  const classNames = [sheet.classes.labeledStat];
  const el = createElement({container, type: 'p', id, classNames });
  let lastClass: string|undefined;
  return {
    element: el,
    setLabel: (newLabel: string) => {
      label = newLabel;
    },
    setText: (text: string) => {
      if (lastClass) {
        el.classList.remove(lastClass);
      }

      el.textContent = label + ': ' + text;

      if (valueMapper) {
        lastClass = valueMapper(text);
        if (lastClass) {
          el.classList.add(lastClass);
        }
      }
    }
  };
}
