#!/bin/sh
set -e

# Restore: a file uploaded as restore.db next to the database replaces it at start-up
# (README, "Sauvegarde et restauration"). The database it replaces is kept beside it.
RESTORE="$(dirname "$DATABASE_PATH")/restore.db"
if [ -f "$RESTORE" ]; then
	if [ -f "$DATABASE_PATH" ]; then
		mv "$DATABASE_PATH" "$DATABASE_PATH.before-restore-$(date +%Y%m%d-%H%M%S)"
	fi
	rm -f "$DATABASE_PATH-wal" "$DATABASE_PATH-shm"
	mv "$RESTORE" "$DATABASE_PATH"
	echo "Restored the database from restore.db"
fi

if [ -n "$LITESTREAM_REPLICA_URL" ]; then
	# A fresh volume restores the last backup before the app opens the database.
	litestream restore -if-db-not-exists -if-replica-exists "$DATABASE_PATH"
	exec litestream replicate -exec "node build"
fi
exec node build
