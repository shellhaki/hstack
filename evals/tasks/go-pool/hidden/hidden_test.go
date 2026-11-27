package pool

import (
	"context"
	"errors"
	"runtime"
	"sync/atomic"
	"testing"
	"time"
)

func double(_ context.Context, i int) (int, error) { return i * 2, nil }

func TestHiddenOrder(t *testing.T) {
	items := make([]int, 200)
	for i := range items {
		items[i] = i
	}
	out, err := Process(context.Background(), items, 8, func(ctx context.Context, i int) (int, error) {
		time.Sleep(time.Duration(200-i) * 10 * time.Microsecond)
		return i * 2, nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(out) != 200 {
		t.Fatalf("len %d", len(out))
	}
	for i, v := range out {
		if v != i*2 {
			t.Fatalf("out[%d] = %d", i, v)
		}
	}
}

func TestHiddenConcurrencyCap(t *testing.T) {
	var cur, peak int64
	items := make([]int, 50)
	_, err := Process(context.Background(), items, 3, func(ctx context.Context, i int) (int, error) {
		n := atomic.AddInt64(&cur, 1)
		for {
			p := atomic.LoadInt64(&peak)
			if n <= p || atomic.CompareAndSwapInt64(&peak, p, n) {
				break
			}
		}
		time.Sleep(2 * time.Millisecond)
		atomic.AddInt64(&cur, -1)
		return 0, nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if peak > 3 || peak < 2 {
		t.Fatalf("peak concurrency %d, want at most 3 (and actually parallel)", peak)
	}
}

func TestHiddenStopsOnFirstError(t *testing.T) {
	boom := errors.New("boom")
	var started int64
	items := make([]int, 1000)
	for i := range items {
		items[i] = i
	}
	start := time.Now()
	_, err := Process(context.Background(), items, 4, func(ctx context.Context, i int) (int, error) {
		atomic.AddInt64(&started, 1)
		if i == 5 {
			return 0, boom
		}
		select {
		case <-ctx.Done():
			return 0, ctx.Err()
		case <-time.After(5 * time.Millisecond):
			return i, nil
		}
	})
	if !errors.Is(err, boom) {
		t.Fatalf("err = %v, want boom", err)
	}
	if s := atomic.LoadInt64(&started); s > 50 {
		t.Fatalf("started %d items after the failure; should stop early", s)
	}
	if time.Since(start) > time.Second {
		t.Fatal("took too long to stop")
	}
}

func TestHiddenContextCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	items := make([]int, 1000)
	go func() { time.Sleep(10 * time.Millisecond); cancel() }()
	_, err := Process(ctx, items, 4, func(ctx context.Context, i int) (int, error) {
		select {
		case <-ctx.Done():
			return 0, ctx.Err()
		case <-time.After(5 * time.Millisecond):
			return i, nil
		}
	})
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("err = %v, want context.Canceled", err)
	}
}

func TestHiddenNoLeaks(t *testing.T) {
	before := runtime.NumGoroutine()
	for k := 0; k < 20; k++ {
		_, _ = Process(context.Background(), make([]int, 100), 4, func(ctx context.Context, i int) (int, error) {
			if i == 3 {
				return 0, errors.New("fail")
			}
			return i, nil
		})
		_, _ = Process(context.Background(), make([]int, 100), 4, double)
	}
	time.Sleep(50 * time.Millisecond)
	if after := runtime.NumGoroutine(); after > before+2 {
		t.Fatalf("goroutines: %d before, %d after", before, after)
	}
}

func TestHiddenEdgeCases(t *testing.T) {
	out, err := Process(context.Background(), []int{}, 4, double)
	if err != nil || len(out) != 0 {
		t.Fatalf("empty: %v %v", out, err)
	}
	if _, err := Process(context.Background(), []int{1}, 0, double); err == nil {
		t.Fatal("workers = 0 should be an error")
	}
	out, err = Process(context.Background(), []int{1, 2, 3}, 10, double)
	if err != nil || len(out) != 3 || out[2] != 6 {
		t.Fatalf("more workers than items: %v %v", out, err)
	}
}
