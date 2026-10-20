import RegisterForm from "@/components/RegisterForm";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
export default function Page() {
  return (
    <main className="auth-shell">
      <aside className="auth-story">
        <Link href="/" className="brand">
          <Leaf /> ledger.
        </Link>
        <div>
          <span className="eyebrow" style={{ color: "#bed0bc" }}>
            SMALL STEPS. REAL PROGRESS.
          </span>
          <h1>
            Good things
            <br />
            grow with
            <br />a little clarity.
          </h1>
          <p>
            A home for your everyday finances. Understand your habits, track
            your progress, and look ahead with confidence.
          </p>
        </div>
        <p>Personal finance, made personal.</p>
      </aside>
      <section className="auth-content">
        <div className="auth-theme">
          <ThemeToggle />
        </div>
        <div className="auth-card">
          <h2>Your fresh start.</h2>
          <p>Create your account and make room for your goals.</p>
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
