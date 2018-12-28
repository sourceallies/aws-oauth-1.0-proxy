#!/bin/sh
echo "Installing dependencies..."
npm install

echo "Running tests..."
chmod -r 500:501 node_modules
npm run test

echo "Running webpack..."
npm run build

echo "Zipping files to be deployed..."
zip -r artifact.zip index.js node_modules

echo "Build successful"
