const { OAuth } = require('oauth');
const { sendResponse, sendError } = require('./src/responses');
const config = require('./config');
const { publishToSNSSuccess, publishToSNSUnsuccessfull } = require('./src/publishSNSHelper');
const { doSignAndGet, doSignAndPost, doSignAndDelete } = require('./src/OAuthSignRequest');

const b = require('dotenv').config();
console.log('b is this cool value', b);
exports.firstLegHandler = (event, context, callback) => {
  console.log('metadata ' + JSON.stringify(event));
  console.log('HERE IS MY RAAAAAAD CONFIG', config);
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

    error ? publishToSNSUnsuccessfull({ ...event, ...response }, config)
      : publishToSNSSuccess({ ...event, ...response }, config);

    callback(null, response);
  };

  tokenlessOauthSession.getOAuthRequestToken(responseCallback);
};

exports.thirdLegHandler = (event, context, callback) => {
  console.log('metadata ' + JSON.stringify(event));
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

    error ? publishToSNSUnsuccessfull({ ...event, ...response }, config)
      : publishToSNSSuccess({ ...event, ...response }, config);

    callback(null, response);
  };

  oAuthSession.getOAuthAccessToken(requestToken, requestTokenSecret, verifier, responseCallback);
};

exports.oAuthSignRequestGet = async (event) => {
  const receivedData = JSON.parse(JSON.stringify(event));
  console.log('metadata ' + JSON.stringify(event));

  const {
    url,
    accessToken,
    accessTokenSecret,
  } = receivedData.queryStringParameters;

  const response = await doSignAndGet(url, accessToken, accessTokenSecret)
    .then(responseData => sendResponse(event, responseData, config))
    .catch(error => sendError(event, error, config));

  return response;
};

exports.oAuthSignRequestPost = async (event) => {
  const receivedBody = JSON.parse(event.body);
  console.log('metadata ' + JSON.stringify(event));

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
    .then(responseData => sendResponse(event, responseData, config))
    .catch(error => sendError(event, error, config));

  return response;
};

exports.oAuthSignRequestDelete = async (event) => {
  console.log('metadata ' + event);
  console.log('metadata ' + JSON.stringify(event));
  console.log('metadata ' + event[0]);
  console.log('metadata ' + JSON.stringify(event[0]));

  const receivedData = JSON.parse(JSON.stringify(event));

  const {
    url,
    accessToken,
    accessTokenSecret,
  } = receivedData.queryStringParameters;

  const response = await doSignAndDelete(url, accessToken, accessTokenSecret)
    .then(responseData => sendResponse(event, responseData, config))
    .catch(error => sendError(event, error, config));

  return response;
};
