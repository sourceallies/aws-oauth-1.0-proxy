#!/bin/bash
set -e

# Extract bamboo variables
DEPLOY_ENVIRONMENT=$bamboo_deploy_environment
RELEASE_NUMBER=$bamboo_deploy_release

# Extract environment variables
CUSTOMER=$bamboo_CUSTOMER
NAME=$bamboo_NAME
CONTACT=$bamboo_CONTACT
CONTACT_EMAIL=$bamboo_CONTACT_EMAIL
BUCKET_NAME=$bamboo_BUCKET_NAME
STACK_NAME=$bamboo_STACK_NAME
CLIENT_KEY=$bamboo_CLIENT_KEY
CLIENT_SECRET=$bamboo_CLIENT_SECRET
API_URL=$bamboo_API_URL
AUTHORIZE_CALLBACK_URI=$bamboo_AUTHORIZE_CALLBACK_URI
OAUTH_CUSTOM_HEADERS=$bamboo_OAUTH_CUSTOM_HEADERS
DOMAIN_NAME=$bamboo_DOMAIN_NAME
DOMAIN_PARENT=$bamboo_DOMAIN_PARENT


# Look up the IAM admin role ARN for the environment we are deploying into
ADMIN_ARN="$(printenv bamboo_SAI_${DEPLOY_ENVIRONMENT}_ADMIN_ARN )"

# Write environment variables to .env file
echo "DEPLOY_ENVIRONMENT=${DEPLOY_ENVIRONMENT}" > .env
echo "RELEASE_NUMBER=${RELEASE_NUMBER}" >> .env
echo "CUSTOMER=${CUSTOMER}" >> .env
echo "NAME=${NAME}" >> .env
echo "CONTACT=${CONTACT}" >> .env
echo "CONTACT_EMAIL=${CONTACT_EMAIL}" >> .env
echo "BUCKET_NAME=${BUCKET_NAME}" >> .env
echo "STACK_NAME=${STACK_NAME}" >> .env
echo "CLIENT_KEY=${CLIENT_KEY}" >> .env
echo "CLIENT_SECRET=${CLIENT_SECRET}" >> .env
echo "API_URL=${API_URL}" >> .env
echo "AUTHORIZE_CALLBACK_URI=${AUTHORIZE_CALLBACK_URI}" >> .env
echo "OAUTH_CUSTOM_HEADERS=${OAUTH_CUSTOM_HEADERS}" >> .env
echo "ADMIN_ARN=${ADMIN_ARN}" >> .env
echo "DOMAIN_NAME=${DOMAIN_NAME}" >> .env
echo "DOMAIN_PARENT=${DOMAIN_PARENT}" >> .env

# Run deploy script
bash deploy/deploy.sh
