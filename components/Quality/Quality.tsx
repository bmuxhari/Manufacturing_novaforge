import styles from "./Quality.module.css";

const CERTIFICATIONS = ["ISO 9001:2015", "AS9100D", "IATF 16949", "ISO 13485", "ISO 14001", "ITAR"];

/** The rings fill to their value when revealed (handled by GlobalEffects via data-ring-value). */
const QUALITY_RINGS = [
  { value: "99.8", decimals: "1", label: "First-pass yield" },
  { value: "98.6", decimals: "1", label: "On-time delivery" },
  { value: "96", decimals: undefined, label: "Customer retention" },
];

export default function Quality() {
  return (
    <section className={styles.quality} id="quality">
      <div className={`container ${styles["quality-grid"]}`}>
        <div>
          <div className="section-tag reveal">
            <span>[ 04 ]</span> Quality
          </div>
          <h2 className="h2 reveal" data-delay="1">
            Measured to the <span className="serif">micron.</span> Proven by data.
          </h2>
          <p className="section-lead reveal" data-delay="2">
            Zeiss CMMs, inline optical inspection and AI-driven SPC monitor every critical dimension in real time — so issues are caught before they become parts.
          </p>
          <ul className={`${styles["quality-certifications"]} reveal`} data-delay="3">
            {CERTIFICATIONS.map((cert) => (
              <li key={cert}>{cert}</li>
            ))}
          </ul>
        </div>

        <div className={styles["quality-rings"]}>
          {QUALITY_RINGS.map((ring, i) => (
            <div key={ring.label} className={`${styles["quality-ring"]} reveal`} data-delay={i} data-ring-value={ring.value}>
              <svg viewBox="0 0 120 120">
                <circle className={styles["quality-ring-track"]} cx="60" cy="60" r="54" />
                <circle className={styles["quality-ring-progress"]} cx="60" cy="60" r="54" data-ring-progress />
              </svg>
              <div className={styles["quality-ring-label"]}>
                <b>
                  <span data-count={ring.value} data-decimals={ring.decimals}>0</span>%
                </b>
                <span>{ring.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
