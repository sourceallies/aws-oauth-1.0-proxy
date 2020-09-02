const { OAuth } = require("oauth");
const { sendResponse, sendError } = require("./src/responses");
const getConfig = require("./config");
const {
  publishToSNSSuccess,
  publishToSNSUnsuccessfull,
} = require("./src/publishSNSHelper");
const { doSignAndGet } = require("./src/SignAndGet");
const { doSignAndDelete } = require("./src/SignAndDelete");
const { doSignAndPost } = require("./src/SignAndPost");

const parsedEnv = require("dotenv").config();

const getOptionalAuthorizeCallbackUri = (event) => {
  return (
    event.queryStringParameters && event.queryStringParameters.oauth_callback
  );
};

const getAuthorizeCallbackUri = (event, config) => {
  const optionalAuthorizeCallbackUri = getOptionalAuthorizeCallbackUri(event);
  return optionalAuthorizeCallbackUri || config.authorizeCallbackUri;
};

exports.firstLegHandler = async (event, context, callback) => {
  let config = await getConfig();
  const tokenlessOauthSession = new OAuth(
    config.firstLegUri,
    config.thirdLegUri,
    config.clientKey,
    config.clientSecret,
    config.oAuthVersion,
    getAuthorizeCallbackUri(event, config),
    config.oAuthSignatureMethod,
    config.oAuthNonceSize,
    config.oAuthCustomHeaders
  );

  return await new Promise((resolve, reject) => {
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
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(body),
        isBase64Encoded: false,
      };

      let publish = error ? publishToSNSUnsuccessfull : publishToSNSSuccess;
      publish({ ...event, ...response }).then(() => resolve(response));
    };

    tokenlessOauthSession.getOAuthRequestToken(responseCallback);
  });
};

exports.thirdLegHandler = async (event, context, callback) => {
  let config = await getConfig();
  const receivedBody = JSON.parse(event.body);

  const { requestToken, requestTokenSecret, verifier } = receivedBody;

  const oAuthSession = new OAuth(
    config.firstLegUri,
    config.thirdLegUri,
    config.clientKey,
    config.clientSecret,
    config.oAuthVersion,
    getAuthorizeCallbackUri(event, config),
    config.oAuthSignatureMethod,
    config.oAuthNonceSize,
    config.oAuthCustomHeaders
  );

  return await new Promise((resolve, reject) => {
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
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(body),
        isBase64Encoded: false,
      };

      let publish = error ? publishToSNSUnsuccessfull : publishToSNSSuccess;
      publish({ ...event, ...response }).then(() => resolve(response));
    };

    oAuthSession.getOAuthAccessToken(
      requestToken,
      requestTokenSecret,
      verifier,
      responseCallback
    );
  });
};

exports.oAuthSignRequestGet = async (event) => {
  const receivedData = JSON.parse(JSON.stringify(event));

  const {
    url,
    accessToken,
    accessTokenSecret,
    allData,
  } = receivedData.queryStringParameters;

  try {
    const body = await doSignAndGet(
      url,
      accessToken,
      accessTokenSecret,
      getOptionalAuthorizeCallbackUri(event),
      allData
    );

    return sendResponse(event, body);
  } catch (error) {
    return sendError(event, error);
  }
};

exports.oAuthSignRequestPost = async (event) => {
  let config = await getConfig();
  const receivedBody = JSON.parse(event.body);

  const { url, accessToken, accessTokenSecret, data } = receivedBody;

  try {
    const body = await doSignAndPost(
      url,
      accessToken,
      accessTokenSecret,
      JSON.stringify(data),
      config.oAuthCustomContentType,
      getOptionalAuthorizeCallbackUri(event)
    );

    return sendResponse(event, body);
  } catch (error) {
    return sendError(event, error);
  }
};

exports.oAuthSignRequestDelete = async (event) => {
  const receivedData = JSON.parse(JSON.stringify(event));

  const {
    url,
    accessToken,
    accessTokenSecret,
  } = receivedData.queryStringParameters;

  try {
    const data = await doSignAndDelete(
      url,
      accessToken,
      accessTokenSecret,
      getOptionalAuthorizeCallbackUri(event)
    );
    return sendResponse(event, data);
  } catch (error) {
    return sendError(event, error);
  }
};
