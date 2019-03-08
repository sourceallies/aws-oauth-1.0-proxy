#!/bin/bash
set -e

echo "Assuming IAM Admin Role..."
source /bin/assumeRole $ADMIN_ARN

policyARN=$bamboo_Policy_ARN

aws iam create-policy-version --policy-arn $policyARN --policy-document deploy/policy.JSON
