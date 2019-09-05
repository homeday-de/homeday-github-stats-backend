#!/bin/bash

if [ "$TRAVIS_BRANCH" = "develop" ]
  then
    echo "Running STAGING build"

    export ENV=staging
fi

if [ "$TRAVIS_BRANCH" = "master" ]
  then
    echo "Running PRODUCTION build"

    export ENV=production
fi
