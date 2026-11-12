"use client";

import { useEffect, useRef, useState } from "react";
import { useFrameLoop } from "@/hooks/useFrameLoop";
import { syncThemeBarColour, toggleTheme } from "@/hooks/themeToggle";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
  { href: "#capabilities", label: "Capabilities" },
  { href: "#process", label: "Process" },
  { href: "#industries", label: "Industries" },
  { href: "#quality", label: "Quality" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("");
  const navRef = useRef<HTMLElement>(null);
  const isMenuOpenRef = useRef(false);

  // Keep the body class in sync (it locks page scroll while the menu is open).
  useEffect(() => {
    isMenuOpenRef.current = isMenuOpen;
    document.body.classList.toggle("menu-open", isMenuOpen);
    if (isMenuOpen) navRef.current?.classList.remove(styles["navbar-hidden"]);
  }, [isMenuOpen]);

  // On load, match the phone browser bar colour to the saved theme.
  useEffect(() => {
    syncThemeBarColour();
  }, []);

  // Close the menu with the Escape key.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Highlight the link of the section in the middle of the screen.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveHref(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    document.querySelectorAll("main section[id]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Solid background after 40px; hide when scrolling down past 700px, show when scrolling up.
  useFrameLoop(({ scrollY, scrollDelta, scrollChanged }) => {
    const nav = navRef.current;
    if (!scrollChanged || !nav) return;
    nav.classList.toggle(styles["navbar-scrolled"], scrollY > 40);
    if (!isMenuOpenRef.current) {
      if (scrollY > 700 && scrollDelta > 0) nav.classList.add(styles["navbar-hidden"]);
      else if (scrollDelta < 0 || scrollY <= 700) nav.classList.remove(styles["navbar-hidden"]);
    }
  });

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* The header's className never changes in React: scroll classes are added directly on scroll. */}
      <header ref={navRef} className={styles.navbar} id="nav">
        <div className={`container ${styles["navbar-inner"]}`}>
          {/* Floating rounded card: logo left, links centered, actions right */}
          <div className={styles["navbar-card"]}>
            <a className="brand" href="#top" aria-label="Novaforge home">
              <svg className="brand-mark" viewBox="0 0 32 32" fill="none">
                <path d="M16 2 28 9v14L16 30 4 23V9z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 8l6 3.5v9L16 24l-6-3.5v-9z" fill="var(--accent)" />
              </svg>
              <span>Novaforge</span>
            </a>
            <nav className={styles["navbar-links"]} aria-label="Primary">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className={activeHref === link.href ? styles["navbar-link-active"] : undefined}>
                  {link.label}
                </a>
              ))}
            </nav>
            <div className={styles["navbar-actions"]}>
              {/* Moon shows in light mode, sun in dark mode (switched by CSS, so no flicker on load). */}
              <button className={styles["theme-toggle-button"]} aria-label="Switch between light and dark mode" onClick={toggleTheme}>
                <svg className={styles["theme-toggle-moon-icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                </svg>
                <svg className={styles["theme-toggle-sun-icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4.5" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              </button>
              <a className={`btn btn--primary btn--sm ${styles["navbar-quote-button"]}`} href="#contact" data-magnetic>
                <span>Request a Quote</span>
              </a>
              <button
                className={`${styles["navbar-menu-toggle"]} ${isMenuOpen ? styles["navbar-menu-toggle-open"] : ""}`}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((open) => !open)}
              >
                <span />
                <span />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`${styles["mobile-menu"]} ${isMenuOpen ? styles["mobile-menu-open"] : ""}`} id="mobileMenu">
        <nav>
          {NAV_LINKS.map((link, index) => (
            <a key={link.href} href={link.href} onClick={closeMenu}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              {link.label}
            </a>
          ))}
        </nav>
        <a className="btn btn--primary" href="#contact" onClick={closeMenu}>
          <span>Request a Quote</span>
        </a>
      </div>
    </>
  );
}
