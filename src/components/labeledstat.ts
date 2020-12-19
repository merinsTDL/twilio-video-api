import { createElement } from './createElement';

export interface ILabeledStat {
  setText: (text: string) => void;
};

export function createLabeledStat({ container, label,  id, className, useValueToStyle = false } : {
  container: HTMLElement,
  label: string,
  className: string,
  id? : string,
  useValueToStyle?: boolean
}) {
  const el = createElement({container, type: 'p', id, classNames: [className, 'labeledStat'] });
  let lastText: string | null;
  return {
    setText: (text: string) => {
      if (useValueToStyle && lastText !== null) {
        el.classList.remove(`${className}_${lastText}`);
      }
      el.textContent = label + ': ' + text;
      if (useValueToStyle) {
        el.classList.add(`${className}_${text}`);
        lastText = text;
      }
    }
  };
}
