package pool

import (
	"context"
	"sync"
)

// Process runs fn on every item and returns the results.
func Process[I, R any](ctx context.Context, items []I, workers int, fn func(context.Context, I) (R, error)) ([]R, error) {
	var (
		mu      sync.Mutex
		results []R
		firstErr error
		wg      sync.WaitGroup
	)
	for _, it := range items {
		wg.Add(1)
		go func(it I) {
			defer wg.Done()
			r, err := fn(ctx, it)
			mu.Lock()
			defer mu.Unlock()
			if err != nil && firstErr == nil {
				firstErr = err
			}
			results = append(results, r)
		}(it)
	}
	wg.Wait()
	return results, firstErr
}
