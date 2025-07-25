#!/bin/bash
set -e

# Function to wait for database
wait_for_db() {
  echo "Waiting for database to be ready..."
  while ! npx prisma db pull --print 2>/dev/null; do
    echo "Database is not ready - sleeping"
    sleep 2
  done
  echo "Database is ready!"
}

# Wait for database
wait_for_db

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (in case it's missing)
echo "Generating Prisma client..."
npx prisma generate

# Start the application based on the command
if [ "$1" = "worker" ]; then
  echo "Starting worker process..."
  exec node dist/src/worker.js
else
  echo "Starting API server..."
  exec node dist/src/main.js
fi