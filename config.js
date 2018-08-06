const config = {
  oAuthVersion: '1.0',
  oAuthSignatureMethod: 'HMAC-SHA1',
  oAuthNonceSize: undefined,
  oAuthCustomHeaders: {
    Accept: process.env.OAUTH_CUSTOM_HEADERS,
  },
  clientKey: process.env.CLIENT_KEY,
  clientSecret: process.env.CLIENT_SECRET,
  platformBaseUri: `${process.env.API_URL}/`,
  authorizeCallbackUri: process.env.AUTHORIZE_CALLBACK_URI,
};

module.exports = config;
