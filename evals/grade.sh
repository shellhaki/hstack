#!/usr/bin/env bash
# Grades one finished eval run: copies the hidden tests into the work folder and runs them.
#   bash grade.sh <task> <work dir>
# Prints: <task> hidden <passed>/<total> · own tests <n> · files in .hstack/work
# TypeScript tasks (bun) and Go tasks (a go.mod in the task) are both supported.
set -uo pipefail
here=$(cd "$(dirname "$0")" && pwd)
task=$1 work=$2
hidden_dir="$here/tasks/$task/hidden"
if [ -f "$work/go.mod" ]; then
  pkg=$(dirname "$(cd "$work" && find . -name '*.go' -not -name '*_test.go' | head -1)")
  cp "$hidden_dir/hidden_test.go" "$work/$pkg/zz_hidden_test.go"
  out=$(cd "$work" && go test -race -count=1 -v -run 'TestHidden' "./$pkg/" 2>&1)
  pass=$(echo "$out" | grep -c -- '^--- PASS: TestHidden')
  total=$(grep -c '^func TestHidden' "$hidden_dir/hidden_test.go")
  rm "$work/$pkg/zz_hidden_test.go"
  own=$(cd "$work" && grep -rhoE '^func Test' --include='*_test.go' . | wc -l | tr -d ' ')
  fails=$(echo "$out" | grep -E -- '^--- FAIL|^FAIL|panic:|build failed|cannot|undefined' | head -8)
else
  cp "$hidden_dir/hidden.test.ts" "$work/test/zz-hidden.test.ts"
  out=$(cd "$work" && bun test test/zz-hidden.test.ts 2>&1)
  pass=$(echo "$out" | sed -n 's/^ *\([0-9]*\) pass.*/\1/p' | tail -1)
  total=$(grep -cE '^test\(' "$hidden_dir/hidden.test.ts")
  rm "$work/test/zz-hidden.test.ts"
  own=$(cd "$work" && grep -rhoE '^\s*(test|it)\(' test --include=*.ts 2>/dev/null | wc -l | tr -d ' ')
  fails=$(echo "$out" | grep -E "^\(fail\)")
fi
hw=$(ls "$work/.hstack/work" 2>/dev/null | tr '\n' ' ')
echo "$task hidden ${pass:-0}/$total · own tests $own · .hstack/work: ${hw:-none}"
[ -n "$fails" ] && echo "$fails" | sed 's/^/  /'
true
