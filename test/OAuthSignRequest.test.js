const Chance = require("chance");
const { getStatusText } = require("../src/HttpResponses");

describe("OAuth Sign Request", () => {
  let chance;

  beforeEach(() => {
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
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("Do Sign and Get", () => {
    it("gets a set of temporary OAuth tokens", async () => {
      const fakeLink = chance.url();
      const fakeAccessToken = chance.string();
      const fakeAccessTokenSecret = chance.string();

      const fakeResponseData = chance.string();

      const OAuth = require("oauth");
      const config = await require("../config")();

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        get: (link, accessToken, accessTokenSecret, callback) => {
          callback(null, fakeResponseData, { statusCode: 200 });
        },
      }));

      const { doSignAndGet } = require("../src/OAuthSignRequest");

      const response = await doSignAndGet(
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
      expect(response).toEqual(fakeResponseData);
    });

    it("throws an error when there is an error in the response", async () => {
      const fakeLink = chance.url();
      const fakeAccessToken = chance.string();
      const fakeAccessTokenSecret = chance.string();

      const fakeError = chance.string();

      const OAuth = require("oauth");

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        get: (link, accessToken, accessTokenSecret, callback) => {
          callback(fakeError, null, { statusCode: 200 });
        },
      }));

      const { doSignAndGet } = require("../src/OAuthSignRequest");

      await expect(
        doSignAndGet(fakeLink, fakeAccessToken, fakeAccessTokenSecret)
      ).rejects.toMatch(fakeError);
    });

    it("return an error when there is an http error from OAuth Sign Request endpoint", async () => {
      const fakeLink = chance.url();
      const fakeAccessToken = chance.string();
      const fakeAccessTokenSecret = chance.string();

      const fakeError = chance.string();

      const OAuth = require("oauth");
      let statusCode = chance.natural({ min: 0, max: 500 });

      while (statusCode > 200 && statusCode < 300) {
        statusCode = chance.natural({ min: 0, max: 500 });
      }

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        get: (link, accessToken, accessTokenSecret, callback) => {
          callback(fakeError, null, { statusCode });
        },
      }));

      const { doSignAndGet } = require("../src/OAuthSignRequest");
      const doSignandGet = doSignAndGet(
        fakeLink,
        fakeAccessToken,
        fakeAccessTokenSecret
      );

      await expect(doSignandGet).resolves.toMatch(getStatusText(statusCode));
    });
  });

  describe("Do Sign and Delete", () => {
    const mockOAuth = (fakeResponseData = chance.string()) => {
      const OAuth = require("oauth");

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        delete: (
          fakeLink,
          fakeAccessToken,
          fakeAccessTokenSecret,
          callback
        ) => {
          callback(null, fakeResponseData, { statusCode: 200 });
        },
      }));

      return OAuth;
    };

    it("is a function", () => {
      const { doSignAndDelete } = require("../src/OAuthSignRequest");

      expect(doSignAndDelete).toEqual(expect.any(Function));
    });

    it("create an Oauth correctly with correct params", async () => {
      process.env.CLIENT_KEY = chance.string();
      process.env.CLIENT_SECRET = chance.string();

      const oauthConfig = await require("../config")();

      oauthConfig.oAuthNonceSize = chance.string();
      const OAuth = mockOAuth();

      const { doSignAndDelete } = require("../src/OAuthSignRequest");

      await doSignAndDelete();

      expect(OAuth.OAuth).toBeCalledWith(
        oauthConfig.firstLegUri,
        oauthConfig.thirdLegUri,
        oauthConfig.clientKey,
        oauthConfig.clientSecret,
        oauthConfig.oAuthVersion,
        oauthConfig.authorizeCallbackUri,
        oauthConfig.oAuthSignatureMethod,
        oauthConfig.oAuthNonceSize,
        oauthConfig.oAuthCustomHeaders
      );

      delete process.env.CLIENT_KEY;
      delete process.env.CLIENT_SECRET;
    });

    it("calls Oauth delete with the provided link, token, and secret", async () => {
      const OAuth = require("oauth");
      const mockDelete = jest
        .fn()
        .mockImplementation(
          (linkToOpen, accessToken, accessTokenSecret, callback) =>
            callback(null, "", {})
        );

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        delete: mockDelete,
      }));

      const linkToOpen = chance.url();
      const accessToken = chance.string();
      const accessTokenSecret = chance.string();

      const { doSignAndDelete } = require("../src/OAuthSignRequest");

      await doSignAndDelete(linkToOpen, accessToken, accessTokenSecret);

      expect(mockDelete).toBeCalledWith(
        linkToOpen,
        accessToken,
        accessTokenSecret,
        expect.any(Function)
      );
    });

    it("returns a promise", () => {
      mockOAuth();

      const linkToOpen = chance.url();
      const accessToken = chance.string();
      const accessTokenSecret = chance.string();

      const { doSignAndDelete } = require("../src/OAuthSignRequest");

      expect(
        doSignAndDelete(linkToOpen, accessToken, accessTokenSecret)
      ).toBeInstanceOf(Promise);
    });

    it("rejects when api offline", async () => {
      expect.assertions(1);

      const OAuth = require("oauth");
      const fakeError = new Error(chance.string());
      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        delete: (
          fakeLink,
          fakeAccessToken,
          fakeAccessTokenSecret,
          callback
        ) => {
          callback(fakeError, null, null);
        },
      }));

      const linkToOpen = chance.url();
      const accessToken = chance.string();
      const accessTokenSecret = chance.string();

      const { doSignAndDelete } = require("../src/OAuthSignRequest");

      try {
        await doSignAndDelete(linkToOpen, accessToken, accessTokenSecret);
      } catch (e) {
        expect(e).toEqual(fakeError);
      }
    });

    it("resolves with status code message upon non-2xx responses", async () => {
      expect.assertions(1);

      const OAuth = require("oauth");
      const fakeResponse = {
        statusCode: chance.integer({ min: 300, max: 599 }),
      };
      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        delete: (
          fakeLink,
          fakeAccessToken,
          fakeAccessTokenSecret,
          callback
        ) => {
          callback(null, null, fakeResponse);
        },
      }));

      const linkToOpen = chance.url();
      const accessToken = chance.string();
      const accessTokenSecret = chance.string();

      const { doSignAndDelete } = require("../src/OAuthSignRequest");

      const result = await doSignAndDelete(
        linkToOpen,
        accessToken,
        accessTokenSecret
      );
      expect(result).toBe(getStatusText(fakeResponse.statusCode));
    });

    it("resolves with the response body upon 2xx response", async () => {
      expect.assertions(1);

      const OAuth = require("oauth");
      const fakeResponse = { stuff: chance.string() };
      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        delete: (
          fakeLink,
          fakeAccessToken,
          fakeAccessTokenSecret,
          callback
        ) => {
          callback(null, fakeResponse, {
            statusCode: chance.integer({ min: 200, max: 299 }),
          });
        },
      }));

      const linkToOpen = chance.url();
      const accessToken = chance.string();
      const accessTokenSecret = chance.string();

      const { doSignAndDelete } = require("../src/OAuthSignRequest");

      const result = await doSignAndDelete(
        linkToOpen,
        accessToken,
        accessTokenSecret
      );
      expect(result).toBe(fakeResponse);
    });
  });

  describe("Do Sign and Post", () => {
    const mockOAuth = (fakeResponseData = chance.string()) => {
      const OAuth = require("oauth");

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        post: (
          fakeLink,
          fakeAccessToken,
          fakeAccessTokenSecret,
          fakePostBody,
          fakePostBodyContentType,
          callback
        ) => {
          callback(null, fakeResponseData, { statusCode: 200 });
        },
      }));

      return OAuth;
    };

    it("is a function", () => {
      const { doSignAndPost } = require("../src/OAuthSignRequest");

      expect(doSignAndPost).toEqual(expect.any(Function));
    });

    it("create an Oauth correctly with correct params", async () => {
      process.env.CLIENT_KEY = chance.string();
      process.env.CLIENT_SECRET = chance.string();

      const oauthConfig = await require("../config")();

      oauthConfig.oAuthNonceSize = chance.string();
      const OAuth = mockOAuth();

      const { doSignAndPost } = require("../src/OAuthSignRequest");

      await doSignAndPost();

      expect(OAuth.OAuth).toBeCalledWith(
        oauthConfig.firstLegUri,
        oauthConfig.thirdLegUri,
        oauthConfig.clientKey,
        oauthConfig.clientSecret,
        oauthConfig.oAuthVersion,
        oauthConfig.authorizeCallbackUri,
        oauthConfig.oAuthSignatureMethod,
        oauthConfig.oAuthNonceSize,
        oauthConfig.oAuthCustomHeaders
      );

      delete process.env.CLIENT_KEY;
      delete process.env.CLIENT_SECRET;
    });

    it("posts correctly", async () => {
      const OAuth = require("oauth");
      const mockPost = jest
        .fn()
        .mockImplementation(
          (
            fakeLink,
            fakeAccessToken,
            fakeAccessTokenSecret,
            fakePostBody,
            fakePostBodyContentType,
            callback
          ) => {
            callback(null, "", {});
          }
        );

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        post: mockPost,
      }));

      const config = await require("../config")();
      const expectedContentType = chance.string();
      config.postContentType = expectedContentType;

      const { doSignAndPost } = require("../src/OAuthSignRequest");

      const fakeLink = chance.url();
      const fakeAccessToken = chance.string();
      const fakeAccessTokenSecret = chance.string();
      const fakePostBody = chance.string();
      const fakePostCustomHeaders = { [chance.string()]: chance.string() };

      await doSignAndPost(
        fakeLink,
        fakeAccessToken,
        fakeAccessTokenSecret,
        fakePostBody,
        fakePostCustomHeaders
      );

      expect(mockPost).toBeCalledWith(
        fakeLink,
        fakeAccessToken,
        fakeAccessTokenSecret,
        fakePostBody,
        expectedContentType,
        expect.any(Function)
      );
    });

    it("returns an error", async () => {
      expect.assertions(1);

      const OAuth = require("oauth");
      const error = chance.string();

      let statusCode = chance.natural({ min: 0, max: 500 });

      while (statusCode > 200 && statusCode < 300) {
        statusCode = chance.natural({ min: 0, max: 500 });
      }

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        post: (
          fakeLink,
          fakeAccessToken,
          fakeAccessTokenSecret,
          fakePostBody,
          fakePostBodyContentType,
          callback
        ) => {
          callback(error, null, { statusCode });
        },
      }));

      const { doSignAndPost } = require("../src/OAuthSignRequest");

      const fakeLink = chance.url();
      const fakeAccessToken = chance.string();
      const fakeAccessTokenSecret = chance.string();
      const fakePostBody = chance.string();
      const fakePostBodyContentType = chance.string();

      let response = await doSignAndPost(
        fakeLink,
        fakeAccessToken,
        fakeAccessTokenSecret,
        fakePostBody,
        fakePostBodyContentType
      );

      expect(response).toMatch(getStatusText(statusCode));
    });

    it("returns an error", async () => {
      expect.assertions(1);

      const OAuth = require("oauth");
      const error = chance.string();

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        post: (
          fakeLink,
          fakeAccessToken,
          fakeAccessTokenSecret,
          fakePostBody,
          fakePostBodyContentType,
          callback
        ) => {
          callback(error, null, { statusCode: 200 });
        },
      }));

      const { doSignAndPost } = require("../src/OAuthSignRequest");

      const fakeLink = chance.url();
      const fakeAccessToken = chance.string();
      const fakeAccessTokenSecret = chance.string();
      const fakePostBody = chance.string();
      const fakePostBodyContentType = chance.string();

      let response;

      try {
        await doSignAndPost(
          fakeLink,
          fakeAccessToken,
          fakeAccessTokenSecret,
          fakePostBody,
          fakePostBodyContentType
        );
      } catch (error) {
        response = error;
      }

      expect(response).toMatch(error);
    });

    it("returns a promise", () => {
      mockOAuth();

      const { doSignAndPost } = require("../src/OAuthSignRequest");

      const promise = doSignAndPost();

      expect(promise instanceof Promise).toEqual(true);
    });

    it("returns a promise that resolves with the post response data", async () => {
      const fakeResponseData = chance.string();

      mockOAuth(fakeResponseData);

      const { doSignAndPost } = require("../src/OAuthSignRequest");

      const responseData = await doSignAndPost();

      expect(responseData.body).toEqual(fakeResponseData);
    });
  });
});
