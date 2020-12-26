import { createElement } from './components/createElement';

import jss from './jss'

// Create your style.
const style = {
  header: {
    color: 'white',
    margin: '0.25em',
    'min-width': '100px',
    'background-color': '#00000066',
    'border-radius': '4px',
    'text-overflow': 'ellipsis',
    'overflow': 'hidden',
    'white-space': 'nowrap',
  },
};
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

export function createHeader({ container, text, type = 'h3', classNames }: {
  container: HTMLElement;
  text: string;
  type?: string;
  classNames?: string[];
}) {

  if (!classNames) {
    classNames = [sheet.classes.header];
  }
  const el = createElement({ container, type, classNames });
  el.innerHTML = text;
  return el;
}
