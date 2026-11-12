"use client";

import { useEffect, useRef } from "react";
import { useFrameLoop } from "@/hooks/useFrameLoop";
import { usePageReady } from "@/hooks/usePageReady";
import { hasFinePointer, lerp, prefersReducedMotion } from "@/hooks/motionPreferences";
import { toggleTheme } from "@/hooks/themeToggle";
import { LensRing, XrayBackground, XrayDefs, XrayGear } from "./HeroXrayLayer";
import { HERO_IMPACT_EVENT, HERO_OVERLOAD_EVENT, HERO_TOUCH_EVENT } from "./HeroLightning";
import styles from "./Hero.module.css";

/* ---------- Gear geometry (pure maths, same result on server and browser) ---------- */

const MODULE_SIZE = 10;

type GearSpec = {
  cx: number; cy: number; teeth: number;
  fill: string; stroke: string; line: string; holes: number;
  /** id of the SVG shadow filter */
  shadow: "gearShadowSoft" | "gearShadowFocus";
};

/** Tooth outline: root → tip → tip → root, repeated for every tooth. */
function gearOutline(teeth: number, m: number) {
  const r = (m * teeth) / 2, ro = r + m, ri = r - 1.25 * m, step = (Math.PI * 2) / teeth;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const points: [number, number][] = [[ri, a], [ro, a + step * 0.15], [ro, a + step * 0.45], [ri, a + step * 0.6]];
    points.forEach(([radius, angle], k) => {
      d += `${i === 0 && k === 0 ? "M" : "L"}${(radius * Math.cos(angle)).toFixed(2)} ${(radius * Math.sin(angle)).toFixed(2)} `;
    });
  }
  return d + "Z";
}

function gearShape(spec: GearSpec) {
  const m = MODULE_SIZE;
  const r = (m * spec.teeth) / 2, ri = r - 1.25 * m;
  const ringR = ri - m * 1.2, hubR = Math.max(r * 0.28, 14);
  const holeR = ((ringR - hubR) / 2) * 0.62, holeD = (ringR + hubR) / 2;
  const centerR = Math.max(r * 0.1, 6);
  const holes = Array.from({ length: spec.holes }, (_, k) => {
    const a = (k / spec.holes) * Math.PI * 2;
    return { cx: (holeD * Math.cos(a)).toFixed(2), cy: (holeD * Math.sin(a)).toFixed(2), r: holeR.toFixed(2) };
  });
  return {
    ...spec,
    path: gearOutline(spec.teeth, m),
    ringR, hubR, holes, centerR,
    stepDeg: 360 / spec.teeth,
    toothOffsetDeg: (360 / spec.teeth) * 0.3,
  };
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
const ANGLE_A_TO_B = -35;
const ANGLE_B_TO_C = 50;
const DIST_A_TO_B = (MODULE_SIZE * (24 + 14)) / 2;
const DIST_B_TO_C = (MODULE_SIZE * (14 + 10)) / 2;

// Big gear = warm taupe, small gear C = soft brown-grey, middle gear B = orange.
const GEAR_A = gearShape({ cx: 250, cy: 300, teeth: 24, fill: "url(#gA)", stroke: "var(--gear-big-stroke)", line: "var(--gear-big-line)", holes: 6, shadow: "gearShadowSoft" });
const GEAR_B = gearShape({
  cx: 250 + DIST_A_TO_B * Math.cos(toRad(ANGLE_A_TO_B)), cy: 300 + DIST_A_TO_B * Math.sin(toRad(ANGLE_A_TO_B)),
  teeth: 14, fill: "url(#gB)", stroke: "var(--gear-orange-stroke)", line: "rgba(0,0,0,0.3)", holes: 5, shadow: "gearShadowFocus",
});
const GEAR_C = gearShape({
  cx: GEAR_B.cx + DIST_B_TO_C * Math.cos(toRad(ANGLE_B_TO_C)), cy: GEAR_B.cy + DIST_B_TO_C * Math.sin(toRad(ANGLE_B_TO_C)),
  teeth: 10, fill: "url(#gC)", stroke: "var(--gear-small-stroke)", line: "rgba(255,255,255,0.14)", holes: 4, shadow: "gearShadowSoft",
});
const GEARS = [GEAR_A, GEAR_B, GEAR_C];
/** Paint order: big gear, small gear, then the orange gear on top. */
const GEAR_DRAW_ORDER = [0, 2, 1];

// Phase offsets so the teeth interlock with the gaps.
const PHASE_B = ANGLE_A_TO_B + 180 - GEAR_B.toothOffsetDeg - GEAR_B.stepDeg * (0.5 - (ANGLE_A_TO_B - GEAR_A.toothOffsetDeg) / GEAR_A.stepDeg);
const PHASE_C = ANGLE_B_TO_C + 180 - GEAR_C.toothOffsetDeg - GEAR_C.stepDeg * (0.5 - (ANGLE_B_TO_C - PHASE_B - GEAR_B.toothOffsetDeg) / GEAR_B.stepDeg);

function gearAngles(angleA: number) {
  const angleB = -angleA * (GEAR_A.teeth / GEAR_B.teeth) + PHASE_B;
  const angleC = -(angleB - PHASE_B) * (GEAR_B.teeth / GEAR_C.teeth) + PHASE_C;
  return [angleA, angleB, angleC];
}
const START_ANGLES = gearAngles(0);

const BASE_GEAR_SPEED = 0.14;

/* ---------- Sparks where the big gear and the orange gear hit ---------- */

/** Contact point = on the line between the two centres, at the big gear's pitch radius. */
const PITCH_RADIUS_A = (MODULE_SIZE * GEAR_A.teeth) / 2;
const SPARK_ORIGIN = {
  x: GEAR_A.cx + PITCH_RADIUS_A * Math.cos(toRad(ANGLE_A_TO_B)),
  y: GEAR_A.cy + PITCH_RADIUS_A * Math.sin(toRad(ANGLE_A_TO_B)),
};
/** The big gear turns clockwise, so its teeth leave the contact moving this way (down-right). */
const SPARK_DIRECTION = Math.atan2(Math.cos(toRad(ANGLE_A_TO_B)), -Math.sin(toRad(ANGLE_A_TO_B)));
const SPARK_POOL_SIZE = 140;
const SPARK_GRAVITY = 0.12;
/** Sparks start once the gears have finished drawing in. */
const SPARK_START_DELAY_MS = 2600;

type Spark = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; active: boolean };

