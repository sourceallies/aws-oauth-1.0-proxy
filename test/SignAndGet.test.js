// jest.mock("../src/HttpResponses");
// jest.mock("aws-sdk");

jest.mock("oauth");
jest.mock("../config");
jest.mock("../src/HttpResponses")
jest.mock("aws-sdk", () => {
  const KMS = class {};
  KMS.prototype.decrypt = jest.fn();
  return { KMS };
});

const Chance = require("chance");
const { getStatusText } = require("../src/HttpResponses");
const OAuth = require("oauth");
const getConfig = require("../config");
const { KMS } = require("aws-sdk");

describe("SignAndGet", () => {
  let chance;
  let underTest;

  const setUp = () => {
    chance = Chance();

    const { decrypt } = KMS.prototype;
    decrypt.mockImplementation(({ CiphertextBlob }) => {
      return {
        promise() {
          return Promise.resolve({ Plaintext: CiphertextBlob });
        },
      };
    });

    jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
      get: (link, accessToken, accessTokenSecret, callback) => {
        callback(null, null, { statusCode: 200 });
      },
    }));

    getConfig.mockImplementation(() => {
      return {};
    });

    underTest = require("../src/SignAndGet");
  };

  beforeEach(async () => {
    setUp();
  });

  afterEach(() => {
    // jest.resetModules();
    // jest.clearAllMocks();
  });

  it("gets a set of temporary OAuth tokens with same values from config", async () => {
    const expectedFirstLegUri = chance.string();
    const expectedThirdLegUri = chance.string();
    const expectedClientKey = chance.string();
    const expectedClientSecret = chance.string();
    const expectedOAuthVersion = chance.string();
    const expectedAuthorizeCallbackUri = chance.string();
    const expectedOAuthSignatureMethod = chance.string();
    const expectedOAuthNonceSize = chance.string();
    const expectedOAuthCustomHeaders = chance.string();

    getConfig.mockImplementation(() => {
      return {
        firstLegUri: expectedFirstLegUri,
        thirdLegUri: expectedThirdLegUri,
        clientKey: expectedClientKey,
        clientSecret: expectedClientSecret,
        oAuthVersion: expectedOAuthVersion,
        authorizeCallbackUri: expectedAuthorizeCallbackUri,
        oAuthSignatureMethod: expectedOAuthSignatureMethod,
        oAuthNonceSize: expectedOAuthNonceSize,
        oAuthCustomHeaders: expectedOAuthCustomHeaders,
      };
    });

    await underTest.doSignAndGet(
      chance.string(),
      chance.string(),
      chance.string()
    );

    expect(OAuth.OAuth).toBeCalledWith(
      expectedFirstLegUri,
      expectedThirdLegUri,
      expectedClientKey,
      expectedClientSecret,
      expectedOAuthVersion,
      expectedAuthorizeCallbackUri,
      expectedOAuthSignatureMethod,
      expectedOAuthNonceSize,
      expectedOAuthCustomHeaders
    );
  });

  it("throws an error when there is an error in the OAuth get response", async () => {
    const fakeError = chance.string();

    jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
      get: (link, accessToken, accessTokenSecret, callback) => {
        callback(fakeError, undefined, { statusCode: 200 });
      },
    }));

    await expect(
      underTest.doSignAndGet(chance.string(), chance.string(), chance.string())
    ).rejects.toMatch(fakeError);
  });

  it("return an error when there is an http error from OAuth Sign Request endpoint", async () => {
    const statusCode = chance.natural({ min: 0, max: 199 });
    let expectedStatusText = chance.string();

    getStatusText.mockImplementation(() => {
      return expectedStatusText;
    })

    jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
      get: (link, accessToken, accessTokenSecret, callback) => {
        callback(undefined, undefined, { statusCode });
      },
    }));

    await expect(
      underTest.doSignAndGet(chance.string(), chance.string(), chance.string())
    ).resolves.toMatch(expectedStatusText);
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
