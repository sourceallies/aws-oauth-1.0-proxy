const { OAuth } = require('oauth');
const config = require('./config');
const { doSignAndGet, doSignAndPost, doSignAndDelete } = require('./src/OAuthSignRequest');

require('dotenv').config();

exports.firstLegHandler = (event, context, callback) => {

  console.log('metadata ' + JSON.stringify(event.headers.metadata[0]));

  const tokenlessOauthSession = new OAuth(
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

  const responseCallback = (error, requestToken, requestTokenSecret) => {
    let body = {
      requestToken,
      requestTokenSecret,
    };

    if (error) {
      body = error;
    }

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(body),
      isBase64Encoded: false,
    };

    callback(null, response);
  };

  tokenlessOauthSession.getOAuthRequestToken(responseCallback);
};

exports.thirdLegHandler = (event, context, callback) => {
  console.log('metadata ' + JSON.stringify(event.headers.metadata[0]));
  const receivedBody = JSON.parse(event.body);

  const {
    requestToken,
    requestTokenSecret,
    verifier,
  } = receivedBody;

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

  const responseCallback = (error, accessToken, accessTokenSecret) => {
    let body = {
      accessToken,
      accessTokenSecret,
    };

    if (error) {
      body = error;
    }

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(body),
      isBase64Encoded: false,
    };

    callback(null, response);
  };

  oAuthSession.getOAuthAccessToken(requestToken, requestTokenSecret, verifier, responseCallback);
};

const sendResponse = responseData => ({
  statusCode: responseData.status,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'location': responseData.headers ? responseData.headers.location : undefined,
  },
  body: JSON.stringify(responseData.body ? responseData.body : responseData),
  isBase64Encoded: false,
});

const sendError = error => ({
  statusCode: 502,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(error),
  isBase64Encoded: false,
});

exports.oAuthSignRequestGet = async (event) => {
  const receivedData = JSON.parse(JSON.stringify(event));
  console.log('metadata ' + JSON.stringify(event.headers.metadata[0]));

  const {
    url,
    accessToken,
    accessTokenSecret,
  } = receivedData.queryStringParameters;

  const response = await doSignAndGet(url, accessToken, accessTokenSecret)
    .then(sendResponse)
    .catch(sendError);

  return response;
};

exports.oAuthSignRequestPost = async (event) => {
  const receivedBody = JSON.parse(event.body);
  console.log('metadata ' + JSON.stringify(event.headers.metadata[0]));

  const {
    url,
    accessToken,
    accessTokenSecret,
    data,
  } = receivedBody;

  const response = await doSignAndPost(
    url,
    accessToken,
    accessTokenSecret,
    JSON.stringify(data),
    config.oAuthCustomContentType,
  )
    .then(sendResponse)
    .catch(sendError);

  return response;
};

exports.oAuthSignRequestDelete = async (event) => {
  console.log('metadata ' + JSON.stringify(event.headers.metadata));

  const receivedData = JSON.parse(JSON.stringify(event));

  const {
    url,
    accessToken,
    accessTokenSecret,
  } = receivedData.queryStringParameters;

  const response = await doSignAndDelete(url, accessToken, accessTokenSecret)
    .then(sendResponse)
    .catch(sendError);

  return response;
};
