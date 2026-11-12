"use client";

import { useEffect, useRef, useState } from "react";
import { markPageReady } from "@/hooks/usePageReady";
import { clamp, prefersReducedMotion } from "@/hooks/motionPreferences";
import styles from "./Preloader.module.css";

const LOAD_DURATION_MS = 1600;

export default function Preloader() {
  const [isDone, setIsDone] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const countRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      // Reduced motion: skip the animation entirely.
      setIsRemoved(true); // eslint-disable-line react-hooks/set-state-in-effect -- one-time skip on mount
      markPageReady();
      return;
    }

    const timers: number[] = [];
    let rafId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = clamp((now - startTime) / LOAD_DURATION_MS, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (countRef.current) countRef.current.textContent = String(Math.round(eased * 100));
      if (barRef.current) barRef.current.style.transform = `scaleX(${eased})`;

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      timers.push(
        window.setTimeout(() => {
          setIsDone(true);
          markPageReady();
          timers.push(window.setTimeout(() => setIsRemoved(true), 1400));
        }, 150),
      );
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      timers.forEach(clearTimeout);
    };
  }, []);

  if (isRemoved) return null;

  return (
    <div className={`${styles.preloader} ${isDone ? styles["preloader-done"] : ""}`} aria-hidden="true">
      <div className={`${styles["preloader-panel"]} ${styles["preloader-panel-top"]}`} />
      <div className={`${styles["preloader-panel"]} ${styles["preloader-panel-bottom"]}`} />
      <div className={styles["preloader-inner"]}>
        <div className={styles["preloader-brand"]}>
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M16 2 28 9v14L16 30 4 23V9z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M16 8l6 3.5v9L16 24l-6-3.5v-9z" fill="var(--accent)" />
          </svg>
          <span>NOVAFORGE</span>
        </div>
        <div className={styles["preloader-bar"]}>
          <span ref={barRef} />
        </div>
        <div className={styles["preloader-meta"]}>
          <span>Calibrating systems</span>
          <span>
            <b ref={countRef}>0</b>%
          </span>
        </div>
      </div>
    </div>
  );
}
