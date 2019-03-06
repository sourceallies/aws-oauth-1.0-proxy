const AWS = require('aws-sdk');
const Chance = require('chance');
const { publishToSNSSuccess, publishToSNS } = require('../src/publishSNSHelper');

describe('publish to SNS helper', () => {
  let chance;

  beforeEach(() => {
    chance = Chance();
    jest.restoreAllMocks();
  });

  describe('publishToSNS', () => {

    it('should have a publishToSNS function', () => {
      expect(publishToSNS).toEqual(expect.any(Function));
    });

    it('should configure the right aws region', () => {
      AWS.config.update = jest.fn();
      publishToSNS();

      expect(AWS.config.update).toHaveBeenCalledWith({ region: 'us-east-1' });
    });

    it('should call AWS.SNS with api version', () => {
      const testObject = { publish: jest.fn() };
      AWS.SNS = jest.fn().mockImplementation(() => testObject);
      publishToSNS();

      expect(AWS.SNS).toHaveBeenCalledWith({ apiVersion: '2010-03-31' });
    });

    it('should take params and use it in the publish call', () => {
      const testObject = { publish: jest.fn() };
      AWS.SNS = jest.fn().mockImplementation(() => testObject);

      const fakeData = {
        event: chance.string(),
        response: chance.string(),
      };

      const fakePublishedData = {
        Message: fakeData,
        TopicArn: chance.string(),
      };

      let config = require('../config.js')
      config.snsSuccessArn = fakePublishedData.TopicArn;

      publishToSNS(fakePublishedData.Message, fakePublishedData.TopicArn);

      expect(testObject.publish).toHaveBeenCalledWith(fakePublishedData);
    });
  });

  describe('Successful response publish', () => {

    it('should have a publishSuccess function', () => {
      expect(publishToSNSSuccess).toEqual(expect.any(Function));
    });

  });
});
