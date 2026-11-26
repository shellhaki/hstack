package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"testing"
)

func ids(rows []Row) []string {
	out := make([]string, len(rows))
	for i, r := range rows {
		out[i] = r.ID
	}
	return out
}

func ranks(rows []Row) []int {
	out := make([]int, len(rows))
	for i, r := range rows {
		out[i] = r.Rank
	}
	return out
}

func museFixture(t *testing.T) []liveItem {
	t.Helper()
	items, used, err := readMuseCatalogs("testdata/muse/model-catalog")
	if err != nil {
		t.Fatal(err)
	}
	if len(used) != 1 {
		t.Fatalf("used files = %v", used)
	}
	return items
}

func TestReadCodexCatalogVisibleByPriority(t *testing.T) {
	items, err := readCodexCatalog("testdata/codex/models_cache.json")
	if err != nil {
		t.Fatal(err)
	}
	rows := orderLive(items, nil, codexLess)
	assignRanks(rows)
	want := []string{"gpt-6-luna", "gpt-5.6-terra", "gpt-5.6-luna"}
	if got := ids(rows); !reflect.DeepEqual(got, want) {
		t.Fatalf("ids = %v, want %v", got, want)
	}
	if rows[0].Name != "GPT-6-Luna" || rows[2].Rank != 3 {
		t.Fatalf("name or rank wrong: %+v", rows)
	}
}

// The built-in ranking wins for known ids: wonder, ember, spark-1.3 (+contributor), spark-1.2 (+contributor).
func TestMuseBuiltInOrderWins(t *testing.T) {
	ml, err := loadModels("muse")
	if err != nil {
		t.Fatal(err)
	}
	rows := orderLive(museFixture(t), builtinIDs(ml), museLess)
	assignRanks(rows)
	want := []string{
		"muse-wonder-1.0", "muse-ember-1.0",
		"muse-spark-1.3", "muse-spark-1.3-contributor",
		"muse-spark-1.2", "muse-spark-1.2-contributor",
	}
	if got := ids(rows); !reflect.DeepEqual(got, want) {
		t.Fatalf("ids = %v, want %v", got, want)
	}
	if got, want := ranks(rows), []int{1, 2, 3, 3, 4, 4}; !reflect.DeepEqual(got, want) {
		t.Fatalf("ranks = %v, want %v", got, want)
	}
}

// Fixture case: ember has no price, and the two sparks cost the same but were released on
// different dates. When they are not in the built-in list, the newer spark goes first, and
// unpriced ember stays after the priced models.
func TestMuseNewModelsOrderByPriceThenRelease(t *testing.T) {
	builtin := []string{"muse-wonder-1.0", "muse-ember-1.0"}
	rows := orderLive(museFixture(t), builtin, museLess)
	want := []string{
		"muse-wonder-1.0",
		"muse-spark-1.3", "muse-spark-1.2",
		"muse-spark-1.3-contributor", "muse-spark-1.2-contributor",
		"muse-ember-1.0",
	}
	if got := ids(rows); !reflect.DeepEqual(got, want) {
		t.Fatalf("ids = %v, want %v", got, want)
	}
}

func TestNewModelInsertedBeforeFirstCheaperKnown(t *testing.T) {
	items := []liveItem{
		{row: Row{ID: "x"}, cost: 10, hasCost: true},
		{row: Row{ID: "wonder"}, cost: 20, hasCost: true},
		{row: Row{ID: "spark"}, cost: 4.25, hasCost: true},
	}
	rows := orderLive(items, []string{"wonder", "spark"}, museLess)
	want := []string{"wonder", "x", "spark"}
	if got := ids(rows); !reflect.DeepEqual(got, want) {
		t.Fatalf("ids = %v, want %v", got, want)
	}
}

func TestAgentForModel(t *testing.T) {
	cases := map[string]string{
		"gpt-6-luna":        "codex",
		"codex-auto-review": "codex",
		"muse-spark-1.3":    "muse",
		"claude-haiku-5-5":  "claude",
		"hermes-3-405b":     "hermes",
	}
	for id, want := range cases {
		got, err := agentForModel(id)
		if err != nil || got != want {
			t.Fatalf("agentForModel(%q) = %q, %v; want %q", id, got, err, want)
		}
	}
	if _, err := agentForModel("llama-3"); err == nil {
		t.Fatal("expected an error for an unknown prefix")
	}
}

func TestModelListLiveCodexMergesBuiltInAliases(t *testing.T) {
	t.Setenv("CODEX_HOME", t.TempDir())
	copyFile(t, "testdata/codex/models_cache.json", filepath.Join(os.Getenv("CODEX_HOME"), "models_cache.json"))
	list, err := modelList("codex")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(list.Source, "live ") {
		t.Fatalf("source = %q, want live", list.Source)
	}
	if list.OrderNote != liveNoteCodex {
		t.Fatalf("order note = %q", list.OrderNote)
	}
	if list.Rows[0].Alias != "luna" || list.Rows[0].Note == "" {
		t.Fatalf("built-in alias/note not merged: %+v", list.Rows[0])
	}
	if list.Rows[1].Alias != "terra-5.6" {
		t.Fatalf("terra alias = %q", list.Rows[1].Alias)
	}
}

