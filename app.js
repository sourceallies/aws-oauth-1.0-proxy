const { OAuth } = require('oauth');
const AWS = require('aws-sdk');
const config = require('./config');
const { doSignAndGet, doSignAndPost, doSignAndDelete } = require('./src/OAuthSignRequest');

require('dotenv').config();

AWS.config.update({ region: 'us-east-1' });

exports.firstLegHandler = (event, context, callback) => {

  console.log('metadata ' + JSON.stringify(event));

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

    // Create publish parameters
    const params = {
      Message: 'MESSAGE_TEXT', /* required */
      TopicArn: 'arn:aws:sns:us-east-1:729161019481:aws-auth-success-topic',
    };

    // Create promise and SNS service object
    const publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();

    // Handle promise's fulfilled/rejected states
    publishTextPromise.then(
      (data) => {
        console.log(`Message ${params.Message} send sent to the topic ${params.TopicArn}`);
        console.log(`MessageID is ${data.MessageId}`);
      },
    ).catch(
      (err) => {
        console.error(err, err.stack);
      },
    );

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
