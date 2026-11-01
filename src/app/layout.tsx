import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventPilot AI — GenAI-Powered Event Planning Assistant",
  description: "Organize weddings, birthdays, and community events with AI-driven personalized plans, deterministic budget allocation, and actionable timelines.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0f19] text-slate-100 antialiased selection:bg-purple-600 selection:text-white">
        {/* WCAG Accessibility: Skip to main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <div id="main-content" tabIndex={-1} className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
