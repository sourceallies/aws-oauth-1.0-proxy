const config = require('../config');

describe('Lambda handlers', () => {
  afterEach(() => {
    jest.resetModules();
  });

  describe('OAuth First Leg Handler', () => {
    it('should be a function', () => {
      const { firstLegHandler } = require('../app');

      expect(firstLegHandler).toEqual(expect.any(Function));
    });

    it('should initialize oAuth with the correct parameters', () => {
      const OAuth = require('oauth');

      const fakeGetOAuthRequestToken = jest.fn();

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthRequestToken: fakeGetOAuthRequestToken,
      }));

      const { firstLegHandler } = require('../app');

      const event = chance.string();
      const context = chance.string();
      const callback = jest.fn();

      firstLegHandler(event, context, callback);

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

    it('should get the request tokens', () => {
      const OAuth = require('oauth');

      const fakeGetOAuthRequestToken = jest.fn();

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthRequestToken: fakeGetOAuthRequestToken,
      }));

      const { firstLegHandler } = require('../app');

      const event = chance.string();
      const context = chance.string();
      const callback = jest.fn();

      firstLegHandler(event, context, callback);

      expect(fakeGetOAuthRequestToken).toBeCalledWith(expect.any(Function));
    });

    it('should return the request tokens if the response is successful', () => {
      const OAuth = require('oauth');

      const fakeError = null;
      const fakeRequestToken = chance.string();
      const fakeRequestTokenSecret = chance.string();

      const fakeGetOAuthRequestToken = jest.fn().mockImplementation((responseCallback) => {
        responseCallback(fakeError, fakeRequestToken, fakeRequestTokenSecret);
      });

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthRequestToken: fakeGetOAuthRequestToken,
      }));

      const { firstLegHandler } = require('../app');

      const event = chance.string();
      const context = chance.string();
      const callback = jest.fn();

      firstLegHandler(event, context, callback);

      const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          requestToken: fakeRequestToken,
          requestTokenSecret: fakeRequestTokenSecret,
        }),
        isBase64Encoded: false,
      };

      expect(callback).toBeCalledWith(null, response);
    });

    it('should return an error if the response is unsuccessful', () => {
      const OAuth = require('oauth');

      const fakeError = chance.string();
      const fakeRequestToken = chance.string();
      const fakeRequestTokenSecret = chance.string();

      const fakeGetOAuthRequestToken = jest.fn().mockImplementation((responseCallback) => {
        responseCallback(fakeError, fakeRequestToken, fakeRequestTokenSecret);
      });

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthRequestToken: fakeGetOAuthRequestToken,
      }));

      const { firstLegHandler } = require('../app');

      const event = chance.string();
      const context = chance.string();
      const callback = jest.fn();

      firstLegHandler(event, context, callback);

      const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(fakeError),
        isBase64Encoded: false,
      };

      expect(callback).toBeCalledWith(null, response);
    });

    it.only('Should Send a Successful Response To SNS Channel',() => {
      const OAuth = require('oauth');

      const fakeError = chance.string();
      const fakeRequestToken = chance.string();
      const fakeRequestTokenSecret = chance.string();

      const fakeGetOAuthRequestToken = jest.fn().mockImplementation((responseCallback) => {
        responseCallback(fakeError, fakeRequestToken, fakeRequestTokenSecret);
      });

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthRequestToken: fakeGetOAuthRequestToken,
      }));

      const { firstLegHandler } = require('../app');

      const event = chance.string();
      const context = chance.string();
      const callback = jest.fn();

      jest.mock('../src/publishSNSHelper');

      const { publishToSNSSuccess } = require('../src/publishSNSHelper');

      firstLegHandler(event, context, callback);

      expect(publishToSNSSuccess).toHaveBeenCalled();
    });
  });

  describe('OAuth Third Leg Handler', () => {
    const generateFakeEvent = () => ({
      body: JSON.stringify({
        requestToken: chance.string(),
        requestTokenSecret: chance.string(),
        verifier: chance.string(),
      }),
    });

    it('should be a function', () => {
      const { thirdLegHandler } = require('../app');

      expect(thirdLegHandler).toEqual(expect.any(Function));
    });

    it('gets the oauth token', () => {
      const OAuth = require('oauth');

      const mockGetOAuthAccessToken = jest.fn();

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthAccessToken: mockGetOAuthAccessToken,
      }));

      const { thirdLegHandler } = require('../app');

      const event = generateFakeEvent();
      const {
        requestToken,
        requestTokenSecret,
        verifier,
      } = JSON.parse(event.body);

      thirdLegHandler(event);

      expect(mockGetOAuthAccessToken)
        .toBeCalledWith(requestToken, requestTokenSecret, verifier, expect.any(Function));
    });

    it('sends back the correct response when there is an error', () => {
      const OAuth = require('oauth');

      const fakeError = new Error(chance.sentence());

      const mockGetOAuthAccessToken = jest.fn()
        .mockImplementation((token, secret, verifier, callback) => {
          callback(fakeError);
        });

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthAccessToken: mockGetOAuthAccessToken,
      }));

      const context = undefined;
      const fakeCallback = jest.fn();

      const { thirdLegHandler } = require('../app');

      thirdLegHandler(generateFakeEvent(), context, fakeCallback);
      const expectedResponse = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(fakeError),
        isBase64Encoded: false,
      };

      expect(fakeCallback).toBeCalledWith(null, expectedResponse);
    });

    it('sends back the correct response when the request is successful', () => {
      const OAuth = require('oauth');

      const fakeAccessToken = chance.string();
      const fakeAccessTokenSecret = chance.string();

      const mockGetOAuthAccessToken = jest.fn()
        .mockImplementation((token, secret, verifier, callback) => {
          callback(undefined, fakeAccessToken, fakeAccessTokenSecret);
        });

      OAuth.OAuth = jest.fn().mockImplementation(() => ({
        getOAuthAccessToken: mockGetOAuthAccessToken,
      }));

      const context = undefined;
      const fakeCallback = jest.fn();

      const { thirdLegHandler } = require('../app');

      thirdLegHandler(generateFakeEvent(), context, fakeCallback);
      const expectedResponse = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          accessToken: fakeAccessToken,
          accessTokenSecret: fakeAccessTokenSecret,
        }),
        isBase64Encoded: false,
      };

      expect(fakeCallback).toBeCalledWith(null, expectedResponse);
    });
  });

  describe('OAuth Sign Request Get Handler', () => {
    it('signs and gets the request, then returns the response', async () => {
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

      const OAuthSignRequest = require('../src/OAuthSignRequest');

      const fakeResponseData = {};
      const numberOfResponseDataKeys = chance.natural({ min: 2, max: 5 });

      for (let i = 0; i < numberOfResponseDataKeys; i += 1) {
        fakeResponseData[chance.string()] = chance.string();
      }

      fakeResponseData.status = chance.natural();

      OAuthSignRequest.doSignAndGet = jest.fn().mockResolvedValue(fakeResponseData);

      const { oAuthSignRequestGet } = require('../app');

      const responseData = await oAuthSignRequestGet(event);

      expect(OAuthSignRequest.doSignAndGet).toBeCalledWith(url, accessToken, accessTokenSecret);
      const response = {
        statusCode: fakeResponseData.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(fakeResponseData),
        isBase64Encoded: false,
      };

      expect(responseData).toEqual(response);
    });

    it('returns an error when an error occurs during the signing and get', async () => {
      const OAuthSignRequest = require('../src/OAuthSignRequest');

      const fakeError = {};
      const numberOfErrorKeys = chance.natural({ min: 2, max: 5 });

      for (let i = 0; i < numberOfErrorKeys; i += 1) {
        fakeError[chance.string()] = chance.string();
      }

      OAuthSignRequest.doSignAndGet = jest.fn().mockRejectedValue(fakeError);

      const { oAuthSignRequestGet } = require('../app');

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
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(fakeError),
        isBase64Encoded: false,
      };

      expect(returnedError).toEqual(fakeErrorResponse);
    });
  });

  describe('OAuth Sign Request Delete Handler', () => {
    it('signs and deletes the request, then returns the response', async () => {
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

      const OAuthSignRequest = require('../src/OAuthSignRequest');

      const fakeResponseData = {};
      const numberOfResponseDataKeys = chance.natural({ min: 2, max: 5 });

      for (let i = 0; i < numberOfResponseDataKeys; i += 1) {
        fakeResponseData[chance.string()] = chance.string();
      }

      fakeResponseData.status = chance.natural();

      OAuthSignRequest.doSignAndDelete = jest.fn().mockResolvedValue(fakeResponseData);

      const { oAuthSignRequestDelete } = require('../app');

      const responseData = await oAuthSignRequestDelete(event);

      expect(OAuthSignRequest.doSignAndDelete).toBeCalledWith(url, accessToken, accessTokenSecret);
      const response = {
        statusCode: fakeResponseData.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(fakeResponseData),
        isBase64Encoded: false,
      };

      expect(responseData).toEqual(response);
    });

    it('returns an error when an error occurs during the signing and delete', async () => {
      const OAuthSignRequest = require('../src/OAuthSignRequest');
      const fakeError = new Error(chance.string());
      OAuthSignRequest.doSignAndDelete = jest.fn().mockRejectedValue(fakeError);
      const { oAuthSignRequestDelete } = require('../app');

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
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(fakeError),
        isBase64Encoded: false,
      };

      expect(returnedError).toEqual(fakeErrorResponse);
    });
  });

  describe('OAuth Sign Request Post Handler', () => {
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
      const OAuthSignRequest = require('../src/OAuthSignRequest');

      OAuthSignRequest.doSignAndPost = jest.fn().mockResolvedValue(chance.string());

      ({ oAuthSignRequestPost } = require('../app'));
    });

    it('should be a function', () => {
      expect(typeof oAuthSignRequestPost).toEqual('function');
    });

    it('returns a promise', () => {
      const response = oAuthSignRequestPost(createFakeEvent());

      expect(response instanceof Promise).toEqual(true);
    });

    it('calls doSignAndPost correctly', () => {
      jest.resetModules();

      const OAuthSignRequest = require('../src/OAuthSignRequest');

      OAuthSignRequest.doSignAndPost = jest.fn().mockResolvedValue(chance.string());

      ({ oAuthSignRequestPost } = require('../app'));

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

      oAuthSignRequestPost(fakeEvent);

      expect(OAuthSignRequest.doSignAndPost)
        .toBeCalledWith(url, accessToken, accessTokenSecret,
          JSON.stringify(data), expectedContentType);
    });

    it('returns the correct response when the post works', async () => {
      jest.resetModules();

      const OAuthSignRequest = require('../src/OAuthSignRequest');
      const status = 200;
      const fakeResponseData = JSON.stringify({ body: chance.string() });
      const fakeLocation = chance.string();
      const fakeResponse = {
        status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          location: fakeLocation,
        },
        body: fakeResponseData,
        isBase64Encoded: false,
      };

      OAuthSignRequest.doSignAndPost = jest.fn().mockResolvedValue(fakeResponse);

      ({ oAuthSignRequestPost } = require('../app'));

      const response = await oAuthSignRequestPost(createFakeEvent());
      const expectedResponse = {
        statusCode: status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          location: response.headers.location,
        },
        body: JSON.stringify(fakeResponseData),
        isBase64Encoded: false,
      };

      expect(response).toEqual(expectedResponse);
    });

    it('returns an error when does not resolve', async () => {
      jest.resetModules();

      const OAuthSignRequest = require('../src/OAuthSignRequest');

      const fakeError = {};
      const numberOfErrorKeys = chance.natural({ min: 2, max: 5 });

      for (let i = 0; i < numberOfErrorKeys; i += 1) {
        fakeError[chance.string()] = chance.string();
      }

      const fakeErrorResponse = {
        statusCode: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(fakeError),
        isBase64Encoded: false,
      };

      OAuthSignRequest.doSignAndPost = jest.fn().mockRejectedValue(fakeError);

      ({ oAuthSignRequestPost } = require('../app'));

      expect.assertions(1);

      const returnedError = await oAuthSignRequestPost(createFakeEvent());

      expect(returnedError).toEqual(fakeErrorResponse);
    });
  });
});
