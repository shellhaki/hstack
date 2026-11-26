import Image from "next/image";
import { BenchmarkCompare } from "@/components/benchmark-compare";
import { CopyButton } from "@/components/copy-button";
import { HarnessPicker } from "@/components/harness-picker";
import { HeroFloat } from "@/components/hero-float";
import { GitHubMark, Nav } from "@/components/nav";
import { ProductWindow } from "@/components/product-window";
import { HowWalkthrough } from "@/components/how-walkthrough";
import { InstallTerminal } from "@/components/install-terminal";
import { SkillDemos } from "@/components/skill-demos";
import { BENCHMARK, GITHUB, HISTORY, INSTALL_CMD, INSTALL_FROM_SOURCE } from "@/lib/site";

const openPoints = [
  { lead: "Every benchmark is in the repo.", rest: "Spec, hidden tests, runner and raw numbers. Run it yourself." },
  { lead: "Results are published either way.", rest: "Wins and losses, from +68% to −53%." },
  { lead: "Plain Markdown skills.", rest: "Read them, fork them, change the brief template." },
];

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-good" aria-hidden>
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

const h2 = "text-[clamp(32px,4vw,48px)] font-semibold leading-[1.05] tracking-[-0.03em]";
const lead = "mt-4 max-w-[620px] text-lg tracking-[-0.005em] text-ink-2";

