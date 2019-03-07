const { OAuth } = require('oauth');
const config = require('./config');
const { publishToSNSSuccess } = require('./src/publishSNSHelper');
const { doSignAndGet, doSignAndPost, doSignAndDelete } = require('./src/OAuthSignRequest');
//const { sendResponse, sendError } = require('./src/responsesToNetworkRequests');

const sendResponse = responseData => {
  // publishToSNSSuccess(responseData);
  return {
    statusCode: responseData.status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'location': responseData.headers ? responseData.headers.location : undefined,
    },
    body: JSON.stringify(responseData.body ? responseData.body : responseData),
    isBase64Encoded: false,
  };
};

const sendError = error => {
    // publishToSNSUnsuccessfull(error)
  return {
    statusCode: 502,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(error),
    isBase64Encoded: false,
  };
};

require('dotenv').config();

exports.firstLegHandler = (event, context, callback) => {
  console.log('metadata ' + JSON.stringify(event));

  publishToSNSSuccess(event);

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
  publishToSNSSuccess(event);
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
    .then(sendResponse)
    .catch(sendError);

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
    .then(sendResponse)
    .catch(sendError);

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
    .then(sendResponse)
    .catch(sendError);

  return response;
};
