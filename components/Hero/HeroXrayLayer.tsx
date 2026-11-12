/**
 * The hidden "X-ray" layer of the hero. It is only seen through the round lens that follows the mouse
 * (clipped in HeroGears.tsx). Everything is drawn in the same SVG coordinates as the gears, so the
 * insides line up exactly with the real gears and rotate with them.
 */
import type { Ref } from "react";
import styles from "./Hero.module.css";

type Point = { x: number; y: number };

/** The parts of a gear shape this layer needs (comes from gearShape() in HeroGears.tsx). */
export type XrayGearShape = {
  cx: number; cy: number; teeth: number; path: string;
  ringR: number; hubR: number; centerR: number;
  holes: { cx: string; cy: string; r: string }[];
};

type GearLabel = { title: string; detail: string; from: Point; to: Point };

const fmt = (n: number) => n.toFixed(2);

/** Ring shape (outer circle minus inner circle) used for the hatched cross-section. */
const annulus = (outer: number, inner: number) =>
  `M${fmt(outer)},0 A${fmt(outer)},${fmt(outer)} 0 1,0 ${fmt(-outer)},0 A${fmt(outer)},${fmt(outer)} 0 1,0 ${fmt(outer)},0 Z ` +
  `M${fmt(inner)},0 A${fmt(inner)},${fmt(inner)} 0 1,0 ${fmt(-inner)},0 A${fmt(inner)},${fmt(inner)} 0 1,0 ${fmt(inner)},0 Z`;

/** Grid + hatch patterns used inside the lens. Render inside <defs>. */
export function XrayDefs() {
  return (
    <>
      <pattern id="xrayGridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M20,0 L0,0 L0,20" className={styles["xray-grid-line"]} />
      </pattern>
      <pattern id="xrayHatchPattern" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" className={styles["xray-hatch-line"]} />
      </pattern>
    </>
  );
}

/** A small label with a leader line: title + one line of detail. */
function Label({ title, detail, from, to }: GearLabel) {
  const textOnLeft = to.x < from.x;
  const anchor = textOnLeft ? "end" : "start";
  const textX = to.x + (textOnLeft ? -6 : 6);
  return (
    <g>
      <circle cx={from.x} cy={from.y} r="2.4" className={styles["xray-label-dot"]} />
      <path d={`M${fmt(from.x)},${fmt(from.y)} L${fmt(to.x)},${fmt(to.y)}`} className={styles["xray-line"]} />
      <text x={textX} y={to.y - 3} textAnchor={anchor} className={styles["xray-label"]}>{title}</text>
      <text x={textX} y={to.y + 10} textAnchor={anchor} className={styles["xray-label-detail"]}>{detail}</text>
    </g>
  );
}

/** The inside of one gear: hatched web, bearing with balls, shaft and keyway, pitch circle. */
export function XrayGear({
  gear, startAngle, rotateRef, labels,
}: { gear: XrayGearShape; startAngle: number; rotateRef: Ref<SVGGElement>; labels: GearLabel[] }) {
  const pitchR = (10 * gear.teeth) / 2;
  const bearingOuter = gear.hubR * 0.95, bearingInner = gear.hubR * 0.5, ballOrbit = gear.hubR * 0.73;
  const balls = Array.from({ length: 8 }, (_, k) => (k / 8) * Math.PI * 2);
  return (
    <g transform={`translate(${fmt(gear.cx)} ${fmt(gear.cy)})`}>
      {/* Rotating internals (turn with the real gear) */}
      <g ref={rotateRef} transform={`rotate(${startAngle.toFixed(3)})`}>
        <path d={gear.path} className={styles["xray-outline-dashed"]} />
        <circle r={pitchR} className={styles["xray-pitch-circle"]} />
        <path d={annulus(gear.ringR, gear.hubR)} fillRule="evenodd" className={styles["xray-hatched"]} />
        {gear.holes.map((hole, k) => (
          <circle key={k} cx={hole.cx} cy={hole.cy} r={hole.r} className={styles["xray-cutout"]} />
        ))}
        <circle r={bearingOuter} className={styles["xray-line"]} />
        <circle r={bearingInner} className={styles["xray-line"]} />
        {balls.map((a, k) => (
          <circle key={k} cx={fmt(Math.cos(a) * ballOrbit)} cy={fmt(Math.sin(a) * ballOrbit)} r={fmt(gear.hubR * 0.13)} className={styles["xray-ball"]} />
        ))}
        <circle r={gear.centerR} className={styles["xray-shaft"]} />
        <rect x={-2} y={-gear.centerR - 4} width={4} height={6} className={styles["xray-shaft"]} />
        <line x1={0} y1={-gear.hubR} x2={0} y2={-gear.ringR} className={styles["xray-line-faint"]} />
      </g>
      {/* Fixed labels (stay upright) */}
      {labels.map((label) => (
        <Label key={label.title} {...label} />
      ))}
    </g>
  );
}

