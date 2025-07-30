#!/bin/bash
set -e

# Function to wait for database
wait_for_db() {
  echo "Waiting for database to be ready..."
  local max_retries=30
  local retry_count=0
  local retry_interval=2
  
  while ! npx prisma db pull --print 2>/dev/null; do
    retry_count=$((retry_count + 1))
    
    if [ $retry_count -ge $max_retries ]; then
      echo "ERROR: Database failed to become ready after $((max_retries * retry_interval)) seconds"
      echo "Maximum retry attempts ($max_retries) reached. Exiting..."
      exit 1
    fi
    
    echo "Database is not ready - sleeping (attempt $retry_count/$max_retries)"
    sleep $retry_interval
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