import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Blocks,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  FileCheck2,
  GitBranch,
  KeyRound,
  LockKeyhole,
  Menu,
  Network,
  Radio,
  ScrollText,
  ShieldCheck,
  TimerReset,
  UserRoundCheck,
  X,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: LockKeyhole,
    eyebrow: 'ENCRYPT & UPLOAD',
    title: 'Authority secures the paper',
    description: 'The administrator encrypts the exam paper with AES-256 before it leaves the authority vault.',
    detail: 'Encrypted payloads never expose plaintext to the distribution layer.',
  },
  {
    number: '02',
    icon: Blocks,
    eyebrow: 'ANCHOR ON-CHAIN',
    title: 'Integrity is committed',
    description: 'A SHA-256 hash and release metadata are anchored on-chain through the Solidity time-lock contract.',
    detail: 'Any change creates a verifiable mismatch against the immutable record.',
  },
  {
    number: '03',
    icon: TimerReset,
    eyebrow: 'RELEASE BY RULE',
    title: 'Centers unlock on schedule',
    description: 'Only registered centers with the right RBAC role can release the paper after its timestamp arrives.',
    detail: 'The contract enforces timing; there is no early-access override.',
  },
  {
    number: '04',
    icon: ScrollText,
    eyebrow: 'AUDIT EVERYTHING',
    title: 'Every access leaves a trail',
    description: 'Immutable events capture each release, verification, and access attempt for complete accountability.',
    detail: 'Auditors can trace the full lifecycle from upload to distribution.',
  },
];

const features = [
  { icon: KeyRound, title: 'AES-256 Encryption', description: 'Exam content stays encrypted end-to-end until an authorized release.' },
  { icon: Clock3, title: 'Smart Contract Time-Lock', description: 'Solidity rules make release timing transparent, automatic, and tamper-proof.' },
  { icon: UserRoundCheck, title: 'Role-Based Access Control', description: 'Only verified centers with explicit permissions can access exam materials.' },
];