const SPEC_ROWS = [
  ["MODULE", "m = 10"],
  ["PRESSURE ANGLE", "20°"],
  ["MATERIAL", "42CrMo4"],
  ["HARDNESS", "58 HRC"],
  ["TOLERANCE", "±0.002 mm"],
];
const GAUGE_TICKS = Array.from({ length: 13 }, (_, i) => (-225 + i * 22.5) * (Math.PI / 180));
const BOLT_HOLES = Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2);

/** Panel colour, fine grid and the hidden drawings scattered around the gears. */
export function XrayBackground({ contactPoint }: { contactPoint: Point }) {
  return (
    <g>
      {/* Lens interior: solid panel + fine grid (covers the normal hero inside the lens) */}
      <rect x="-1600" y="-900" width="3600" height="2600" className={styles["xray-panel"]} />
      <rect x="-1600" y="-900" width="3600" height="2600" fill="url(#xrayGridPattern)" />

      {/* Section title */}
      <text x="96" y="122" className={styles["xray-label"]}>SECTION A–A · SCALE 2:1</text>

      {/* Spec sheet (left of the gears) */}
      <g transform="translate(-340 40)">
        <rect width="236" height="158" className={styles["xray-line"]} />
        <text x="10" y="18" className={styles["xray-label"]}>SPEC SHEET · NF-G24</text>
        {SPEC_ROWS.map(([key, value], i) => (
          <g key={key} transform={`translate(0 ${28 + i * 26})`}>
            <line x1="0" y1="0" x2="236" y2="0" className={styles["xray-line-faint"]} />
            <text x="10" y="17" className={styles["xray-label-detail"]}>{key}</text>
            <text x="226" y="17" textAnchor="end" className={styles["xray-label"]}>{value}</text>
          </g>
        ))}
      </g>

      {/* Torque curve */}
      <g transform="translate(-340 270)">
        <path d="M0,0 L0,130 L236,130" className={styles["xray-line"]} />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={i * 59} y1="130" x2={i * 59} y2="135" className={styles["xray-line"]} />
        ))}
        <path d="M0,118 C40,40 90,18 140,26 C180,32 210,58 236,84" className={styles["xray-curve"]} />
        <text x="6" y="-8" className={styles["xray-label"]}>TORQUE / RPM</text>
        <text x="236" y="150" textAnchor="end" className={styles["xray-label-detail"]}>PEAK 240 N·m @ 3,200</text>
      </g>

      {/* Bolt circle */}
      <g transform="translate(-170 560)">
        <circle r="62" className={styles["xray-line"]} />
        <circle r="42" className={styles["xray-pitch-circle"]} />
        <circle r="20" className={styles["xray-shaft"]} />
        {BOLT_HOLES.map((a, i) => (
          <circle key={i} cx={fmt(Math.cos(a) * 42)} cy={fmt(Math.sin(a) * 42)} r="6" className={styles["xray-cutout"]} />
        ))}
        <path d="M-74,0 L74,0 M0,-74 L0,74" className={styles["xray-line-faint"]} />
        <text x="0" y="92" textAnchor="middle" className={styles["xray-label"]}>BOLT PCD Ø84</text>
      </g>

      {/* Diameter dimension under the big gear */}
      <g>
        <path d="M120,462 L380,462 M120,452 L120,472 M380,452 L380,472 M120,462 L130,457 M120,462 L130,467 M380,462 L370,457 M380,462 L370,467" className={styles["xray-line"]} />
        <text x="250" y="482" textAnchor="middle" className={styles["xray-label"]}>Ø 260.00 ±0.002</text>
      </g>

      {/* Datum marker */}
      <g transform="translate(600 118)">
        <path d="M0,14 L10,0 L20,14 Z" className={styles["xray-shaft"]} />
        <rect x="0" y="18" width="20" height="18" className={styles["xray-line"]} />
        <text x="10" y="31" textAnchor="middle" className={styles["xray-label"]}>A</text>
      </g>

      {/* RPM gauge */}
      <g transform="translate(640 440)">
        <circle r="48" className={styles["xray-line"]} />
        {GAUGE_TICKS.map((a, i) => (
          <line key={i} x1={fmt(Math.cos(a) * 40)} y1={fmt(Math.sin(a) * 40)} x2={fmt(Math.cos(a) * 46)} y2={fmt(Math.sin(a) * 46)} className={styles["xray-line"]} />
        ))}
        <line x1="0" y1="0" x2="26" y2="-24" className={styles["xray-curve"]} />
        <circle r="3" className={styles["xray-shaft"]} />
        <text x="0" y="68" textAnchor="middle" className={styles["xray-label"]}>RPM ×1000</text>
      </g>

      {/* CNC cell floor plan (bottom-left, between text and gears) */}
      <g transform="translate(-40 470)">
        <text x="0" y="-8" className={styles["xray-label"]}>CNC CELL 07 · LAYOUT</text>
        {[0, 1, 2].map((c) => [0, 1].map((r) => (
          <g key={`${c}-${r}`} transform={`translate(${c * 46} ${r * 40})`}>
            <rect width="40" height="34" className={styles["xray-line"]} />
            <circle cx="20" cy="17" r="8" className={styles["xray-line-faint"]} />
            <text x="3" y="10" className={styles["xray-label-detail"]}>{`M${c + 1 + r * 3}`}</text>
          </g>
        )))}
        <path d="M-6,84 L144,84" className={styles["xray-pitch-circle"]} />
        <text x="0" y="98" className={styles["xray-label-detail"]}>ROBOT RAIL · 6 AXIS</text>
      </g>

      {/* Measurement readout (top-left of the gears) */}
      <g transform="translate(20 170)">
        <circle r="16" className={styles["xray-line"]} />
        <path d="M-24,0 L24,0 M0,-24 L0,24" className={styles["xray-line-faint"]} />
        <text x="28" y="-4" className={styles["xray-label"]}>CMM PROBE</text>
        <text x="28" y="9" className={styles["xray-label-detail"]}>MEASURED 259.998</text>
      </g>

      {/* Geometric tolerance frame (right side) */}
      <g transform="translate(560 300)">
        <rect width="120" height="22" className={styles["xray-line"]} />
        <path d="M30,0 L30,22 M84,0 L84,22 M102,0 L102,22" className={styles["xray-line"]} />
        <circle cx="15" cy="11" r="6" className={styles["xray-line"]} />
        <text x="57" y="15" textAnchor="middle" className={styles["xray-label"]}>Ø0.01</text>
        <text x="93" y="15" textAnchor="middle" className={styles["xray-label"]}>A</text>
        <text x="111" y="15" textAnchor="middle" className={styles["xray-label"]}>B</text>
        <text x="0" y="40" className={styles["xray-label-detail"]}>POSITION · DATUM A|B</text>
      </g>

      {/* Parts list (below the gears) */}
      <g transform="translate(230 520)">
        <rect width="170" height="84" className={styles["xray-line"]} />
        {["ITEM   PART            QTY", "01     DRIVE GEAR 24T   1", "02     PINION 14T       1", "03     IDLER 10T        1", "04     BEARING 6208     2"].map((row, i) => (
          <text key={i} x="8" y={16 + i * 15} className={i === 0 ? styles["xray-label"] : styles["xray-label-detail"]} style={{ whiteSpace: "pre" }}>{row}</text>
        ))}
      </g>

      {/* Hex nut (far left) */}
      <g transform="translate(-150 420)">
        <path d="M30,0 L15,26 L-15,26 L-30,0 L-15,-26 L15,-26 Z" className={styles["xray-line"]} />
        <circle r="14" className={styles["xray-shaft"]} />
        <circle r="22" className={styles["xray-line-faint"]} />
        <text x="0" y="46" textAnchor="middle" className={styles["xray-label-detail"]}>M24 HEX NUT</text>
      </g>

      {/* Top strip: drawing number */}
      <g transform="translate(420 30)">
        <rect width="150" height="34" className={styles["xray-line"]} />
        <text x="8" y="15" className={styles["xray-label"]}>DWG NF-26-004</text>
        <text x="8" y="28" className={styles["xray-label-detail"]}>REV C · CHECKED</text>
      </g>

      {/* Where the big gear and the orange gear touch */}
      <Label title="CONTACT RATIO 1.62" detail="BACKLASH 0.08 mm" from={contactPoint} to={{ x: contactPoint.x - 70, y: contactPoint.y - 92 }} />
    </g>
  );
}

/** The lens outline (ring, 4 ticks, centre dot, tag). Drawn for radius 100 and scaled in HeroGears. */
export function LensRing({ ringRef }: { ringRef: Ref<SVGGElement> }) {
  return (
    <g ref={ringRef} className={styles["lens-ring"]} style={{ opacity: 0 }}>
      <circle r="100" className={styles["lens-ring-circle"]} vectorEffect="non-scaling-stroke" />
      <path d="M0,-108 L0,-92 M0,92 L0,108 M-108,0 L-92,0 M92,0 L108,0" className={styles["lens-ring-circle"]} vectorEffect="non-scaling-stroke" />
      <circle r="2.6" className={styles["lens-ring-dot"]} />
      <text x="116" y="4" className={styles["lens-ring-tag"]}>X-RAY VIEW</text>
    </g>
  );
}
