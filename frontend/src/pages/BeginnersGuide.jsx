import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  Clock3,
  Download,
  FileLock2,
  Hash,
  KeyRound,
  LockKeyhole,
  Network,
  ScrollText,
  ShieldCheck,
  Upload,
  Users,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

const features = [
  {
    title: 'Authority Upload',
    icon: Upload,
    subtitle: 'For exam admins',
    description: 'Exam authorities upload the paper, set its release time, and seal it. The paper is encrypted before it leaves their hands, while a unique fingerprint (hash) is recorded on-chain so any later change would be immediately detected.',
  },
  {
    title: 'Center Portal',
    icon: Users,
    subtitle: 'For exam centers',
    description: 'Invigilators can see papers assigned to their center and download them only after the release time has passed. They cannot edit the paper, move the release time, or open it early — the lock is cryptographically enforced by the network.',
  },
  {
    title: 'Audit Trail',
    icon: ScrollText,
    subtitle: 'A shared receipt book',
    description: 'Every important action — upload, unlock, and download — is permanently recorded on-chain. Because the record is distributed and chained to earlier blocks, nobody can quietly rewrite history.',
  },
  {
    title: 'Time-Lock',
    icon: Clock3,
    subtitle: 'A vault with a timer',
    description: 'Think of a bank vault with a timer built into its door. The system checks block.timestamp, a verifiable time value supplied by the blockchain, and refuses to open until that scheduled moment arrives.',
  },
  {
    title: 'RBAC (Role-Based Access Control)',
    icon: KeyRound,
    subtitle: 'The right key for each job',
    description: 'Like key-cards in a secure facility: Admins can upload papers, Centers can unlock assigned papers after release, and Auditors can inspect logs. A key-card never grants more access than its assigned role allows.',
  },
  {
    title: 'Encryption (AES-256 + RSA envelope)',
    icon: FileLock2,
    subtitle: 'Two layers of protection',
    description: 'The paper is like a document inside a heavy steel safe (AES-256). Its key is placed inside another locked box (RSA key wrapping). Even if someone intercepts the transmission, they cannot read the paper without the destination private key.',
  },
];

const steps = [
  { label: 'Upload', icon: Upload, detail: 'Authority uploads the master exam paper into the secure dashboard.' },
  { label: 'Encrypt', icon: LockKeyhole, detail: 'The file is encrypted with AES-256-GCM before leaving the browser.' },
  { label: 'Hash on-chain', icon: Hash, detail: 'SHA-256 hash and metadata are registered on the Sepolia smart contract.' },
  { label: 'Wait for time-lock', icon: Clock3, detail: 'The smart contract rejects any access requests prior to release time.' },
  { label: 'Center unlocks', icon: KeyRound, detail: 'Authorized center connects their verified wallet after release time.' },
  { label: 'Download', icon: Download, detail: 'Encrypted payload is verified against on-chain hash and decrypted.' },
  { label: 'Logged to audit trail', icon: ScrollText, detail: 'Access timestamp, center address, and tx hash recorded immutably.' },
];

const faqs = [
  {
    question: 'Is this actually secure?',
    answer: 'It uses multiple defense-in-depth safeguards: military-grade AES-256 encryption, role-based access control, and an autonomous smart contract time-lock. No single party can bypass the cryptographic verification.',
  },
  {
    question: 'What if the internet or RPC goes down?',
    answer: 'The paper remains securely locked. Network downtime does not skip the timer or alter on-chain records. Centers simply resume access as soon as their connection or RPC provider is restored.',
  },
  {
    question: 'What blockchain does this use and why testnet?',
    answer: 'ExamVault is deployed on Ethereum Sepolia Testnet. It operates identically to the Ethereum mainnet but uses test Ether, making it ideal for zero-cost demonstrations, testing, and audits.',
  },
];

