export function createRadioSelection({ container, name, options = ['dog', 'cat', 'parrot', 'rabbit'], defaultChoice = null, labelClasses = [], onChange = () => { } }: {
  container: HTMLElement,
  options: string[],
  labelClasses?: string[],
  name: string,
  defaultChoice?: string |null,
  onChange: () => void;
}) {

  for (const val of options) {
    const checkbox = document.createElement('input');
    checkbox.type = 'radio';
    checkbox.name = name;
    checkbox.value = val;
    checkbox.id = val;
    if (defaultChoice === val) {
      checkbox.checked = true;
    }

    const label = document.createElement('label')
    label.htmlFor = checkbox.id;
    label.appendChild(document.createTextNode(checkbox.value));
    checkbox.addEventListener('change', onChange);

    var br = document.createElement('br');
    container.appendChild(checkbox);
    container.appendChild(label);
    container.appendChild(br);
  }

  return {
    getValue: () => {
      const items = container.getElementsByTagName('input') as HTMLCollectionOf<HTMLInputElement>
      for(let i = 0; i < items.length; i++) {
        if (items[i].checked) {
          return items[i].value;
        }
      }
    }
  };
}
