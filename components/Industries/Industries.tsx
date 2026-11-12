"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { hasFinePointer } from "@/hooks/motionPreferences";
import styles from "./Industries.module.css";

type Industry = { title: string; hue: number; text: string; badges: string[]; icon: ReactNode };

const INDUSTRIES: Industry[] = [
  {
    title: "Aerospace & Defense", hue: 22,
    text: "Flight-critical structural brackets, actuator housings and engine components in titanium and nickel superalloys.",
    badges: ["AS9100D", "ITAR registered", "NADCAP"],
    icon: <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />,
  },
  {
    title: "Automotive & EV", hue: 200,
    text: "Battery enclosures, e-motor housings, busbars and high-volume powertrain components at automotive PPM levels.",
    badges: ["IATF 16949", "PPAP Level 3", "<10 PPM"],
    icon: (<><path d="M5 17h14v-5l-2-5H7l-2 5z" /><circle cx="7.5" cy="17" r="1.5" /><circle cx="16.5" cy="17" r="1.5" /><path d="M5 12h14" /></>),
  },
  {
    title: "Medical Devices", hue: 340,
    text: "Surgical instruments, orthopedic implants and diagnostic housings produced in validated cleanroom environments.",
    badges: ["ISO 13485", "FDA registered", "Class 7"],
    icon: <path d="M3 12h4l2-5 4 10 2-5h6" />,
  },
  {
    title: "Energy", hue: 48,
    text: "Turbine components, grid-scale storage hardware and hydrogen-ready valves built for decades of service.",
    badges: ["API Q1", "ASME", "PED"],
    icon: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  },
  {
    title: "Robotics & Automation", hue: 160,
    text: "Harmonic drive components, end-effectors and lightweight arm structures with micron-level repeatability.",
    badges: ["Low-volume", "High-mix", "Rapid iteration"],
    icon: (<><path d="M4 21h8M8 21v-4l5-6 4-4 3 1M17 7l1-3" /><circle cx="13" cy="11" r="1.5" /><circle cx="8" cy="17" r="1.5" /></>),
  },
];

/** Accordion of industry panels: click (or hover with a mouse) to expand one. */
/** How long the mouse must rest on a panel before it opens (stops panels fighting when the mouse passes over). */
const HOVER_INTENT_MS = 120;

export default function Industries() {
  const [activeIndex, setActiveIndex] = useState(0);
  const hoverTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const openOnHover = (index: number) => {
    if (!hasFinePointer()) return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setActiveIndex(index), HOVER_INTENT_MS);
  };
  const cancelHover = () => window.clearTimeout(hoverTimer.current);

  return (
    <section className={styles.industries} id="industries">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="section-tag reveal">
              <span>[ 03 ]</span> Industries
            </div>
            <h2 className="h2 reveal" data-delay="1">
              Trusted where <span className="serif">failure</span> isn&apos;t an option.
            </h2>
          </div>
        </div>

        <div className={`${styles["industry-panels"]} reveal`} data-delay="1">
          {INDUSTRIES.map((industry, i) => {
            const isActive = i === activeIndex;
            return (
              <article
                key={industry.title}
                className={`${styles["industry-panel"]} ${isActive ? styles["industry-panel-active"] : ""}`}
                style={{ "--hue": industry.hue } as CSSProperties}
                data-industry-panel
                data-active={isActive}
                onClick={() => {
                  cancelHover();
                  setActiveIndex(i);
                }}
                onMouseEnter={() => openOnHover(i)}
                onMouseLeave={cancelHover}
              >
                <div className={styles["industry-panel-background-icon"]}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth=".6">
                    {industry.icon}
                  </svg>
                </div>
                <span className={styles["industry-panel-number"]}>{String(i + 1).padStart(2, "0")}</span>
                {/* Collapsed: vertical label. Open: the content block below. They cross-fade (no snapping). */}
                <span className={styles["industry-panel-vertical-label"]} aria-hidden="true">{industry.title}</span>
                <div className={styles["industry-panel-content"]}>
                  <h3 className={styles["industry-panel-title"]}>{industry.title}</h3>
                  <div className={styles["industry-panel-body"]}>
                    <p>{industry.text}</p>
                    <ul>
                      {industry.badges.map((badge) => (
                        <li key={badge}>{badge}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
