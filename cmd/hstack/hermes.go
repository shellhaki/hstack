package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
)

// hermesHome is Hermes's config directory: $HERMES_HOME when set (profiles
// included — `hermes -p <profile>` points it at the profile's home),
// else ~/.hermes.
func hermesHome() string {
	if d := os.Getenv("HERMES_HOME"); d != "" {
		return d
	}
	return filepath.Join(home(), ".hermes")
}

// hermesProviderCache is the part of $HERMES_HOME/provider_models_cache.json
// hstack reads: every provider Hermes has credentials for, with the model ids
// that provider serves.
type hermesProviderCache map[string]struct {
	Models []string `json:"models"`
}

// readHermesCatalog lists the models Hermes knows, across every provider in
// its live cache. Providers are visited in sorted order so the merge is
// deterministic; the first provider wins for a repeated id. It returns the
// cache path it read.
func readHermesCatalog(home string) ([]liveItem, string, error) {
	path := filepath.Join(home, "provider_models_cache.json")
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, "", err
	}
	var c hermesProviderCache
	if err := json.Unmarshal(b, &c); err != nil {
		return nil, "", fmt.Errorf("%s: %w", path, err)
	}
	provs := make([]string, 0, len(c))
	for p := range c {
		provs = append(provs, p)
	}
	sort.Strings(provs)
	seen := map[string]bool{}
	var items []liveItem
	for _, p := range provs {
		for _, id := range c[p].Models {
			if id == "" || seen[id] {
				continue
			}
			seen[id] = true
			items = append(items, liveItem{row: Row{ID: id, Name: id}})
		}
	}
	if len(items) == 0 {
		return nil, "", fmt.Errorf("no models in %s", path)
	}
	return items, path, nil
}

// hermesLess orders new Hermes models alphabetically. Known models keep their
// built-in positions via orderLive; the live cache's own order is not a
// capability ranking, so it is not trusted here.
func hermesLess(a, b liveItem) bool { return a.row.ID < b.row.ID }
