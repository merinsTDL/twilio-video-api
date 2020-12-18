import { createElement } from './createElement';

export function createLink({ container, linkText, linkUrl, newTab = false } : {
  container: HTMLElement,
  linkText: string,
  linkUrl: string,
  newTab? : boolean
}) : HTMLAnchorElement {
  var a = createElement({ container, type: 'a' }) as HTMLAnchorElement;
  a.appendChild(document.createTextNode(linkText));
  a.title = linkText;
  a.href = linkUrl;
  if (newTab) {
    a.target = '_blank';
  }
  return a;
}
