#!/bin/bash
set -e

echo "Loading environment variables from .env file..."
set -o allexport
source .env
set +o allexport

echo "Assuming IAM Admin Role..."
source /bin/assumeRole $ADMIN_ARN

echo "Removing the S3 bucket..."
bucketName="${BUCKET_NAME}-${DEPLOY_ENVIRONMENT,,}"
aws s3 rb s3://$bucketName --force
aws s3api wait bucket-not-exists --bucket $bucketName

echo "Creating a new S3 bucket..."
aws s3 mb s3://$bucketName
aws s3api wait bucket-exists --bucket $bucketName

echo "Putting the zipped code into the S3 bucket..."
aws s3api put-object --bucket $bucketName --key artifact.zip --body artifact.zip

echo "Hosted Zone"
host_zone=$(aws route53 list-hosted-zones-by-name --query 'HostedZones[?Name == `'sourceallies.com.'`].Id')
IFS="/" read -r -a host_zone <<< "${host_zone}"
host_zone_name=${host_zone[2]}

echo "Creating the lambdas..."
aws cloudformation deploy --stack-name $STACK_NAME \
    --template-file deploy/cloudformation.template.JSON \
    --tags \
        Customer=$CUSTOMER \
        Name=$NAME \
        Contact=$CONTACT \
        ContactEmail=$CONTACT_EMAIL \
        Release=$RELEASE_NUMBER \
    --parameter-overrides \
        ClientKey=$CLIENT_KEY \
        ClientSecret=$CLIENT_SECRET \
        BucketName=$bucketName \
        StackName=$STACK_NAME\
        ApiUrl=$API_URL \
        HostedZone=$host_zone_name \
        DomainName="${bamboo_domain_name}" \
        OAuthCustomHeaders=$OAUTH_CUSTOM_HEADERS \
        AuthorizeCallbackUri=$AUTHORIZE_CALLBACK_URI \
    --no-fail-on-empty-changeset \

echo "Describing stack events..."
aws cloudformation describe-stack-events --stack-name $STACK_NAME

echo "Deploy successful"
