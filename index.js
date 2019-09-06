'use strict';
require ('dotenv').config ();

const AWS = require ('aws-sdk');
const uuidv4 = require ('uuid/v4');
const {
  analyze: githubAnalyze,
  repositories: getGithubRepositories,
} = require ('./github');
const { getGithubToken } = require ('./auth');
const getAuthorizationToken = require ('./utilities/getAuthorizationToken');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

module.exports.githubAnalyze = async ({ queryStringParameters, headers: { Authorization = '' } }) => {
  const {
    repo,
    user,
    dateFrom,
    dateTo = new Date ().getTime(),
  } = queryStringParameters;

  if (!repo || !user || !dateFrom || !dateTo) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify ({
        error: {
          message: 'API signature not followed. Check your query params',
        },
      }),
    };
  }

  const authorizationToken = getAuthorizationToken (Authorization);

  if (!authorizationToken) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify ({
        error: {
          message: 'Authorization token missing in headers',
        },
      }),
    };
  }

  const githubAuthorizationToken = await getGithubToken({ authorizationToken });

  if (!githubAuthorizationToken) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify ({
        error: {
          message: 'Authorization token not valid',
        },
      }),
    };
  }

  const s3 = new AWS.S3 ();
  const uniqueFileName = uuidv4 ();

  githubAnalyze ({
    user,
    repo,
    dateFrom: parseInt (dateFrom, 10),
    dateTo: parseInt (dateTo, 10),
    authorizationToken: githubAuthorizationToken,
  })
    .then (s3.putObject ({
      Bucket: process.env.BUCKET,
      Key: `${uniqueFileName}.json`,
      Body: buffer,
      ContentType: 'application/json',
      ACL: 'public-read',
      CacheControl: 'no-cache',
    }).promise ());

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify ({
      path: `${process.env.APP_DOMAIN}/results/${uniqueFileName}.json`
    }),
  };
};

module.exports.getGithubRepositories = async ({ headers: { Authorization = '' } }) => {
  const authorizationToken = getAuthorizationToken (Authorization);

  if (!authorizationToken) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify ({
        error: {
          message: 'Authorization token missing in headers',
        },
      }),
    };
  }

  const githubAuthorizationToken = await getGithubToken({ authorizationToken });

  if (!githubAuthorizationToken) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify ({
        error: {
          message: 'Authorization token not valid',
        },
      }),
    };
  }

  const results = await getGithubRepositories ({
    authorizationToken: githubAuthorizationToken,
  });

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify (results),
  };
};