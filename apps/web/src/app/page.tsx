import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/briefing", label: "Briefing" },
  { href: "/dashboard/journal", label: "Journal", phase: 2 },
  { href: "/dashboard/risk", label: "Risk" },
  { href: "/dashboard/coach", label: "Coach" },
  { href: "/dashboard/hermes", label: "Hermes Ops" },
];

export default function HomePage() {
  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">AI Trading Operating System & Hermes Protocol</p>
        <h1>Disciplined trading intelligence</h1>
        <p className="lede">
          Journal, risk, briefing, coaching, and operator-grade liquidity
          infrastructure — one production platform.
        </p>
        <Link className="button" href="/dashboard">
          Open dashboard
        </Link>
      </header>
      <section className="grid">
        {navItems.map((item) => (
          <article key={item.href} className="card">
            <h2>{item.label}</h2>
            {item.phase ? (
              <p className="muted">Phase {item.phase} MVP</p>
            ) : (
              <p className="muted">Available now</p>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
