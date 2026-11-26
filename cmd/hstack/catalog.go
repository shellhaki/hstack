package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

// Row is one model in the list `hstack models` prints, most capable first. Models with the same
// rank are the same tier: a "-contributor" variant shares its base model's rank.
type Row struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Alias string `json:"alias"`
	Note  string `json:"note"`
	Rank  int    `json:"rank"`

	outCost string // output price from the harness catalog, shown as a note when there is none
}

// modelListing is the list for one harness and where it came from.
type modelListing struct {
	Rows      []Row
	Source    string // "live <path>" or "built-in list"
	OrderNote string
}

// liveItem is one visible model read from a harness's own catalog, before ordering.
type liveItem struct {
	row      Row
	cost     float64 // output price; meaningful only when hasCost
	hasCost  bool
	release  string // ISO date from the catalog, may be empty
	priority int    // Codex's priority; lower comes first
}

const (
	liveNoteMuse   = "Order: built-in ranking for known models, price for new ones."
	liveNoteCodex  = "Order: built-in ranking for known models, Codex priority for new ones."
	liveNoteHermes = "Order: built-in ranking for known models, live Hermes provider cache for new ones."
)

// codexModelsCache is the part of $CODEX_HOME/models_cache.json that hstack reads.
type codexModelsCache struct {
	Models []struct {
		Slug        string `json:"slug"`
		DisplayName string `json:"display_name"`
		Visibility  string `json:"visibility"`
		Priority    int    `json:"priority"`
	} `json:"models"`
}

// museModelCatalog is the part of a Muse model catalog file that hstack reads.
type museModelCatalog struct {
	Rows []struct {
		ModelID      string  `json:"model_id"`
		DisplayLabel string  `json:"display_label"`
		Visibility   string  `json:"visibility"`
		ReleaseDate  *string `json:"release_date"`
		Cost         *struct {
			Output string `json:"output"`
		} `json:"cost"`
	} `json:"rows"`
}

// tierOf is the model's tier: its base id, so "x-contributor" and "x" share a tier.
func tierOf(id string) string { return strings.TrimSuffix(id, "-contributor") }

// agentForModel picks the harness from a model id prefix.
func agentForModel(id string) (string, error) {
	switch {
	case strings.HasPrefix(id, "claude-"):
		return "claude", nil
	case strings.HasPrefix(id, "muse-"):
		return "muse", nil
	case strings.HasPrefix(id, "gpt-"), strings.HasPrefix(id, "codex-"):
		return "codex", nil
	case strings.HasPrefix(id, "hermes-"):
		return "hermes", nil
	}
	return "", fmt.Errorf("can't tell the harness from %q (use --agent claude, muse, codex or hermes)", id)
}

// readCodexCatalog lists the user-selectable models ("list") in the Codex cache.
func readCodexCatalog(path string) ([]liveItem, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var c codexModelsCache
	if err := json.Unmarshal(b, &c); err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}
	var items []liveItem
	for _, m := range c.Models {
		if m.Visibility == "list" && m.Slug != "" {
			items = append(items, liveItem{row: Row{ID: m.Slug, Name: m.DisplayName}, priority: m.Priority})
		}
	}
	return items, nil
}

// readMuseCatalogs lists the visible models in every Muse catalog file under dir, first file
// wins for a repeated id. It returns the files it read rows from.
func readMuseCatalogs(dir string) ([]liveItem, []string, error) {
	files, _ := filepath.Glob(filepath.Join(dir, "*.json"))
	sort.Strings(files)
	seen := map[string]bool{}
	var items []liveItem
	var used []string
	for _, f := range files {
		b, err := os.ReadFile(f)
		if err != nil {
			continue
		}
		var c museModelCatalog
		if json.Unmarshal(b, &c) != nil {
			continue
		}
		fileUsed := false
		for _, r := range c.Rows {
			if r.Visibility != "visible" || r.ModelID == "" || seen[r.ModelID] {
				continue
			}
			seen[r.ModelID] = true
			it := liveItem{row: Row{ID: r.ModelID, Name: r.DisplayLabel}}
			if r.ReleaseDate != nil {
				it.release = *r.ReleaseDate
			}
			if r.Cost != nil {
				if v, err := strconv.ParseFloat(r.Cost.Output, 64); err == nil {
					it.cost, it.hasCost = v, true
					it.row.outCost = r.Cost.Output
				}
			}
			items = append(items, it)
			fileUsed = true
		}
		if fileUsed {
			used = append(used, f)
		}
	}
	if len(items) == 0 {
		return nil, nil, fmt.Errorf("no visible models in %s", dir)
	}
	return items, used, nil
}

// museLess orders new Muse models by price, highest output first, then newer release first.
// Models without a price go last.
func museLess(a, b liveItem) bool {
	if a.hasCost != b.hasCost {
		return a.hasCost
	}
	if a.hasCost && a.cost != b.cost {
		return a.cost > b.cost
	}
	if a.release != b.release {
		return a.release > b.release
	}
	return a.row.ID < b.row.ID
}

