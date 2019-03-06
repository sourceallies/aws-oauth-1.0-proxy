const AWS = require('aws-sdk');
const Chance = require('chance');
const { publishToSNSSuccess } = require('../src/publishSNSHelper');

describe('publish to SNS helper', () => {
  let chance;

  beforeEach(() => {
    chance = Chance();
    jest.restoreAllMocks();
  });

  describe('Successful response publish', () => {
    it('should have a publishSuccess function', () => {
      expect(publishToSNSSuccess).toEqual(expect.any(Function));
    });

    it('should configure the right aws region', () => {
      AWS.config.update = jest.fn();
      publishToSNSSuccess();

      expect(AWS.config.update).toHaveBeenCalledWith({ region: 'us-east-1' });
    });

    it('should call AWS.SNS with api version', () => {
      const testObject = { publish: jest.fn() };
      AWS.SNS = jest.fn().mockImplementation(() => testObject);
      publishToSNSSuccess();

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

      publishToSNSSuccess(fakeData);

      expect(testObject.publish).toHaveBeenCalledWith(fakePublishedData);
    });

  });
});
