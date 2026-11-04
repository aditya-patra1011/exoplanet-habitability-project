"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/classification", label: "Part A: Candidate Classification" },
  { href: "/ablation", label: "Ablation Study" },
  { href: "/habitability", label: "Part B: Habitability Scoring" },
  { href: "/candidates", label: "Top Habitable Candidates" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-full shrink-0 bg-[#1c1f26] border-b border-gray-800 p-4 md:w-64 md:h-screen md:overflow-y-auto md:border-b-0 md:border-r md:p-6 md:sticky md:top-0">
      <h2 className="text-lg font-bold mb-3 md:mb-6">Navigation</h2>
      <ul className="space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-green-900/40 text-green-400 font-medium"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
