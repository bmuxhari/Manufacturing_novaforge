"use client";

import { useEffect, useRef } from "react";
import styles from "./Hero.module.css";

/**
 * "Do not touch" effect, part 1: lightning drawn on a canvas over the hero.
 *  - OVERLOAD: arcs shoot from the oval to the gears, then an electric wave sweeps left → right.
 *  - IMPACT:   a bright flash when the gears slam back together (the theme switches under the flash).
 * Part 2 (gears bursting, flames, theme switch) lives in HeroGears.tsx.
 */
/** Fired by the "Do not touch" button. HeroGears decides whether to run the sequence (not while one is running). */
export const HERO_TOUCH_EVENT = "novaforge:hero-touch";
export const HERO_OVERLOAD_EVENT = "novaforge:hero-overload";
export const HERO_IMPACT_EVENT = "novaforge:hero-impact";

type Pt = { x: number; y: number };

const ARC_DURATION = 520; // ms: arcs from the oval to the gears
const WAVE_DELAY = 180;
const WAVE_DURATION = 1250; // ms: wave front crossing the hero
const FLASH_DURATION = 650;

/** Jagged lightning path between two points (midpoint displacement). */
function boltPoints(a: Pt, b: Pt, roughness: number): Pt[] {
  let points = [a, b];
  let offset = Math.hypot(b.x - a.x, b.y - a.y) * roughness;
  while (offset > 2.5) {
    const next: Pt[] = [points[0]];
    for (let i = 0; i < points.length - 1; i++) {
      const p = points[i], q = points[i + 1];
      const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
      const shift = (Math.random() - 0.5) * offset;
      next.push({ x: (p.x + q.x) / 2 + (-dy / len) * shift, y: (p.y + q.y) / 2 + (dx / len) * shift }, q);
    }
    points = next;
    offset /= 2;
  }
  return points;
}

export default function HeroLightning() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0, height = 0, rafId = 0;
    let overloadStart = -Infinity, flashStart = -Infinity;
    let arcFrom: Pt = { x: 0, y: 0 };
    let arcTargets: Pt[] = [];
    let glow = "#ff6b1a";
    const core = "#fff6e6";

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /** Screen points (relative to the hero) of the oval and the three gear centres. */
    const measure = () => {
      const box = canvas.getBoundingClientRect();
      const cue = canvas.parentElement?.querySelector("[data-hero-cue]")?.getBoundingClientRect();
      arcFrom = cue ? { x: cue.left + cue.width / 2 - box.left, y: cue.top - box.top } : { x: width / 2, y: height };
      const svg = canvas.parentElement?.querySelector<SVGSVGElement>("svg[data-gears]");
      const ctm = svg?.getScreenCTM();
      arcTargets = ctm
        ? [[250, 300], [405.6, 191], [482.7, 282.9]].map(([x, y]) => {
            const p = new DOMPoint(x, y).matrixTransform(ctm);
            return { x: p.x - box.left, y: p.y - box.top };
          })
        : [];
      const styleVars = getComputedStyle(document.documentElement);
      glow = styleVars.getPropertyValue("--accent").trim() || glow;
    };

    const strokeBolt = (points: Pt[], widthScale: number, alpha: number) => {
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.globalAlpha = alpha;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 22;
      ctx.strokeStyle = glow;
      ctx.lineWidth = 5 * widthScale;
      ctx.stroke();
      ctx.shadowBlur = 8;
      ctx.strokeStyle = core;
      ctx.lineWidth = 1.6 * widthScale;
      ctx.stroke();
    };

    /** A bolt plus 2–3 short side branches. */
    const drawBranchingBolt = (a: Pt, b: Pt, widthScale: number, alpha: number) => {
      const main = boltPoints(a, b, 0.18);
      strokeBolt(main, widthScale, alpha);
      for (let k = 0; k < 3; k++) {
        if (Math.random() < 0.35) continue;
        const from = main[Math.floor(Math.random() * main.length)];
        const angle = Math.atan2(b.y - a.y, b.x - a.x) + (Math.random() - 0.5) * 1.8;
        const len = 30 + Math.random() * 70;
        strokeBolt(boltPoints(from, { x: from.x + Math.cos(angle) * len, y: from.y + Math.sin(angle) * len }, 0.3), widthScale * 0.55, alpha * 0.8);
      }
    };

    const loop = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      const t = now - overloadStart;

      // 1) Arcs from the oval to each gear (flicker: new shape every frame)
      if (t >= 0 && t < ARC_DURATION) {
        const fade = 1 - t / ARC_DURATION;
        arcTargets.forEach((target) => drawBranchingBolt(arcFrom, target, 1, 0.55 + 0.45 * fade));
      }

      // 2) Electric wave sweeping left → right across the hero
      const w = t - WAVE_DELAY;
      if (w >= 0 && w < WAVE_DURATION) {
        const p = w / WAVE_DURATION;
        const front = -80 + (width + 160) * (1 - Math.pow(1 - p, 2));
        const alpha = p < 0.85 ? 1 : (1 - p) / 0.15;
        for (let k = 0; k < 3; k++) {
          const x = front + (Math.random() - 0.5) * 70;
          drawBranchingBolt({ x: x + (Math.random() - 0.5) * 60, y: -10 }, { x: x + (Math.random() - 0.5) * 60, y: height + 10 }, 1.1 - k * 0.25, alpha * (1 - k * 0.2));
        }
        // faint glow trail behind the front
        const trail = ctx.createLinearGradient(front - 260, 0, front, 0);
        trail.addColorStop(0, "rgba(0,0,0,0)");
        trail.addColorStop(1, glow);
        ctx.globalAlpha = 0.12 * alpha;
        ctx.shadowBlur = 0;
        ctx.fillStyle = trail;
        ctx.fillRect(front - 260, 0, 260, height);
      }

      // 3) Impact flash (theme switches underneath it)
      const f = now - flashStart;
      if (f >= 0 && f < FLASH_DURATION) {
        const fp = f / FLASH_DURATION;
        ctx.globalAlpha = fp < 0.15 ? fp / 0.15 * 0.85 : 0.85 * (1 - (fp - 0.15) / 0.85);
        ctx.shadowBlur = 0;
        const flash = ctx.createRadialGradient(arcTargets[1]?.x ?? width / 2, arcTargets[1]?.y ?? height / 2, 0, width / 2, height / 2, Math.max(width, height));
        flash.addColorStop(0, "#fff8ec");
        flash.addColorStop(0.35, glow);
        flash.addColorStop(1, "rgba(255,107,26,0)");
        ctx.fillStyle = flash;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();

      const stillRunning = t < WAVE_DELAY + WAVE_DURATION || f < FLASH_DURATION;
      rafId = stillRunning ? requestAnimationFrame(loop) : 0;
      if (!stillRunning) ctx.clearRect(0, 0, width, height);
    };

    const start = () => {
      if (!rafId) rafId = requestAnimationFrame(loop);
    };
    const onOverload = () => {
      resize();
      measure();
      overloadStart = performance.now();
      start();
    };
    const onImpact = () => {
      measure();
      flashStart = performance.now();
      start();
    };

    window.addEventListener(HERO_OVERLOAD_EVENT, onOverload);
    window.addEventListener(HERO_IMPACT_EVENT, onImpact);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener(HERO_OVERLOAD_EVENT, onOverload);
      window.removeEventListener(HERO_IMPACT_EVENT, onImpact);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles["hero-lightning"]} aria-hidden="true" />;
}
