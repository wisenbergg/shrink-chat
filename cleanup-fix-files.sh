#!/bin/zsh
# filepath: /Users/hipdev/dev/shrink-chat/cleanup-fix-files.sh

echo "🧹 Cleaning up temporary fix and test files..."

# Create a backup directory
BACKUP_DIR="./fix-scripts-backup"
mkdir -p "$BACKUP_DIR"

# Move files to backup
mv fix-memory-*.sql "$BACKUP_DIR/"
mv check-trigger*.js "$BACKUP_DIR/"
mv apply-fix*.* "$BACKUP_DIR/"
mv direct-fix*.* "$BACKUP_DIR/"
mv test-memory-*.* "$BACKUP_DIR/"
mv fix-supabase-*.sh "$BACKUP_DIR/"

echo "✅ Files moved to $BACKUP_DIR"
echo "You can delete this directory later when you're sure you don't need these files."
