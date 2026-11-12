"use client";

import { Fragment, useRef } from "react";
import { useFrameLoop } from "@/hooks/useFrameLoop";
import { clamp } from "@/hooks/motionPreferences";
import styles from "./Intro.module.css";

/**
 * The big statement. Plain words light up one by one as you scroll;
 * each <em> phrase lights up as a single unit.
 */
const STATEMENT: { text: string; emphasis?: boolean }[] = [
  { text: "For four decades we've turned bold engineering into" },
  { text: "tangible reality", emphasis: true },
  { text: "— combining 640 automated cells, obsessive metrology and a team of 2,800 makers to deliver parts that perform flawlessly," },
  { text: "every single time.", emphasis: true },
];

const INTRO_FACTS = [
  { label: "EST. 1984", text: "Family-founded in Michigan, now operating 9 plants across 3 continents." },
  { label: "1.2M SQ FT", text: "Climate-controlled production floor with ISO Class 7 cleanrooms." },
  { label: "NET-ZERO 2030", text: "Solar-powered facilities and closed-loop coolant & metal recycling." },
];

export default function Intro() {
  const statementRef = useRef<HTMLParagraphElement>(null);

  useFrameLoop(({ scrollChanged }) => {
    const statement = statementRef.current;
    if (!scrollChanged || !statement) return;
    const viewportHeight = window.innerHeight;
    const rect = statement.getBoundingClientRect();
    const progress = clamp((viewportHeight * 0.82 - rect.top) / (rect.height + viewportHeight * 0.32), 0, 1);
    const words = statement.querySelectorAll(`.${styles["intro-statement-word"]}`);
    const litCount = progress * words.length;
    words.forEach((word, i) => word.classList.toggle(styles["intro-statement-word-lit"], i < litCount));
  });

  return (
    <section className={styles.intro} id="intro">
      <div className="container">
        {/* Two columns: heading + statement on the left, image on the right (image to be added) */}
        <div className={styles["intro-columns"]}>
          <div className={styles["intro-text-column"]}>
            <h2 className={`h2 reveal ${styles["intro-heading"]}`}>About us</h2>
            <p ref={statementRef} className={styles["intro-statement"]}>
              {STATEMENT.map((part, partIndex) =>
                part.emphasis ? (
                  <Fragment key={partIndex}>
                    {" "}
                    <em className={styles["intro-statement-word"]}>{part.text}</em>{" "}
                  </Fragment>
                ) : (
                  part.text.split(/\s+/).map((word, i) => (
                    <Fragment key={`${partIndex}-${i}`}>
                      {i > 0 && " "}
                      <span className={styles["intro-statement-word"]}>{word}</span>
                    </Fragment>
                  ))
                ),
              )}
            </p>
          </div>
          {/* Biplane sketch: the PNG is a transparent stencil with soft faded edges; CSS paints it in the theme orange */}
          <div className={`${styles["intro-image-column"]} reveal`} data-delay="1">
            <div className={styles["intro-blueprint-image"]} role="img" aria-label="Orange sketch of a vintage biplane with engineering notes" />
          </div>
        </div>
        <div className={styles["intro-facts"]}>
          {INTRO_FACTS.map((fact, i) => (
            <div key={fact.label} className="reveal" data-delay={i}>
              <span className="mono">{fact.label}</span>
              <p>{fact.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
