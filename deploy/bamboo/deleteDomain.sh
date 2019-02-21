#!/bin/bash
set -e

# Extract bamboo variables
DEPLOY_ENVIRONMENT=$bamboo_deploy_environment

# Extract environment variables
DOMAIN_NAME=$bamboo_DOMAIN_NAME

# Look up the IAM admin role ARN for the environment we are deploying into
ADMIN_ARN="$(printenv bamboo_SAI_${DEPLOY_ENVIRONMENT}_ADMIN_ARN )"

# Write environment variables to .env file
echo "DOMAIN_NAME=${DOMAIN_NAME}" > .env
echo "ADMIN_ARN=${ADMIN_ARN}" >> .env

# Run deleteDomain script
bash deploy/deleteDomain.sh
