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

describe("SignAndPost", () => {
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
      post: (
        link,
        accessToken,
        accessTokenSecret,
        postBody,
        postBodyContentType,
        callback
      ) => {
        callback(null, null, { statusCode: 200 });
      },
    }));

    getConfig.mockImplementation(() => {
      return {};
    });

    underTest = require("../src/SignAndPost");
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

      await underTest.doSignAndPost(
        chance.string(),
        chance.string(),
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
      await underTest.doSignAndPost(
        chance.string(),
        chance.string(),
        chance.string(),
        chance.string(),
        chance.string()
      );
    });

    it("should create an OAuth with the custom JD Accept header", () => {
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

      await underTest.doSignAndPost(
        chance.string(),
        chance.string(),
        chance.string(),
        chance.string(),
        chance.string(),
        expectedAuthorizeCallbackUri
      );
    });

    it("should create an OAuth with the provided optionalAuthorizationCallbackUri", () => {
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

  describe("OAuth post returns an error", () => {
    let expectedError;
    let result;

    beforeEach(() => {
      expectedError = chance.string();
      jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
        post: (
          linkToOpen,
          accessToken,
          accessTokenSecret,
          postBody,
          postBodyContentType,
          callback
        ) => {
          callback(expectedError, undefined, { statusCode: 200 });
        },
      }));

      result = underTest.doSignAndPost(
        chance.string(),
        chance.string(),
        chance.string(),
        chance.string(),
        chance.string(),
      );
    });

    it("should reject with the same error", async () => {
      await expect(result).rejects.toMatch(expectedError);
    });
  });

  describe("OAuth post returns a http status code below 200", () => {
    let httpStatusCode;
    let expectedStatusText;
    let result;

    beforeEach(() => {
      httpStatusCode = chance.natural({ min: 0, max: 199 });
      expectedStatusText = chance.string();

      jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
        post: (
          linkToOpen,
          accessToken,
          accessTokenSecret,
          postBody,
          postBodyContentType,
          callback
        ) => {
          callback(undefined, undefined, { statusCode: httpStatusCode });
        },
      }));

      getStatusText.mockImplementation(() => {
        return expectedStatusText;
      });

      result = underTest.doSignAndPost(
        chance.string(),
        chance.string(),
        chance.string(),
        chance.string(),
        chance.string(),
      );
    });

    it("should return the correct status text", async () => {
      await expect(result).resolves.toMatch(expectedStatusText);
    });
  });

  describe("OAuth post returns a http status code above 300", () => {
    let httpStatusCode;
    let expectedStatusText;
    let result;

    beforeEach(() => {
      httpStatusCode = chance.natural({ min: 301, max: 500 });
      expectedStatusText = chance.string();

      jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
        post: (
          linkToOpen,
          accessToken,
          accessTokenSecret,
          postBody,
          postBodyContentType,
          callback
        ) => {
          callback(undefined, undefined, { statusCode: httpStatusCode });
        },
      }));

      getStatusText.mockImplementation(() => {
        return expectedStatusText;
      });

      result = underTest.doSignAndPost(
        chance.string(),
        chance.string(),
        chance.string(),
        chance.string(),
        chance.string(),
      );
    });

    it("should return the correct status text", async () => {
      await expect(result).resolves.toMatch(expectedStatusText);
    });
  });

  describe("OAuth post returns a http status code between 200 and 300 and a response", () => {
    let jdResponse;
    let result;
    let headers;

    beforeEach(() => {
      jdResponse = chance.string();
      headers = chance.string();
      const statusCode = chance.natural({ min: 200, max: 300 });

      jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
        post: (
          linkToOpen,
          accessToken,
          accessTokenSecret,
          postBody,
          postBodyContentType,
          callback
        ) => {
          callback(undefined, jdResponse, { statusCode, headers });
        },
      }));

      result = underTest.doSignAndPost(
        chance.string(),
        chance.string(),
        chance.string(),
        chance.string(),
        chance.string(),
      );
    });

    it("should return the same response", async () => {
        const expectedResponse = {
            body: jdResponse,
            headers: headers
        }

        await expect(result).resolves.toMatchObject(expectedResponse);
    });
  });

  describe("with link, accessToken, and accessTokenSecret", () => {
    let expectedLinkToOpen;
    let expectedAccessToken;
    let expectedAccesssTokenSecret;
    let expectedPostBody;
    let expectedPostBodyContentType;
    let actualLinkToOpen;
    let actualAccessToken;
    let actualAccessTokenSecret;
    let actualPostBody;
    let actualPostBodyContentType;

    beforeEach(async () => {
      expectedLinkToOpen = chance.string();
      expectedAccessToken = chance.string();
      expectedAccesssTokenSecret = chance.string();
      expectedPostBody = chance.string();
      expectedPostBodyContentType = chance.string();

      jest.spyOn(OAuth, "OAuth").mockImplementation(() => ({
        post: (
          linkToOpen,
          accessToken,
          accessTokenSecret,
          postBody,
          postBodyContentType,
          callback
        ) => {
          actualLinkToOpen = linkToOpen;
          actualAccessToken = accessToken;
          actualAccessTokenSecret = accessTokenSecret;
          actualPostBody = postBody;
          actualPostBodyContentType = postBodyContentType;
          callback(undefined, undefined, { statusCode: 200 });
        },
      }));

      await underTest.doSignAndPost(
        expectedLinkToOpen,
        expectedAccessToken,
        expectedAccesssTokenSecret,
        expectedPostBody,
        expectedPostBodyContentType
      );
    });

    it("should pass parameters to oauthSession", () => {
      expect(actualLinkToOpen).toBe(expectedLinkToOpen);
      expect(actualAccessToken).toBe(expectedAccessToken);
      expect(actualAccessTokenSecret).toBe(expectedAccesssTokenSecret);
      expect(actualPostBody).toBe(expectedPostBody);
      expect(actualPostBodyContentType).toBe(expectedPostBodyContentType);
    });
  });
});
