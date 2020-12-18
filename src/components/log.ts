/* eslint-disable no-console */
import createButton from './button';

let logClearBtn: { btn: HTMLButtonElement; show: (visible: boolean) => void; text: (newText: string) => void; click: () => void; enable: () => void; disable: () => void; };
let realLogDiv: HTMLDivElement;
export function createLog(logDiv? : HTMLElement) {
  if (!logClearBtn) {
    if (!logDiv) {
      logDiv = document.createElement('div');
      document.body.appendChild(logDiv);
    }
    logClearBtn = createButton('clear log', logDiv, () => {
      realLogDiv.innerHTML = '';
    });

    realLogDiv = document.createElement('div');
    logDiv.appendChild(realLogDiv);
  }
}

export function log(...args: any[]) {
  createLog();
  const message = args.map(arg => String(arg)).join(', ');
  realLogDiv.innerHTML += '<p>' + message  + '</p>';
  realLogDiv.scrollTop = realLogDiv.scrollHeight;
  console.log(...args);
}
