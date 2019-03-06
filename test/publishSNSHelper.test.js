const AWS = require('aws-sdk');
const Chance = require('chance');
const { publishSuccess } = require('../src/publishSNSHelper');

describe('publish to SNS helper', () => {
  let chance;

  beforeEach(() => {
    chance = Chance();
    jest.restoreAllMocks();
  });

  describe('Successful response publish', () => {
    it('should have a publishSuccess function', () => {
      expect(publishSuccess).toEqual(expect.any(Function));
    });

    it('should configure the right aws region', () => {
      AWS.config.update = jest.fn();
      publishSuccess();

      expect(AWS.config.update).toHaveBeenCalledWith({ region: 'us-east-1' });
    });

    it('should call AWS.SNS with api version', () => {
      const testObject = { publish: jest.fn() };
      AWS.SNS = jest.fn().mockImplementation(() => testObject);
      publishSuccess();

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

      publishSuccess(fakePublishedData);

      expect(testObject.publish).toHaveBeenCalledWith(fakePublishedData);
    });
  });
});
