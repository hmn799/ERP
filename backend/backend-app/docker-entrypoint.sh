#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Ensuring roles, permissions, and the default admin user exist..."
npm run seed

echo "Starting ERP API..."
exec node dist/src/main
