const getConfig = require("../config");
const { OAuth } = require("oauth");
const { getStatusText } = require("../src/HttpResponses");

const doSignAndPost = async (
  linkToOpen,
  accessToken,
  accessTokenSecret,
  postBody,
  postBodyContentType,
  optionalAuthorizeCallbackUri
) => {
  const config = await getConfig();
  const authorizeCallbackUri =
    optionalAuthorizeCallbackUri || config.authorizeCallbackUri;

  let customHeaders = { Accept: "application/vnd.deere.axiom.v3+json" };

  const oAuthSession = new OAuth(
    config.firstLegUri,
    config.thirdLegUri,
    config.clientKey,
    config.clientSecret,
    config.oAuthVersion,
    authorizeCallbackUri,
    config.oAuthSignatureMethod,
    config.oAuthNonceSize,
    customHeaders
  );

  return await new Promise((resolve, reject) => {
    oAuthSession.post(
      linkToOpen,
      accessToken,
      accessTokenSecret,
      postBody,
      postBodyContentType,
      (error, responseData, result) => {
        console.log("Post Response From Deere", {
          error,
          responseData,
          result,
          resultHeaders: result.headers
        });
        if (result.statusCode < 200 || result.statusCode >= 300) {
          resolve(getStatusText(result.statusCode));
        } else if (error) {
          reject(error);
        } else {
          resolve({ headers: result.headers, body: responseData });
        }
      }
    );
  });
};

module.exports = {
  doSignAndPost,
};
