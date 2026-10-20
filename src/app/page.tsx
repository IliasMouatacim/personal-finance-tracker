import Starburst from "@/components/Starburst";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  MoveUpRight,
  Layers3,
  ChartNoAxesCombined,
  Download,
  Check,
  Sparkles,
} from "lucide-react";
import Brand from "@/components/Brand";
import FlowPreview from "@/components/FlowPreview";
import { ThemeToggle } from "@/components/ThemeToggle";
export default function Home() {
  return (
    <main className="marketing">
      <nav className="marketing-nav">
        <Brand />
        <div className="marketing-nav-links">
          <a href="#why-ledger">The good stuff</a>
          <Link href="/login">Sign in</Link>
          <ThemeToggle />
          <Link className="button primary" href="/register">
            Get started <ArrowUpRight size={17} />
          </Link>
        </div>
      </nav>
      <section className="intro-grid">
        <div className="intro-copy">
          <span className="edition-label">
            <i /> LESS MONEY STRESS. MORE MAIN CHARACTER ENERGY.
          </span>
          <h1>
            Make room for
            <br />a richer{" "}
            <span className="life-word">
              life.
              <svg viewBox="0 0 200 20" aria-hidden="true">
                <path
                  d="M4 13Q95-6 194 9M16 19Q96 5 180 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p>
            Your money has a story.
            <br />
            Let’s make it a good one.
          </p>
          <p className="intro-description">
            Connect the dots between what comes in, what goes out, and what you
            really want from life. A fresh perspective on your everyday
            finances.
          </p>
          <div className="intro-actions">
            <Link href="/register" className="button primary large-button">
              Meet your new money mindset <ArrowUpRight size={20} />
            </Link>
            <span>
              <Check size={13} /> No spreadsheets. No overthinking.
            </span>
          </div>
          <a className="explore-link" href="#why-ledger">
            <span>
              <ArrowDown size={16} />
            </span>{" "}
            A little scroll. A fresh perspective.
          </a>
        </div>
        <FlowPreview />
      </section>
      <div className="manifesto-strip">
        <span>MORE CLARITY</span>
        <span aria-hidden="true">
          <Starburst />
        </span>
        <span>LESS GUESSWORK</span>
        <span aria-hidden="true">
          <Starburst />
        </span>
        <span>YOUR MONEY, YOUR MOVE</span>
        <span aria-hidden="true">
          <Starburst />
        </span>
        <span>MORE CLARITY</span>
        <span aria-hidden="true">
          <Starburst />
        </span>
      </div>
      <section id="why-ledger" className="good-stuff">
        <div className="section-heading">
          <div>
            <span className="edition-label">01 / THE GOOD STUFF</span>
            <h2>
              Big picture.
              <br />
              <span>Little details handled.</span>
            </h2>
          </div>
          <p>
            Good with money isn’t a personality type.
            <br />
            It starts with a little clarity.
          </p>
        </div>
        <div className="bento-grid">
          <article className="bento bento-blue">
            <div className="bento-top">
              <span className="bento-icon">
                <Layers3 size={22} />
              </span>
              <span>01</span>
            </div>
            <h3>
              All your ins.
              <br />
              All your outs.
              <br />
              <em>One happy place.</em>
            </h3>
            <p>
              Your income and expenses, finally on the same page. Add an entry
              and let the bigger picture come together.
            </p>
            <div className="mini-transactions">
              <div>
                <span className="mini-transaction-icon">↙</span>
                <b>That payday feeling</b>
                <span>+$2,600</span>
              </div>
              <div>
                <span className="mini-transaction-icon peach">↗</span>
                <b>Life’s little essentials</b>
                <span>−$86.40</span>
              </div>
            </div>
          </article>
          <article className="bento bento-lime">
            <div className="bento-top">
              <span className="bento-icon">
                <ChartNoAxesCombined size={22} />
              </span>
              <span>02</span>
            </div>
            <div
              className="category-art"
              aria-label="Illustrative category breakdown"
            >
              <div className="category-ring">
                <span>
                  SEE THE
                  <br />
                  <b>whole thing.</b>
                </span>
              </div>
              <span className="category-pill pill-one">The essentials</span>
              <span className="category-pill pill-two">The fun stuff</span>
            </div>
            <h3>
              Find your patterns.
              <br />
              Change your trajectory.
            </h3>
            <p>
              Turn everyday numbers into a little self-knowledge. See your
              spending by category and your cash flow over time.
            </p>
          </article>
          <article className="bento bento-export">
            <div>
              <div className="bento-top">
                <span className="bento-icon">
                  <Download size={22} />
                </span>
                <span>03</span>
              </div>
              <h3>
                Your data.
                <br />
                Your next move.
              </h3>
              <p>
                Take your full transaction history with you. One click, one CSV,
                ready for whatever’s next.
              </p>
            </div>
            <div className="export-art" aria-hidden="true">
              <div className="export-sheet">
                <span>ledger / your money, organised.</span>
                <div />
                <div />
                <div />
                <div />
                <b>.csv</b>
              </div>
              <span className="export-download">
                <Download size={24} />
              </span>
            </div>
          </article>
        </div>
      </section>
      <section className="how-section" id="how-it-works">
        <div>
          <span className="edition-label">02 / FIND YOUR RHYTHM</span>
          <h2>
            A fresh start.
            <br />
            Not a full-time job.
          </h2>
          <Link href="/register" className="text-action">
            Make your first move <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="steps">
          {[
            {
              title: "Make it your space.",
              text: "Create an account. A clean slate for your financial story.",
            },
            {
              title: "Get the everyday down.",
              text: "Log income and expenses as you go. Even the coffee counts.",
            },
            {
              title: "See it. Understand it. Own it.",
              text: "Spot your patterns, check your balance, and plan your next move.",
            },
          ].map((step, i) => (
            <article key={step.title}>
              <span>0{i + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
              <ArrowRight size={17} aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>
      <section className="closing-card">
        <span className="closing-spark" aria-hidden="true">
          <Starburst />
        </span>
        <div>
          <span className="edition-label">LESS CHAOS. MORE POSSIBILITY.</span>
          <h2>
            Your future self
            <br />
            says <em>thanks.</em>
          </h2>
          <Link className="button lime-button large-button" href="/register">
            Let’s make some room <ArrowUpRight size={20} />
          </Link>
        </div>
        <div className="closing-note">
          <Sparkles size={23} />
          <p>
            For the big plans.
            <br />
            And the little joys
            <br />
            along the way.
          </p>
          <span>THAT’S THE LEDGER WAY.</span>
        </div>
      </section>
      <footer className="new-footer">
        <div>
          <Brand />
          <p>A little clarity changes a lot.</p>
        </div>
        <div>
          <Link href="/login">
            Sign in <MoveUpRight size={13} />
          </Link>
          <Link href="/register">
            Make a fresh start <ArrowRight size={13} />
          </Link>
          <a href="#why-ledger">Back to the good stuff ↑</a>
        </div>
        <span>
          MADE FOR YOUR EVERYDAY.
          <br />
          AND EVERYTHING AFTER.
        </span>
      </footer>
    </main>
  );
}
