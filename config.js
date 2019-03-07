const config = {
  oAuthVersion: '1.0',
  oAuthSignatureMethod: 'HMAC-SHA1',
  oAuthNonceSize: undefined,
  oAuthCustomHeaders: {
    Accept: process.env.OAUTH_CUSTOM_HEADERS,
  },
  oAuthCustomContentType: process.env.OAUTH_CUSTOM_HEADERS,
  clientKey: process.env.CLIENT_KEY,
  clientSecret: process.env.CLIENT_SECRET,
  platformBaseUri: `${process.env.API_URL}/`,
  firstLegUri: `${process.env.API_URL}/oauth/request_token`,
  thirdLegUri: `${process.env.API_URL}/oauth/access_token`,
  authorizeCallbackUri: process.env.AUTHORIZE_CALLBACK_URI,
  snsSuccessArn: process.env.SNS_SUCCESS_ARN,
  snsNonsuccessArn: process.env.SNS_NONSUCCESS_ARN,
};

module.exports = (() => {
  console.log(process.env);
  return config;
})();
