export type REST_CREDENTIALS = {
  signingKeySecret:string,
  signingKeySid: string,
  restUrl: string
  restUrlNoCreds: string
};

// returns credentials to be used for rest calls.
export async function getRestCreds(environment: string, serverUrl: string): Promise<REST_CREDENTIALS> {
  const { protocol, host } = window.location;
  const urlParams = new URLSearchParams(window.location.search);
  let url = new URL(serverUrl + '/getCreds');
  url.search = (new URLSearchParams({ environment })).toString();
  const response = await fetch(url.toString());
  if (response.ok) {
    const jsonResponse = await response.json();
    // add restUrl to the response.
    const credentialsAt = `${jsonResponse.signingKeySid}:${jsonResponse.signingKeySecret}@`;
    jsonResponse.restUrl = environment === 'prod' ? `https://${credentialsAt}video.twilio.com` : `https://${credentialsAt}video.${environment}.twilio.com`;;
    jsonResponse.restUrlNoCreds = environment === 'prod' ? 'https://video.twilio.com' : `https://video.${environment}.twilio.com`
    return jsonResponse;
  }
  throw new Error(`Failed to obtain creds from from ${url}, Status: ${response.status}`);
}
