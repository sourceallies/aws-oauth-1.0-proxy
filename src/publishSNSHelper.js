const AWS = require('aws-sdk');

const publishToSNS = async (message, arn) => {
  console.log('message in SNS', message);
  const params = {
    Message: message,
    TopicArn: arn,
  };
  AWS.config.update({ region: 'us-east-1' });
  const awsSNS = new AWS.SNS({ apiVersion: '2010-03-31' });
  awsSNS.publish(params).promise().then(
    () => {
      console.log(`Message ${params.Message} send sent to the topic ${params.TopicArn}`);
    },
  ).catch(
    (err) => {
      console.log('error caught');
      console.error(err, err.stack);
    },
  );
};

const publishToSNSSuccess = async (message) => {
  await publishToSNS(JSON.stringify(message), process.env.SNS_SUCCESS_ARN);
};

const publishToSNSUnsuccessfull = async (message) => {
  await publishToSNS(JSON.stringify(message), process.env.SNS_NONSUCCESS_ARN);
};

module.exports = {
  publishToSNS,
  publishToSNSSuccess,
  publishToSNSUnsuccessfull,
};
