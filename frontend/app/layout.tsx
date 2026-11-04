import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Exoplanet Candidate Classification & Habitability Analysis",
  description:
    "ML classification and habitability scoring on Kepler and NASA Exoplanet Archive data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0e1117] text-gray-100 min-h-screen">
        <div className="flex flex-col md:flex-row">
          <Sidebar />
          <main className="flex-1 min-w-0 p-4 md:p-8 max-w-6xl mx-auto w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
