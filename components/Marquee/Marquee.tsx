import { Fragment } from "react";
import styles from "./Marquee.module.css";

const CLIENT_NAMES = [
  "AERODYNE", "Kestrel Motors", "HELIX MEDICAL", "Voltaic",
  "NORTHWIND", "Orbital Systems", "Meridian Robotics", "STRATOS ENERGY",
];

function ClientRow({ hidden }: { hidden?: boolean }) {
  return (
    <div className={styles["marquee-row"]} aria-hidden={hidden || undefined}>
      {CLIENT_NAMES.map((name) => (
        <Fragment key={name}>
          <span>{name}</span>
          <i>✦</i>
        </Fragment>
      ))}
    </div>
  );
}

/** Endless scrolling strip of client names. The row is rendered twice so the loop has no gap. */
export default function Marquee() {
  return (
    <section className={styles.marquee} aria-label="Trusted by">
      <p className={styles["marquee-label"]}>Trusted by engineering teams at</p>
      <div className={styles["marquee-track"]}>
        <ClientRow />
        <ClientRow hidden />
      </div>
    </section>
  );
}
