#!/bin/bash
set -e

echo "Loading environment variables from .env file..."
set -o allexport
source .env
set +o allexport

echo "Assuming IAM Admin Role..."
source /bin/assumeRole $ADMIN_ARN

echo "Delete domain ${DOMAIN_NAME}"
aws apigateway delete-domain-name --domain-name ${DOMAIN_NAME}
