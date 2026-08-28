import type { Metadata } from "next";
import "./globals.css";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Gym Lead Tracker",
  description: "Cold outreach CRM for independently-owned Florida gyms & fitness studios",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Applies the saved theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="antialiased bg-page text-fg">{children}</body>
    </html>
  );
}
