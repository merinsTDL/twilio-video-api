export function getBooleanUrlParam(paramName: string, defaultValue: boolean): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has(paramName)) {
    const paramValue = urlParams.get(paramName);
    if (paramValue === null) {
      return defaultValue;
    } else if (paramValue.length === 0) {
      // when url=www.foo.com?autoJoin&bar
      // urlParams.get('autoJoin') returns ''
      // ?autoJoin&foo should return autoJoin = true;
      return true;
    } else if (!paramValue || paramValue.toLowerCase() === 'false') {
      return false;
    } else {
      return true;
    }
  }
  return defaultValue;
}

