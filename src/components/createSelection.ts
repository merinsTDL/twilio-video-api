
export function createSelection({ id, container, options = ['dog', 'cat', 'parrot', 'rabbit'], title = 'Pets', labelClasses = [], onChange = () => { } }: {
  id?: string,
  container: HTMLElement,
  options: string[],
  title: string,
  labelClasses?: string[],
  onChange: () => void;
}) {
  const select = document.createElement('select');
  if (id) {
    select.id = id;
  }

  for (const val of options) {
    const option = document.createElement('option');
    option.value = val;
    option.text = val;
    select.appendChild(option);
  }

  const label = document.createElement('label');
  label.innerHTML = title;
  label.htmlFor = select.id;
  label.classList.add(...labelClasses);

  select.addEventListener('change', onChange);

  container.appendChild(label).appendChild(select);
  return {
    select,
    getValue: () => { return select.value; },
    setValue: (value: string) => { select.value = value; /* not if the value is not one of the options then a blank value gets selected */ }
  };
}