/* ---------- "Do not touch": gears burst, hit the hero edges, slam back, flames, theme switch ---------- */

/** Where the orange gear and the small gear touch. */
const PITCH_RADIUS_B = (MODULE_SIZE * GEAR_B.teeth) / 2;
const CONTACT_B_C = {
  x: GEAR_B.cx + PITCH_RADIUS_B * Math.cos(toRad(ANGLE_B_TO_C)),
  y: GEAR_B.cy + PITCH_RADIUS_B * Math.sin(toRad(ANGLE_B_TO_C)),
};
const FLAME_POINTS = [SPARK_ORIGIN, CONTACT_B_C];
const FLAME_TONGUES = Array.from({ length: 8 }, (_, i) => i * 45);
/** Outer radius of each gear (tooth tips), used to stop it at the hero edges. */
const GEAR_OUTER_R = GEARS.map((g) => (MODULE_SIZE * g.teeth) / 2 + MODULE_SIZE);

/** Timeline in ms after the click. */
const BURST_START = 250; // gears fly apart while the lightning wave runs
const HIT_1 = BURST_START + 420; // first edge
const HIT_2 = HIT_1 + 380; // second edge
const IMPACT = HIT_2 + 700; // back home, teeth slam together
const FLAME_DURATION = 750;
/** Theme switches under the brightest moment of the impact flash. */
const THEME_SWITCH_DELAY = 100;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeInCubic = (t: number) => t * t * t;

type Offset = { x: number; y: number };
/** Position offset of one gear at time t (ms) along home → hit 1 → hit 2 → home. */
function flightOffset(t: number, hit1: Offset, hit2: Offset): Offset {
  if (t <= BURST_START || t >= IMPACT) return { x: 0, y: 0 };
  const mix = (a: Offset, b: Offset, k: number) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
  if (t < HIT_1) return mix({ x: 0, y: 0 }, hit1, easeOutCubic((t - BURST_START) / (HIT_1 - BURST_START)));
  if (t < HIT_2) return mix(hit1, hit2, easeInOutSine((t - HIT_1) / (HIT_2 - HIT_1)));
  return mix(hit2, { x: 0, y: 0 }, easeInCubic((t - HIT_2) / (IMPACT - HIT_2)));
}

