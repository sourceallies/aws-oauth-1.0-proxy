const getConfig = require("../config");
const { OAuth } = require('oauth');

const doSignAndGet = async (
  linkToOpen,
  accessToken,
  accessTokenSecret,
  allData,
  optionalAuthorizeCallbackUri
) => {
  const config = await getConfig();
  const authorizeCallbackUri =
    optionalAuthorizeCallbackUri || config.authorizeCallbackUri;

  let oAuthCustomHeaders = Object.assign({}, config.oAuthCustomHeaders);

  if (!oAuthCustomHeaders) {
    throw new Error("Missing required oAuthCustomHeaders from config");
  }

  if (allData) {
    oAuthCustomHeaders["No_Paging"] = true;
  }

  const oAuthSession = new OAuth(
    config.firstLegUri,
    config.thirdLegUri,
    config.clientKey,
    config.clientSecret,
    config.oAuthVersion,
    authorizeCallbackUri,
    config.oAuthSignatureMethod,
    config.oAuthNonceSize,
    oAuthCustomHeaders
  );

  return await new Promise((resolve, reject) => {
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
      }
    );
  });
};

module.exports = {
  doSignAndGet
}