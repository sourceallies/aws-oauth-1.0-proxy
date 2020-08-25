const Chance = require("chance");

describe("Responses To Network Requests", () => {
  let chance;

  beforeEach(() => {
    chance = Chance();
  });

  describe("Send Response", () => {
    it("Should send a successful SNS topic and return correct object", async () => {
      const { sendResponse } = require("../src/responses");

      jest.mock("../src/PublishSNSHelper");

      const { publishToSNSSuccess } = require("../src/PublishSNSHelper");

      const testObject = {
        headers: {
          location: chance.string(),
        },
        body: chance.string(),
        status: chance.string(),
      };

      const event = chance.string();

      const recivedData = await sendResponse(event, testObject);

      expect(publishToSNSSuccess).toHaveBeenCalledWith({
        ...event,
        ...testObject,
      });

      expect(recivedData).toEqual({
        statusCode: testObject.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          location: testObject.headers.location,
        },
        body: JSON.stringify(testObject.body),
        isBase64Encoded: false,
      });
    });
  });

  describe("Send Error", () => {
    it("Should send a un-successful SNS topic", async () => {
      const { sendError } = require("../src/responses");

      jest.mock("../src/PublishSNSHelper");
      const { publishToSNSUnsuccessfull } = require("../src/PublishSNSHelper");

      const testObject = {
        headers: {
          location: chance.string(),
        },
        body: chance.string(),
      };

      const event = chance.string();

      const recivedData = await sendError(event, testObject);

      expect(publishToSNSUnsuccessfull).toHaveBeenCalledWith({
        ...event,
        ...testObject,
      });

      expect(recivedData).toEqual({
        statusCode: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(testObject),
        isBase64Encoded: false,
      });
    });
  });
});
