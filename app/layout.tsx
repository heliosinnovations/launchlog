import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

export const metadata: Metadata = {
  title: "LaunchLog - Your Portfolio of Shipped Projects",
  description: "Stop sharing GitHub repos. Start showcasing what you've actually built, launched, and shipped.",
  keywords: ["portfolio", "developer", "projects", "showcase", "shipped", "launched"],
  authors: [{ name: "LaunchLog" }],
  openGraph: {
    title: "LaunchLog - Your Portfolio of Shipped Projects",
    description: "Stop sharing GitHub repos. Start showcasing what you've actually built, launched, and shipped.",
    url: "https://launchlog.dev",
    siteName: "LaunchLog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LaunchLog - Your Portfolio of Shipped Projects",
    description: "Stop sharing GitHub repos. Start showcasing what you've actually built, launched, and shipped.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <GoogleAnalytics />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
