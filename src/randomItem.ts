export function randomItem<T>(array: T[]) {
  var randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}
