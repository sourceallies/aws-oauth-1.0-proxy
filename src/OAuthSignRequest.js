const { OAuth } = require('oauth');
const getConfig = require('../config');
const { getStatusText } = require('../src/HttpResponses');
const doSignAndPost = async (
  linkToOpen,
  accessToken,
  accessTokenSecret,
  postBody,
  postBodyContentType,
  optionalAuthorizeCallbackUri
) => {
  const config = await getConfig();
  const authorizeCallbackUri = optionalAuthorizeCallbackUri || config.authorizeCallbackUri;

  const oAuthSession = new OAuth(
    config.firstLegUri,
    config.thirdLegUri,
    config.clientKey,
    config.clientSecret,
    config.oAuthVersion,
    authorizeCallbackUri,
    config.oAuthSignatureMethod,
    config.oAuthNonceSize,
    config.oAuthCustomHeaders,
  );

  return await new Promise((resolve, reject) => {
    oAuthSession.post(
      linkToOpen,
      accessToken,
      accessTokenSecret,
      postBody,
      postBodyContentType,
      (error, responseData, result) => {
        console.log('Post Response From Deere', {
          error,
          responseData,
          result,
          resultHeaders: result.headers,
        });
        if (result.statusCode < 200 || result.statusCode >= 300) {
          resolve(getStatusText(result.statusCode));
        } else if (error) {
          reject(error);
        } else {
          resolve({ headers: result.headers, body: responseData });
        }
      },
    );
  });
};

module.exports = {
  doSignAndDelete,
  doSignAndPost,
};
