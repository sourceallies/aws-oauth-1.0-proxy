#!/bin/bash
set -e

echo "Loading environment variables from .env file..."
set -o allexport
source .env
set +o allexport

echo "Assuming IAM Admin Role..."
source /bin/assumeRole $ADMIN_ARN

# echo "Removing the S3 bucket..."
bucketName="${BUCKET_NAME}-${DEPLOY_ENVIRONMENT,,}"
# aws s3 rb s3://$bucketName --force
# aws s3api wait bucket-not-exists --bucket $bucketName

# echo "Creating a new S3 bucket..."
# aws s3 mb s3://$bucketName
# aws s3api wait bucket-exists --bucket $bucketName

echo "Putting the zipped code into the S3 bucket..."
aws s3api put-object --bucket $bucketName --key artifact.zip --body artifact.zip

echo "Getting Distribution Hosted Zone ID"
DomainParentHostedZoneID=$(aws route53 list-hosted-zones-by-name --query "(HostedZones[?Name=='${DOMAIN_PARENT}'].Id)[0]" --output text)

echo "Getting Certificate"
CertificateArn=$(aws acm list-certificates --query "(CertificateSummaryList[?DomainName=='${CERTIFICATE_DOMAIN}'].CertificateArn)[0]" --output text)
echo $CertificateArn

domainExists=$(aws apigateway get-domain-names --query "items[?domainName=='${DOMAIN_NAME}']")
if [ "$domainExists" = "[]" ]; then
  echo "Creating Domain Name"
  aws apigateway create-domain-name --domain-name ${DOMAIN_NAME} --certificate-arn $CertificateArn
fi

echo "Getting Distribution Domain Name"
DistributionDomainName=$(aws apigateway get-domain-names --output text --query "(items[?domainName=='${DOMAIN_NAME}'].distributionDomainName)[0]")

echo "Creating the lambdas..."
aws cloudformation deploy --stack-name $STACK_NAME \
    --template-file deploy/cloudformation.template.yaml \
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
        StackName=$STACK_NAME \
        ApiUrl=$API_URL \
        HostedZone=$host_zone_name \
        OAuthCustomHeaders=$OAUTH_CUSTOM_HEADERS \
        AuthorizeCallbackUri=$AUTHORIZE_CALLBACK_URI \
        DomainParentHostedZoneID=$DomainParentHostedZoneID \
    --no-fail-on-empty-changeset \

echo "Getting API ID"
apiId=$(aws apigateway get-rest-apis --output text --query "(items[?name=='${STACK_NAME}'].id)[0]")
echo $apiId

    aws cloudformation deploy --stack-name "${STACK_NAME}-domain" \
        --template-file deploy/domain.template.yaml \
        --tags \
            Customer=$CUSTOMER \
            Name=$NAME \
            Contact=$CONTACT \
            ContactEmail=$CONTACT_EMAIL \
            Release=$RELEASE_NUMBER \
        --parameter-overrides \
            RestApiId=$apiId \
            DomainParentHostedZoneID=$DomainParentHostedZoneID \
            DomainName=$DOMAIN_NAME \
            DistributionDomainName=$DistributionDomainName \
        --no-fail-on-empty-changeset \

echo "Describing stack events..."
aws cloudformation describe-stack-events --stack-name $STACK_NAME

echo "Updating lambda code"
aws lambda update-function-code --function-name oauth-sign-request-get --s3-bucket $bucketName --s3-key artifact.zip
aws lambda update-function-code --function-name oauth-sign-request-post --s3-bucket $bucketName --s3-key artifact.zip
aws lambda update-function-code --function-name oauth-sign-request-delete --s3-bucket $bucketName --s3-key artifact.zip
aws lambda update-function-code --function-name oauth-first-leg --s3-bucket $bucketName --s3-key artifact.zip
aws lambda update-function-code --function-name oauth-third-leg --s3-bucket $bucketName --s3-key artifact.zip

echo "Deploy successful"