type BurstState = { active: boolean; start: number; hits: { hit1: Offset; hit2: Offset }[]; impactAt: number };
/** Ends the flight and records the impact time (kept outside the component: plain animation state). */
function markImpact(state: BurstState, now: number) {
  state.active = false;
  state.impactAt = now;
}
/* ---------- X-ray lens (mouse only): a round window that shows the inside of the gears ---------- */

/** Lens radius on screen, in CSS pixels. */
const LENS_RADIUS_PX = 110;
/** Labels for each gear's inside view (gear-local coordinates, they don't rotate). */
const XRAY_LABELS = [
  [
    { title: "MAIN DRIVE GEAR", detail: "24T · m10 · 42CrMo4", from: { x: -70, y: -70 }, to: { x: -150, y: -150 } },
    { title: "BEARING 6208-2RS", detail: "8 BALLS · SEALED", from: { x: -22, y: 22 }, to: { x: -150, y: 110 } },
  ],
  [
    { title: "PINION · 14T", detail: "CASE-HARDENED 58 HRC", from: { x: 24, y: -40 }, to: { x: 90, y: -112 } },
  ],
  [
    { title: "IDLER · 10T", detail: "BRONZE BUSHING", from: { x: 20, y: 26 }, to: { x: 62, y: 92 } },
  ],
];

