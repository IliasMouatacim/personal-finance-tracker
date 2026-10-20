import Starburst from "@/components/Starburst";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Brand from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
export default function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <main className="auth-shell">
      <aside className="auth-story">
        <Brand inverse />
        <div className="auth-story-main">
          <span className="edition-label">YOUR NEXT CHAPTER STARTS HERE.</span>
          <h1>
            A little clarity.
            <br />A whole lot
            <br />
            of <em>possibility.</em>
          </h1>
          <p>
            A home for your everyday finances.
            <br />
            More space for the life you want to live.
          </p>
          <div className="auth-art" aria-hidden="true">
            <div className="auth-orbit" />
            <span className="auth-asterisk">
              <Starburst />
            </span>
            <div className="auth-ticket">
              <Sparkles size={21} />
              <b>
                Good things
                <br />
                are adding up.
              </b>
              <ArrowUpRight size={30} />
            </div>
            <span className="auth-art-caption">SMALL STEPS. BIG PICTURE.</span>
          </div>
        </div>
        <div className="auth-story-footer">
          <span>YOUR MONEY, YOUR MOVE.</span>
          <span>01 — ∞</span>
        </div>
      </aside>
      <section className="auth-content">
        <div className="auth-theme">
          <ThemeToggle />
        </div>
        <div className="auth-card">
          <span className="edition-label">LET’S MAKE ROOM.</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
          {children}
          <div className="auth-bottom-note">
            <span>
              <Starburst />
            </span>{" "}
            A little clarity changes a lot.
          </div>
        </div>
      </section>
    </main>
  );
}
