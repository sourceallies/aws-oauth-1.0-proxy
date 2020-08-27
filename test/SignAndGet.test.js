const Chance = require("chance");
const { getStatusText } = require("../src/HttpResponses");
const OAuth = require("oauth");
const getConfig = require("../config");
const { KMS } = require("aws-sdk");

jest.mock("oauth");
jest.mock("../config");
jest.mock("../src/HttpResponses");
jest.mock("aws-sdk", () => {
  const KMS = class {};
  KMS.prototype.decrypt = jest.fn();
  return { KMS };
});

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
    jest.clearAllMocks();
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
      expect.anything()
    );
  });

  it("gets a set of temporary OAuth tokens with same values from config when optionalAuthorizeCallbackUri is provided", async () => {
    const expectedAuthorizeCallbackUri = chance.string();

    await underTest.doSignAndGet(
      chance.string(),
      chance.string(),
      chance.string(),
      expectedAuthorizeCallbackUri
    );

    expect(OAuth.OAuth).toBeCalledWith(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      expectedAuthorizeCallbackUri,
      undefined,
      undefined,
      expect.anything()
    );
  });

  it("throws an error when there is an error in the OAuth get response", async () => {
    const expectedError = chance.string();
    jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
      get: (link, accessToken, accessTokenSecret, callback) => {
        callback(expectedError, undefined, { statusCode: 200 });
      },
    }));

    await expect(
      underTest.doSignAndGet(chance.string(), chance.string(), chance.string())
    ).rejects.toMatch(expectedError);
  });

  it("sets the correct custom headers for OAuth Tokens", async () => {
    await underTest.doSignAndGet(
      chance.string(),
      chance.string(),
      chance.string()
    );

    expect(OAuth.OAuth).toBeCalledWith(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { Accept: "application/vnd.deere.axiom.v3+json" }
    );
  });

  it("return an error when there is an http status code below 200 from OAuth Sign Request endpoint", async () => {
    const statusCode = chance.natural({ min: 0, max: 199 });
    jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
      get: (link, accessToken, accessTokenSecret, callback) => {
        callback(undefined, undefined, { statusCode });
      },
    }));
    const expectedStatusText = chance.string();
    getStatusText.mockImplementation(() => {
      return expectedStatusText;
    });

    await expect(
      underTest.doSignAndGet(chance.string(), chance.string(), chance.string())
    ).resolves.toMatch(expectedStatusText);
  });

  it("return an error when there is an http status code above 300 from OAuth Sign Request endpoint", async () => {
    const statusCode = chance.natural({ min: 301, max: 500 });
    jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
      get: (link, accessToken, accessTokenSecret, callback) => {
        callback(undefined, undefined, { statusCode });
      },
    }));
    const expectedStatusText = chance.string();
    getStatusText.mockImplementation(() => {
      return expectedStatusText;
    });

    await expect(
      underTest.doSignAndGet(chance.string(), chance.string(), chance.string())
    ).resolves.toMatch(expectedStatusText);
  });

  it("return response data when status code betweeen 200 and 300", async () => {
    const expectedResponse = chance.string();
    const statusCode = chance.natural({ min: 200, max: 300 });
    jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
      get: (link, accessToken, accessTokenSecret, callback) => {
        callback(undefined, expectedResponse, { statusCode });
      },
    }));

    await expect(
      underTest.doSignAndGet(chance.string(), chance.string(), chance.string())
    ).resolves.toMatch(expectedResponse);
  });

  it("should pass parameters to oauthSession", async () => {
    const expectedLinkToOpen = chance.string();
    const expectedAccessToken = chance.string();
    const expectedAccesssTokenSecret = chance.string();
    let actualLinkToOpen;
    let actualAccessToken;
    let actualAccessTokenSecret;

    jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
      get: (link, accessToken, accessTokenSecret, callback) => {
        actualLinkToOpen = link;
        actualAccessToken = accessToken;
        actualAccessTokenSecret = accessTokenSecret;
        callback(undefined, undefined, { statusCode: 200 });
      },
    }));

    await underTest.doSignAndGet(
      expectedLinkToOpen,
      expectedAccessToken,
      expectedAccesssTokenSecret
    );

    expect(actualLinkToOpen).toBe(expectedLinkToOpen);
    expect(actualAccessToken).toBe(expectedAccessToken);
    expect(actualAccessTokenSecret).toBe(expectedAccesssTokenSecret);
  });
});
