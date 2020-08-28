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

  describe("config has values defined", () => {
    let expectedFirstLegUri;
    let expectedThirdLegUri;
    let expectedClientKey;
    let expectedClientSecret;
    let expectedOAuthVersion;
    let expectedAuthorizeCallbackUri;
    let expectedOAuthSignatureMethod;
    let expectedOAuthNonceSize;

    beforeEach(async () => {
      expectedFirstLegUri = chance.string();
      expectedThirdLegUri = chance.string();
      expectedClientKey = chance.string();
      expectedClientSecret = chance.string();
      expectedOAuthVersion = chance.string();
      expectedAuthorizeCallbackUri = chance.string();
      expectedOAuthSignatureMethod = chance.string();
      expectedOAuthNonceSize = chance.string();

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
    });

    it("creates an OAuth with same values from config", () => {
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
  });

  describe("optionalAuthorizationCallbackUri is provided", () => {
    let expectedAuthorizeCallbackUri;

    beforeEach(async () => {
      expectedAuthorizeCallbackUri = chance.string();

      await underTest.doSignAndGet(
        chance.string(),
        chance.string(),
        chance.string(),
        expectedAuthorizeCallbackUri
      );
    });

    it("creates an OAuth with the provided optionalAuthorizationCallbackUri", () => {
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
  });

  describe("OAuth get returns an error", () => {
    let expectedError;
    let result;

    beforeEach(() => {
      expectedError = chance.string();
      jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
        get: (link, accessToken, accessTokenSecret, callback) => {
          callback(expectedError, undefined, { statusCode: 200 });
        },
      }));

      result = underTest.doSignAndGet(
        chance.string(),
        chance.string(),
        chance.string()
      );
    });

    it("throws an error when there is an error in the OAuth get response", async () => {
      await expect(result).rejects.toMatch(expectedError);
    });
  });

  describe("allData is not provided", () => {
    beforeEach(async () => {
      await underTest.doSignAndGet(
        chance.string(),
        chance.string(),
        chance.string()
      );
    });

    it("sets the correct custom headers for OAuth Tokens", () => {
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
  });

  describe("allData is true", () => {
    beforeEach(async () => {
      await underTest.doSignAndGet(
        chance.string(),
        chance.string(),
        chance.string(),
        undefined,
        true
      );
    });

    it("sets the correct custom headers for OAuth Tokens", () => {
      expect(OAuth.OAuth).toBeCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { Accept: "application/vnd.deere.axiom.v3+json", No_Paging: true }
      );
    });
  });

  describe("allData is false", () => {
    beforeEach(async () => {
      await underTest.doSignAndGet(
        chance.string(),
        chance.string(),
        chance.string(),
        undefined,
        false
      );
    });

    it("sets the correct custom headers for OAuth Tokens when allData is false", () => {
      expect(OAuth.OAuth).toBeCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { Accept: "application/vnd.deere.axiom.v3+json", No_Paging: false }
      );
    });
  });

  describe("OAuth get returns a http status code below 200", () => {
    let httpStatusCode;
    let expectedStatusText;
    let result;

    beforeEach(() => {
      httpStatusCode = chance.natural({ min: 0, max: 199 });
      expectedStatusText = chance.string();

      jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
        get: (link, accessToken, accessTokenSecret, callback) => {
          callback(undefined, undefined, { statusCode: httpStatusCode });
        },
      }));

      getStatusText.mockImplementation(() => {
        return expectedStatusText;
      });

      result = underTest.doSignAndGet(
        chance.string(),
        chance.string(),
        chance.string()
      );
    });

    it("should return an error", async () => {
      await expect(result).resolves.toMatch(expectedStatusText);
    });
  });

  describe("OAuth get returns a http status code above 300", () => {
    let httpStatusCode;
    let expectedStatusText;
    let result;

    beforeEach(() => {
      httpStatusCode = chance.natural({ min: 301, max: 500 });
      expectedStatusText = chance.string();

      jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
        get: (link, accessToken, accessTokenSecret, callback) => {
          callback(undefined, undefined, { statusCode: httpStatusCode });
        },
      }));

      getStatusText.mockImplementation(() => {
        return expectedStatusText;
      });

      result = underTest.doSignAndGet(
        chance.string(),
        chance.string(),
        chance.string()
      );
    });

    it("should return an error", async () => {
      await expect(result).resolves.toMatch(expectedStatusText);
    });
  });

  describe("OAuth get returns a http status code between 200 and 300 and a response", () => {
    let expectedResponse;
    let result;

    beforeEach(() => {
      expectedResponse = chance.string();
      const statusCode = chance.natural({ min: 200, max: 300 });

      jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
        get: (link, accessToken, accessTokenSecret, callback) => {
          callback(undefined, expectedResponse, { statusCode });
        },
      }));

      result = underTest.doSignAndGet(
        chance.string(),
        chance.string(),
        chance.string()
      );
    });

    it("returns the same response", async () => {
      await expect(result).resolves.toMatch(expectedResponse);
    });
  });

  describe("with link, accessToken, and accessTokenSecret", () => {
    let expectedLinkToOpen;
    let expectedAccessToken;
    let expectedAccesssTokenSecret;
    let actualLinkToOpen;
    let actualAccessToken;
    let actualAccessTokenSecret;

    beforeEach(async () => {
      expectedLinkToOpen = chance.string();
      expectedAccessToken = chance.string();
      expectedAccesssTokenSecret = chance.string();

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
    });

    it("should pass parameters to oauthSession", () => {
      expect(actualLinkToOpen).toBe(expectedLinkToOpen);
      expect(actualAccessToken).toBe(expectedAccessToken);
      expect(actualAccessTokenSecret).toBe(expectedAccesssTokenSecret);
    });
  });
});
