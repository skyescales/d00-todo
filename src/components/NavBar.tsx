"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/board", label: "Board" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-fg shrink-0">
          <span className="h-7 w-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm font-bold">
            G
          </span>
          <span className="hidden sm:inline">Gym Lead Tracker</span>
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-brand-50 text-brand-700" : "text-fg-muted hover:bg-surface-muted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <ThemeSwitcher />
          <Link
            href="/leads/new"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            + Add Lead
          </Link>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-fg-muted hover:bg-surface-muted transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