const installCta =
  "btn-metallic inline-flex min-h-11 items-center gap-2 rounded-[10px] px-[22px] py-3.5 text-[15px] font-semibold transition-[filter,transform]";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="gutter relative overflow-hidden pb-16 pt-[120px] md:pt-[72px]">
          <div className="hero-grid" aria-hidden />
          <HeroFloat />
          <div className="relative mx-auto min-w-0 max-w-[1240px] text-center">
            <h1 className="mx-auto mb-6 mt-4 max-w-[20ch] text-[clamp(34px,9.2vw,56px)] font-semibold leading-[1.05] tracking-[-0.03em] md:mt-12 md:text-[clamp(38px,5.6vw,76px)]">
              <span className="rise inline-block">Small models do the work.</span>
              <br />
              <span className="rise inline-block" style={{ "--d": "90ms" } as React.CSSProperties}>Frontier models direct it.</span>
            </h1>
            <p className="rise mx-auto mb-9 max-w-[720px] text-[clamp(16px,1.4vw,19px)] leading-[1.55] tracking-[-0.005em] text-ink-2" style={{ "--d": "300ms" } as React.CSSProperties}>
              Agent skills that make your frontier model a senior engineer and a cheaper model the engineer who does the work. Half the cost, same hidden tests.
            </p>
            <div className="rise mb-14 flex flex-col items-center gap-4" style={{ "--d": "400ms" } as React.CSSProperties}>
              <CopyButton
                text={INSTALL_CMD}
                label="Copy the install command"
                className={installCta}
              >
                Install hstack
              </CopyButton>
              <code className="block max-w-full overflow-x-auto whitespace-nowrap font-mono text-xs text-ink-3">{INSTALL_CMD}</code>
              <a href={GITHUB} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 text-sm font-medium tracking-[-0.01em] text-ink-2 transition-colors hover:text-ink">
                <GitHubMark />
                <span>View the source</span>
                <Arrow />
              </a>
            </div>

            {/* Layered preview of the real run */}
            <div className="rise mx-auto max-w-[880px]" style={{ "--d": "460ms" } as React.CSSProperties}>
              <div className="hero-preview-frame text-left">
                <div className="hero-preview-fade">
                  <ProductWindow limit={3} />
                </div>
              </div>
              <p className="mt-3 text-[13px] text-ink-3">A real run from benchmark 2, condensed — the full thread is under How it works.</p>
            </div>

            {/* Benchmark 2, front and centre */}
            <div id="benchmark" className="rise mx-auto mt-14 max-w-[1180px] scroll-mt-20 text-left" style={{ "--d": "520ms" } as React.CSSProperties}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <div>
                  <p className="eyebrow">Benchmark 2 · production waitlist backend · Claude Code</p>
                  <h2 className="mt-2 text-[clamp(22px,2.6vw,30px)] font-semibold leading-tight tracking-[-0.03em]">Opus directing Haiku: half the cost, same hidden tests.</h2>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-2">
                  <a href={BENCHMARK} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1.5 hover:text-ink">Full results <Arrow /></a>
                  <a href={HISTORY} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1.5 hover:text-ink">From +68% to −53% <Arrow /></a>
                </div>
              </div>
              <BenchmarkCompare />
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-3">
                Same spec, separate Claude Code sessions. Opus 5.5 wrote 90% fewer output tokens. Costs are Claude Code&apos;s own per-model list-price figures, sub-agent included, judged by a 20-test suite neither side saw.
              </p>
            </div>
          </div>
        </section>

        {/* Harnesses */}
        <section className="section gutter">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-10 max-w-[720px]">
              <h2 className={h2}>Plugs into your harness</h2>
              <p className={lead}>hstack is a set of skills and sub-agents. It runs inside the agent you already use, on the subscription you already pay for.</p>
            </div>
            <HarnessPicker />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="section gutter scroll-mt-14">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-10 max-w-[720px]">
              <h2 className={h2}>The frontier decides why and what; the worker works out how.</h2>
              <p className={lead}>A real run from the benchmark: one brief, one approval, one correction, and no code from the frontier.</p>
            </div>
            <HowWalkthrough />
          </div>
        </section>

        {/* Skills */}
        <section id="skills" className="section gutter scroll-mt-14">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-10 max-w-[720px]">
              <h2 className={h2}>Four skills now, with a skill bank next</h2>
              <p className={lead}>Plus two sub-agents, hstack-worker and hstack-reviewer, that the skills start on your worker model. Try each one — they all work.</p>
            </div>
            <SkillDemos />
            <div className="mt-4 rounded-xl border border-dashed border-line-strong p-6">
              <h3 className="text-lg font-semibold">Skill bank <span className="ml-2 rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-normal text-ink-2">coming next</span></h3>
              <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink-2">
                Curated skills that make the worker better on its own: testing, security, frameworks, data and UI quality. The more it knows, the less the frontier has to correct.
              </p>
            </div>
          </div>
        </section>

        {/* Open */}
        <section id="install" className="section gutter scroll-mt-14">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-10 max-w-[720px]">
              <h2 className={h2}>Don&apos;t trust the numbers? Run them.</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <InstallTerminal />
              <div className="tile flex min-w-0 flex-col justify-between gap-8 p-6 sm:p-8">
                <ul className="flex flex-col gap-5">
                  {openPoints.map((p) => (
                    <li key={p.lead} className="flex gap-3 text-[15px] leading-relaxed text-ink-2">
                      <span className="mt-1"><Check /></span>
                      <span><strong className="font-semibold text-ink">{p.lead}</strong> {p.rest}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-3 border-t border-line pt-6">
                  <div className="flex items-center gap-2 rounded-lg border border-line bg-bg p-1.5 pl-3">
                    <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-ink-2">{INSTALL_FROM_SOURCE}</code>
                    <CopyButton text={INSTALL_FROM_SOURCE} label="Copy the install-from-source command" className="h-8 shrink-0 rounded-md bg-surface-2 px-3 font-mono text-xs hover:bg-white/10" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <a href={GITHUB} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-frontier px-[18px] py-2.5 font-semibold text-white transition-[background,transform] hover:-translate-y-px hover:bg-frontier-hover">
                      <GitHubMark size={14} /> Star on GitHub
                    </a>
                    <a href={BENCHMARK} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">Benchmark source <Arrow /></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section gutter">
          <div className="mx-auto flex max-w-[1240px] flex-col items-center py-8 text-center">
            <h2 className="max-w-[18ch] text-[clamp(34px,5vw,64px)] font-semibold leading-[1.05] tracking-[-0.03em]">Your frontier model shouldn&apos;t be typing.</h2>
            <p className="mt-5 max-w-xl text-lg text-ink-2">Let it direct. Let a cheaper model build.</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <CopyButton text={INSTALL_CMD} label="Copy the install command" className={installCta}>
                Install hstack
              </CopyButton>
              <a href={GITHUB} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-[10px] border border-line px-[22px] py-3.5 text-[15px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink">
                Read the docs
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="gutter border-t border-line py-8">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 text-[13px] text-ink-3">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-256.png" alt="" width={20} height={20} />
            <span>hstack · by <a href="https://shellhaki.dev" className="hover:text-ink">shellhaki</a></span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href={GITHUB} className="hover:text-ink">GitHub</a>
            <a href={BENCHMARK} className="hover:text-ink">Benchmarks</a>
            <a href={HISTORY} className="hover:text-ink">History</a>
          </div>
        </div>
      </footer>
    </>
  );
}
