// app/layout.tsx
import "./globals.css";
import "./fonts.css"; // Import custom fonts CSS
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ClientLayout } from "./client-layout";
import StackedLogoLockup from "./components/StackedLogoLockup";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-playfair-display",
  display: "swap",
});

// Define Apfel Grotezk as a variable without directly importing the font files
// The actual font files will be loaded via CSS in fonts.css
const apfelGrotezk = {
  variable: "--font-apfel-grotezk",
};

export const metadata: Metadata = {
  title: "whenIwas",
  description: "your safe space",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: {
      url: "/favicon/apple-touch-icon.png",
      type: "image/png",
      sizes: "180x180",
    },
    other: [
      {
        url: "/favicon/web-app-manifest-192x192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/favicon/web-app-manifest-512x512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" style={{ colorScheme: "light dark" }}>
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          ${playfair.variable}
          ${apfelGrotezk.variable}
          antialiased bg-background text-foreground h-full relative
        `}
      >
        <ClientLayout>
          <div className="logo-position logo-container">
            <StackedLogoLockup />
          </div>
          {children}
          <Analytics />
        </ClientLayout>
      </body>
    </html>
  );
}