function FeatureRow({ item, open, toggle }) {
  const Icon = item.icon;
  return (
    <div className={`overflow-hidden rounded-xl border transition-all duration-200 ${open ? 'border-blue-500/40 bg-[#171e31]' : 'border-white/[0.07] bg-[#131826]'}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
          <Icon size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-white">{item.title}</span>
          <span className="mt-1 block text-xs text-slate-500">{item.subtitle}</span>
        </span>
        <ChevronDown size={18} className={`text-slate-500 transition-transform duration-300 ${open ? 'rotate-180 text-blue-400' : ''}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="border-t border-white/[0.06] px-5 pb-5 pt-4 pl-5 sm:pl-[4.5rem] text-sm leading-6 text-slate-400">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function BeginnersGuide() {
  const [openFeature, setOpenFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-slate-200 selection:bg-blue-500/30 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-white/[0.07] bg-[#0d1220]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex size-8 items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-400 transition-colors">
              <ShieldCheck size={18} />
            </Link>
            <Link to="/" className="text-sm font-bold text-white hover:text-blue-400 transition-colors">
              ExamVault
            </Link>
            <span className="hidden rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] text-blue-300 sm:inline">
              BEGINNER&apos;S GUIDE
            </span>
          </div>
          
          <nav className="hidden gap-6 text-xs text-slate-400 md:flex items-center">
            <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <Link to="/upload" className="hover:text-white transition-colors">Authority Upload</Link>
            <Link to="/center" className="hover:text-white transition-colors">Center Portal</Link>
            <Link to="/audit" className="hover:text-white transition-colors">Audit Trail</Link>
          </nav>

          <span className="flex items-center gap-2 text-xs text-slate-500">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            Sepolia Testnet
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 lg:px-8 lg:pt-24">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 font-mono text-[11px] text-blue-300">
            <LockKeyhole size={13} /> A safer way to handle exam papers
          </div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl leading-[1.05]">
            Understand the lock<br />
            <span className="text-blue-400">before exam day.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            ExamVault keeps exam papers sealed until the exact moment they are needed. This guide explains what happens behind the scenes — no blockchain knowledge required.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-400 transition-colors"
            >
              Try Upload Demo <ArrowRight size={15} />
            </Link>
            <Link
              to="/center"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors"
            >
              Access Center Portal
            </Link>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-blue-500/20 bg-[#131826] p-6 sm:p-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck size={18} className="text-blue-400" /> What problem does ExamVault solve?
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Exam papers are historically vulnerable when they sit in storage or transit before an exam. ExamVault encrypts the paper and anchors a mathematical time-lock on the blockchain, so no one — not even the school or server host — can decrypt it early. Once released, the designated center can unlock it and every single attempt leaves a permanent audit trail.
          </p>
        </div>
      </section>

      {/* Building Blocks */}
      <section id="features" className="mx-auto max-w-6xl px-5 pb-20 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-400">01 / The building blocks</p>
        <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Six ideas, one secure flow.</h2>
        <p className="mt-3 text-sm text-slate-500">Open any section below to see the plain-English explanation.</p>
        
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {features.map((item, i) => (
            <FeatureRow
              key={item.title}
              item={item}
              open={openFeature === i}
              toggle={() => setOpenFeature(openFeature === i ? -1 : i)}
            />
          ))}
        </div>
      </section>

      {/* Follow the paper - Interactive Walkthrough */}
      <section className="border-y border-white/[0.06] bg-[#0d1220] py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mb-10 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-400">02 / Follow the paper</p>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">From upload to unlock.</h2>
            <p className="mt-3 text-sm text-slate-500">Click each step to simulate how the data travels securely.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {steps.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveStep(i)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    activeStep === i
                      ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                      : 'border-white/[0.07] bg-[#131826] hover:border-blue-500/30'
                  }`}
                >
                  <div className="mb-6 flex justify-between items-center">
                    <span className={`font-mono text-xs ${activeStep === i ? 'text-blue-400 font-bold' : 'text-slate-600'}`}>
                      0{i + 1}
                    </span>
                    <Icon size={17} className={activeStep === i ? 'text-blue-400' : 'text-slate-500'} />
                  </div>
                  <span className="block text-xs font-semibold text-white">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mx-auto mt-8 max-w-xl rounded-lg border border-blue-500/20 bg-blue-500/[0.06] p-4 text-sm text-blue-100 flex items-start gap-3">
            <Check size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Step 0{activeStep + 1}: {steps[activeStep].label}</div>
              <p className="mt-1 text-xs text-blue-200/80 leading-5">{steps[activeStep].detail}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-400">03 / Common questions</p>
        <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">You asked. We made it simple.</h2>

        <div className="mt-8 space-y-3">
          {faqs.map((faq, i) => (
            <div key={faq.question} className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#131826]">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                className="flex w-full items-center gap-4 p-5 text-left text-sm font-semibold text-white hover:bg-white/[0.02] transition-colors"
              >
                <span className="flex-1">{faq.question}</span>
                <ChevronDown size={18} className={`text-slate-500 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-blue-400' : ''}`} />
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ${openFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <p className="border-t border-white/[0.06] px-5 pb-5 pt-4 text-sm leading-6 text-slate-400">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row justify-between items-center gap-4 px-5 text-xs text-slate-500 lg:px-8">
          <span className="font-mono">EXAMVAULT / SYSTEM GUIDE</span>
          <span className="flex items-center gap-2">
            <Network size={13} className="text-blue-400" /> Built for verifiable exam distribution
          </span>
        </div>
      </footer>
    </main>
  );
}

export default BeginnersGuide;
