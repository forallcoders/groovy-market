#!/bin/bash

URL="http://localhost:3000/api/markets/cron/sports/publish"

while true; do
  echo "Requesting $URL at $(date)"
  curl -s -o /dev/null "$URL"
  sleep 60
done