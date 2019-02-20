domainExists="asdfad"

if [ ${domainExists} != "[]" ]; then
  echo "Deleting the Domain"
  aws apigateway delete-domain-name --domain-name example
fi
