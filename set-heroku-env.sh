#!/bin/sh
# this script will set all the Heroku environment variables from the .env file

APP_NAME="$1"

if [ -z "$APP_NAME" ]; then
  echo "Usage: $0 <app-name>"
  exit 1
fi

if [ ! -f ".env" ]; then
  echo ".env file not found"
  exit 1
fi

while read -r line; do
  if [[ -n "$line" ]]; then
    heroku config:set -a "$APP_NAME" "$line"
  fi
done < .env
