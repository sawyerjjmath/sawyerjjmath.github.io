"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type ArchiveKind = "paper" | "talk";
type ArchiveItem = {
  kind: ArchiveKind;
  year: string;
  status: string;
  title: string;
  venue: string;
  collaborators?: string;
  summary: string;
  tags: string[];
  links: Array<{ label: string; href: string }>;
};

const archive: ArchiveItem[] = [
  {
    kind: "paper",
    year: "June 2026",
    status: "Preprint · in peer review",
    title: "Uniqueness of the Dirichlet Problem for Graphical Self-Shrinkers",
    venue: "Preprint",
    summary:
      "A direct uniqueness result for graphical self-shrinkers, obtained by linearizing the governing quasilinear elliptic equation and applying a maximum principle.",
    tags: ["Mean Curvature Flow", "Self-Shrinkers"],
    links: [
      { label: "Paper", href: "/papers/self-shrinkers-uniqueness.pdf" },
    ],
  },
  {
    kind: "paper",
    year: "April 2026",
    status: "Published",
    title: "Approximating Graphical Minimal Surfaces Through Mean Curvature Flow",
    venue: "Parabola, Vol. 62 No. 1",
    collaborators: "with Jeffery Zhang",
    summary:
      "A computational framework for evolving graphical surfaces toward minimality, with simulations testing planarity, rotational symmetry, and complex boundary data.",
    tags: ["Minimal Surfaces", "Mean Curvature Flow"],
    links: [
      {
        label: "Journal Link",
        href: "https://www.parabola.unsw.edu.au/sites/default/files/2026-05/vol62_no1_6.pdf",
      },
    ],
  },
  {
    kind: "talk",
    year: "January 2026",
    status: "Conference lecture",
    title:
      "On Graphical Minimal Surfaces and the Homotheticity of Singular Behavior in Mean Curvature Flow",
    venue: "Presented at Joint Mathematics Meetings",
    summary:
      "From uniqueness of graphical minimal surfaces to a computational mean-curvature-flow framework—and the self-similar geometry that emerges near Type I singularities.",
    tags: ["Minimal Surfaces", "Mean Curvature Flow", "Self-Shrinkers"],
    links: [
      { label: "Paper", href: "/papers/graphical-minimal-surfaces.pdf" },
      { label: "Slides", href: "/slides/jmm-2026-graphical-minimal-surfaces.pdf" },
      {
        label: "Presentation Record",
        href: "https://meetings.ams.org/math/jmm2026/meetingapp.cgi/Paper/50726",
      },
    ],
  },
  {
    kind: "paper",
    year: "August 2025",
    status: "Published",
    title: "On Convex Kinematics: A Resurrection of Holditch’s Theorem",
    venue: "Parabola, Vol. 61 No. 2",
    collaborators: "with William Balz",
    summary:
      "An intuitive proof of Holditch’s classical area invariant, built from concrete geometry and the complementary perspectives of Green’s and Stewart’s theorems.",
    tags: ["Convex Geometry", "Kinematics"],
    links: [
      {
        label: "Journal Link",
        href: "https://www.parabola.unsw.edu.au/sites/default/files/2025-08/vol61_no2_4.pdf",
      },
    ],
  },
];

const carouselPapers: ArchiveItem[] = [
  archive[0],
  archive[1],
  {
    ...archive[2],
    summary:
      "A self-contained path from graphical minimal-surface theory to computation by mean curvature flow, followed by a study of self-similar models for Type I singularities.",
  },
  archive[3],
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M4 14 14 4M6 4h8v8" />
    </svg>
  );
}

