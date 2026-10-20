import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  ChartNoAxesCombined,
  Wallet,
  Layers,
  Download,
  Leaf,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="landing">
      <nav className="site-nav">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <Leaf size={21} />
          </span>{" "}
          ledger<span className="brand-dot">.</span>
        </Link>
        <div className="nav-links">
          <a href="#features">Why Ledger</a>
          <Link href="/login">Sign in</Link>
          <ThemeToggle />
          <Link className="button primary" href="/register">
            Get started <ArrowUpRight size={16} />
          </Link>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="status-dot" /> A little clarity goes a long way
          </span>
          <h1>
            Make room for
            <br />a richer <em>life.</em>
          </h1>
          <p>
            Less wondering where it all went. More knowing where you’re going.
            Give every dollar a place, and your plans a little breathing room.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/register">
              Find your financial flow <ArrowRight size={18} />
            </Link>
            <Link className="text-link" href="/login">
              Already a member? Sign in
            </Link>
          </div>
          <div className="hero-note">
            <span className="mini-line" /> Your money. Your pace. One clear
            picture.
          </div>
        </div>
        <div className="preview-wrap">
          <div className="preview-label">
            A FRESH PERSPECTIVE ON YOUR FINANCES
          </div>
          <div className="preview-card">
            <div className="preview-top">
              <span>
                <Wallet size={17} /> My overview
              </span>
              <span className="preview-badge">Illustrative example</span>
            </div>
            <p className="muted">Total balance</p>
            <div className="preview-balance">
              $12,480<span>.00</span>
            </div>
            <div className="preview-change">A little more peace of mind.</div>
            <div className="sparkline" aria-hidden="true">
              <svg viewBox="0 0 480 130">
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#5c856a" stopOpacity=".2" />
                    <stop offset="1" stopColor="#5c856a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 110 L40 95 L80 103 L120 65 L160 73 L200 48 L240 60 L280 30 L320 45 L360 20 L400 28 L440 8 L480 15 L480 130 L0 130Z"
                  fill="url(#fill)"
                />
                <path
                  d="M0 110 L40 95 L80 103 L120 65 L160 73 L200 48 L240 60 L280 30 L320 45 L360 20 L400 28 L440 8 L480 15"
                  fill="none"
                  stroke="#477858"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="preview-stats">
              <div>
                <span className="round-icon">
                  <ArrowDownLeft size={18} />
                </span>
                <div>
                  <small>Income</small>
                  <strong>$5,200.00</strong>
                </div>
              </div>
              <div>
                <span className="round-icon peach">
                  <ArrowUpRight size={18} />
                </span>
                <div>
                  <small>Expenses</small>
                  <strong>$2,340.00</strong>
                </div>
              </div>
            </div>
            <div className="preview-bottom">
              <span className="status-dot" /> Small steps. Real progress.
            </div>
          </div>
          <div className="floating-note">
            <span className="round-icon">
              <Leaf size={18} />
            </span>
            <div>
              <strong>Good habits grow.</strong>
              <small>Start with a clearer picture.</small>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="features">
        <div className="section-intro">
          <span className="eyebrow">SIMPLY, MORE CLARITY</span>
          <h2>
            Everything you need.
            <br />
            Space for what matters.
          </h2>
        </div>
        {[
          {
            icon: Layers,
            title: "Every dollar, in focus.",
            text: "Keep income and expenses together. A simple record that makes the bigger picture easier to see.",
          },
          {
            icon: ChartNoAxesCombined,
            title: "Find your patterns.",
            text: "See spending by category and compare your months. Turn everyday numbers into useful insights.",
          },
          {
            icon: Download,
            title: "Your data goes with you.",
            text: "Export your transactions to CSV whenever you need. Your records, ready for your next step.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title}>
            <span className="feature-icon">
              <Icon size={23} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>
      <footer className="site-footer">
        <span className="brand">ledger.</span>
        <span>A clearer picture. A lighter mind.</span>
        <span>Personal finance, made personal.</span>
      </footer>
    </main>
  );
}
