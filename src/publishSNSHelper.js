const AWS = require('aws-sdk');

const publishToSNS = async (message, arn) => {
  console.log('message in SNS', message);
  const params = {
    Message: message,
    TopicArn: arn,
  };
  AWS.config.update({ region: 'us-east-1' });
  const awsSNS = new AWS.SNS({ apiVersion: '2010-03-31' });
  await awsSNS.publish(params).promise();

  awsSNS.then(
    (data) => {
      console.log(`Message ${params.Message} send sent to the topic ${params.TopicArn}`);
      console.log(`MessageID is ${data.MessageID}`);
    },
  ).catch(
    (err) => {
      console.error(err, err.stack);
    },
  );
};

const publishToSNSSuccess = async (message) => {
  console.log('message', message);
  console.log('process env success arn', process.env.SNS_SUCCESS_ARN);
  await publishToSNS(JSON.stringify(message), process.env.SNS_SUCCESS_ARN);
};

const publishToSNSUnsuccessfull = async (message) => {
  console.log('err message', message);
  console.log('err ARN', config);
  console.log('process env fail arn', process.env.SNS_NONSUCCESS_ARN);
  await publishToSNS(JSON.stringify(message), process.env.SNS_NONSUCCESS_ARN);
};

module.exports = {
  publishToSNS,
  publishToSNSSuccess,
  publishToSNSUnsuccessfull,
};
