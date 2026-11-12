"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/hooks/motionPreferences";
import { HERO_TOUCH_EVENT } from "./HeroLightning";
import styles from "./Hero.module.css";

/** Electric arcs drawn around the oval while hovered (SVG units; oval is 30 × 46 px at the centre). */
const ARC_COUNT = 5;
const ARC_RX = 23, ARC_RY = 33; // ellipse the arcs crawl along
const CRACKLE_MS = 70; // new arc shapes this often → flicker like real electricity

/** One jagged arc hugging the ellipse, starting at a random angle. */
function randomArcPath() {
  const start = Math.random() * Math.PI * 2;
  const span = (0.6 + Math.random() * 1.2) * (Math.random() < 0.5 ? 1 : -1);
  const steps = 9;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const a = start + (span * i) / steps;
    const jitter = (Math.random() - 0.5) * 7 + (Math.random() < 0.12 ? 6 : 0); // occasional outward spike
    const x = Math.cos(a) * (ARC_RX + jitter), y = Math.sin(a) * (ARC_RY + jitter);
    d += `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return d;
}

/**
 * The "Do not touch" button: glowing electric-blue capsule with a flickering bolt and pulse rings.
 * Hover = crackling electric arcs around it. Click = the hero overload sequence (HeroGears + HeroLightning).
 */
export default function HeroTouchButton() {
  const [charged, setCharged] = useState(false);
  const arcRefs = useRef<(SVGPathElement | null)[]>([]);

  // While hovered/focused: re-draw the arcs every CRACKLE_MS for a live-electricity flicker.
  useEffect(() => {
    if (!charged || prefersReducedMotion()) return;
    const arcs = arcRefs.current;
    const crackle = () =>
      arcs.forEach((arc) => {
        if (!arc) return;
        const on = Math.random() > 0.25;
        arc.setAttribute("d", on ? randomArcPath() : "");
        arc.style.opacity = on ? (0.55 + Math.random() * 0.45).toFixed(2) : "0";
      });
    crackle();
    const timer = window.setInterval(crackle, CRACKLE_MS);
    return () => {
      window.clearInterval(timer);
      arcs.forEach((arc) => arc?.setAttribute("d", ""));
    };
  }, [charged]);

  return (
    <button
      type="button"
      className={`${styles["touch-button"]} ${charged ? styles["touch-button-charged"] : ""}`}
      data-hero-cue
      onClick={() => window.dispatchEvent(new Event(HERO_TOUCH_EVENT))}
      onPointerEnter={() => setCharged(true)}
      onPointerLeave={() => setCharged(false)}
      onFocus={() => setCharged(true)}
      onBlur={() => setCharged(false)}
    >
      <span className={styles["touch-oval-area"]} aria-hidden="true">
        <span className={styles["touch-pulse-ring"]} />
        <span className={`${styles["touch-pulse-ring"]} ${styles["touch-pulse-ring-late"]}`} />
        <span className={styles["touch-oval"]}>
          <svg className={styles["touch-bolt"]} viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2z" />
          </svg>
        </span>
        <svg className={styles["touch-arcs"]} viewBox="-60 -70 120 140">
          {Array.from({ length: ARC_COUNT }, (_, i) => (
            <path key={i} ref={(el) => { arcRefs.current[i] = el; }} d="" />
          ))}
        </svg>
      </span>
      <span className={styles["touch-label"]}>Do not touch</span>
    </button>
  );
}
