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
            linkToOpen,
            accessToken,
            accessTokenSecret,
            postBody,
            postBodyContentType,
            callback
          ) => callback(null, "", {})
        );

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        post: mockPost,
      }));

      const { doSignAndPost } = require("../src/OAuthSignRequest");

      const fakeLink = chance.url();
      const fakeAccessToken = chance.string();
      const fakeAccessTokenSecret = chance.string();
      const fakePostBody = chance.string();
      const fakePostBodyContentType = chance.string();

      await doSignAndPost(
        fakeLink,
        fakeAccessToken,
        fakeAccessTokenSecret,
        fakePostBody,
        fakePostBodyContentType
      );

      expect(mockPost).toBeCalledWith(
        fakeLink,
        fakeAccessToken,
        fakeAccessTokenSecret,
        fakePostBody,
        fakePostBodyContentType,
        expect.any(Function)
      );
    });

    it("returns an error", async () => {
      expect.assertions(1);

      const OAuth = require("oauth");
      const error = chance.string();

      let statusCode = chance.natural({ min: 400, max: 505 });

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
