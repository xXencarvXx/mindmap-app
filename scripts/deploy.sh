#!/bin/bash
# Deploy only app files to the public GitHub Pages repo.
# Private files (CLAUDE.md, scripts/, drafts/, etc.) stay in the private repo.
#
# Usage: bash scripts/deploy.sh

set -e

DEPLOY_REPO="https://github.com/xXencarvXx/mindmap-app.git"
TMPDIR=$(mktemp -d)

echo "Copying app files..."
cp index.html "$TMPDIR/"
cp -r js "$TMPDIR/"
cp -r styles "$TMPDIR/"

cd "$TMPDIR"
git init -b main
git add -A
git commit -m "Deploy $(date '+%Y-%m-%d %H:%M')"
git remote add deploy "$DEPLOY_REPO"

echo "Pushing to $DEPLOY_REPO..."
git push --force deploy main

cd -
rm -rf "$TMPDIR"
echo "Done."
