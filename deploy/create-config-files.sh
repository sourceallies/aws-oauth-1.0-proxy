#!/bin/bash

for file in $(find deploy -type f -path "*.params.json"); do \
    envName=$(echo $file | xargs basename | sed "s/.params.json//"); \
    params=$(cat $file); \
    config="{}"; \
    config=$(echo "$config" | jq --argjson params "$params" '.Parameters=$params'); \
    echo "$config" > ${envName}.config.json; \
done
