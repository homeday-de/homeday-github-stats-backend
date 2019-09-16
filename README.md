# Homeday GitHub Stats - Backend

This is the backend part of the [Homeday GitHub Stats](http://github-stats.homeday.dev) app. Documentation covers all of the deployment requirements.

## Systems involved
- [GitHub](https://github.com)
- [Serverless](https://serverless.com)
- [AWS Lambda](https://aws.amazon.com/lambda)
- [AWS S3](https://aws.amazon.com/s3)
- [Travis](https://travis-ci.com)
- [Auth0](https://auth0.com)

Unless you expect high usage, you should be covered by the free plan of each service.

## Setup

### Creating a GitHub OAuth APP
Go to [GitHub -> Settings -> Developer Settings -> OAuth Apps](https://github.com/settings/developers).
Create a new OAuth App (give it a recognizable name as people will see it when authenticating with GitHub).
Homepage URL will be the url of your Auth0 account, which you will get when signing up with Auth0.

### Creating a Auth0 App
After creating an account with [Auth0](https://auth0.com), under "Connections -> Social", set up the GitHub authentication (here you will need Client ID and Client Secret from your GitHub App). Permissions you need are the following:
- public_repo
- repo
- repo_deployment
- repo:status

Under Applications, create a new "SINGLE PAGE APPLICATION" (this application will be used for the Authentication on the frontend side of your app).
In the "Allowed Callback URLs" enter any urls your app might run on (including localhost). Copy-paste those into the "Allowed Web Origins" and "Allowed Logout URLs" fields as well.
Under "Connections", make sure to disable the default Username-Password-Authentication and allow the newly created GitHub one.

Create another Application, this time of type "MACHINE TO MACHINE" (will be used to verify authentication on the backend). Enable Auth0 Management API for it (which was probably already created for you under "APIs").

### Serverless
You don't need anything except serverless installed locally on your machine:
```
npm install -g serverless
```
Then, make sure to authenticate with your AWS profile: [AWS Credentials guide](https://github.com/serverless/serverless/blob/HEAD/docs/providers/aws/guide/credentials.md), [AWS IAM](https://serverless.com/framework/docs/providers/aws/guide/iam/)

### AWS S3
You will need tow S# buckets, one for staging and one for production. Make sure you enable "Static website hosting" for them. Also, under Permissions -> CORS configuration, we need to enable CORS:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
<CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <ExposeHeader>ETag</ExposeHeader>
    <AllowedHeader>*</AllowedHeader>
</CORSRule>
</CORSConfiguration>
```
This policy allows CORS for all origins which was ok for the purposes of our app, you might wish to tweak it to allow only your own domains.

### AWS Lambda
Lambdas are managed by the Serverless framework, so in theory, other than for debugging, you should not have totouch them.

### Travis
The final piece of the puzzle is Travis. There are two parts to it, `.travis.variables.sh` file in this repo where we set some variables based on the environment (there you will want to change your S3 bucket and app domain), and the configuration of the repository.

You will need the following list of environment variables defined in the repo settings of the Travis APP:
- `API_ENDPOINT`: Public, fixed value of `https://api.github.com/graphql`
- `AUTH0_BACKEND_CLIENT_ID`: Public, Client ID of your Auth0 "MACHINE TO MACHINE" app
- `AUTH0_BACKEND_CLIENT_SECRET`: Private, Client Secret of your Auth0 "MACHINE TO MACHINE" app
- `AUTH0_BACKEND_DOMAIN`: Public, your Auth0 domain, will be your main Auth0 domain assigned to your account
- `AUTH0_CLIENT_ID`: Public, Client ID of your Auth0 "SINGLE PAGE APPLICATION" app
- `AUTH0_DOMAIN`: Public, probably the same as AUTH0_BACKEND_DOMAIN unless you used two separate Auth0 accounts
- `AWS_ACCESS_KEY_ID`: Private, access key of the AWS account with permissions to write to S3 and execute lambdas
- `AWS_SECRET_ACCESS_KEY`: Private, secret access key of the AWS account with permissions to write to S3 and execute lambdas

## How it works
Authentication is performed with Auth0. We then do the exchange of a Auth0 token for a GitHub access token in the lambda so as not to leak the GitHub access token. That exchange is done with each API call.

Once we have GitHub access code, we perform data fetching and calculations. Due to the hardcoded limit of 29 seconds for any lambda connected to the API Gateway, the approach taken here is to have two lambdas for doing the analysis work (in total 3 lambdas, 1 for fetching GitHub repositories and 2 for analyzing them).

The first analyzing lambda simply authenticatest he user and receives the request, and immediately responds with a path on which a frontend can expect JSON results to be (it's a path to S3 `results` directory). The second analyzing lambda then does the actual work and writes the results into the S3 bucket under the defined path. On the frontend, we poll the url until it responds with the actual data.

## (Hopefully) Useful notes

### Changing the name of the app
If you change the name of the "app" in `package.json`, you will want to update it in the `index.js` file since it's used as a prefix for the lambda name

