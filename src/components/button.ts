export interface IButton {
  btn: HTMLButtonElement,
  show: (visible: boolean) => void;
  text: (newText: string) => void;
  click: () => void;
  enable: () => void;
  disable: () => void;
};

import jss from '../jss'

// Create your style.
const style = {
  button: {
    height: '2em',
    margin: '5px',
  },
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

export function createButton(text: string, container: HTMLElement, onClick: () => void): IButton {
  const btn = document.createElement('button') as HTMLButtonElement;
  btn.classList.add(sheet.classes.button);
  btn.innerHTML = text;
  btn.onclick = onClick;
  container.appendChild(btn);
  return {
    btn,
    show: (visible: boolean) => { btn.style.display = visible ? 'inline-block' : 'none'; },
    text: (newText: string) => { btn.innerHTML = newText; },
    click: () => onClick(),
    enable: () => { btn.disabled = false; },
    disable: () => { btn.disabled = true; }
  };
}

