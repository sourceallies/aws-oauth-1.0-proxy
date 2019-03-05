const Chance = require('chance');
const { publishSuccess } = require('../src/publishSNSHelper');

describe('publish to SNS helper', () => {
  let chance;

  beforeEach(() => {
    chance = Chance();
  });

  describe('Successful response publish', () => {
    it.only('should have a publishSuccess function', () => {
      expect(publishSuccess).toEqual(expect.any(Function));
    });
  });
});
