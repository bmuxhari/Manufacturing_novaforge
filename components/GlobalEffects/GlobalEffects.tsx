"use client";

import { useEffect, useRef } from "react";
import { useFrameLoop } from "@/hooks/useFrameLoop";
import { usePageReady } from "@/hooks/usePageReady";
import { clamp, hasFinePointer, lerp, prefersReducedMotion } from "@/hooks/motionPreferences";
import styles from "./GlobalEffects.module.css";

/** Length of the quality ring circle (r = 54). */
const RING_CIRCUMFERENCE = 2 * Math.PI * 54;

/** Counts a number up from 0, e.g. "0" → "99.98". */
function animateCount(element: HTMLElement) {
  const target = parseFloat(element.dataset.count ?? "0");
  const decimals = parseInt(element.dataset.decimals ?? "0", 10);
  const format = (value: number) =>
    value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  if (prefersReducedMotion()) {
    element.textContent = format(target);
    return;
  }
  const duration = 2200;
  const startTime = performance.now();
  const step = (now: number) => {
    const progress = clamp((now - startTime) / duration, 0, 1);
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    element.textContent = format(target * eased);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/**
 * Page-wide effects that are not owned by one section:
 * - custom cursor, film grain, scroll progress bar
 * - "reveal" fade-ups, number counters and quality rings (start after the preloader)
 * - magnetic buttons (any element with data-magnetic)
 */
export default function GlobalEffects() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0, ringX: 0, ringY: 0, enabled: false, overHero: true });

  // Scroll progress bar + cursor ring that trails behind the dot.
  useFrameLoop(({ scrollY, scrollChanged }) => {
    if (scrollChanged && progressRef.current) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      progressRef.current.style.transform = `scaleX(${scrollable > 0 ? scrollY / scrollable : 0})`;
    }
    const p = pointer.current;
    if (p.enabled && cursorRingRef.current) {
      p.ringX = lerp(p.ringX, p.x, 0.16);
      p.ringY = lerp(p.ringY, p.y, 0.16);
      cursorRingRef.current.style.transform = `translate3d(${p.ringX}px, ${p.ringY}px, 0)`;
    }
    // The dot + circle cursor only shows over the hero; every other section uses the normal cursor.
    if (p.enabled && cursorRef.current) {
      const hero = document.getElementById("top")?.getBoundingClientRect();
      const overHero = !!hero && p.x >= hero.left && p.x <= hero.right && p.y >= hero.top && p.y <= hero.bottom;
      if (overHero !== p.overHero) {
        p.overHero = overHero;
        cursorRef.current.classList.toggle(styles["cursor-outside-hero"], !overHero);
        if (overHero) { p.ringX = p.x; p.ringY = p.y; } // ring appears under the mouse, not flying in
      }
    }
  });

  // Custom cursor + magnetic buttons (mouse devices only).
  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const cursor = cursorRef.current;
    const dot = cursorDotRef.current;
    if (!cursor || !dot) return;

    const p = pointer.current;
    p.x = p.ringX = window.innerWidth / 2;
    p.y = p.ringY = window.innerHeight / 2;
    p.enabled = true;

    const onMove = (e: PointerEvent) => {
      p.x = e.clientX;
      p.y = e.clientY;
      dot.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    };
    const onDown = () => cursor.classList.add(styles["cursor-pressed"]);
    const onUp = () => cursor.classList.remove(styles["cursor-pressed"]);
    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const isInteractive = !!target?.closest(
        'a, button, label, [data-tilt], [data-industry-panel]:not([data-active="true"])',
      );
      cursor.classList.toggle(styles["cursor-hovering"], isInteractive);
    };
    const onLeave = () => (cursor.style.opacity = "0");
    const onEnter = () => (cursor.style.opacity = "1");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);

    const magneticCleanups = Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]")).map((button) => {
      const onButtonMove = (e: PointerEvent) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.22}px, ${y * 0.35}px)`;
      };
      const onButtonLeave = () => (button.style.transform = "");
      button.addEventListener("pointermove", onButtonMove);
      button.addEventListener("pointerleave", onButtonLeave);
      return () => {
        button.removeEventListener("pointermove", onButtonMove);
        button.removeEventListener("pointerleave", onButtonLeave);
      };
    });

    return () => {
      p.enabled = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
      magneticCleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  // Reveals, counters and rings start only after the preloader is gone.
  const observers = useRef<IntersectionObserver[]>([]);
  usePageReady(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          const delay = parseInt(element.dataset.delay ?? "0", 10) * 110;
          element.style.transitionDelay = `${delay}ms`;
          element.classList.add("is-in");
          // Clear the delay so later hover/tilt transitions are immediate.
          window.setTimeout(() => (element.style.transitionDelay = ""), delay + 1200);

          const ringValue = element.dataset.ringValue;
          const ringCircle = element.querySelector<SVGCircleElement>("[data-ring-progress]");
          if (ringValue && ringCircle) {
            window.setTimeout(() => {
              ringCircle.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - parseFloat(ringValue) / 100));
            }, delay);
          }
          revealObserver.unobserve(element);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target as HTMLElement);
          counterObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.6 },
    );
    document.querySelectorAll("[data-count]").forEach((element) => counterObserver.observe(element));

    observers.current = [revealObserver, counterObserver];
  });
  useEffect(() => () => observers.current.forEach((observer) => observer.disconnect()), []);

  return (
    <>
      <div ref={cursorRef} className={styles.cursor} aria-hidden="true">
        <div ref={cursorDotRef} className={styles["cursor-dot"]} />
        <div ref={cursorRingRef} className={styles["cursor-ring"]} />
      </div>
      <div className={styles["film-grain"]} aria-hidden="true" />
      <div ref={progressRef} className={styles["scroll-progress-bar"]} aria-hidden="true" />
    </>
  );
}
