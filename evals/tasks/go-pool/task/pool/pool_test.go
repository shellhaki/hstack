package pool

import (
	"context"
	"testing"
)

func TestDoubles(t *testing.T) {
	out, err := Process(context.Background(), []int{1}, 2, func(_ context.Context, i int) (int, error) { return i * 2, nil })
	if err != nil || len(out) != 1 || out[0] != 2 {
		t.Fatalf("got %v, %v", out, err)
	}
}
