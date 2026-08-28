import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gym Lead Tracker",
  description: "Cold outreach CRM for independently-owned Florida gyms & fitness studios",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-900">{children}</body>
    </html>
  );
}
