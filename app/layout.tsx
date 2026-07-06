import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Revix",
  description: "Revix watches your repositories, understands the diff, and turns noisy code changes into focused feedback your team can trust.",
  icons: {
    icon: "/revix.png", // Change to /logo.png if using a PNG
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en" className={cn("font-sans", geist.variable)}
    >
      <body className="min-h-screen overflow-hidden bg-[#0b0f14] text-[#f5f1ea]">
        <Sidebar />
        <main className="h-screen overflow-y-auto bg-transparent md:pl-60">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
