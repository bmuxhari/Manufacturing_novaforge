import styles from "./Numbers.module.css";

/** Counters count up from 0 when scrolled into view (handled by GlobalEffects via data-count). */
const NUMBERS = [
  { count: "2.4", decimals: "1", unit: "M", label: "Parts shipped every month" },
  { count: "99.98", decimals: "2", unit: "%", label: "First-pass quality yield" },
  { count: "38", decimals: undefined, unit: "", label: "Countries served" },
  { count: "640", decimals: undefined, unit: "+", label: "CNC & robotic cells" },
];

export default function Numbers() {
  return (
    <section className={styles.numbers}>
      <div className={`container ${styles["numbers-grid"]}`}>
        {NUMBERS.map((item, i) => (
          <div key={item.label} className={`${styles["number-item"]} reveal`} data-delay={i}>
            <b>
              <span data-count={item.count} data-decimals={item.decimals}>0</span>
              {item.unit && <small>{item.unit}</small>}
            </b>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
