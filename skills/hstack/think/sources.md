# Check the source, not your memory

Your memory of a library comes from training, which may be a different version from the one in this
project. Many wrong answers come from an API that existed once, exists in another version, or never
existed. A strong engineer checks the installed version. So do you, every time.

## Before using anything you haven't read in this task
That includes a library function, a framework feature, a CLI flag, a config key, an HTTP endpoint and
an environment variable.

1. **Find the installed version:** in `package.json` and the lockfile, `go.mod`, `requirements.txt`
   or `pyproject.toml`, or `<tool> --version`.
2. **Read the installed copy:**
   - JS/TS: `node_modules/<pkg>/package.json` (`exports`, `types`), then the `.d.ts` files it
     points to. Search them: `grep -rn "<name>" node_modules/<pkg>/dist/*.d.ts`.
   - Frameworks that ship docs: read them. For example, Next.js ships
     `node_modules/next/dist/docs/`. Read the project's `AGENTS.md` notes about versions.
   - Go: `go doc <pkg>.<Symbol>`. Python: the package source in site-packages, or
     `python -c "import x; help(x.y)"`.
   - CLI: `<tool> --help` and `<tool> <subcommand> --help`.
   - HTTP API: the OpenAPI document if it has one (`/openapi.json`), or the official docs page.
3. **Write down where you read it:** the file and line or the command, in `PROGRESS.md`. The reviewer
   may ask.
4. **Can't find it, or the docs are unclear?** Write a probe: a 5 to 15 line script that calls the
   API and prints the result. Run it, then delete it. A probe settles in a minute what guessing
   gets wrong for an hour.

## The project's own code
Before you call a function in this repo, open its definition. Read its parameters, return type,
errors and side effects. Don't infer them from the name.

## Never
- Write an import, flag or config key you haven't seen in the installed version.
- "Fix" a type error by casting (`as any`, `# type: ignore`, `//nolint`). The error is telling you
  that your idea of the API is wrong. Read the source.
- Copy an example from memory without checking each call in it.
