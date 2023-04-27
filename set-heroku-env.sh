#!/bin/sh
# this script will set all the Heroku environment variables from the .env file

APP_NAME="$1"

if [ -z "$APP_NAME" ]; then
  echo "Usage: $0 <app-name>"
  exit 1
fi

if [ ! -f ".env.heroku" ]; then
  echo ".env.heroku file not found"
  exit 1
fi

for var in $(heroku config --app "$APP_NAME" | awk -F ':' '{ print $1 }' | sed '1d')
do
  heroku config:unset "$var" --app "$APP_NAME"
done

while read -r line; do
  if [[ -n "$line" ]]; then
    heroku config:set -a "$APP_NAME" "$line"
  fi
done < .env.heroku
