#!/bin/bash

if [ "$TRAVIS_BRANCH" = "develop" ]
  then
    echo "Running STAGING build"

    export ENV=staging
    export APP_DOMAIN=https://github-stats-staging.homeday.dev
    export SERVERLESS_STAGE=dev
    export DEPLOYMENT_S3_BUCKET=github-stats.staging.homeday.dev
fi

if [ "$TRAVIS_BRANCH" = "master" ]
  then
    echo "Running PRODUCTION build"

    export ENV=production
    export APP_DOMAIN=https://github-stats.homeday.dev
    export SERVERLESS_STAGE=production
    export DEPLOYMENT_S3_BUCKET=github-stats.homeday.dev
fi
