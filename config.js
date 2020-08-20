const { KMS } = require("aws-sdk");
const kms = new KMS();

async function decrypt(value) {
  if (typeof value === "undefined") {
    return;
  }

  try {
    const kmsResponse = await kms
      .decrypt({ CiphertextBlob: Buffer.from(value, "base64") })
      .promise();
    return kmsResponse.Plaintext.toString();
  } catch (error) {
    console.log("failed to decrypt value. got error: ", error);
    return value;
  }
}

var config;

module.exports = async function () {
  if (typeof config === "undefined") {
    config = {
      oAuthVersion: "1.0",
      oAuthSignatureMethod: "HMAC-SHA1",
      oAuthNonceSize: undefined,
      oAuthCustomHeaders: {
        Accept: process.env.OAUTH_CUSTOM_HEADERS,
      },
      oAuthCustomContentType: process.env.OAUTH_CUSTOM_HEADERS,
      clientKey: await decrypt(process.env.CLIENT_KEY),
      clientSecret: await decrypt(process.env.CLIENT_SECRET),
      platformBaseUri: `${process.env.API_URL}/`,
      firstLegUri: `${process.env.API_URL}/oauth/request_token`,
      thirdLegUri: `${process.env.API_URL}/oauth/access_token`,
      authorizeCallbackUri: process.env.AUTHORIZE_CALLBACK_URI,
      snsSuccessArn: process.env.SNS_SUCCESS_ARN,
      snsNonsuccessArn: process.env.SNS_NONSUCCESS_ARN,
    };
  }

  return config;
};
