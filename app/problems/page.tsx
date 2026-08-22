import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Problems & Monthly Puzzles — Sawyer Jacobson",
  description:
    "An open research question on higher-dimensional Holditch theory and The Twenty-Seventh Settlement, a monthly puzzle by Sawyer Jacobson.",
  openGraph: {
    title: "Open Problems & Monthly Puzzles — Sawyer Jacobson",
    description:
      "A research question on higher-dimensional Holditch theory and The Twenty-Seventh Settlement.",
  },
  twitter: {
    title: "Open Problems & Monthly Puzzles — Sawyer Jacobson",
    description:
      "A research question on higher-dimensional Holditch theory and The Twenty-Seventh Settlement.",
  },
};

export default function ProblemsPage() {
  return (
    <main className="problems-page">
      <header className="site-header problems-header">
        <a className="wordmark" href="/" aria-label="Sawyer Jacobson, research archive">
          <span>SJ</span>
          <strong>Sawyer Jacobson</strong>
        </a>
        <span className="problems-header-title">Problems &amp; Puzzles</span>
        <a className="contact-pill" href="/">
          Research archive <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="problems-hero">
        <div className="problems-intro">
          <p className="eyebrow problems-quote">
            “The struggle is not an obstacle to mathematics; it is where mathematics begins.”
          </p>
          <h1>
            Open Problems
            <span>&amp; Monthly Puzzles.</span>
          </h1>
          <p>
            Submit all solutions to{" "}
            <a href="mailto:sawyerjacobson@college.harvard.edu">
              sawyerjacobson@college.harvard.edu
            </a>{" "}
            :)
          </p>
        </div>
        <div className="problems-mark" aria-hidden="true">
          <span>?</span>
        </div>
      </section>

      <section className="problems-grid" aria-label="Open research question and monthly puzzle">
        <article className="problems-card">
          <div className="problems-card-topline">
            <span>01</span>
            <span>Open Problem</span>
          </div>
          <h2>
            Does a general, shape-independent analogue of Holditch’s theorem exist for smooth
            convex bodies in arbitrary Euclidean dimension?
          </h2>
          <div className="forthcoming-status">
            <span aria-hidden="true" /> Under investigation
          </div>
        </article>

        <article className="problems-card puzzle-card">
          <div className="problems-card-topline">
            <span>02</span>
            <span>Monthly Puzzle</span>
          </div>
          <h2>The Twenty-Seventh Settlement</h2>
          <p>Neither moves first; weigh each indecision.</p>
          <div className="puzzle-card-actions">
            <div className="forthcoming-status">
              <span aria-hidden="true" /> Puzzle 01 · August 2026
            </div>
            <a
              className="puzzle-download"
              href="/puzzles/the-twenty-seventh-settlement.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Open puzzle <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
      </section>

      <footer>
        <span>© {new Date().getFullYear()} Sawyer Jacobson</span>
        <span>
          “Differential geometry remains the most prominent tool to uncover hidden dimensions of
          our universe, those beyond human perception.” — me lol
        </span>
        <a href="/">Return to archive ↑</a>
      </footer>
    </main>
  );
}
