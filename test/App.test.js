describe("Lambda handlers", () => {
  afterEach(() => {
    jest.resetModules();

    jest.mock("../src/publishSNSHelper");

    const {
      publishToSNSSuccess,
      publishToSNSUnsuccessfull,
    } = require("../src/publishSNSHelper");

    // these are supposed to return promises
    publishToSNSSuccess.mockResolvedValue(undefined);
    publishToSNSUnsuccessfull.mockResolvedValue(undefined);
  });

  describe("OAuth First Leg Handler", () => {
    it("should be a function", () => {
      const { firstLegHandler } = require("../app");

      expect(firstLegHandler).toEqual(expect.any(Function));
    });

    it("should initialize oAuth with the correct parameters", async () => {
      const OAuth = require("oauth");
      const config = await require("../config")();
      const fakeGetOAuthRequestToken = jest
        .fn()
        .mockImplementation((callback) => callback());

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthRequestToken: fakeGetOAuthRequestToken,
      }));

      const { firstLegHandler } = require("../app");

      const event = chance.string();
      const context = chance.string();
      const callback = jest.fn();

      await firstLegHandler(event, context, callback);

      const oAuthFirstCallParameters = OAuth.OAuth.mock.calls[0];

      expect(oAuthFirstCallParameters).toEqual([
        config.firstLegUri,
        config.thirdLegUri,
        config.clientKey,
        config.clientSecret,
        config.oAuthVersion,
        config.authorizeCallbackUri,
        config.oAuthSignatureMethod,
        config.oAuthNonceSize,
        config.oAuthCustomHeaders,
      ]);
    });

    it("should get the request tokens", async () => {
      const OAuth = require("oauth");

      const fakeGetOAuthRequestToken = jest
        .fn()
        .mockImplementation((callback) => callback());

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthRequestToken: fakeGetOAuthRequestToken,
      }));

      const { firstLegHandler } = require("../app");

      const event = chance.string();
      const context = chance.string();
      const callback = jest.fn();

      await firstLegHandler(event, context, callback);

      expect(fakeGetOAuthRequestToken).toBeCalledWith(expect.any(Function));
    });

    it("should return the request tokens if the response is successful", async () => {
      const OAuth = require("oauth");

      const fakeError = null;
      const fakeRequestToken = chance.string();
      const fakeRequestTokenSecret = chance.string();

      const fakeGetOAuthRequestToken = jest
        .fn()
        .mockImplementation((responseCallback) => {
          responseCallback(fakeError, fakeRequestToken, fakeRequestTokenSecret);
        });

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthRequestToken: fakeGetOAuthRequestToken,
      }));

      const { firstLegHandler } = require("../app");

      const event = chance.string();
      const context = chance.string();
      const expectedResponse = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          requestToken: fakeRequestToken,
          requestTokenSecret: fakeRequestTokenSecret,
        }),
        isBase64Encoded: false,
      };

      expect(await firstLegHandler(event, context)).toMatchObject(
        expectedResponse
      );
    });

    it("should return an error if the response is unsuccessful", async () => {
      const OAuth = require("oauth");

      const fakeError = chance.string();
      const fakeRequestToken = chance.string();
      const fakeRequestTokenSecret = chance.string();

      const fakeGetOAuthRequestToken = jest
        .fn()
        .mockImplementation((responseCallback) => {
          responseCallback(fakeError, fakeRequestToken, fakeRequestTokenSecret);
        });

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthRequestToken: fakeGetOAuthRequestToken,
      }));

      const { firstLegHandler } = require("../app");

      const event = chance.string();
      const context = chance.string();
      const callback = jest.fn();
      const expectedResponse = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(fakeError),
        isBase64Encoded: false,
      };

      expect(await firstLegHandler(event, context, callback)).toMatchObject(
        expectedResponse
      );
    });

    it("Should Send a Successful Response To SNS Channel", async () => {
      const OAuth = require("oauth");

      const fakeError = null;
      const fakeRequestToken = chance.string();
      const fakeRequestTokenSecret = chance.string();

      const fakeGetOAuthRequestToken = jest
        .fn()
        .mockImplementation((responseCallback) => {
          responseCallback(fakeError, fakeRequestToken, fakeRequestTokenSecret);
        });

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthRequestToken: fakeGetOAuthRequestToken,
      }));

      const { firstLegHandler } = require("../app");

      const event = chance.string();
      const context = chance.string();
      const callback = jest.fn();

      jest.mock("../src/publishSNSHelper");

      const { publishToSNSSuccess } = require("../src/publishSNSHelper");

      await firstLegHandler(event, context, callback);

      const response = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          requestToken: fakeRequestToken,
          requestTokenSecret: fakeRequestTokenSecret,
        }),
        isBase64Encoded: false,
      };

      expect(publishToSNSSuccess).toHaveBeenCalledWith({
        ...event,
        ...response,
      });
    });

    it("Should Send an unSuccessful Response To SNS Channel", async () => {
      const OAuth = require("oauth");

      const fakeError = chance.string();
      const fakeRequestToken = chance.string();
      const fakeRequestTokenSecret = chance.string();

      const fakeGetOAuthRequestToken = jest
        .fn()
        .mockImplementation((responseCallback) => {
          responseCallback(fakeError, fakeRequestToken, fakeRequestTokenSecret);
        });

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthRequestToken: fakeGetOAuthRequestToken,
      }));

      const { firstLegHandler } = require("../app");

      const event = chance.string();
      const context = chance.string();
      const callback = jest.fn();
      const response = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(fakeError),
        isBase64Encoded: false,
      };

      jest.mock("../src/publishSNSHelper");

      const { publishToSNSUnsuccessfull } = require("../src/publishSNSHelper");

      await firstLegHandler(event, context, callback);

      expect(publishToSNSUnsuccessfull).toHaveBeenCalledWith({
        ...event,
        ...response,
      });
    });
  });

  describe("OAuth Third Leg Handler", () => {
    const generateFakeEvent = () => ({
      body: JSON.stringify({
        requestToken: chance.string(),
        requestTokenSecret: chance.string(),
        verifier: chance.string(),
      }),
    });

    it("should be a function", () => {
      const { thirdLegHandler } = require("../app");

      expect(thirdLegHandler).toEqual(expect.any(Function));
    });

    it("gets the oauth token", async () => {
      const OAuth = require("oauth");

      const mockGetOAuthAccessToken = jest
        .fn()
        .mockImplementation((p1, p2, p3, callback) => callback());

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthAccessToken: mockGetOAuthAccessToken,
      }));

      const { thirdLegHandler } = require("../app");

      const event = generateFakeEvent();
      const { requestToken, requestTokenSecret, verifier } = JSON.parse(
        event.body
      );

      await thirdLegHandler(event);

      expect(mockGetOAuthAccessToken).toBeCalledWith(
        requestToken,
        requestTokenSecret,
        verifier,
        expect.any(Function)
      );
    });

    it("sends back the correct response when there is an error", async () => {
      const OAuth = require("oauth");
      const fakeError = new Error(chance.sentence());

      const mockGetOAuthAccessToken = jest
        .fn()
        .mockImplementation((token, secret, verifier, callback) => {
          callback(fakeError);
        });

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthAccessToken: mockGetOAuthAccessToken,
      }));

      const context = undefined;
      const { thirdLegHandler } = require("../app");
      const expectedResponse = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(fakeError),
        isBase64Encoded: false,
      };

      expect(await thirdLegHandler(generateFakeEvent(), context)).toMatchObject(
        expectedResponse
      );
    });

    it("sends back the correct response when the request is successful", async () => {
      const OAuth = require("oauth");

      const fakeAccessToken = chance.string();
      const fakeAccessTokenSecret = chance.string();

      const mockGetOAuthAccessToken = jest
        .fn()
        .mockImplementation((token, secret, verifier, callback) => {
          callback(undefined, fakeAccessToken, fakeAccessTokenSecret);
        });

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthAccessToken: mockGetOAuthAccessToken,
      }));

      const context = undefined;
      const { thirdLegHandler } = require("../app");
      const expectedResponse = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          accessToken: fakeAccessToken,
          accessTokenSecret: fakeAccessTokenSecret,
        }),
        isBase64Encoded: false,
      };

      expect(await thirdLegHandler(generateFakeEvent(), context)).toMatchObject(
        expectedResponse
      );
    });

    it("Should Send a Successful Response To SNS Channel", async () => {
      const OAuth = require("oauth");

      const fakeAccessToken = chance.string();
      const fakeAccessTokenSecret = chance.string();
      const fakeEvent = generateFakeEvent();

      const mockGetOAuthAccessToken = jest
        .fn()
        .mockImplementation((token, secret, verifier, callback) => {
          callback(undefined, fakeAccessToken, fakeAccessTokenSecret);
        });

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthAccessToken: mockGetOAuthAccessToken,
      }));

      const context = undefined;
      const { thirdLegHandler } = require("../app");
      const { publishToSNSSuccess } = require("../src/publishSNSHelper");

      await thirdLegHandler(fakeEvent, context);

      const expectedResponse = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          accessToken: fakeAccessToken,
          accessTokenSecret: fakeAccessTokenSecret,
        }),
        isBase64Encoded: false,
      };

      expect(publishToSNSSuccess).toHaveBeenCalledWith({
        ...fakeEvent,
        ...expectedResponse,
      });
    });

    it("Should Send a unSuccessful Response To SNS Channel", async () => {
      const OAuth = require("oauth");

      const fakeError = new Error(chance.sentence());
      const fakeEvent = generateFakeEvent();

      const mockGetOAuthAccessToken = jest
        .fn()
        .mockImplementation((token, secret, verifier, callback) => {
          callback(fakeError);
        });

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthAccessToken: mockGetOAuthAccessToken,
      }));

      const context = undefined;
      const fakeCallback = jest.fn();

      const { thirdLegHandler } = require("../app");

      jest.mock("../src/publishSNSHelper");

      const { publishToSNSUnsuccessfull } = require("../src/publishSNSHelper");
      publishToSNSUnsuccessfull.mockResolvedValue(undefined);

      await thirdLegHandler(fakeEvent, context, fakeCallback);

      const expectedResponse = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(fakeError),
        isBase64Encoded: false,
      };

      expect(publishToSNSUnsuccessfull).toHaveBeenCalledWith({
        ...fakeEvent,
        ...expectedResponse,
      });
    });
  });

  describe("OAuth Sign Request Get Handler", () => {
    it("signs and gets the request, then returns the response", async () => {
      const url = chance.url();
      const accessToken = chance.string();
      const accessTokenSecret = chance.string();

      const event = {
        queryStringParameters: {
          url,
          accessToken,
          accessTokenSecret,
        },
      };

      const SignAndGet = require("../src/SignAndGet");

      const fakeResponseData = {};
      const numberOfResponseDataKeys = chance.natural({ min: 2, max: 5 });

      for (let i = 0; i < numberOfResponseDataKeys; i += 1) {
        fakeResponseData[chance.string()] = chance.string();
      }

      fakeResponseData.status = chance.natural();

      SignAndGet.doSignAndGet = jest.fn().mockResolvedValue(fakeResponseData);

      const { oAuthSignRequestGet } = require("../app");

      const responseData = await oAuthSignRequestGet(event);

      expect(SignAndGet.doSignAndGet).toBeCalledWith(
        url,
        accessToken,
        accessTokenSecret,
        undefined,
        undefined
      );
      const response = {
        statusCode: fakeResponseData.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(fakeResponseData),
        isBase64Encoded: false,
      };

      expect(responseData).toEqual(response);
    });

    it("signs and gets the request, then returns the response when an oauth_callback query param is present", async () => {
      const url = chance.url();
      const accessToken = chance.string();
      const accessTokenSecret = chance.string();
      const oauth_callback = chance.string();

      const event = {
        queryStringParameters: {
          url,
          accessToken,
          accessTokenSecret,
          oauth_callback,
        },
      };

      const SignAndGet = require("../src/SignAndGet");

      const fakeResponseData = {};
      const numberOfResponseDataKeys = chance.natural({ min: 2, max: 5 });

      for (let i = 0; i < numberOfResponseDataKeys; i += 1) {
        fakeResponseData[chance.string()] = chance.string();
      }

      fakeResponseData.status = chance.natural();

      SignAndGet.doSignAndGet = jest.fn().mockResolvedValue(fakeResponseData);

      const { oAuthSignRequestGet } = require("../app");

      const responseData = await oAuthSignRequestGet(event);

      expect(SignAndGet.doSignAndGet).toBeCalledWith(
        url,
        accessToken,
        accessTokenSecret,
        oauth_callback,
        undefined
      );
      const response = {
        statusCode: fakeResponseData.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(fakeResponseData),
        isBase64Encoded: false,
      };

      expect(responseData).toEqual(response);
    });

    it("returns an error when an error occurs during the signing and get", async () => {
      const SignAndGet = require("../src/SignAndGet");

      const fakeError = {};
      const numberOfErrorKeys = chance.natural({ min: 2, max: 5 });

      for (let i = 0; i < numberOfErrorKeys; i += 1) {
        fakeError[chance.string()] = chance.string();
      }

      SignAndGet.doSignAndGet = jest.fn().mockRejectedValue(fakeError);

      const { oAuthSignRequestGet } = require("../app");

      const url = chance.url();
      const accessToken = chance.string();
      const accessTokenSecret = chance.string();

      const fakeEvent = {
        queryStringParameters: {
          url,
          accessToken,
          accessTokenSecret,
        },
      };

      const returnedError = await oAuthSignRequestGet(fakeEvent);

      const fakeErrorResponse = {
        statusCode: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(fakeError),
        isBase64Encoded: false,
      };

      expect(returnedError).toEqual(fakeErrorResponse);
    });

    it("when provided a allData queryParameter calls DoSignAndGet with same value", async () => {
      const SignAndGet = require("../src/SignAndGet");

      SignAndGet.doSignAndGet = jest.fn().mockResolvedValue({});

      const expectedAllDataValue = chance.bool();
      const providedEvent = {
        queryStringParameters: {
          url: chance.url(),
          accessToken: chance.string(),
          accessTokenSecret: chance.string(),
          allData: expectedAllDataValue,
        },
      };

      const { oAuthSignRequestGet } = require("../app");

      await oAuthSignRequestGet(providedEvent);

      expect(SignAndGet.doSignAndGet).toBeCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        undefined,
        expectedAllDataValue
      );
    });
  });

  describe("OAuth Sign Request Delete Handler", () => {
    it("signs and deletes the request, then returns the response", async () => {
      const url = chance.url();
      const accessToken = chance.string();
      const accessTokenSecret = chance.string();

      const event = {
        queryStringParameters: {
          url,
          accessToken,
          accessTokenSecret,
        },
      };

      const SignAndDelete = require("../src/SignAndDelete");

      const fakeResponseData = {};
      const numberOfResponseDataKeys = chance.natural({ min: 2, max: 5 });

      for (let i = 0; i < numberOfResponseDataKeys; i += 1) {
        fakeResponseData[chance.string()] = chance.string();
      }

      fakeResponseData.status = chance.natural();

      SignAndDelete.doSignAndDelete = jest
        .fn()
        .mockResolvedValue(fakeResponseData);

      const { oAuthSignRequestDelete } = require("../app");

      const responseData = await oAuthSignRequestDelete(event);

      expect(SignAndDelete.doSignAndDelete).toBeCalledWith(
        url,
        accessToken,
        accessTokenSecret,
        undefined
      );
      const response = {
        statusCode: fakeResponseData.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(fakeResponseData),
        isBase64Encoded: false,
      };

      expect(responseData).toEqual(response);
    });

    it("signs and deletes the request, then returns the response when an oauth_callback query param is present", async () => {
      const url = chance.url();
      const accessToken = chance.string();
      const accessTokenSecret = chance.string();
      const oauth_callback = chance.string();

      const event = {
        queryStringParameters: {
          url,
          accessToken,
          accessTokenSecret,
          oauth_callback,
        },
      };

      const SignAndDelete = require("../src/SignAndDelete");

      const fakeResponseData = {};
      const numberOfResponseDataKeys = chance.natural({ min: 2, max: 5 });

      for (let i = 0; i < numberOfResponseDataKeys; i += 1) {
        fakeResponseData[chance.string()] = chance.string();
      }

      fakeResponseData.status = chance.natural();

      SignAndDelete.doSignAndDelete = jest
        .fn()
        .mockResolvedValue(fakeResponseData);

      const { oAuthSignRequestDelete } = require("../app");

      const responseData = await oAuthSignRequestDelete(event);

      expect(SignAndDelete.doSignAndDelete).toBeCalledWith(
        url,
        accessToken,
        accessTokenSecret,
        oauth_callback
      );
      const response = {
        statusCode: fakeResponseData.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(fakeResponseData),
        isBase64Encoded: false,
      };

      expect(responseData).toEqual(response);
    });

    it("returns an error when an error occurs during the signing and delete", async () => {
      const SignAndDelete = require("../src/SignAndDelete");
      const fakeError = new Error(chance.string());
      SignAndDelete.doSignAndDelete = jest.fn().mockRejectedValue(fakeError);
      const { oAuthSignRequestDelete } = require("../app");

      const fakeEvent = {
        queryStringParameters: {
          url: chance.url(),
          accessToken: chance.string(),
          accessTokenSecret: chance.string(),
        },
      };

      const returnedError = await oAuthSignRequestDelete(fakeEvent);

      const fakeErrorResponse = {
        statusCode: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(fakeError),
        isBase64Encoded: false,
      };

      expect(returnedError).toEqual(fakeErrorResponse);
    });
  });

  describe("OAuth Sign Request Post Handler", () => {
    let oAuthSignRequestPost;

    const createFakeEvent = (options = {}) => ({
      body: JSON.stringify({
        url: options.url || chance.url(),
        accessToken: options.accessToken || chance.string(),
        accessTokenSecret: options.accessTokenSecret || chance.string(),
        data: options.data || chance.string(),
      }),
    });

    beforeEach(() => {
      const SignAndPost = require("../src/SignAndPost");

      SignAndPost.doSignAndPost = jest
        .fn()
        .mockResolvedValue(chance.string());

      ({ oAuthSignRequestPost } = require("../app"));
    });

    it("returns a promise", () => {
      const response = oAuthSignRequestPost(createFakeEvent());

      expect(response instanceof Promise).toEqual(true);
    });

    it("calls doSignAndPost correctly", async () => {
      jest.resetModules();

      const SignAndPost = require("../src/SignAndPost");

      SignAndPost.doSignAndPost = jest
        .fn()
        .mockResolvedValue(chance.string());

      ({ oAuthSignRequestPost } = require("../app"));

      const url = chance.url();
      const accessToken = chance.string();
      const accessTokenSecret = chance.string();
      const data = chance.string();
      const expectedContentType = process.env.OAUTH_CUSTOM_HEADERS;
      const fakeEvent = createFakeEvent({
        url,
        accessToken,
        accessTokenSecret,
        data,
      });

      await oAuthSignRequestPost(fakeEvent);

      expect(SignAndPost.doSignAndPost).toBeCalledWith(
        url,
        accessToken,
        accessTokenSecret,
        JSON.stringify(data),
        expectedContentType,
        undefined
      );
    });

    it("calls doSignAndPost correctly when an oauth_callback query param is present", async () => {
      jest.resetModules();

      const SignAndPost = require("../src/SignAndPost");

      SignAndPost.doSignAndPost = jest
        .fn()
        .mockResolvedValue(chance.string());

      ({ oAuthSignRequestPost } = require("../app"));

      const url = chance.url();
      const accessToken = chance.string();
      const accessTokenSecret = chance.string();
      const oauth_callback = chance.string();
      const data = chance.string();
      const expectedContentType = process.env.OAUTH_CUSTOM_HEADERS;
      const fakeEvent = createFakeEvent({
        url,
        accessToken,
        accessTokenSecret,
        data,
      });
      fakeEvent.queryStringParameters = {
        oauth_callback,
      };

      await oAuthSignRequestPost(fakeEvent);

      expect(SignAndPost.doSignAndPost).toBeCalledWith(
        url,
        accessToken,
        accessTokenSecret,
        JSON.stringify(data),
        expectedContentType,
        oauth_callback
      );
    });

    it("returns the correct response when the post works", async () => {
      jest.resetModules();

      const SignAndPost = require("../src/SignAndPost");
      const status = 200;
      const fakeResponseData = JSON.stringify({ body: chance.string() });
      const fakeLocation = chance.string();
      const fakeResponse = {
        status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          location: fakeLocation,
        },
        body: fakeResponseData,
        isBase64Encoded: false,
      };

      SignAndPost.doSignAndPost = jest
        .fn()
        .mockResolvedValue(fakeResponse);

      ({ oAuthSignRequestPost } = require("../app"));

      const response = await oAuthSignRequestPost(createFakeEvent());
      const expectedResponse = {
        statusCode: status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          location: response.headers.location,
        },
        body: JSON.stringify(fakeResponseData),
        isBase64Encoded: false,
      };

      expect(response).toEqual(expectedResponse);
    });

    it("returns an error when does not resolve", async () => {
      jest.resetModules();

      const SignAndPost = require("../src/SignAndPost");

      const fakeError = {};
      const numberOfErrorKeys = chance.natural({ min: 2, max: 5 });

      for (let i = 0; i < numberOfErrorKeys; i += 1) {
        fakeError[chance.string()] = chance.string();
      }

      const fakeErrorResponse = {
        statusCode: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(fakeError),
        isBase64Encoded: false,
      };

      SignAndPost.doSignAndPost = jest.fn().mockRejectedValue(fakeError);

      ({ oAuthSignRequestPost } = require("../app"));

      expect.assertions(1);

      const returnedError = await oAuthSignRequestPost(createFakeEvent());

      expect(returnedError).toEqual(fakeErrorResponse);
    });
  });
});
