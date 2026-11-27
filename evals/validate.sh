#!/usr/bin/env bash
# Checks every task: the reference solution passes all hidden tests, and the starter fails some.
set -uo pipefail
here=$(cd "$(dirname "$0")" && pwd)
tmp=$(mktemp -d "$here/.validate.XXXXXX")
for t in "$here"/tasks/*/; do
  name=$(basename "$t")
  rm -rf "$tmp/s" "$tmp/r"; cp -R "$t/task" "$tmp/s"; cp -R "$t/task" "$tmp/r"
  for f in "$t"/solution/*; do
    dest=$(cd "$tmp/r" && find . -name "$(basename "$f")" -not -path '*/test/*' | head -1)
    cp "$f" "$tmp/r/${dest:-src/$(basename "$f")}"
  done
  echo "== $name"
  echo -n "  solution: "; bash "$here/grade.sh" "$name" "$tmp/r" | head -3
  echo -n "  starter:  "; bash "$here/grade.sh" "$name" "$tmp/s" | head -1
done
rm -rf "$tmp"
