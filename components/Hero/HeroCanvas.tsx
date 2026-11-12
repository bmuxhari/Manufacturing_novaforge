"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/hooks/motionPreferences";
import styles from "./Hero.module.css";

/** Background canvas: a slowly moving perspective grid. */
export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0, height = 0, time = 0, isVisible = true, rafId = 0;

    // Grid line colour follows the theme (--ink-rgb changes in dark mode).
    let inkRgb = "23,20,15";
    const readThemeColour = () => {
      inkRgb = getComputedStyle(document.documentElement).getPropertyValue("--ink-rgb").trim() || inkRgb;
    };
    readThemeColour();
    const themeObserver = new MutationObserver(() => {
      readThemeColour();
      drawGrid();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawGrid = () => {
      ctx.clearRect(0, 0, width, height);
      const horizon = height * 0.58, vanishX = width * 0.5;
      const gradient = ctx.createLinearGradient(0, horizon, 0, height);
      gradient.addColorStop(0, `rgba(${inkRgb},0)`);
      gradient.addColorStop(1, `rgba(${inkRgb},0.08)`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const cols = 20;
      for (let i = -cols; i <= cols; i++) {
        ctx.moveTo(vanishX + i * 4, horizon);
        ctx.lineTo(vanishX + i * (width / cols) * 1.8, height);
      }
      const rows = 16, offset = (time * 0.0035) % 1;
      for (let j = 0; j < rows; j++) {
        const z = (j + offset) / rows;
        const y = horizon + (height - horizon) * z * z * z;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    };

    const onResize = () => {
      resize();
      drawGrid();
    };
    resize();
    window.addEventListener("resize", onResize);

    if (prefersReducedMotion()) {
      drawGrid();
      return () => {
        themeObserver.disconnect();
        window.removeEventListener("resize", onResize);
      };
    }

    // Pause drawing while the hero is off screen.
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    visibilityObserver.observe(canvas);

    const loop = () => {
      if (isVisible) {
        time++;
        drawGrid();
      }
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles["hero-canvas"]} aria-hidden="true" />;
}
