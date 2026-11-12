"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./Contact.module.css";

const PROCESS_OPTIONS = [
  { value: "cnc", label: "CNC", defaultChecked: true },
  { value: "sheet", label: "Sheet metal" },
  { value: "molding", label: "Molding" },
  { value: "additive", label: "Additive" },
  { value: "assembly", label: "Assembly" },
];

const REQUIRED_FIELDS = ["name", "company", "email"] as const;
type RequiredField = (typeof REQUIRED_FIELDS)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormStatus = "idle" | "sending" | "sent";

const BUTTON_LABELS: Record<FormStatus, string> = {
  idle: "Request a quote",
  sending: "Sending…",
  sent: "Request received — we’ll be in touch ✓",
};

/**
 * Quote form. Front-end only for now: it checks the fields and shows a success message,
 * but does NOT send the data anywhere yet (Supabase will be connected later).
 */
export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null);
  const [invalidFields, setInvalidFields] = useState<RequiredField[]>([]);
  const [status, setStatus] = useState<FormStatus>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const invalid = REQUIRED_FIELDS.filter((field) => {
      const value = (form.elements.namedItem(field) as HTMLInputElement).value.trim();
      return field === "email" ? !EMAIL_PATTERN.test(value) : value.length === 0;
    });
    setInvalidFields(invalid);
    if (invalid.length > 0) {
      (form.elements.namedItem(invalid[0]) as HTMLInputElement).focus();
      return;
    }

    // Fake send: wait a moment, show success, then reset the form.
    setStatus("sending");
    timers.current.push(
      window.setTimeout(() => {
        setStatus("sent");
        timers.current.push(
          window.setTimeout(() => {
            formRef.current?.reset();
            setStatus("idle");
          }, 4500),
        );
      }, 1100),
    );
  };

  // Typing in a field clears its red border.
  const clearInvalid = (field: string) => {
    setInvalidFields((current) => current.filter((f) => f !== field));
  };

  const fieldClass = (field: RequiredField) =>
    `${styles["form-field"]} ${invalidFields.includes(field) ? styles["form-field-invalid"] : ""}`;

  return (
    <section className={styles.contact} id="contact">
      <div className={styles["contact-glow"]} aria-hidden="true" />
      <div className={`container ${styles["contact-grid"]}`}>
        <div>
          <div className="section-tag reveal">
            <span>[ 06 ]</span> Get started
          </div>
          <h2 className="h1 reveal" data-delay="1">
            Let&apos;s build <span className="serif accent">what&apos;s next.</span>
          </h2>
          <p className="section-lead reveal" data-delay="2">
            Send us your drawings and requirements. A manufacturing engineer — not a salesperson — will respond with a detailed quote within 24 hours.
          </p>
          <div className={`${styles["contact-info"]} reveal`} data-delay="3">
            <div>
              <span className="mono">SALES</span>
              <a href="mailto:quotes@novaforge.example">quotes@novaforge.example</a>
            </div>
            <div>
              <span className="mono">PHONE</span>
              <a href="tel:+18005550199">+1 (800) 555-0199</a>
            </div>
            <div>
              <span className="mono">HQ</span>
              <span>2200 Foundry Ave, Detroit, MI</span>
            </div>
          </div>
        </div>

        {/* The outer div carries the reveal animation so React re-renders of the form never remove it. */}
        <div className="reveal" data-delay="2">
          <form
            ref={formRef}
            className={`${styles["quote-form"]} ${status === "sent" ? styles["quote-form-sent"] : ""}`}
            id="quoteForm"
            noValidate
            onSubmit={handleSubmit}
            onInput={(e) => clearInvalid((e.target as HTMLInputElement).name)}
          >
            <div className={styles["form-row"]}>
              <label className={fieldClass("name")}>
                <input type="text" name="name" placeholder=" " required />
                <span>Full name</span>
              </label>
              <label className={fieldClass("company")}>
                <input type="text" name="company" placeholder=" " required />
                <span>Company</span>
              </label>
            </div>
            <label className={fieldClass("email")}>
              <input type="email" name="email" placeholder=" " required />
              <span>Work email</span>
            </label>
            <fieldset className={styles["process-chips"]}>
              <legend>Process needed</legend>
              {PROCESS_OPTIONS.map((option) => (
                <label key={option.value}>
                  <input type="checkbox" name="process" value={option.value} defaultChecked={option.defaultChecked} />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>
            <label className={styles["form-field"]}>
              <textarea name="message" rows={4} placeholder=" " />
              <span>Project details, volumes, materials…</span>
            </label>
            <button type="submit" className={`btn btn--primary btn--block ${styles["quote-form-submit"]}`} data-magnetic>
              <span>{BUTTON_LABELS[status]}</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <p className={styles["quote-form-note"]}>NDA available on request. Your files are encrypted and never shared.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
