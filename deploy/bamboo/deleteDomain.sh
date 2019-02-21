#!/bin/bash
set -e

# Extract bamboo variables
DEPLOY_ENVIRONMENT=$bamboo_deploy_environment

# Extract environment variables
DOMAIN_NAME=$bamboo_DOMAIN_NAME

# Write environment variables to .env file
echo "DOMAIN_NAME=${DOMAIN_NAME}" > .env

# Run deleteDomain script
bash deploy/deleteDomain.sh