// codexLess orders new Codex models by their cache priority.
func codexLess(a, b liveItem) bool {
	if a.priority != b.priority {
		return a.priority < b.priority
	}
	return a.row.ID < b.row.ID
}

// orderLive orders a harness's live models. A model in the built-in list keeps its built-in
// position and that always wins. Other models are inserted by price: each goes just before the
// first built-in model whose price is lower (a model without a price counts as lowest), or
// after the rest when it has no price. Models with no built-in entry and no price keep the
// order of less.
func orderLive(items []liveItem, builtin []string, less func(a, b liveItem) bool) []Row {
	pos := map[string]int{}
	for i, id := range builtin {
		if _, ok := pos[id]; !ok {
			pos[id] = i
		}
	}
	var known, unknown []liveItem
	for _, it := range items {
		if _, ok := pos[it.row.ID]; ok {
			known = append(known, it)
		} else {
			unknown = append(unknown, it)
		}
	}
	sort.SliceStable(known, func(i, j int) bool { return pos[known[i].row.ID] < pos[known[j].row.ID] })
	sort.SliceStable(unknown, func(i, j int) bool { return less(unknown[i], unknown[j]) })

	result := known
	for _, u := range unknown {
		at := len(result)
		if u.hasCost {
			for i, it := range result {
				_, isKnown := pos[it.row.ID]
				if isKnown && (!it.hasCost || it.cost < u.cost) {
					at = i
					break
				}
			}
		}
		result = append(result, liveItem{})
		copy(result[at+1:], result[at:])
		result[at] = u
	}
	rows := make([]Row, len(result))
	for i, it := range result {
		rows[i] = it.row
	}
	return rows
}

// assignRanks numbers the tiers from 1 in list order. Rows of one tier share a rank.
// A tier's rank is set by its first row, so ranks rise down the list unless a new
// "-contributor" model sits in the list far from its base.
func assignRanks(rows []Row) {
	rank := map[string]int{}
	for i := range rows {
		k := tierOf(rows[i].ID)
		if _, ok := rank[k]; !ok {
			rank[k] = len(rank) + 1
		}
		rows[i].Rank = rank[k]
	}
}

// builtinIDs returns the built-in list's ids in order.
func builtinIDs(ml *ModelList) []string {
	var ids []string
	if ml != nil {
		for _, m := range ml.Models {
			ids = append(ids, m.ID)
		}
	}
	return ids
}

// mergeStatic adds the alias and note from the built-in list to rows whose ids match it.
func mergeStatic(rows []Row, ml *ModelList) {
	known := map[string]Model{}
	if ml != nil {
		for _, m := range ml.Models {
			known[m.ID] = m
		}
	}
	for i := range rows {
		if m, ok := known[rows[i].ID]; ok {
			if rows[i].Name == "" || rows[i].Name == rows[i].ID {
				rows[i].Name = m.Name
			}
			rows[i].Alias = m.Alias
			rows[i].Note = m.Note
		}
		if rows[i].Note == "" && rows[i].outCost != "" {
			rows[i].Note = "output cost " + rows[i].outCost + " USD"
		}
	}
}

// modelList returns the harness's own live catalog when it has one, else the built-in list.
func modelList(agent string) (modelListing, error) {
	builtin, berr := loadModels(agent)
	var out modelListing
	if berr == nil {
		out.OrderNote = builtin.OrderNote
	}
	ids := builtinIDs(builtin)
	var rows []Row
	switch agent {
	case "codex":
		path := filepath.Join(codexHome(), "models_cache.json")
		items, err := readCodexCatalog(path)
		if err == nil && len(items) > 0 {
			rows = orderLive(items, ids, codexLess)
			out.Source = "live " + path
			out.OrderNote = liveNoteCodex
		} else if err != nil && !os.IsNotExist(err) {
			fmt.Fprintf(os.Stderr, "warning: %v; using the built-in list\n", err)
		}
	case "muse":
		items, used, err := readMuseCatalogs(filepath.Join(home(), ".local", "share", "muse", "model-catalog"))
		if err == nil && len(items) > 0 {
			rows = orderLive(items, ids, museLess)
			out.Source = "live " + strings.Join(used, ", ")
			out.OrderNote = liveNoteMuse
		}
	case "hermes":
		items, used, err := readHermesCatalog(hermesHome())
		if err == nil && len(items) > 0 {
			rows = orderLive(items, ids, hermesLess)
			out.Source = "live " + used
			out.OrderNote = liveNoteHermes
		}
	}
	if out.Source != "" {
		mergeStatic(rows, builtin)
	} else {
		if berr != nil {
			return out, fmt.Errorf("no model list for %q", agent)
		}
		rows = nil
		for _, m := range builtin.Models {
			rows = append(rows, Row{ID: m.ID, Name: m.Name, Alias: m.Alias, Note: m.Note})
		}
		out.Source = "built-in list"
	}
	assignRanks(rows)
	out.Rows = rows
	return out, nil
}