func TestModelListLiveHermesOrderAndNotes(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HERMES_HOME", home)
	copyFile(t, "testdata/hermes/provider_models_cache.json", filepath.Join(home, "provider_models_cache.json"))
	list, err := modelList("hermes")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(list.Source, "live ") {
		t.Fatalf("source = %q, want live", list.Source)
	}
	if list.OrderNote != liveNoteHermes {
		t.Fatalf("order note = %q", list.OrderNote)
	}
	// Built-in ranking wins for known ids even though the live cache lists
	// ember before wonder; unknown live models rank after, alphabetically.
	want := []string{
		"muse-wonder-1.0", "muse-ember-1.0",
		"muse-spark-1.3", "muse-spark-1.3-contributor",
		"muse-spark-1.2", "muse-spark-1.2-contributor",
		"muse-spark-1.1",
		"openai/gpt-6-luna-pro", "sam-3.1",
	}
	if got := ids(list.Rows); !reflect.DeepEqual(got, want) {
		t.Fatalf("ids = %v, want %v", got, want)
	}
	if list.Rows[0].Alias != "wonder" {
		t.Fatalf("wonder alias = %q", list.Rows[0].Alias)
	}
	if list.Rows[1].Alias != "ember" {
		t.Fatalf("ember alias = %q", list.Rows[1].Alias)
	}
}

func TestModelListHermesFallsBackToBuiltIn(t *testing.T) {
	t.Setenv("HERMES_HOME", t.TempDir())
	list, err := modelList("hermes")
	if err != nil {
		t.Fatal(err)
	}
	if list.Source != "built-in list" {
		t.Fatalf("source = %q", list.Source)
	}
	if got, want := ids(list.Rows), []string{
		"muse-wonder-1.0", "muse-ember-1.0",
		"muse-spark-1.3", "muse-spark-1.3-contributor",
		"muse-spark-1.2", "muse-spark-1.2-contributor",
		"muse-spark-1.1",
	}; !reflect.DeepEqual(got, want) {
		t.Fatalf("fallback ids = %v", got)
	}
}

func TestModelListLiveMuseOrderAndNotes(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	dir := filepath.Join(home, ".local", "share", "muse", "model-catalog")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatal(err)
	}
	copyFile(t, "testdata/muse/model-catalog/catalog.json", filepath.Join(dir, "catalog.json"))
	list, err := modelList("muse")
	if err != nil {
		t.Fatal(err)
	}
	if list.OrderNote != liveNoteMuse {
		t.Fatalf("order note = %q", list.OrderNote)
	}
	want := []string{
		"muse-wonder-1.0", "muse-ember-1.0",
		"muse-spark-1.3", "muse-spark-1.3-contributor",
		"muse-spark-1.2", "muse-spark-1.2-contributor",
	}
	if got := ids(list.Rows); !reflect.DeepEqual(got, want) {
		t.Fatalf("ids = %v, want %v", got, want)
	}
	if list.Rows[0].Alias != "wonder" || list.Rows[0].Note != "output cost 20 USD" {
		t.Fatalf("wonder row = %+v", list.Rows[0])
	}
	if list.Rows[1].Note != "" {
		t.Fatalf("ember (no price) should have no cost note: %+v", list.Rows[1])
	}
}

func TestModelListFallsBackToBuiltIn(t *testing.T) {
	t.Setenv("CODEX_HOME", t.TempDir())
	list, err := modelList("codex")
	if err != nil {
		t.Fatal(err)
	}
	if list.Source != "built-in list" {
		t.Fatalf("source = %q", list.Source)
	}
	if list.OrderNote == liveNoteCodex {
		t.Fatal("built-in fallback must print the static order note")
	}
	if got, want := ids(list.Rows), []string{"gpt-6-luna", "gpt-5.6-terra", "gpt-5.6-luna"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("fallback ids = %v", got)
	}

	claude, err := modelList("claude")
	if err != nil {
		t.Fatal(err)
	}
	if claude.Source != "built-in list" || len(claude.Rows) != 4 || claude.Rows[1].Alias != "opus" {
		t.Fatalf("claude listing = %+v", claude)
	}
	if _, err := modelList("nope"); err == nil {
		t.Fatal("expected an error for an unknown agent")
	}
}

func TestRowJSONShape(t *testing.T) {
	b, err := json.Marshal(Row{ID: "gpt-6-luna", Name: "GPT-6-Luna", Alias: "luna", Note: "n", Rank: 1, outCost: "4"})
	if err != nil {
		t.Fatal(err)
	}
	var m map[string]any
	if err := json.Unmarshal(b, &m); err != nil {
		t.Fatal(err)
	}
	var keys []string
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	if want := []string{"alias", "id", "name", "note", "rank"}; !reflect.DeepEqual(keys, want) {
		t.Fatalf("keys = %v, want %v", keys, want)
	}
}

func copyFile(t *testing.T, src, dst string) {
	t.Helper()
	b, err := os.ReadFile(src)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(dst, b, 0o644); err != nil {
		t.Fatal(err)
	}
}
