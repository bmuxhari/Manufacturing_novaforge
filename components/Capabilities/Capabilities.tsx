"use client";

import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/hooks/motionPreferences";
import styles from "./Capabilities.module.css";

type Capability = { title: string; text: string; tags: string[]; icon: ReactNode };

const CAPABILITIES: Capability[] = [
  {
    title: "CNC Machining",
    text: "5-axis milling, Swiss turning and EDM on 300+ machines, holding tolerances to ±0.002 mm.",
    tags: ["Titanium", "Inconel", "Aluminum", "PEEK"],
    icon: (<><path d="M9 3h6v4H9zM10 7h4v5l-2 3-2-3z" /><path d="M12 15v2M4 21h16M6 21v-3h12v3" /></>),
  },
  {
    title: "Sheet Metal Fabrication",
    text: "Fiber-laser cutting, robotic press-brake forming and certified MIG/TIG/robotic welding.",
    tags: ["Laser", "Forming", "Welding"],
    icon: (<><path d="M3 8h13l5 5v3H8l-5-5z" /><path d="M16 8v5h5M3 11v5l5 5v-5" /></>),
  },
  {
    title: "Injection Molding",
    text: "50–1,200 ton presses with multi-shot, overmolding and cleanroom medical molding.",
    tags: ["Multi-shot", "LSR", "Class 7"],
    icon: (<><rect x="3" y="6" width="8" height="12" rx="1" /><rect x="13" y="6" width="8" height="12" rx="1" /><path d="M11 12h2M7 10v4M17 10v4" /></>),
  },
  {
    title: "Additive Manufacturing",
    text: "Metal DMLS, SLS and MJF for functional prototypes and end-use parts in as little as 72 hours.",
    tags: ["DMLS", "SLS", "MJF"],
    icon: (<><path d="M12 3 3 8l9 5 9-5z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>),
  },
  {
    title: "Precision Assembly",
    text: "Electromechanical box builds, cable harnesses and full functional test with serialized traceability.",
    tags: ["Box build", "Harness", "EOL test"],
    icon: (<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></>),
  },
  {
    title: "Surface Finishing",
    text: "Type II/III anodizing, powder coat, passivation, PVD and laser marking, all in-house.",
    tags: ["Anodize", "PVD", "Powder"],
    icon: (<><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6 6 2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></>),
  },
];

/** Glow follows the mouse; on mouse devices the card also tilts in 3D. */
function onCardPointerMove(e: ReactPointerEvent<HTMLElement>) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  card.style.setProperty("--mx", `${x * 100}%`);
  card.style.setProperty("--my", `${y * 100}%`);
  if (hasFinePointer() && !prefersReducedMotion()) {
    card.classList.add(styles["capability-card-tilting"]);
    card.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    card.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
  }
}

function onCardPointerLeave(e: ReactPointerEvent<HTMLElement>) {
  const card = e.currentTarget;
  card.classList.remove(styles["capability-card-tilting"]);
  card.style.setProperty("--rx", "0deg");
  card.style.setProperty("--ry", "0deg");
}

export default function Capabilities() {
  return (
    <section className={styles.capabilities} id="capabilities">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="section-tag reveal">
              <span>[ 01 ]</span> Capabilities
            </div>
            <h2 className="h2 reveal" data-delay="1">
              One partner. <span className="serif">Every process</span> your product needs.
            </h2>
          </div>
        </div>

        <div className={styles["capability-cards"]}>
          {CAPABILITIES.map((capability, i) => (
            <article
              key={capability.title}
              className={`${styles["capability-card"]} reveal`}
              data-delay={i % 3}
              data-tilt
              onPointerMove={onCardPointerMove}
              onPointerLeave={onCardPointerLeave}
            >
              <div className={styles["capability-card-glow"]} />
              <div className={styles["capability-card-top"]}>
                <div className={styles["capability-card-icon"]}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {capability.icon}
                  </svg>
                </div>
                <span className={styles["capability-card-number"]}>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3>{capability.title}</h3>
              <p>{capability.text}</p>
              <ul className={styles["capability-card-tags"]}>
                {capability.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
