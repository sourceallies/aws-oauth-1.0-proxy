# OAuth 1.0a Proxy

[![Coverage Status](https://coveralls.io/repos/github/sourceallies/aws-oauth-1.0-proxy/badge.svg?branch=master&t=VpXCpR)](https://coveralls.io/github/sourceallies/aws-oauth-1.0-proxy?branch=master)

This project serves as a proxy for OAuth 1.0a requests. We leverage Lambdas created with [AWS SAM](https://github.com/awslabs/serverless-application-model) to sign requests using the specified app ID and secret. The Lambdas cover the first and third legs of OAuth 1.0a authentication as well as signing and proxying GET and POST requests.

## Initial Setup

1. Clone git repo: `git clone https://github.com/sourceallies/aws-oauth-1.0-proxy.git`
2. cd to the git repository
3. `npm install`

## Build and Deploy

The deploy scripts are configured to read environment variables from a `.env` file. Thus, a `.env` file should be created based on `.env.example`. See [Environment Configuration](../../wiki/Environment-Configuration) for more details about environment variables and how they are used.

We've also included example scripts for deployment via CI in `deploy/bamboo` (they were removed and migrated to use codepipeline). These scripts read environment variables from the CI and write them to a `.env` file. Then they run the general deployment scripts.

Note that the deploy script will fail if there are no AWS keys with valid IAM permissions. An [example policy](/deploy/policy.JSON) has been included for the Lambdas. For your CI service (in our case, codepipeline), Admin permissions must be granted for API Gateway, Cloudformation and Lambdas.

A more detailed explanation of what the deploy script is doing can be found in the wiki under [Deploy Steps](../../wiki/Deploy-Steps).

#### Build (codepipeline)

1. Installs dependencies
2. Runs tests
3. Webpacks the project
4. Zips deploy files into artifact.zip

#### Deploy (cloudformation)

1. Load environment variables from `.env`
2. Assume IAM admin role
3. Removes the old S3 bucket
4. Creates a new S3 bucket
5. Adds the zipped code to the S3 bucket
6. Creates the lambdas

## Endpoints

#### First Leg OAuth: POST

Path: `/firstLegAuth`

Get the temporary oAuth tokens needed for the second leg.

Example Request:

``` json
POST /Prod/firstLegAuth HTTP/1.1
Host: **.execute-api.us-east-1.amazonaws.com
Cache-Control: no-cache
```

Example Response:

``` json
{
    "requestToken": "$tempToken",
    "requestTokenSecret": "$tempSecret"
}
```

#### Third Leg OAuth: POST

Path: `/thirdLegAuth`

Use the temporary oAuth tokens and verifier from the second leg to get the access token and access token secret.

Example Request:

``` json
POST /Prod/thirdLegAuth HTTP/1.1
Host: **.execute-api.us-east-1.amazonaws.com
Content-Type: application/json
Cache-Control: no-cache

{
  "requestToken": "$tempToken",
  "requestTokenSecret": "$tempSecret",
  "verifier": "$verifier"
}
```

Example Response:

``` json
{
    "accessToken": "$accessToken",
    "accessTokenSecret": "$accessTokenSecret"
}
```

#### Sign Request: GET

Path: `/oAuthSignRequest`

Signs the GET request with the app ID and app secret. Provide access tokens and the url to proxy as query parameters.

Example Request:

``` json
GET /Prod/oAuthSignRequest?accessToken=<access_token>&accessTokenSecret=<access_token_secret>&url=<url_to_proxy> HTTP/1.1
Host: **.execute-api.us-east-1.amazonaws.com
Accept: application/json
Content-Type: application/json
Cache-Control: no-cache
```

Response will be the same as what you expect from the url that is being proxied.

If there is an error connecting to the url that is being proxied, the response status code will be 502.

#### Sign Request: POST

Path: `/oAuthSignRequest`

Signs the POST request with the app ID and app secret. Provide access tokens and the url to proxy in the body of the request along with the body that you want to post to the url that is being proxied.

Example Request:

``` json
POST /Prod/oAuthSignRequest HTTP/1.1
Host: **.execute-api.us-east-1.amazonaws.com
Accept: application/json
Content-Type: application/json
Cache-Control: no-cache

{
  "accessToken": "$accessToken",
  "accessTokenSecret": "$accessTokenSecret",
  "url": "$urlToProxy",
  "data": "$postBody"
}
```

Response will be the same as what you expect from the url that is being proxied.

If there is an error connecting to the url that is being proxied, the response status code will be 502.

### Gotchas:
* Be sure to url encode your url query parameters to make sure the value comes across correctly.  (this can be a headache to trouble shoot and ensuring the query params are html safe will save you time later)
Here is a snippet used by an application to talk to this aws-proxy.  This snippet uses javascript to make a "fetch" call to the aws proxy.
##### Sample code:
```
import { OauthToken } from "../../types";

export const backendGet = (
  path: string,
  oAuthToken: OauthToken,
  apiBaseUrl: string
): Promise<any> => {
  return fetch(
    apiBaseUrl +
      path +
      "?accessToken=" +
      encodeURIComponent(oAuthToken.accessToken) +
      "&accessTokenSecret=" +
      encodeURIComponent(oAuthToken.accessTokenSecret),
    { method: "GET" }
  ).then(res => res.json());
};
```

## Testing

#### Unit Tests

Run the [Jest](https://github.com/facebook/jest) test runner:

`npm run test`


#### Linting

Lint repo using [ES Lint](https://github.com/eslint/eslint):

`npm run lint`

## Deploying
The project is built and deployed with CodePipeline and CodeBuild. For deploying to production, manual approval in CodePipeline/Slack (#cicd-notifications) is required.

You can view the pipeline here (log into aws shared account first): https://console.aws.amazon.com/codesuite/codepipeline/pipelines/aws-oauth-1-0-proxy/view

## Contribution

Fork the repo and create a pull request describing your contribution.

## License
This project is licensed under the terms of the [Apache 2.0](APACHE_LICENSE.md) license or alternatively under the terms of the [MIT](MIT_LICENSE.md).
You may use aws-oauth-1.0-proxy according to either of these licenses as is most appropriate
for your project on a case-by-case basis..

## About Source Allies
Source Allies is an IT Consultancy based in Urbandale, Iowa. Learn more [here](https://www.sourceallies.com/what-we-do/) and get in touch with us [here](https://www.sourceallies.com/contact-us/).

![Source Allies Logo](assets/sai-logo.png)
