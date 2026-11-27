// Command hstack installs hstack for Claude Code, Muse Code, Codex or Hermes Agent: the skills (hstack,
// hstack-team, hstack-swarm, hstack-orchestrator-swarm, hstack-ui, hstack-motion, hstack-research, hstack-update) and the worker sub-agents (hstack-worker, hstack-reviewer).
//
//	hstack            install for Claude Code (same as `hstack install`)
//	hstack install    [--agent claude|muse|codex|hermes]
//	hstack models     show the model list used to validate workers (live from the harness's catalog when it has one)
//	hstack status     show the saved setup
//	hstack uninstall  remove the installed links and setup
package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/shellhaki/hstack"
)

var version = "dev"

type Model struct {
	ID    string   `json:"id"`
	Alias string   `json:"alias"`
	Name  string   `json:"name"`
	Names []string `json:"names"`
	Note  string   `json:"note"`
}

type ModelList struct {
	Updated       string  `json:"updated"`
	DefaultWorker string  `json:"default_worker"`
	OrderNote     string  `json:"order_note"`
	Models        []Model `json:"models"`
	Benchmarks    []struct {
		Name  string `json:"name"`
		Tests string `json:"tests"`
	} `json:"benchmarks"`
}

type Config struct {
	Version int    `json:"version"`
	Agent   string `json:"agent"`
	Home    string `json:"home"`
}

func home() string       { h, _ := os.UserHomeDir(); return h }
func hstackHome() string { return filepath.Join(home(), ".config", "hstack") }
func configPath() string { return filepath.Join(hstackHome(), "config.json") }
func claudeHome() string {
	if d := os.Getenv("CLAUDE_CONFIG_DIR"); d != "" {
		return d
	}
	return filepath.Join(home(), ".claude")
}

func bold(s string) string { return "\033[1m" + s + "\033[0m" }
func dim(s string) string  { return "\033[2m" + s + "\033[0m" }

// agentsHome is the shared skills root that Muse Code and Codex read (Muse also reads ~/.claude/skills).
func agentsHome() string { return filepath.Join(home(), ".agents") }

// skillTargets lists where an agent loads skills and sub-agents from.
func skillTargets(agent string) (skills string, agents string) {
	if agent == "hermes" {
		// Hermes has no sub-agent files: a worker is a separate `hermes chat`
		// process whose prompt points at <home>/agents/hstack-worker.md.
		// $HERMES_HOME covers profiles: `hermes -p <profile>` points it at
		// the profile's home.
		return filepath.Join(hermesHome(), "skills"), ""
	}
	if agent == "muse" || agent == "codex" {
		// Muse has no sub-agent files: its workers read <home>/agents/*.md as instructions.
		// Codex sub-agents are TOML files written by installCodexAgents instead of links.
		return filepath.Join(agentsHome(), "skills"), ""
	}
	return filepath.Join(claudeHome(), "skills"), filepath.Join(claudeHome(), "agents")
}

func loadModels(agent string) (*ModelList, error) {
	b, err := hstack.Assets.ReadFile("models/" + agent + ".json")
	if err != nil {
		return nil, err
	}
	var m ModelList
	return &m, json.Unmarshal(b, &m)
}

var in = bufio.NewReader(os.Stdin)

func ask(prompt, def string) string {
	fmt.Printf("%s [%s]: ", prompt, def)
	line, err := in.ReadString('\n')
	line = strings.TrimSpace(line)
	if line == "" || err != nil {
		return def
	}
	return line
}

// install extracts the embedded files into ~/.config/hstack and links skills (and, for Claude Code,
// sub-agents) where the agent loads them.
func install(agent string) error {
	dst := hstackHome()
	// Start from a clean copy, so skills removed from hstack don't linger.
	for _, sub := range []string{"skills", "agents", "models"} {
		if err := os.RemoveAll(filepath.Join(dst, sub)); err != nil {
			return err
		}
	}
	err := fs.WalkDir(hstack.Assets, ".", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		target := filepath.Join(dst, p)
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		b, err := hstack.Assets.ReadFile(p)
		if err != nil {
			return err
		}
		return os.WriteFile(target, b, 0o644)
	})
	if err != nil {
		return err
	}
	link := func(src, dest string) error {
		if fi, err := os.Lstat(dest); err == nil {
			if fi.Mode()&os.ModeSymlink == 0 {
				fmt.Printf("  skip %s: exists and is not an hstack link\n", dest)
				return nil
			}
			_ = os.Remove(dest)
		}
		if err := os.Symlink(src, dest); err != nil {
			return err
		}
		fmt.Printf("  %s %s\n", dim("linked"), dest)
		return nil
	}
	skillsDir, agentsDir := skillTargets(agent)
	for sub, target := range map[string]string{"skills": skillsDir, "agents": agentsDir} {
		if target == "" {
			continue
		}
		if err := os.MkdirAll(target, 0o755); err != nil {
			return err
		}
		// Drop our links whose skill or agent no longer exists.
		old, _ := os.ReadDir(target)
		for _, e := range old {
			p := filepath.Join(target, e.Name())
			if dest, err := os.Readlink(p); err == nil && strings.HasPrefix(dest, dst+string(os.PathSeparator)) {
				if _, err := os.Stat(dest); os.IsNotExist(err) {
					_ = os.Remove(p)
					fmt.Printf("  %s %s\n", dim("removed"), p)
				}
			}
		}
		entries, _ := os.ReadDir(filepath.Join(dst, sub))
		for _, e := range entries {
			if err := link(filepath.Join(dst, sub, e.Name()), filepath.Join(target, e.Name())); err != nil {
				return err
			}
		}
	}
	if agent == "codex" {
		return installCodexAgents()
	}
	return nil
}

