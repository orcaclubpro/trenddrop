#!/bin/bash

# Run Drizzle Kit push to update database schema
echo "Running database schema migration..."
npx drizzle-kit push:pg
echo "Database schema migration completed."