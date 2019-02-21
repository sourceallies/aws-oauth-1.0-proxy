#!/bin/bash
set -e

echo "Loading environment variables from .env file..."
set -o allexport
source .env
set +o allexport

aws apigateway delete-domain-name --domain-name ${DOMAIN_NAME}
