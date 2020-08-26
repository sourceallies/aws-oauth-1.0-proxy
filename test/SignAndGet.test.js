// jest.mock("../src/HttpResponses");
// jest.mock("aws-sdk");

jest.mock("oauth");

const Chance = require("chance");
const { getStatusText } = require("../src/HttpResponses");
const OAuth = require("oauth");
// const getConfig = require("../config");
// const underTest = require("../src/SignAndGet");


describe("SignAndGet", () => {
  let chance;
  let get;

  const setUp = () => {
    chance = Chance();

    jest.mock("aws-sdk", () => {
      const KMS = class {};
      KMS.prototype.decrypt = jest.fn();
      return { KMS };
    });

    const { KMS } = require("aws-sdk");
    const { decrypt } = KMS.prototype;
    decrypt.mockImplementation(({ CiphertextBlob }) => {
      return {
        promise() {
          return Promise.resolve({ Plaintext: CiphertextBlob });
        },
      };
    });
  };

  beforeEach(async () => {
    setUp();

    // config = await getConfig();
    // config.oAuthCustomHeaders = { [chance.string()]: chance.string() };
    // config.authorizeCallbackUri = chance.string();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("gets a set of temporary OAuth tokens", async () => {
    const fakeLink = chance.url();
    const fakeAccessToken = chance.string();
    const fakeAccessTokenSecret = chance.string();

    const config = await require("../config")();

    OAuth.OAuth = jest.fn().mockImplementation(() => ({
      get: (link, accessToken, accessTokenSecret, callback) => {
        callback(null, null, { statusCode: 200 });
      },
    }));

    const underTest = require("../src/SignAndGet");

    await underTest.doSignAndGet(
      fakeLink,
      fakeAccessToken,
      fakeAccessTokenSecret
    );

    expect(OAuth.OAuth).toBeCalledWith(
      config.firstLegUri,
      config.thirdLegUri,
      config.clientKey,
      config.clientSecret,
      config.oAuthVersion,
      config.authorizeCallbackUri,
      config.oAuthSignatureMethod,
      config.oAuthNonceSize,
      config.oAuthCustomHeaders
    );
  });
});

// describe("Do Sign and Get", () => {
//   let config;

//   beforeEach(async () => {
//     config = await config();
//     config.oAuthCustomHeaders = { [chance.string()]: chance.string() };
//     config.authorizeCallbackUri = chance.string();
//   });

//   it("throws error if no oAuthCustomHeaders in config", async () => {
//     config.oAuthCustomHeaders = undefined;

//     expect(() =>
//       underTest.doSignAndGet(
//         chance.url(),
//         chance.string(),
//         chance.string(),
//         allDataFlag
//       )
//     ).toThrow(Error);
//   });

//   it("throws an error when there is an error in the response", async () => {
//     const fakeLink = chance.url();
//     const fakeAccessToken = chance.string();
//     const fakeAccessTokenSecret = chance.string();
//     const fakeError = chance.string();
//     OAuth.OAuth = jest.fn().mockImplementation(() => ({
//       get: (link, accessToken, accessTokenSecret, callback) => {
//         callback(fakeError, null, { statusCode: 200 });
//       },
//     }));

//     await expect(
//       underTest.doSignAndGet(fakeLink, fakeAccessToken, fakeAccessTokenSecret)
//     ).rejects.toMatch(fakeError);
//   });

//   it("return an error when there is an http error from OAuth Sign Request endpoint", async () => {
//     const fakeLink = chance.url();
//     const fakeAccessToken = chance.string();
//     const fakeAccessTokenSecret = chance.string();
//     const fakeError = chance.string();
//     let statusCode = chance.natural({ min: 0, max: 500 });

//     while (statusCode > 200 && statusCode < 300) {
//       statusCode = chance.natural({ min: 0, max: 500 });
//     }

//     OAuth.OAuth = jest.fn().mockImplementation(() => ({
//       get: (link, accessToken, accessTokenSecret, callback) => {
//         callback(fakeError, null, { statusCode });
//       },
//     }));

//     const doSignandGet = underTest.doSignAndGet(
//       fakeLink,
//       fakeAccessToken,
//       fakeAccessTokenSecret
//     );

//     await expect(doSignandGet).resolves.toMatch(getStatusText(statusCode));
//   });
// });
