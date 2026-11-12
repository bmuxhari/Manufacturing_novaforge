"use client";

import { useRef } from "react";
import { useFrameLoop } from "@/hooks/useFrameLoop";
import { clamp } from "@/hooks/motionPreferences";
import styles from "./Process.module.css";

const PROCESS_STEPS = [
  { tag: "01 / DFM", title: "Design for Manufacturability", text: "Our engineers review your CAD within 24 hours and suggest optimizations that cut cost and cycle time — before a single chip is cut." },
  { tag: "02 / PROTOTYPE", title: "Rapid Prototyping", text: "Functional prototypes in production-grade materials in 72 hours, so you can validate fit, form and function fast." },
  { tag: "03 / VALIDATE", title: "Tooling & Validation", text: "In-house tool room, fixture design and full PPAP / FAI documentation for regulated industries." },
  { tag: "04 / SCALE", title: "Production at Scale", text: "Lights-out automated cells and statistical process control keep quality locked in as volumes ramp." },
  { tag: "05 / DELIVER", title: "Quality & Logistics", text: "CMM-verified, serialized and kitted for your line — with VMI, Kanban and global JIT delivery." },
];

export default function Process() {
  const stepsListRef = useRef<HTMLOListElement>(null);
  const trackFillRef = useRef<HTMLSpanElement>(null);

  // The orange line fills and each step lights up as it passes 55% of the screen height.
  useFrameLoop(({ scrollChanged }) => {
    const list = stepsListRef.current, fill = trackFillRef.current;
    if (!scrollChanged || !list || !fill) return;
    const trigger = window.innerHeight * 0.55;
    const rect = list.getBoundingClientRect();
    fill.style.transform = `scaleY(${clamp((trigger - rect.top) / rect.height, 0, 1)})`;
    list.querySelectorAll(`.${styles["process-step"]}`).forEach((step) => {
      step.classList.toggle(styles["process-step-active"], step.getBoundingClientRect().top < trigger);
    });
  });

  return (
    <section className={styles.process} id="process">
      <div className={`container ${styles["process-grid"]}`}>
        <div className={styles["process-aside"]}>
          <div className="section-tag reveal">
            <span>[ 02 ]</span> Process
          </div>
          <h2 className="h2 reveal" data-delay="1">
            From CAD file to <span className="serif">production line</span> — without the friction.
          </h2>
          <p className="section-lead reveal" data-delay="2">
            A single program manager, a single quality plan and real-time visibility into every part from quote to dock.
          </p>
          <div className="reveal" data-delay="3">
            <a href="#contact" className="btn btn--ghost" data-magnetic>
              <span>Upload a drawing</span>
            </a>
          </div>
        </div>

        <ol ref={stepsListRef} className={styles["process-steps"]} id="steps">
          <li className={styles["process-track"]} aria-hidden="true">
            <span ref={trackFillRef} className={styles["process-track-fill"]} />
          </li>
          {PROCESS_STEPS.map((step) => (
            <li key={step.tag} className={styles["process-step"]}>
              <span className={styles["process-step-dot"]} />
              <span className={styles["process-step-number"]}>{step.tag}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
