#!/bin/bash
set -e

echo "Loading environment variables from .env file..."
set -o allexport
source .env
set +o allexport


echo "Assuming IAM Admin Role..."
source /bin/assumeRole $ADMIN_ARN
echo "Policy assignment"
policyARN=$bamboo_Policy_ARN

echo "Update start"
aws iam create-policy-version --policy-arn $policyARN --policy-document file://deploy/policy.JSON --set-as-default