function SurfaceLab() {
  const [time, setTime] = useState(0);
  const [isFlowing, setIsFlowing] = useState(true);

  useEffect(() => {
    if (!isFlowing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setTime((current) => (current >= 100 ? 0 : current + 0.35));
    }, 32);

    return () => window.clearInterval(timer);
  }, [isFlowing]);

  const surfaceLines = useMemo(() => {
    const damping = 1 - time / 112;
    return Array.from({ length: 12 }, (_, row) => {
      const points = Array.from({ length: 43 }, (_, column) => {
        const x = 21 + column * 8.6;
        const edge = Math.sin((column / 42) * Math.PI);
        const wave =
          damping *
          edge *
          (12 * Math.sin(column * 0.38 + row * 0.42) +
            5 * Math.cos(column * 0.18 - row * 0.55));
        const perspective = row * 8.4 + Math.pow(Math.abs(row - 5.5), 1.35) * 0.75;
        const y = 42 + perspective - wave;
        return x.toFixed(1) + "," + y.toFixed(1);
      });
      return points.join(" ");
    });
  }, [time]);

  return (
    <div className="surface-lab" aria-label="Interactive qualitative mean curvature flow model">
      <div className="lab-topline">
        <span>Geometric Flow Module</span>
        <button
          className={"live-dot lab-toggle " + (isFlowing ? "is-flowing" : "")}
          type="button"
          onClick={() => setIsFlowing((current) => !current)}
          aria-pressed={!isFlowing}
        >
          {isFlowing ? "flowing" : "paused"}
        </button>
      </div>
      <div className="surface-stage">
        <svg viewBox="0 0 405 160" role="img" aria-label="A rippled surface smoothing as time increases">
          <defs>
            <linearGradient id="surface-ink" x1="0" x2="1">
              <stop offset="0" stopColor="#d9ff5f" />
              <stop offset="0.5" stopColor="#64d8c7" />
              <stop offset="1" stopColor="#eef2e7" />
            </linearGradient>
          </defs>
          {surfaceLines.map((points, index) => (
            <polyline
              key={index}
              points={points}
              fill="none"
              stroke="url(#surface-ink)"
              strokeWidth={index === 5 || index === 6 ? 1.55 : 0.8}
              opacity={0.25 + index * 0.052}
            />
          ))}
        </svg>
        <div className="lab-equation" aria-hidden="true">
          ∂<sub>t</sub>F = Hν
        </div>
      </div>
      <div className="lab-question">
        <h2>What does a surface remember as it evolves?</h2>
      </div>
      <label className="time-control">
        <span>t = {(time / 100).toFixed(2)}</span>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={time}
          onChange={(event) => setTime(Number(event.target.value))}
          aria-label="Evolution time"
        />
        <span>toward minimality</span>
      </label>
    </div>
  );
}

