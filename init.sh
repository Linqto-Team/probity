#!/bin/bash

# Setup environment vairbales

# ETHERNAL_PASSWORD should be set in the shell before running script
if [[ -z "${ETHERNAL_PASSWORD}" ]]; then
  echo "Please export ETHERNAL_PASSWORD envvar in the shell."
  exit 1
fi

export ETHERNAL_EMAIL=mrosendin@linqto.com
export NATIVE_TOKEN=ETH

# (TODO: create separate file other than .env for deploy script output; below conditional is temporary)
if [ -e .env ]
then
    rm .env
fi

# Deploy contracts
yarn run deploy:dev localhost

# Initialize
yarn run initialize localhost

# Get system info
yarn run getSystemInfo localhost

# Create an issuance
yarn run issuance localhost