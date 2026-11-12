import type { Metadata, Viewport } from "next";
import { Ubuntu, Poppins } from "next/font/google";
import "./globals.css";

/** The only two fonts on the site: Ubuntu for headings, Poppins for all other text. */
const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-ubuntu",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Novaforge Industries — Precision Manufacturing at Scale",
  description:
    "Novaforge Industries: precision CNC machining, fabrication, injection molding, additive manufacturing and assembly for aerospace, automotive, medical and energy OEMs.",
};

export const viewport: Viewport = {
  themeColor: "#ece2d0",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const fontVariables = `${ubuntu.variable} ${poppins.variable}`;

  return (
    // "no-js" becomes "js" as soon as JavaScript runs, so the animation start states
    // (hidden reveals, preloader) only apply when JavaScript can finish them.
    <html lang="en" className={`no-js ${fontVariables}`} suppressHydrationWarning>
      <head>
        {/* Runs before the page paints: marks JS as on, and applies the saved dark/light choice (no flash). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.replace('no-js','js');" +
              "try{if(localStorage.getItem('novaforge-theme')==='dark'){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}",
          }}
        />
      </head>
      <body className="is-loading" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
