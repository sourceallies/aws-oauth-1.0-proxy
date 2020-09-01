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

describe("SignAndDelete", () => {
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
      delete: (link, accessToken, accessTokenSecret, callback) => {
        callback(null, null, { statusCode: 200 });
      },
    }));

    getConfig.mockImplementation(() => {
      return {};
    });

    underTest = require("../src/SignAndDelete");
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

      await underTest.doSignAndDelete(
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

  describe("is called", () => {
    beforeEach(async () => {
      await underTest.doSignAndDelete(
        chance.string(),
        chance.string(),
        chance.string()
      );
    });

    it("should have the JD Accept header", () => {
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

  describe("optionalAuthorizationCallbackUri is provided", () => {
    let expectedAuthorizeCallbackUri;

    beforeEach(async () => {
      expectedAuthorizeCallbackUri = chance.string();

      await underTest.doSignAndDelete(
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

  describe("OAuth delete returns an error", () => {
    let expectedError;
    let result;

    beforeEach(() => {
      expectedError = chance.string();
      jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
        delete: (link, accessToken, accessTokenSecret, callback) => {
          callback(expectedError, undefined, { statusCode: 200 });
        },
      }));

      result = underTest.doSignAndDelete(
        chance.string(),
        chance.string(),
        chance.string()
      );
    });

    it("should reject with the same error", async () => {
      await expect(result).rejects.toMatch(expectedError);
    });
  });

  describe("OAuth delete returns a http status code below 200", () => {
    let httpStatusCode;
    let expectedStatusText;
    let result;

    beforeEach(() => {
      httpStatusCode = chance.natural({ min: 0, max: 199 });
      expectedStatusText = chance.string();

      jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
        delete: (link, accessToken, accessTokenSecret, callback) => {
          callback(undefined, undefined, { statusCode: httpStatusCode });
        },
      }));

      getStatusText.mockImplementation(() => {
        return expectedStatusText;
      });

      result = underTest.doSignAndDelete(
        chance.string(),
        chance.string(),
        chance.string()
      );
    });

    it("should return the correct status text", async () => {
      await expect(result).resolves.toMatch(expectedStatusText);
    });
  });

  describe("OAuth delete returns a http status code above 300", () => {
    let httpStatusCode;
    let expectedStatusText;
    let result;

    beforeEach(() => {
      httpStatusCode = chance.natural({ min: 301, max: 500 });
      expectedStatusText = chance.string();

      jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
        delete: (link, accessToken, accessTokenSecret, callback) => {
          callback(undefined, undefined, { statusCode: httpStatusCode });
        },
      }));

      getStatusText.mockImplementation(() => {
        return expectedStatusText;
      });

      result = underTest.doSignAndDelete(
        chance.string(),
        chance.string(),
        chance.string()
      );
    });

    it("should return the same status text", async () => {
      await expect(result).resolves.toMatch(expectedStatusText);
    });
  });

  describe("OAuth delete returns a http status code between 200 and 300 and a response", () => {
    let expectedResponse;
    let result;

    beforeEach(() => {
      expectedResponse = chance.string();
      const statusCode = chance.natural({ min: 200, max: 300 });

      jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
        delete: (link, accessToken, accessTokenSecret, callback) => {
          callback(undefined, expectedResponse, { statusCode });
        },
      }));

      result = underTest.doSignAndDelete(
        chance.string(),
        chance.string(),
        chance.string()
      );
    });

    it("should return the same response", async () => {
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
        delete: (link, accessToken, accessTokenSecret, callback) => {
          actualLinkToOpen = link;
          actualAccessToken = accessToken;
          actualAccessTokenSecret = accessTokenSecret;
          callback(undefined, undefined, { statusCode: 200 });
        },
      }));

      await underTest.doSignAndDelete(
        expectedLinkToOpen,
        expectedAccessToken,
        expectedAccesssTokenSecret
      );
    });

    it("should pass linkToOpen to oauthSession", () => {
      expect(actualLinkToOpen).toBe(expectedLinkToOpen);
    });

    it("should pass accessToken to oauthSession", () => {
      expect(actualAccessToken).toBe(expectedAccessToken);
    });

    it("should pass accessTokenSecret to oauthSession", () => {
      expect(actualAccessTokenSecret).toBe(expectedAccesssTokenSecret);
    });
  });
});