func cmdInstall(args []string) error {
	fl := flag.NewFlagSet("install", flag.ExitOnError)
	agent := fl.String("agent", "claude", "harness: claude (Claude Code), muse (Muse Code), codex (Codex) or hermes (Hermes Agent)")
	_ = fl.Parse(args)

	names := map[string]string{"claude": "Claude Code", "muse": "Muse Code", "codex": "Codex", "hermes": "Hermes Agent"}
	if names[*agent] == "" {
		return fmt.Errorf("unknown --agent %q (use claude, muse, codex or hermes)", *agent)
	}
	fmt.Println(bold("hstack") + dim("  small models do the work, frontier models direct it"))
	fmt.Println("Installing for " + names[*agent])
	if _, err := exec.LookPath(*agent); err != nil {
		fmt.Printf("  note: `%s` is not on your PATH; installing anyway.\n", *agent)
	}
	if err := install(*agent); err != nil {
		return err
	}
	cfg := Config{Version: 3, Agent: *agent, Home: hstackHome()}
	b, _ := json.MarshalIndent(cfg, "", "  ")
	if err := os.WriteFile(configPath(), append(b, '\n'), 0o644); err != nil {
		return err
	}

	fmt.Println()
	fmt.Println(bold("Done.") + " In a session, run  /hstack  to turn the guides on (or  /hstack-team  to direct a smaller worker).")
	return nil
}

func cmdModels(args []string) error {
	fl := flag.NewFlagSet("models", flag.ContinueOnError)
	agent := fl.String("agent", "", "harness: claude, muse, codex or hermes (default: the one saved by install)")
	frontier := fl.String("frontier", "", "the session's model id; picks the harness by its prefix when --agent is not set (in Hermes always pass --agent hermes: its model ids overlap other harnesses)")
	asJSON := fl.Bool("json", false, "print [{id, name, alias, note, rank}], most to least capable")
	if err := fl.Parse(args); err != nil {
		return err
	}
	a := *agent
	if a == "" && fl.NArg() > 0 {
		a = fl.Arg(0) // older form: hstack models codex
	}
	if a == "" && *frontier != "" {
		var err error
		if a, err = agentForModel(*frontier); err != nil {
			return err
		}
	}
	if a == "" {
		a = "claude"
		if b, err := os.ReadFile(configPath()); err == nil {
			var c Config
			if json.Unmarshal(b, &c) == nil && c.Agent != "" {
				a = c.Agent
			}
		}
	}
	if a != "claude" && a != "muse" && a != "codex" && a != "hermes" {
		return fmt.Errorf("unknown agent %q (use claude, muse, codex or hermes)", a)
	}
	list, err := modelList(a)
	if err != nil {
		return err
	}
	if *asJSON {
		fmt.Fprintln(os.Stderr, "source: "+list.Source)
		b, err := json.MarshalIndent(list.Rows, "", "  ")
		if err != nil {
			return err
		}
		fmt.Println(string(b))
		return nil
	}
	fmt.Println(bold(a + " models, most to least capable"))
	fmt.Println(dim("source: " + list.Source))
	for i, m := range list.Rows {
		note := ""
		if m.Note != "" {
			note = "  " + dim(m.Note)
		}
		fmt.Printf("  %d. %-28s %-22s %s%s\n", i+1, m.Name, m.Alias, dim(m.ID), note)
	}
	if list.OrderNote != "" {
		fmt.Println("\n" + dim(list.OrderNote))
	}
	return nil
}

func cmdStatus() error {
	b, err := os.ReadFile(configPath())
	if err != nil {
		fmt.Println("hstack is not set up yet. Run: hstack")
		return nil
	}
	fmt.Print(string(b))
	return nil
}

func cmdUninstall() error {
	targets := map[string][]string{
		"skills": {filepath.Join(claudeHome(), "skills"), filepath.Join(agentsHome(), "skills"), filepath.Join(hermesHome(), "skills")},
		"agents": {filepath.Join(claudeHome(), "agents")},
	}
	for sub, dirs := range targets {
		entries, _ := os.ReadDir(filepath.Join(hstackHome(), sub))
		for _, e := range entries {
			for _, dir := range dirs {
				p := filepath.Join(dir, e.Name())
				if fi, err := os.Lstat(p); err == nil && fi.Mode()&os.ModeSymlink != 0 {
					_ = os.Remove(p)
					fmt.Println("  removed", p)
				}
			}
		}
	}
	removeCodexAgents()
	if strings.EqualFold(ask("Remove "+hstackHome()+" too? (y/N)", "N"), "y") {
		if err := os.RemoveAll(hstackHome()); err != nil {
			return err
		}
		fmt.Println("  removed", hstackHome())
	}
	return nil
}

func main() {
	cmd, args := "install", []string{}
	if len(os.Args) > 1 {
		cmd, args = os.Args[1], os.Args[2:]
		if strings.HasPrefix(cmd, "-") {
			cmd, args = "install", os.Args[1:]
		}
	}
	var err error
	switch cmd {
	case "install":
		err = cmdInstall(args)
	case "models":
		err = cmdModels(args)
	case "status":
		err = cmdStatus()
	case "uninstall":
		err = cmdUninstall()
	case "version", "--version":
		fmt.Println("hstack", version)
	case "help", "-h", "--help":
		fmt.Println("usage: hstack [install [--agent claude|muse|codex|hermes]|models [--agent claude|muse|codex|hermes] [--frontier <model id>] [--json]|status|uninstall|version]")
	default:
		err = fmt.Errorf("unknown command %q (try: hstack help)", cmd)
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}
