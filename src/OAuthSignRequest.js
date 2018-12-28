const { OAuth } = require('oauth');
const config = require('../config');
const { getStatusText } = require('../src/HttpResponses');

const doSignAndGet = (linkToOpen, accessToken, accessTokenSecret) => {
  const oAuthSession = new OAuth(
    config.firstLegUri,
    config.thirdLegUri,
    config.clientKey,
    config.clientSecret,
    config.oAuthVersion,
    config.authorizeCallbackUri,
    config.oAuthSignatureMethod,
    config.oAuthNonceSize,
    config.oAuthCustomHeaders,
  );

  return new Promise((resolve, reject) => {
    oAuthSession.get(
      linkToOpen,
      accessToken,
      accessTokenSecret,
      (error, responseData, result) => {
        if (result.statusCode < 200 || result.statusCode >= 300) {
          resolve(getStatusText(result.statusCode));
        } else if (error) {
          reject(error);
        } else {
          resolve(responseData);
        }
      },
    );
  });
};

const doSignAndDelete = (linkToOpen, accessToken, accessTokenSecret) => {
  const oAuthSession = new OAuth(
    config.firstLegUri,
    config.thirdLegUri,
    config.clientKey,
    config.clientSecret,
    config.oAuthVersion,
    config.authorizeCallbackUri,
    config.oAuthSignatureMethod,
    config.oAuthNonceSize,
    config.oAuthCustomHeaders,
  );

  return new Promise((resolve, reject) => {
    oAuthSession.delete(
      linkToOpen,
      accessToken,
      accessTokenSecret,
      (error, responseData, result) => {
        if (error) {
          reject(error);
        }
        if (result.statusCode <= 200 && result.statusCode < 300) {
          resolve(responseData);
        }
        resolve(getStatusText(result.statusCode));
      },
    );
  });
};

const doSignAndPost = (
  linkToOpen,
  accessToken,
  accessTokenSecret,
  postBody,
  postBodyContentType,
) => {
  const oAuthSession = new OAuth(
    config.firstLegUri,
    config.thirdLegUri,
    config.clientKey,
    config.clientSecret,
    config.oAuthVersion,
    config.authorizeCallbackUri,
    config.oAuthSignatureMethod,
    config.oAuthNonceSize,
    config.oAuthCustomHeaders,
  );

  return new Promise((resolve, reject) => {
    oAuthSession.post(
      linkToOpen,
      accessToken,
      accessTokenSecret,
      postBody,
      postBodyContentType,
      (error, responseData, result) => {
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
  doSignAndGet,
  doSignAndDelete,
  doSignAndPost,
};
