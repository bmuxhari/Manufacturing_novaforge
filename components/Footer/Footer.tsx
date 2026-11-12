import styles from "./Footer.module.css";

const FOOTER_COLUMNS = [
  {
    heading: "Capabilities",
    links: [
      { label: "CNC Machining", href: "#capabilities" },
      { label: "Fabrication", href: "#capabilities" },
      { label: "Molding", href: "#capabilities" },
      { label: "Additive", href: "#capabilities" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#intro" },
      { label: "Quality", href: "#quality" },
      { label: "Careers", href: "#" },
      { label: "Sustainability", href: "#" },
    ],
  },
  {
    heading: "Connect",
    links: [
      { label: "LinkedIn", href: "#" },
      { label: "YouTube", href: "#" },
      { label: "Contact", href: "#contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles["footer-top"]}>
          <div className={styles["footer-brand"]}>
            <a className="brand" href="#top">
              <svg className="brand-mark" viewBox="0 0 32 32" fill="none">
                <path d="M16 2 28 9v14L16 30 4 23V9z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 8l6 3.5v9L16 24l-6-3.5v-9z" fill="var(--accent)" />
              </svg>
              <span>Novaforge</span>
            </a>
            <p>Precision manufacturing for the companies building the future.</p>
          </div>
          <div className={styles["footer-columns"]}>
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.heading}>
                <h4>{column.heading}</h4>
                {column.links.map((link) => (
                  <a key={link.label} href={link.href}>
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className={styles["footer-big-wordmark"]} aria-hidden="true">
          NOVAFORGE
        </div>
        <div className={styles["footer-bottom"]}>
          <span>© {new Date().getFullYear()} Novaforge Industries. All rights reserved.</span>
          <span>
            <a href="#">Privacy</a> · <a href="#">Terms</a>
          </span>
          <a href="#top" className={styles["footer-back-to-top"]}>
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
