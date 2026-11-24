#!/bin/sh
set -e
if [ -n "$LITESTREAM_REPLICA_URL" ]; then
	# A fresh volume restores the last backup before the app opens the database.
	litestream restore -if-db-not-exists -if-replica-exists "$DATABASE_PATH"
	exec litestream replicate -exec "node build"
fi
exec node build
