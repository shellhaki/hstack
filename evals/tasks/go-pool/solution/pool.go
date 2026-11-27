package pool

import (
	"context"
	"errors"
	"sync"
)

// Process runs fn on every item with at most workers running at once, and returns the results in
// input order. It stops at the first error or when ctx is cancelled, and waits for every started
// call to return before it does.
func Process[I, R any](ctx context.Context, items []I, workers int, fn func(context.Context, I) (R, error)) ([]R, error) {
	if workers < 1 {
		return nil, errors.New("pool: workers must be at least 1")
	}
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	results := make([]R, len(items))
	var (
		once     sync.Once
		firstErr error
		wg       sync.WaitGroup
	)
	fail := func(err error) { once.Do(func() { firstErr = err; cancel() }) }
	jobs := make(chan int)
	for w := 0; w < workers && w < len(items); w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := range jobs {
				r, err := fn(ctx, items[i])
				if err != nil {
					fail(err)
					continue
				}
				results[i] = r
			}
		}()
	}
feed:
	for i := range items {
		select {
		case <-ctx.Done():
			break feed
		case jobs <- i:
		}
	}
	close(jobs)
	wg.Wait()
	if firstErr != nil {
		return nil, firstErr
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return results, nil
}
