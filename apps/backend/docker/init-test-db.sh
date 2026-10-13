#!/bin/bash
# Creates the test database alongside the dev one. Runs once, on a fresh volume.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
	-c "CREATE DATABASE ${POSTGRES_DB}_test OWNER ${POSTGRES_USER};"
