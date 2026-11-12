"use client";

import { useRef, type CSSProperties } from "react";
import { useFrameLoop } from "@/hooks/useFrameLoop";
import { clamp, prefersReducedMotion } from "@/hooks/motionPreferences";
import HeroCanvas from "./HeroCanvas";
import HeroGears from "./HeroGears";
import HeroLightning from "./HeroLightning";
import HeroTouchButton from "./HeroTouchButton";
import styles from "./Hero.module.css";

/** Sets the CSS variable used to stagger the entrance animation. */
const entranceDelay = (step: number) => ({ "--entrance-step": step }) as CSSProperties;
const wordDelay = (index: number) => ({ "--word-index": index }) as CSSProperties;

export default function Hero() {
  const contentRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useRef<boolean | null>(null);

  // Parallax: text drifts down and fades, gears drift and shrink slightly while scrolling out.
  useFrameLoop(({ scrollY, scrollChanged }) => {
    if (!scrollChanged) return;
    reduceMotion.current ??= prefersReducedMotion();
    const viewportHeight = window.innerHeight;
    if (reduceMotion.current || scrollY >= viewportHeight * 1.2) return;
    const content = contentRef.current, visual = visualRef.current;
    if (content) {
      content.style.transform = `translate3d(0, ${scrollY * 0.22}px, 0)`;
      content.style.opacity = String(clamp(1 - scrollY / (viewportHeight * 0.85), 0, 1));
    }
    if (visual) {
      visual.style.transform = `translate3d(0, ${scrollY * 0.1}px, 0) scale(${1 - (scrollY / viewportHeight) * 0.08})`;
    }
  });

  return (
    <section className={styles.hero} id="top">
      <HeroCanvas />
      <div className={styles["hero-glow"]} aria-hidden="true" />

      <div className={`container ${styles["hero-grid"]}`}>
        <div ref={contentRef} className={styles["hero-content"]} data-hero-content>
          <h1 className={styles["hero-title"]}>
            {/* Three fixed lines, like the reference: Precision / engineered. / Built at scale. */}
            <span className={styles["hero-title-line"]}>
              <span className={styles["hero-title-word"]} style={wordDelay(0)}>Precision</span>
            </span>
            <span className={styles["hero-title-line"]}>
              <span className={styles["hero-title-word"]} style={wordDelay(1)}>Engineered.</span>
            </span>
            <span className={styles["hero-title-line"]}>
              <span className={styles["hero-title-word"]} style={wordDelay(2)}>Built</span>{" "}
              <span className={styles["hero-title-word"]} style={wordDelay(3)}>at</span>{" "}
              <span className={`${styles["hero-title-word"]} accent`} style={wordDelay(4)}>scale.</span>
            </span>
          </h1>
          <p className={`${styles["hero-subtitle"]} ${styles["hero-entrance"]}`} style={entranceDelay(6)}>
            From first prototype to millions of production parts, Novaforge machines, molds and assembles
            mission-critical components for the world&apos;s most demanding OEMs.
          </p>
          <div className={`${styles["hero-buttons"]} ${styles["hero-entrance"]}`} style={entranceDelay(7)} data-hero-buttons>
            <a href="#contact" className="btn btn--primary">
              <span>Start your project</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a href="#capabilities" className="btn btn--ghost">
              <span>Explore capabilities</span>
            </a>
          </div>
        </div>

        <div ref={visualRef} className={styles["hero-visual"]} aria-hidden="true" data-hero-visual>
          <div className={`${styles["hero-visual-inner"]} ${styles["hero-entrance"]}`} style={entranceDelay(3)}>
            <HeroGears />
          </div>
        </div>
      </div>

      {/* "Do not touch" button: glowing electric oval; click starts the lightning + gear burst + theme switch */}
      <HeroTouchButton />
      <HeroLightning />
    </section>
  );
}