function ResearchCarousel() {
  const [activePaper, setActivePaper] = useState(0);
  const [isCarouselPlaying, setIsCarouselPlaying] = useState(true);

  useEffect(() => {
    if (
      !isCarouselPlaying ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActivePaper((current) => (current + 1) % carouselPapers.length);
    }, 4600);

    return () => window.clearInterval(timer);
  }, [isCarouselPlaying]);

  const moveCarousel = (direction: number) => {
    setActivePaper(
      (current) =>
        (current + direction + carouselPapers.length) % carouselPapers.length,
    );
  };

  return (
    <div
      className="research-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Research papers"
    >
      <div className="carousel-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="carousel-stage">
        {carouselPapers.map((paper, index) => {
          let offset = (index - activePaper + carouselPapers.length) % carouselPapers.length;
          if (offset > carouselPapers.length / 2) offset -= carouselPapers.length;
          const distance = Math.abs(offset);
          const isActive = offset === 0;
          const cardStyle: CSSProperties = {
            transform:
              "translate(-50%, -50%) translateX(" +
              offset * 72 +
              "%) translateY(" +
              distance * 22 +
              "px) rotate(" +
              offset * -4 +
              "deg) scale(" +
              (1 - distance * 0.16) +
              ")",
            opacity: distance > 1 ? 0 : isActive ? 1 : 0.42,
            zIndex: 10 - distance,
            pointerEvents: isActive ? "auto" : "none",
          };

          return (
            <article
              className={
                "carousel-card " +
                (isActive ? "is-active " : "") +
                (paper.status === "Conference lecture" ? "is-conference" : "")
              }
              style={cardStyle}
              key={paper.title}
              aria-hidden={!isActive}
              aria-label={
                "Paper " + (index + 1) + " of " + carouselPapers.length
              }
            >
              <div className="carousel-card-topline">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{paper.year}</span>
                <span>{paper.status}</span>
              </div>
              <h3>{paper.title}</h3>
              <p className="carousel-venue">
                {paper.venue}
                {paper.collaborators ? " · " + paper.collaborators : ""}
              </p>
              <p className="carousel-summary">{paper.summary}</p>
              <div className="carousel-card-footer">
                <div className="tag-row">
                  {paper.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="carousel-card-links">
                  {paper.links.map((link) => (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      tabIndex={isActive ? 0 : -1}
                      key={link.label}
                    >
                      {link.label} <ArrowIcon />
                    </a>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="carousel-controls">
        <button type="button" onClick={() => moveCarousel(-1)} aria-label="Previous paper">
          ←
        </button>
        <div className="carousel-dots" aria-label="Choose a paper">
          {carouselPapers.map((paper, index) => (
            <button
              type="button"
              className={index === activePaper ? "is-active" : ""}
              key={paper.title}
              onClick={() => setActivePaper(index)}
              aria-label={"Show paper " + (index + 1)}
              aria-pressed={index === activePaper}
            />
          ))}
        </div>
        <span className="carousel-count">
          {String(activePaper + 1).padStart(2, "0")} / {String(carouselPapers.length).padStart(2, "0")}
        </span>
        <button type="button" onClick={() => moveCarousel(1)} aria-label="Next paper">
          →
        </button>
        <button
          className="carousel-play"
          type="button"
          onClick={() => setIsCarouselPlaying((current) => !current)}
          aria-pressed={!isCarouselPlaying}
        >
          {isCarouselPlaying ? "Pause rotation" : "Resume rotation"}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [filter, setFilter] = useState<"all" | ArchiveKind>("all");
  const filteredArchive = archive.filter((item) => filter === "all" || item.kind === filter);
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Sawyer Jacobson, home">
          <span>SJ</span>
          <strong>Sawyer Jacobson</strong>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#research">Featured Work</a>
          <a href="#archive">Archive</a>
          <a href="#about">About</a>
        </nav>
        <a className="contact-pill" href="mailto:sawyerjacobson@college.harvard.edu">
          Start a conversation <ArrowIcon />
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Differential geometry · partial differential equations</p>
          <h1>
            Research
            <span>Archive.</span>
          </h1>
          <p className="hero-intro">
            I study how surfaces evolve, what their boundaries determine, and how structure
            persists when smooth geometry begins to break down.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#archive">
              Explore the archive <ArrowIcon />
            </a>
            <a className="button problem-link" href="/problems">
              Open Problem &amp; Monthly Puzzle <ArrowIcon />
            </a>
          </div>
          <div className="hero-meta">
            <div>
              <span>Based at</span>
              <strong>Harvard University</strong>
            </div>
            <div>
              <span>Current focus</span>
              <strong>Geometric Flows</strong>
            </div>
          </div>
        </div>
        <SurfaceLab />
      </section>

      <section className="research-section" id="research">
        <div className="section-heading featured-heading">
          <div>
            <h2>Featured Work</h2>
          </div>
        </div>
        <ResearchCarousel />
      </section>

      <section className="archive-section" id="archive">
        <div className="section-heading archive-heading">
          <div>
            <p className="eyebrow">Research &amp; talks</p>
            <h2>The archive.</h2>
          </div>
          <div className="filter-bar" role="group" aria-label="Filter archive">
            {(["all", "paper", "talk"] as const).map((option) => (
              <button
                key={option}
                className={filter === option ? "is-active" : ""}
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
              >
                {option === "all" ? "All work" : option === "paper" ? "Papers" : "Talks"}
              </button>
            ))}
          </div>
        </div>
        <div className="archive-list">
          {filteredArchive.map((item, index) => (
            <article className="archive-item" key={item.title + "-" + item.kind}>
              <div className="archive-index">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{item.year}</span>
              </div>
              <div className="archive-main">
                <div className="archive-status">
                  <span>{item.kind}</span>
                  <span>{item.status}</span>
                </div>
                <h3>{item.title}</h3>
                <p className="archive-venue">
                  {item.venue}
                  {item.collaborators ? " · " + item.collaborators : ""}
                </p>
                <p className="archive-summary">{item.summary}</p>
                <div className="tag-row">
                  {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </div>
              <div className="archive-links">
                {item.links.map((link) => (
                  <a href={link.href} target="_blank" rel="noreferrer" key={link.label}>
                    {link.label} <ArrowIcon />
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="portrait-wrap">
          <img
            src="/assets/sawyer-jacobson.png"
            alt="Portrait of Sawyer Jacobson"
            width="400"
            height="400"
          />
          <span>Harvard · Cambridge, MA</span>
        </div>
        <div className="about-copy">
          <p className="eyebrow">About</p>
          <h2>Geometry under evolution and constraint.</h2>
          <p>
            Sawyer Jacobson is a mathematical researcher affiliated with Harvard University.
            His work sits at the intersection of differential geometry and the analysis of
            partial differential equations.
          </p>
          <p>
            His research broadly examines the behavior of surfaces and geometric objects under
            natural evolution and constraint: when geometric structure is preserved, how
            singularities arise, and how analytical and computational methods can clarify
            problems without closed-form solutions. This includes work on graphical minimal
            surfaces, mean curvature flow, self-shrinkers, elliptic uniqueness, numerical
            approximation, and the homothetic structure of Type I singularities. Alongside
            geometric analysis, he studies classical convex kinematics, developing more
            intuitive and extensible approaches to foundational results. Across these projects,
            he aims to connect rigorous theoretical frameworks with concrete geometric insight.
          </p>
          <div className="education-block">
            <div className="education-heading">
              <p className="eyebrow">Education</p>
            </div>
            <div className="education-list">
              <div className="education-item">
                <span>Aug 2026 — May 2030</span>
                <div>
                  <strong>Harvard University</strong>
                  <p>Bachelor of Arts, Mathematics</p>
                </div>
              </div>
              <div className="education-item">
                <span>Sep 2023 — Jun 2026</span>
                <div>
                  <strong>Weston High School</strong>
                  <p>Secondary education</p>
                </div>
              </div>
            </div>
          </div>
          <div className="profile-links">
            <a href="https://orcid.org/0009-0009-2775-6127" target="_blank" rel="noreferrer">
              ORCID <ArrowIcon />
            </a>
            <a
              href="https://scholar.google.com/citations?user=HCaRpkkAAAAJ&hl=en"
              target="_blank"
              rel="noreferrer"
            >
              Google Scholar <ArrowIcon />
            </a>
            <a href="https://www.linkedin.com/in/sawyerjmath/" target="_blank" rel="noreferrer">
              LinkedIn <ArrowIcon />
            </a>
            <a
              className="resume-link"
              href="/resume/sawyer-jacobson-resume.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Résumé <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <p className="eyebrow">Contact</p>
        <h2>What might we understand together?</h2>
        <p>
          I welcome conversations about geometric analysis, research collaboration, and
          questions where computation can sharpen intuition.
        </p>
        <a href="mailto:sawyerjacobson@college.harvard.edu">
          sawyerjacobson@college.harvard.edu <ArrowIcon />
        </a>
      </section>

      <footer>
        <span>© {new Date().getFullYear()} Sawyer Jacobson</span>
        <span>
          “Differential geometry remains the most prominent tool to uncover hidden dimensions of
          our universe, those beyond human perception.” — me lol
        </span>
        <a href="#top">Return to top ↑</a>
      </footer>
    </main>
  );
}
