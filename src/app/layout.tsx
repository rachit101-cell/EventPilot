import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventPilot Atelier — Bespoke Event Direction & Private Concierge",
  description: "Curate weddings, gala celebrations, and milestone symposiums with verifiable financial allocations, master itinerary scheduling, and curated creative concepts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#05070E] text-slate-100 antialiased selection:bg-[#C5A880] selection:text-[#05070E]">
        {/* WCAG Accessibility: Skip to main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#C5A880] focus:text-[#05070E] focus:rounded-md focus:shadow-lg focus:outline-none font-semibold text-xs"
        >
          Skip to main content
        </a>
        <div id="main-content" tabIndex={-1} className="min-h-screen flex flex-col bg-[#05070E]">
          {children}
        </div>
      </body>
    </html>
  );
}
