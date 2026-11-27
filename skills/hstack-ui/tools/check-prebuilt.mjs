#!/usr/bin/env node
// hstack-ui: fail when a page builds UI by hand instead of using installed registry parts.
// Usage: node <skill>/tools/check-prebuilt.mjs [project-root]   (exit 1 on any finding)
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";

const root = process.argv[2] ?? process.cwd();
const cfgPath = join(root, "components.json");
if (!existsSync(cfgPath)) {
  console.error("No components.json: run `npx shadcn@latest init` first (guides/components/SKILL.md).");
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
const alias = (a) => (a ?? "").replace(/^@\//, "");
const uiDir = join(root, alias(cfg.aliases?.ui) || "components/ui");

// Raw HTML elements that have a registry part. Allowed only inside the ui folder.
const RAW = {
  button: "Button", input: "Input", textarea: "Textarea", select: "Select", option: "Select",
  dialog: "Dialog", details: "Accordion or Collapsible", summary: "Accordion or Collapsible",
  table: "Table", progress: "Progress", label: "Label", hr: "Separator", meter: "Progress",
};
const ROLES = /role=["'](button|tab|tablist|tabpanel|dialog|switch|slider|menu|menuitem|checkbox|radio|listbox|option|tooltip|progressbar)["']/;
const CLICK_ON_PLAIN = /<(div|span|li|section|article|img)\b[^>]*\bon(Click|KeyDown|PointerDown)=/;

const skipDirs = new Set(["node_modules", ".next", ".git", "dist", "build", ".hstack", "out", ".turbo"]);
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.(tsx|jsx)$/.test(name)) files.push(p);
  }
})(root);

const findings = [];
for (const f of files) {
  if (f.startsWith(uiDir + "/")) continue;
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    const at = `${relative(root, f)}:${i + 1}`;
    for (const m of line.matchAll(/<([a-z]+)\b/g)) {
      const part = RAW[m[1]];
      if (part) findings.push(`${at}  raw <${m[1]}>: use the registry ${part}`);
    }
    const r = line.match(ROLES);
    if (r) findings.push(`${at}  role="${r[1]}" on a plain element: use the registry part for it`);
    if (CLICK_ON_PLAIN.test(line)) findings.push(`${at}  click handler on a plain element: use Button, Toggle or another registry part`);
  });
}

// Every file in the ui folder must be a registry item, not a hand-made component placed there.
let registry = null;
try {
  const res = await fetch("https://ui.shadcn.com/r/index.json");
  if (res.ok) registry = new Set((await res.json()).map((x) => x.name));
} catch {}
if (existsSync(uiDir)) {
  const extra = (cfg.registries && Object.keys(cfg.registries).length) || 0;
  for (const name of readdirSync(uiDir)) {
    const item = basename(name).replace(/\.(tsx|ts|jsx|js)$/, "");
    if (registry && !registry.has(item) && !extra)
      findings.push(`${relative(root, join(uiDir, name))}  not a @shadcn registry item: delete it and install the real part, or name its registry in components.json`);
  }
}
if (!registry) console.error("note: could not fetch the @shadcn index; the ui folder was not checked");

if (findings.length) {
  console.log(findings.join("\n"));
  console.log(`\n${findings.length} hand-built part(s). Replace each with an installed registry part (guides/components/SKILL.md).`);
  process.exit(1);
}
console.log("ok: every interactive element comes from installed registry parts");
