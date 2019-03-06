const AWS = require('aws-sdk');
const config = require('../config');

const publishToSNSSuccess = async (message) => {
  const params = {
     Message: message,
     TopicArn: config.snsSuccessArn
  };

  AWS.config.update({ region: 'us-east-1' });
  const awsSNS = new AWS.SNS({ apiVersion: '2010-03-31' });
  await awsSNS.publish(params).promise();
};

module.exports = {
  publishToSNSSuccess,
};