/** The three meshing gears. They spin faster while scrolling. */
export default function HeroGears() {
  const rotateRefs = useRef<(SVGGElement | null)[]>([]);
  const bodyRefs = useRef<(SVGPathElement | null)[]>([]);
  const motion = useRef({ angle: 0, speed: BASE_GEAR_SPEED, enabled: false });
  const sparkLineRefs = useRef<(SVGLineElement | null)[]>([]);
  const sparkFlashRef = useRef<SVGCircleElement>(null);
  const sparkState = useRef({
    sparks: Array.from({ length: SPARK_POOL_SIZE }, (): Spark => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, active: false })),
    toothProgress: 0, // counts up; every whole number = one tooth hit
    startAt: Infinity, // performance.now() time when sparks may start
    flash: 0,
  });

  // X-ray lens
  const svgRef = useRef<SVGSVGElement>(null);
  const lensClipRef = useRef<SVGCircleElement>(null);
  const lensRingRef = useRef<SVGGElement>(null);
  const xrayLayerRef = useRef<SVGGElement>(null);
  const xrayRotateRefs = useRef<(SVGGElement | null)[]>([]);
  const lens = useRef({
    enabled: false,
    clientX: 0, clientY: 0,
    pointerTarget: null as Element | null,
    x: 0, y: 0, r: 0, // current lens centre + radius in SVG units
    isShowing: false,
  });

  // Track the mouse for the lens (mouse devices only, not with "reduce motion").
  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const l = lens.current;
    l.enabled = true;
    const onMove = (e: PointerEvent) => {
      l.clientX = e.clientX;
      l.clientY = e.clientY;
      l.pointerTarget = e.target as Element | null;
    };
    const onLeave = () => (l.pointerTarget = null);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      l.enabled = false;
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.body.classList.remove("hero-lens-active");
    };
  }, []);

  /** Moves / grows / shrinks the lens every frame. */
  const updateLens = () => {
    const l = lens.current, svg = svgRef.current;
    if (!l.enabled || !svg) return;
    const section = svg.closest("section");
    const ctm = svg.getScreenCTM();
    if (!section || !ctm) return;

    // Lens shows over the hero picture area, but not over the heading/text/buttons or the navbar.
    const target = l.pointerTarget;
    const rect = section.getBoundingClientRect();
    const insideHero = l.clientX >= rect.left && l.clientX <= rect.right && l.clientY >= rect.top && l.clientY <= rect.bottom;
    const overText = !!target?.closest("h1, p, a, button, header, #mobileMenu"); // only real text/buttons, not empty space
    // No lens in the bottom-left area: from the buttons row down, left of where the gears start
    // (covers both hero buttons and the "Do not touch" oval).
    const buttonsTop = section.querySelector("[data-hero-buttons]")?.getBoundingClientRect().top ?? Infinity;
    const gearsLeft = section.querySelector("[data-hero-visual]")?.getBoundingClientRect().left ?? Infinity;
    const inQuietZone = l.clientY >= buttonsTop - 24 && l.clientX < gearsLeft;
    const wantLens = !!target && insideHero && !overText && !inQuietZone && !burst.current.active && !!target.closest("section#top");

    const p = new DOMPoint(l.clientX, l.clientY).matrixTransform(ctm.inverse());
    const targetR = wantLens ? LENS_RADIUS_PX / ctm.a : 0;
    if (l.r < 0.5 && wantLens) { l.x = p.x; l.y = p.y; } // appear right under the mouse
    l.x = lerp(l.x, p.x, 0.22);
    l.y = lerp(l.y, p.y, 0.22);
    l.r = insideHero ? lerp(l.r, targetR, 0.18) : 0; // close instantly once the mouse leaves the hero
    if (l.r < 0.3) l.r = targetR === 0 ? 0 : l.r;

    const showing = l.r > 0.5;
    if (xrayLayerRef.current) xrayLayerRef.current.style.display = showing ? "" : "none";
    if (lensClipRef.current && showing) {
      lensClipRef.current.setAttribute("cx", l.x.toFixed(2));
      lensClipRef.current.setAttribute("cy", l.y.toFixed(2));
      lensClipRef.current.setAttribute("r", l.r.toFixed(2));
    }
    if (lensRingRef.current) {
      lensRingRef.current.setAttribute("transform", `translate(${l.x.toFixed(2)} ${l.y.toFixed(2)}) scale(${(l.r / 100).toFixed(4)})`);
      lensRingRef.current.style.opacity = targetR > 0 ? Math.min(1, l.r / targetR).toFixed(2) : (l.r > 0.5 ? "0.5" : "0");
    }
    // Hide the normal cursor while the lens is the cursor
    if (showing !== l.isShowing) {
      l.isShowing = showing;
      document.body.classList.toggle("hero-lens-active", showing);
      section.classList.toggle(styles["hero-lens-active"], showing);
    }
  };

  /**
   * Throws a burst of sparks. Normal tooth hits: a fan towards SPARK_DIRECTION.
   * Impact: `allDirections` + `extra` sparks + faster.
   */
  const emitSparkBurst = (gearSpeed: number, origin = SPARK_ORIGIN, allDirections = false, extra = 0) => {
    const s = sparkState.current;
    const speedBoost = Math.min(gearSpeed, 2);
    const count = 10 + Math.round(speedBoost * 5) + Math.floor(Math.random() * 5) + extra;
    let launched = 0;
    for (const spark of s.sparks) {
      if (launched >= count) break;
      if (spark.active) continue;
      const angle = allDirections ? Math.random() * Math.PI * 2 : SPARK_DIRECTION + (Math.random() - 0.5) * 1.2;
      const velocity = (2 + Math.random() * 3.6) * (1 + speedBoost * 0.35) * (allDirections ? 1.5 : 1);
      spark.x = origin.x + (Math.random() - 0.5) * 4;
      spark.y = origin.y + (Math.random() - 0.5) * 4;
      spark.vx = Math.cos(angle) * velocity;
      spark.vy = Math.sin(angle) * velocity - 0.6;
      spark.life = 0;
      spark.maxLife = 20 + Math.random() * 26;
      spark.active = true;
      launched++;
    }
    s.flash = 1;
  };

  /** Moves every live spark one frame: gravity, fade, white-hot → orange. */
  const updateSparks = () => {
    const s = sparkState.current;
    const isDark = document.documentElement.dataset.theme === "dark";
    s.sparks.forEach((spark, i) => {
      const line = sparkLineRefs.current[i];
      if (!line || !spark.active) return;
      spark.vy += SPARK_GRAVITY;
      spark.vx *= 0.985;
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.life++;
      if (spark.life >= spark.maxLife) {
        spark.active = false;
        line.style.opacity = "0";
        return;
      }
      const t = spark.life / spark.maxLife; // 0 → 1 over the spark's life
      const hue = 48 - 28 * t;
      const lightness = isDark ? 90 - 35 * t : 58 - 16 * t;
      line.setAttribute("x1", spark.x.toFixed(2));
      line.setAttribute("y1", spark.y.toFixed(2));
      line.setAttribute("x2", (spark.x - spark.vx * 3.4).toFixed(2));
      line.setAttribute("y2", (spark.y - spark.vy * 3.4).toFixed(2));
      line.style.stroke = `hsl(${hue.toFixed(0)}, 100%, ${lightness.toFixed(0)}%)`;
      line.style.strokeWidth = (2.4 * (1 - t * 0.55)).toFixed(2);
      line.style.opacity = (1 - t).toFixed(2);
    });
    if (sparkFlashRef.current) {
      s.flash *= 0.8;
      sparkFlashRef.current.style.opacity = s.flash < 0.02 ? "0" : s.flash.toFixed(2);
    }
  };

  /* ----- "Do not touch" sequence ----- */
  const flightRefs = useRef<(SVGGElement | null)[]>([]);
  const flameRefs = useRef<(SVGGElement | null)[]>([]);
  const burst = useRef<BurstState>({ active: false, start: 0, hits: [], impactAt: -Infinity });

  // The oval was touched: start the sequence (ignored while one is already running).
  useEffect(() => {
    const onTouch = () => {
      const b = burst.current, svg = svgRef.current;
      if (b.active) return;
      if (!motion.current.enabled || !svg) {
        toggleTheme(); // "reduce motion": just switch the theme, no animation
        return;
      }
      const section = svg.closest("section"), ctm = svg.getScreenCTM();
      if (!section || !ctm) return;
      // Hero edges in SVG units (top edge kept below the floating navbar)
      const rect = section.getBoundingClientRect();
      const inv = ctm.inverse();
      const topLeft = new DOMPoint(rect.left, rect.top + 110).matrixTransform(inv);
      const bottomRight = new DOMPoint(rect.right, rect.bottom).matrixTransform(inv);
      const margin = 10 / ctm.a;
      const left = (i: number) => topLeft.x + GEAR_OUTER_R[i] + margin - GEARS[i].cx;
      const right = (i: number) => bottomRight.x - GEAR_OUTER_R[i] - margin - GEARS[i].cx;
      const top = (i: number) => topLeft.y + GEAR_OUTER_R[i] + margin - GEARS[i].cy;
      const bottom = (i: number) => bottomRight.y - GEAR_OUTER_R[i] - margin - GEARS[i].cy;
      // Big gear: left then bottom · orange gear: top then right · small gear: right then bottom
      b.hits = [
        { hit1: { x: left(0), y: 30 }, hit2: { x: -40, y: bottom(0) } },
        { hit1: { x: -30, y: top(1) }, hit2: { x: right(1), y: 20 } },
        { hit1: { x: right(2), y: 40 }, hit2: { x: 10, y: bottom(2) } },
      ];
      b.active = true;
      b.start = performance.now();
      window.dispatchEvent(new Event(HERO_OVERLOAD_EVENT));
    };
    window.addEventListener(HERO_TOUCH_EVENT, onTouch);
    return () => window.removeEventListener(HERO_TOUCH_EVENT, onTouch);
  }, []);

  /** Moves the gears along their flight paths; on arrival: flames, sparks, flash, theme switch. */
  const updateBurst = (now: number) => {
    const b = burst.current;
    if (b.active) {
      const t = now - b.start;
      GEARS.forEach((gear, i) => {
        const o = flightOffset(t, b.hits[i].hit1, b.hits[i].hit2);
        flightRefs.current[i]?.setAttribute("transform", `translate(${(gear.cx + o.x).toFixed(2)} ${(gear.cy + o.y).toFixed(2)})`);
      });
      if (t >= IMPACT) {
        markImpact(burst.current, now);
        FLAME_POINTS.forEach((point) => emitSparkBurst(2, point, true, 34));
        window.dispatchEvent(new Event(HERO_IMPACT_EVENT));
        window.setTimeout(toggleTheme, THEME_SWITCH_DELAY);
      }
    }
    // Flames + shockwave at the contact points right after the impact
    const f = (now - b.impactAt) / FLAME_DURATION;
    flameRefs.current.forEach((flame) => {
      if (!flame) return;
      if (f < 0 || f >= 1) {
        flame.style.opacity = "0";
        return;
      }
      const grow = f < 0.25 ? f / 0.25 : 1 - (f - 0.25) / 0.75;
      const flicker = 0.85 + Math.random() * 0.3;
      flame.style.opacity = "1";
      flame.querySelector<SVGGElement>("[data-flame-tongues]")?.setAttribute("transform", `scale(${(grow * flicker * 1.4).toFixed(3)})`);
      const ring = flame.querySelector<SVGCircleElement>("[data-flame-ring]");
      ring?.setAttribute("r", (12 + f * 150).toFixed(1));
      ring?.style.setProperty("opacity", (1 - f).toFixed(2));
    });
  };

  // Prepare the "draw-on" outline animation.
  useEffect(() => {
    const reduceMotion = prefersReducedMotion();
    motion.current.enabled = !reduceMotion;
    bodyRefs.current.forEach((body) => {
      if (!body) return;
      const length = body.getTotalLength();
      body.style.strokeDasharray = String(length);
      body.style.strokeDashoffset = reduceMotion ? "0" : String(length);
      body.style.fillOpacity = reduceMotion ? "1" : "0";
    });
  }, []);

  // When the preloader finishes, draw the outlines then fill the gears.
  usePageReady(() => {
    bodyRefs.current.forEach((body, i) => {
      if (!body) return;
      body.style.transition = `stroke-dashoffset 2.6s cubic-bezier(.16,1,.3,1) ${0.3 + i * 0.2}s, fill-opacity 1.4s ease ${1.2 + i * 0.2}s`;
      body.style.strokeDashoffset = "0";
      body.style.fillOpacity = "1";
    });
    sparkState.current.startAt = performance.now() + SPARK_START_DELAY_MS;
  });

  useFrameLoop(({ scrollDelta }) => {
    const m = motion.current;
    if (!m.enabled) return;
    // Spin hard while the gears are flying apart ("Do not touch"), otherwise follow the scroll speed
    const targetSpeed = burst.current.active ? 7 : BASE_GEAR_SPEED + Math.min(Math.abs(scrollDelta) * 0.06, 3.2);
    m.speed = lerp(m.speed, targetSpeed, 0.06);
    m.angle += m.speed;
    gearAngles(m.angle).forEach((angle, i) => {
      const rotate = `rotate(${angle.toFixed(3)})`;
      rotateRefs.current[i]?.setAttribute("transform", rotate);
      xrayRotateRefs.current[i]?.setAttribute("transform", rotate); // X-ray insides turn with the gears
    });
    updateLens();

    // A spark burst every time one tooth of the big gear passes the contact point.
    const s = sparkState.current;
    if (performance.now() >= s.startAt && !burst.current.active) { // no tooth sparks while the gears are apart
      s.toothProgress += m.speed / GEAR_A.stepDeg;
      while (s.toothProgress >= 1) {
        s.toothProgress -= 1;
        emitSparkBurst(m.speed);
      }
    }
    updateBurst(performance.now());
    updateSparks();
  });

  return (
    <>
      <svg ref={svgRef} className={styles["gears-svg"]} viewBox="90 86 480 390" preserveAspectRatio="xMaxYMid meet" role="img" data-gears>
        <defs>
          <XrayDefs />
          {/* The lens: only the part of the X-ray layer inside this circle is shown */}
          <clipPath id="xrayLensClip">
            <circle ref={lensClipRef} cx="0" cy="0" r="0" />
          </clipPath>
          <radialGradient id="gA" cx="50%" cy="40%" r="70%">
            {/* 3 stops = soft metallic shading (light centre → mid tone → dark rim) */}
            <stop offset="0" style={{ stopColor: "var(--gear-big-from)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--gear-big-mid)" }} />
            <stop offset="1" style={{ stopColor: "var(--gear-big-to)" }} />
          </radialGradient>
          <radialGradient id="gB" cx="50%" cy="40%" r="70%">
            <stop offset="0" stopColor="#ff8a3d" />
            <stop offset="1" stopColor="#c24600" />
          </radialGradient>
          <radialGradient id="gC" cx="50%" cy="40%" r="70%">
            <stop offset="0" style={{ stopColor: "var(--gear-small-from)" }} />
            <stop offset="1" style={{ stopColor: "var(--gear-small-to)" }} />
          </radialGradient>
          {/* Very soft shadows for depth. The orange gear gets a warm glow so it stays the focal point. */}
          <filter id="gearShadowSoft" x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" style={{ floodColor: "rgb(var(--shadow-rgb))", floodOpacity: "var(--gear-shadow-opacity)" }} />
          </filter>
          <filter id="gearShadowFocus" x="-40%" y="-40%" width="180%" height="190%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#c24600" floodOpacity="0.32" />
          </filter>
          {/* Soft glow around the sparks */}
          <filter id="sparkGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="flameGradient" cx="50%" cy="85%" r="75%">
            <stop offset="0" stopColor="#fff6d6" />
            <stop offset="0.35" stopColor="#ffb15c" />
            <stop offset="0.7" stopColor="#ff6b1a" stopOpacity="0.85" />
            <stop offset="1" stopColor="#c24600" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sparkFlashGradient">
            <stop offset="0" stopColor="#fff4cc" />
            <stop offset="0.4" stopColor="#ffb15c" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ff6b1a" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Crosshair lines end at the dashed ring so nothing pokes past the screen edge on phones. */}
        <g className={styles["gears-decoration"]}>
          <circle cx="250" cy="300" r="165" />
          <circle cx="250" cy="300" r="190" className={styles["gears-decoration-dashed-ring"]} />
          <line x1="250" y1="110" x2="250" y2="490" />
          <line x1="60" y1="300" x2="440" y2="300" />
        </g>
        <g>
          {/* Drawn big → small → orange, so the orange gear sits on top. */}
          {GEAR_DRAW_ORDER.map((i) => GEARS[i]).map((gear, orderIndex) => {
            const i = GEAR_DRAW_ORDER[orderIndex];
            return (
            <g key={i} ref={(el) => { flightRefs.current[i] = el; }} transform={`translate(${gear.cx} ${gear.cy})`} filter={`url(#${gear.shadow})`}>
              <g ref={(el) => { rotateRefs.current[i] = el; }} transform={`rotate(${START_ANGLES[i].toFixed(3)})`}>
                <path
                  ref={(el) => { bodyRefs.current[i] = el; }}
                  d={gear.path}
                  className={styles["gear-body"]}
                  fill={gear.fill}
                  style={{ stroke: gear.stroke }}
                />
                <circle r={gear.ringR} className={styles["gear-line"]} style={{ stroke: gear.line }} />
                <circle r={gear.hubR} className={styles["gear-line"]} style={{ stroke: gear.line }} />
                {gear.holes.map((hole, k) => (
                  <circle key={k} cx={hole.cx} cy={hole.cy} r={hole.r} className={styles["gear-hole"]} style={{ stroke: gear.line }} />
                ))}
                <circle r={gear.centerR} className={styles["gear-hole"]} style={{ stroke: gear.stroke }} />
                <rect x={-2} y={-gear.centerR - 4} width={4} height={6} style={{ fill: gear.stroke }} />
              </g>
            </g>
            );
          })}
        </g>
        {/* X-ray layer: hidden insides of the gears + blueprint details, seen only through the lens */}
        <g ref={xrayLayerRef} clipPath="url(#xrayLensClip)" style={{ display: "none" }} aria-hidden="true">
          <XrayBackground contactPoint={SPARK_ORIGIN} />
          {GEAR_DRAW_ORDER.map((i) => (
            <XrayGear
              key={i}
              gear={GEARS[i]}
              startAngle={START_ANGLES[i]}
              rotateRef={(el) => { xrayRotateRefs.current[i] = el; }}
              labels={XRAY_LABELS[i]}
            />
          ))}
        </g>
        {/* Fire flames + shockwave at the two contact points when the gears slam back together */}
        <g filter="url(#sparkGlow)" className={styles["gear-sparks"]}>
          {FLAME_POINTS.map((point, i) => (
            <g key={i} ref={(el) => { flameRefs.current[i] = el; }} transform={`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`} style={{ opacity: 0 }}>
              <circle data-flame-ring r="12" className={styles["flame-shockwave"]} />
              <g data-flame-tongues transform="scale(0)">
                <circle r="16" fill="url(#flameGradient)" />
                {FLAME_TONGUES.map((angle) => (
                  <path key={angle} d="M0,0 C7,-10 7,-28 0,-46 C-7,-28 -7,-10 0,0 Z" transform={`rotate(${angle})`} fill="url(#flameGradient)" />
                ))}
              </g>
            </g>
          ))}
        </g>
        <LensRing ringRef={lensRingRef} />
        {/* Sparks: drawn on top of all gears, at the contact point of the big and orange gears */}
        <g filter="url(#sparkGlow)" className={styles["gear-sparks"]}>
          <circle ref={sparkFlashRef} cx={SPARK_ORIGIN.x} cy={SPARK_ORIGIN.y} r="14" fill="url(#sparkFlashGradient)" style={{ opacity: 0 }} />
          {Array.from({ length: SPARK_POOL_SIZE }, (_, i) => (
            <line key={i} ref={(el) => { sparkLineRefs.current[i] = el; }} strokeLinecap="round" style={{ opacity: 0 }} />
          ))}
        </g>
      </svg>
    </>
  );
}
