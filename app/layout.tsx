import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthGuard } from "@/app/components/auth-guard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dynamic Dashboard with Authentication",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