export function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  return (
    <main className="min-h-screen overflow-hidden bg-[#0B0F1A] text-slate-100 selection:bg-blue-500/30 selection:text-white">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(59,130,246,0.16),transparent_36%),radial-gradient(circle_at_85%_55%,rgba(30,64,175,0.08),transparent_28%)]" />
      
      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.08] bg-[#0B0F1A]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="ExamVault home">
            <span className="flex size-9 items-center justify-center rounded-[10px] border border-blue-400/30 bg-blue-500/15 text-blue-400">
              <ShieldCheck className="size-5" />
            </span>
            <span>
              <span className="block text-[15px] font-bold tracking-[-0.02em]">ExamVault</span>
              <span className="hidden font-mono text-[8px] tracking-[0.18em] text-slate-500 sm:block">BLOCKCHAIN TIMELOCK & SECURITY</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            <Link to="/guide" className="rounded-md px-3 py-2 text-xs font-medium text-blue-400 transition-colors hover:bg-white/5 hover:text-white">Beginner&apos;s Guide</Link>
            <Link to="/upload" className="rounded-md px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Authority Upload</Link>
            <Link to="/center" className="rounded-md px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Center Portal</Link>
            <Link to="/audit" className="rounded-md px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">Audit Trail</Link>
          </nav>
          <div className="hidden items-center gap-2 xl:flex">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-1.5 font-mono text-[10px] text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />Demo Mode ON
            </span>
            <span className="rounded-full border border-white/[0.09] px-2.5 py-1.5 font-mono text-[10px] text-slate-400">Sepolia</span>
            <span className="rounded-full border border-white/[0.09] px-2.5 py-1.5 font-mono text-[10px] text-slate-500">0x71...A9C2</span>
          </div>
          <button className="rounded-lg border border-white/10 p-2 text-slate-300 lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-white/[0.08] px-5 py-3 lg:hidden">
            <Link to="/guide" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-blue-400 hover:bg-white/5">Beginner&apos;s Guide</Link>
            <Link to="/upload" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/5">Authority Upload</Link>
            <Link to="/center" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/5">Center Portal</Link>
            <Link to="/audit" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/5">Audit Trail</Link>
          </nav>
        )}
      </header>

      {/* Hero Section */}
      <section id="top" className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-20 lg:px-8 lg:pb-28 lg:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.07] px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-blue-300">
              <Radio className="size-3" />SECURE DISTRIBUTION PROTOCOL <ChevronRight className="size-3 text-blue-500" />
            </div>
            <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-8xl">
              Exams that arrive<br /><span className="text-blue-500">exactly on time.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              ExamVault uses encryption, blockchain time-locks, and verifiable access controls to make exam paper distribution tamper-proof from authority to center.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/upload" className="group inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(59,130,246,0.22)] transition-all hover:bg-blue-400 hover:shadow-[0_0_36px_rgba(59,130,246,0.35)]">
                Go to Authority Upload <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/guide" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-white/25 hover:bg-white/[0.07]">
                Learn How It Works <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-3 text-xs text-slate-500">
              <span className="flex -space-x-2">
                <span className="flex size-6 items-center justify-center rounded-full border-2 border-[#0B0F1A] bg-blue-500 text-[9px] font-bold">A</span>
                <span className="flex size-6 items-center justify-center rounded-full border-2 border-[#0B0F1A] bg-indigo-500 text-[9px] font-bold">C</span>
                <span className="flex size-6 items-center justify-center rounded-full border-2 border-[#0B0F1A] bg-slate-600 text-[9px] font-bold">+</span>
              </span>
              Built for authorities, centers, and auditors
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:ml-auto">
            <div className="absolute -inset-10 rounded-full bg-blue-500/[0.08] blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#131826] shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-md bg-blue-500/15 text-blue-400">
                    <FileCheck2 className="size-4" />
                  </span>
                  <span className="text-xs font-semibold">release_manifest.enc</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-400">VERIFIED</span>
              </div>
              <div className="space-y-5 p-5">
                <div className="rounded-lg border border-white/[0.07] bg-[#0B0F1A] p-4">
                  <div className="mb-3 flex items-center justify-between text-[10px] text-slate-500">
                    <span>SHA-256 HASH</span>
                    <Check className="size-3 text-emerald-400" />
                  </div>
                  <code className="break-all font-mono text-xs leading-5 text-blue-300">a7f3c92e1d8b4f61c0...9b22e8a1</code>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/[0.07] bg-[#0B0F1A] p-3">
                    <span className="font-mono text-[9px] text-slate-500">RELEASE AT</span>
                    <p className="mt-2 font-mono text-xs text-slate-200">2026.06.14<br /><span className="text-slate-500">09:00:00 UTC</span></p>
                  </div>
                  <div className="rounded-lg border border-white/[0.07] bg-[#0B0F1A] p-3">
                    <span className="font-mono text-[9px] text-slate-500">NETWORK</span>
                    <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-slate-200">
                      <Network className="size-3 text-blue-400" /> Sepolia
                    </p>
                    <p className="mt-1 text-[10px] text-emerald-400">● Contract active</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/[0.07] p-3">
                  <span className="flex size-8 items-center justify-center rounded-md bg-blue-500/15 text-blue-400">
                    <ShieldCheck className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-blue-100">Time-lock protected</p>
                    <p className="mt-0.5 text-[10px] text-blue-300/60">Awaiting release timestamp</p>
                  </div>
                  <span className="ml-auto flex size-2 rounded-full bg-blue-400 shadow-[0_0_12px_#60a5fa]" />
                </div>
              </div>
              <div className="border-t border-white/[0.08] px-5 py-3 font-mono text-[9px] text-slate-600">
                CONTRACT 0x4e...f28a <span className="float-right">BLOCK #5,921,044</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="relative z-10 border-y border-white/[0.07] bg-white/[0.015]" aria-label="Platform stats">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/[0.07] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">
          {[
            ['12,480', 'PAPERS SECURED', '+18.4% this month'],
            ['86', 'CENTERS REGISTERED', 'Across 12 regions'],
            ['34,921', 'ON-CHAIN TRANSACTIONS', 'Sepolia testnet'],
          ].map(([value, label, note]) => (
            <div key={label} className="flex items-center justify-between px-3 py-6 sm:block sm:px-8">
              <div className="font-mono text-3xl font-semibold tracking-tight text-white">{value}</div>
              <div className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-slate-500">{label}</div>
              <div className="mt-2 text-[11px] text-blue-400">{note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-5 py-24 lg:px-8 lg:py-32">
        <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-blue-400">THE PROTOCOL</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">How ExamVault works</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-500">
            A transparent chain of custody where every step is cryptographically verifiable.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <button
                key={step.number}
                onClick={() => setActiveStep(index)}
                className={`group relative rounded-xl border p-5 text-left transition-all duration-300 ${
                  activeStep === index
                    ? 'border-blue-500/50 bg-blue-500/[0.08] shadow-[0_0_28px_rgba(59,130,246,0.08)]'
                    : 'border-white/[0.08] bg-[#131826] hover:-translate-y-1 hover:border-blue-400/30'
                }`}
              >
                <div className="mb-12 flex items-start justify-between">
                  <span className={`font-mono text-xs ${activeStep === index ? 'text-blue-400' : 'text-slate-600'}`}>{step.number}</span>
                  <span className={`flex size-9 items-center justify-center rounded-lg ${activeStep === index ? 'bg-blue-500 text-white' : 'bg-white/[0.06] text-slate-400 group-hover:text-blue-400'}`}>
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="font-mono text-[9px] tracking-[0.16em] text-blue-400">{step.eyebrow}</p>
                <h3 className="mt-2 text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{step.description}</p>
                <div className={`grid transition-[grid-template-rows] duration-300 ${activeStep === index ? 'mt-4 grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <p className="overflow-hidden text-xs leading-5 text-blue-200/70">{step.detail}</p>
                </div>
                {index < 3 && <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden size-5 -translate-y-1/2 text-blue-500/40 lg:block" />}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-600">
          <CircleDot className="size-3 text-blue-500" /> Select a step to inspect the security layer
        </div>
      </section>

      {/* Guide / Security */}
      <section id="guide" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-5 pb-24 lg:px-8 lg:pb-32">
        <div className="mb-9 flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-blue-400">BUILT-IN SECURITY</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Security by design</h2>
          </div>
          <Code2 className="hidden size-7 text-slate-700 sm:block" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="group rounded-xl border border-white/[0.08] bg-[#131826] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-[#161d2e]">
              <span className="flex size-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-8 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
              <div className="mt-6 flex items-center gap-1 font-mono text-[10px] text-slate-600 transition-colors group-hover:text-blue-400">
                LEARN MORE <ArrowRight className="size-3" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="audit" className="relative z-10 border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <ShieldCheck className="size-4 text-blue-500" />
            <span>ExamVault <span className="text-slate-700">/</span> Hackathon project</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="https://github.com/GhostKernel19/ExamVault" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-slate-500 transition-colors hover:text-white">
              <GitBranch className="size-4" /> GitHub Repo <ArrowUpRight className="size-3" />
            </a>
            <span className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.06] px-3 py-1.5 font-mono text-[10px] text-blue-300">
              <span className="size-1.5 rounded-full bg-blue-400" /> Sepolia testnet
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Home;
