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

  it("return an error when there is an http error below 200 from OAuth Sign Request endpoint", async () => {
    const statusCode = chance.natural({ min: 0, max: 199 });
    jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
      get: (link, accessToken, accessTokenSecret, callback) => {
        callback(undefined, undefined, { statusCode });
      },
    }));
    const expectedStatusText = chance.string();
    getStatusText.mockImplementation(() => {
      return expectedStatusText;
    })

    await expect(
      underTest.doSignAndGet(chance.string(), chance.string(), chance.string())
    ).resolves.toMatch(expectedStatusText);
  });

  it("return an error when there is an http error above 300 from OAuth Sign Request endpoint", async () => {
    const statusCode = chance.natural({ min: 301, max: 500 });
    jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
      get: (link, accessToken, accessTokenSecret, callback) => {
        callback(undefined, undefined, { statusCode });
      },
    }));
    const expectedStatusText = chance.string();
    getStatusText.mockImplementation(() => {
      return expectedStatusText;
    })

    await expect(
      underTest.doSignAndGet(chance.string(), chance.string(), chance.string())
    ).resolves.toMatch(expectedStatusText);
  });
});