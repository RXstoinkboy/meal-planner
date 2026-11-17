#!/bin/sh
# The src bind mount hides the client generated at image build time, and the schema
# may have changed on the host, so regenerate before the watcher starts.
set -e

npx prisma generate
exec npm run start:dev
