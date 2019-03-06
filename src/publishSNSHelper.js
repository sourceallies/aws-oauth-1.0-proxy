const AWS = require('aws-sdk');

const publishSuccess = (params) => {
  AWS.config.update({ region: 'us-east-1' });
  console.log(AWS.SNS);
  const awsSNS = new AWS.SNS({ apiVersion: '2010-03-31' });
  console.log('awsSNS', awsSNS);
  awsSNS.publish(params);
  console.log('here');
};

module.exports = {
  publishSuccess,
};


// AWS.config.update({ region: 'us-east-1' });
// // Create publish parameters
// const params = {
//   Message: 'MESSAGE_TEXT', /* required */
//   TopicArn: 'arn:aws:sns:us-east-1:729161019481:aws-auth-success-topic',
// };
//
// // Create promise and SNS service object
// const publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();
//
// // Handle promise's fulfilled/rejected states
// publishTextPromise.then(
//   (data) => {
//     console.log(`Message ${params.Message} send sent to the topic ${params.TopicArn}`);
//     console.log(`MessageID is ${data.MessageId}`);
//   },
// ).catch(
//   (err) => {
//     console.error(err, err.stack);
//   },
// );
