export async function getCreds(environment: string): Promise<{signingKeySecret:string, signingKeySid: string }> {
  const { protocol, host } = window.location;
  const urlParams = new URLSearchParams(window.location.search);
  const serverUrl = urlParams.get('server') || `${protocol}//${host}`;
  let url = new URL(serverUrl + '/getCreds');
  url.search = (new URLSearchParams({ environment })).toString();
  const response = await fetch(url.toString());
  if (response.ok) {
    return response.json();
  }
  throw new Error(`Failed to obtain creds from from ${url}, Status: ${response.status}`);
}

