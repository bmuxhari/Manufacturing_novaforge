"use client";

import { useEffect, useState } from "react";
import styles from "./Testimonials.module.css";

/**
 * PLACEHOLDER REVIEWS: names, companies and quotes are sample text.
 * Replace them with real, approved customer reviews before the site goes live.
 */
const REVIEWS = [
  {
    quote: "Novaforge took our flight-control housing from prototype to rate production in eleven weeks. Zero escapes in two years.",
    name: "Elena Marsh",
    role: "VP Supply Chain, Aerodyne",
  },
  {
    quote: "Their DFM team cut our battery enclosure cost by 31% before the first tool was even built. A true engineering partner.",
    name: "Daniel Okafor",
    role: "Director of Engineering, Kestrel Motors",
  },
  {
    quote: "Cleanroom molding, assembly and sterilization-ready packaging under one roof. It simplified our entire FDA submission.",
    name: "Priya Raman",
    role: "Head of Operations, Helix Medical",
  },
  {
    quote: "We moved three suppliers' worth of machined parts to Novaforge. Lead times dropped by half and our line hasn't stopped once.",
    name: "Marcus Lindqvist",
    role: "Plant Manager, Northwind Robotics",
  },
  {
    quote: "Every shipment arrives with full CMM reports and traceability. Our incoming inspection is now a formality.",
    name: "Sofia Alvarez",
    role: "Quality Lead, Stratos Energy",
  },
  {
    quote: "From a rough sketch to fifty working prototypes in under two weeks. Their engineers ask the right questions early.",
    name: "James Whitfield",
    role: "Founder, Orbital Systems",
  },
];

/** 3 reviews per page on desktop, 1 per page on tablet and phone. */
const DESKTOP_QUERY = "(min-width: 1025px)";

export default function Testimonials() {
  const [perPage, setPerPage] = useState(3);
  const [page, setPage] = useState(0);

  // Switch between 3-per-page and 1-per-page with the screen width.
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const update = () => {
      setPerPage(media.matches ? 3 : 1);
      setPage(0);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const pageCount = Math.ceil(REVIEWS.length / perPage);
  const pages = Array.from({ length: pageCount }, (_, i) => REVIEWS.slice(i * perPage, i * perPage + perPage));
  const isFirst = page === 0;
  const isLast = page === pageCount - 1;

  return (
    <section className={styles.reviews} id="reviews" aria-roledescription="carousel" aria-label="Customer reviews">
      <div className="container">
        <h2 className={`h2 reveal ${styles["reviews-heading"]}`}>Reviews</h2>

        <div className={`${styles["reviews-viewport"]} reveal`} data-delay="1">
          {/* All pages sit side by side; the track slides one full page per arrow click */}
          <div className={styles["reviews-track"]} style={{ transform: `translateX(-${page * 100}%)` }}>
            {pages.map((group, groupIndex) => (
              <div
                key={groupIndex}
                className={styles["reviews-page"]}
                aria-hidden={groupIndex !== page}
                inert={groupIndex !== page}
              >
                {group.map((review) => (
                  <figure key={review.name} className={styles["review-card"]}>
                    <svg className={styles["review-quote-icon"]} viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
                      <path d="M8 34c0-9 4-16 13-20l2 3c-5 3-7 7-7 11h7v10H8zm19 0c0-9 4-16 13-20l2 3c-5 3-7 7-7 11h7v10H27z" />
                    </svg>
                    <blockquote className={styles["review-quote"]}>{review.quote}</blockquote>
                    <figcaption className={styles["review-author"]}>
                      <b className={styles["review-author-name"]}>{review.name}</b>
                      <span className={styles["review-author-role"]}>{review.role}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className={styles["reviews-arrows"]}>
          <button
            className={styles["reviews-arrow-button"]}
            aria-label="Previous reviews"
            disabled={isFirst}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            className={styles["reviews-arrow-button"]}
            aria-label="Next reviews"
            disabled={isLast}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
