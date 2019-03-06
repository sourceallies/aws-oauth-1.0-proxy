const AWS = require('aws-sdk');
const config = require('../config');

const publishToSNSSuccess = async (message) => {
  await publishToSNS(message, config.snsSuccessArn);
};

const publishToSNSUnsuccessfull = async (message) => {
  await publishToSNS(message, config.snsNonSuccessArn);
}

const publishToSNS = async (message, arn) => {
  const params = {
     Message: message,
     TopicArn: arn
  };
  AWS.config.update({ region: 'us-east-1' });
  const awsSNS = new AWS.SNS({ apiVersion: '2010-03-31' });
  await awsSNS.publish(params).promise();
}

module.exports = {
  publishToSNS,
  publishToSNSSuccess,
  publishToSNSUnsuccessfull,
};
