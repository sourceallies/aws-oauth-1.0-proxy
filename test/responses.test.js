const { sendResponse, sendError } = require('../src/responses');
const { publishToSNSSuccess, publishToSNSUnsuccessfull } = require('../src/publishSNSHelper');

describe('Responses To Network Requests', () => {

  let chance;

  beforeEach(() => {
    chance = Chance();
    jest.restoreAllMocks();
  });

  describe('Send Response', () => {
    it('Should send a successful SNS topic', () => {

      jest.mock('../src/publishSNSHelper');

      const { publishToSNSSuccess } = require('../src/publishSNSHelper');

      const testObject = {
        headers: {
          location: chance.string()
        },
        body: chance.string()
      };

      sendResponse(testObject);

      expect(publishToSNSSuccess).toHaveBeenCalledWith(testObject);
    })
  });

  describe('Send Error', () => {
    it('Should send a un-successful SNS topic', () => {

      jest.mock('../src/publishSNSHelper');

      const { publishToSNSUnsuccessfull } = require('../src/publishSNSHelper');

      const testObject = {
        headers: {
          location: chance.string()
        },
        body: chance.string()
      };

      sendError(testObject);

      expect(publishToSNSUnsuccessfull).toHaveBeenCalledWith(testObject);

    })
  });
});
