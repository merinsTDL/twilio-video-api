export default function createButton(text: string, container: HTMLElement, onClick: () => void) {
  const btn = document.createElement('button') as HTMLButtonElement;
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

