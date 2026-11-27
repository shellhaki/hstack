# Batch processing (Go)

`pool.Process` in `pool/pool.go` runs `fn` over a batch of items. On big batches it overloads the
downstream service, its results come back in a random order, and when one item fails the whole job
sometimes hangs or keeps working long after it should have stopped.

Rewrite `Process` so it:
- runs at most `workers` items at a time,
- returns the results in the same order as `items`,
- stops as soon as one item fails (or `ctx` is cancelled) and returns that error,
- leaves nothing running behind when it returns.

Keep the signature. Run the tests with `go test -race ./...`.
