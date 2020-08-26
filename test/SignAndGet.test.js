// jest.mock("../src/HttpResponses");
const Chance = require("chance");
const { getStatusText } = require("../src/HttpResponses");
const underTest = require("../src/SignAndGet")
const config = require("../config");
const OAuth = require("oauth");
const { KMS } = require("aws-sdk");

describe("OAuth Sign Request", () => {
  let chance;

  beforeEach(() => {
    chance = Chance();

    jest.mock("aws-sdk", () => {
      const KMS = class {};
      KMS.prototype.decrypt = jest.fn();

      return { KMS };
    });

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
    let config;

    beforeEach(async () => {
      config = config();
      config.oAuthCustomHeaders = { [chance.string()]: chance.string() };
      config.authorizeCallbackUri = chance.string();
    });

    it("throws error if no oAuthCustomHeaders in config", async () => {
      config.oAuthCustomHeaders = undefined;

      expect(() =>
        underTest.doSignAndGet(
          chance.url(),
          chance.string(),
          chance.string(),
          allDataFlag
        )
      ).toThrow(Error);
    });

    it("creates OAuth config with correct values when allDataFlag is true", async () => {
      const allDataFlag = true;
      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        get: (link, accessToken, accessTokenSecret, callback) => {
          callback(null, null, { statusCode: 200 });
        },
      }));

      await underTest.doSignAndGet(
        chance.url(),
        chance.string(),
        chance.string(),
        allDataFlag
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
        {
          ...config.oAuthCustomHeaders,
          No_Paging: true,
        }
      );
    });

    it("returns correct response when allDataFlag is true", async () => {
      const allDataFlag = true;
      const fakeResponseData = chance.string();
      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        get: (link, accessToken, accessTokenSecret, callback) => {
          callback(null, fakeResponseData, { statusCode: 200 });
        },
      }));

      const response = await underTest.doSignAndGet(
        chance.url(),
        chance.string(),
        chance.string(),
        allDataFlag
      );

      expect(response).toEqual(fakeResponseData);
    });

    it("creates OAuth config with correct values when allDataFlag is false and there are preexisting custom headers", async () => {
      const allDataFlag = false;
      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        get: (link, accessToken, accessTokenSecret, callback) => {
          callback(null, null, { statusCode: 200 });
        },
      }));

      await underTest.doSignAndGet(
        chance.url(),
        chance.string(),
        chance.string(),
        allDataFlag
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
        {
          ...config.oAuthCustomHeaders,
        }
      );
    });

    it("returns correct response when allDataFlag is false", async () => {
      const allDataFlag = false;
      const fakeResponseData = chance.string();
      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        get: (link, accessToken, accessTokenSecret, callback) => {
          callback(null, fakeResponseData, { statusCode: 200 });
        },
      }));

      const response = await underTest.doSignAndGet(
        chance.url(),
        chance.string(),
        chance.string(),
        allDataFlag
      );

      expect(response).toEqual(fakeResponseData);
    });

    it("throws an error when there is an error in the response", async () => {
      const fakeLink = chance.url();
      const fakeAccessToken = chance.string();
      const fakeAccessTokenSecret = chance.string();
      const fakeError = chance.string();
      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        get: (link, accessToken, accessTokenSecret, callback) => {
          callback(fakeError, null, { statusCode: 200 });
        },
      }));

      await expect(
        underTest.doSignAndGet(fakeLink, fakeAccessToken, fakeAccessTokenSecret)
      ).rejects.toMatch(fakeError);
    });

    it("return an error when there is an http error from OAuth Sign Request endpoint", async () => {
      const fakeLink = chance.url();
      const fakeAccessToken = chance.string();
      const fakeAccessTokenSecret = chance.string();
      const fakeError = chance.string();
      let statusCode = chance.natural({ min: 0, max: 500 });

      while (statusCode > 200 && statusCode < 300) {
        statusCode = chance.natural({ min: 0, max: 500 });
      }

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        get: (link, accessToken, accessTokenSecret, callback) => {
          callback(fakeError, null, { statusCode });
        },
      }));

      const doSignandGet = underTest.doSignAndGet(
        fakeLink,
        fakeAccessToken,
        fakeAccessTokenSecret
      );

      await expect(doSignandGet).resolves.toMatch(getStatusText(statusCode));
    });
  });
});
