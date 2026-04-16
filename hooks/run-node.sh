#!/bin/sh
# Portable node resolver for hooks running under /bin/sh
# /bin/sh inherits a minimal PATH, so `node` is often not found.
# This script searches common locations and execs node with the given args.

for candidate in \
  /opt/homebrew/bin/node \
  /usr/local/bin/node \
  "$HOME/.nvm/versions/node"/*/bin/node \
  "$HOME/.volta/bin/node" \
  "$HOME/.fnm/node-versions"/*/installation/bin/node \
  "$HOME/.nodenv/shims/node" \
  "$HOME/.asdf/shims/node" \
  /usr/bin/node; do
  if [ -x "$candidate" ] 2>/dev/null; then
    exec "$candidate" "$@"
  fi
done

echo "run-node.sh: node not found in any known location" >&2
exit 1
