// export async function getCreds(env) {
//   const auth = await import('../../server/twilio_credentials.json');
//   return auth[env];
// }

// eslint-disable-next-line no-unused-vars
export async function getCreds(_env) {
  // eslint-disable-next-line no-warning-comments
  // todo: update this to query creds from server.
  // using import above does not work since, webpack generates the chunk with creds
  // that we must not push/commit.
  await Promise.resolve();
  throw new Error('not implemented.');
  // return {
  //   'accountSid': 'ACxxxxxx',
  //   'authToken': 'xxxx',
  //   'signingKeySid': 'SKxxxx',
  //   'signingKeySecret': 'your_key_secret'
  // };
}

