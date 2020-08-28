const getConfig = require("../config");
const { OAuth } = require("oauth");
const { getStatusText } = require("../src/HttpResponses");

const doSignAndGet = async (
  linkToOpen,
  accessToken,
  accessTokenSecret,
  optionalAuthorizeCallbackUri,
  allData
) => {
  const config = await getConfig();
  const authorizeCallbackUri =
    optionalAuthorizeCallbackUri || config.authorizeCallbackUri;

  let customHeaders = { Accept: "application/vnd.deere.axiom.v3+json" };
  if (allData !== undefined) {
    customHeaders["No_Paging"] = allData;
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
    customHeaders
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
  doSignAndGet,
};
