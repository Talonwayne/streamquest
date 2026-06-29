import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Streamquest — Request-driven stream discovery",
    template: "%s | Streamquest",
  },
  description:
    "Request stream ideas, upvote what you want to watch, and get notified when streamers go live on Twitch, YouTube, Kick, and more.",
  openGraph: {
    title: "Streamquest",
    description: "Request-driven stream discovery for viewers and streamers.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500">
          Streamquest — discover streams by what you want to watch.
        </footer>
      </body>
    </html>
  );
}
