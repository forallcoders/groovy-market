import { Toaster } from "@/components/ui/toaster";
import Web3Provider from "@/providers/web3-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Georama } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const georama = Georama({
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
const metaTitle =
  "GroovyMarket | Turn Predictions Into Profit with Creator-Powered Markets";
const imagesURLs = [
  "/images/x-twitter-social-1.webp",
  "/images/x-twitter-social-2.webp",
];
const metaDescription =
  "GroovyMarket empowers creators to launch fun, social prediction markets—monetize your influence, engage fans, and profit from what you know.";

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  openGraph: {
    type: "website",
    title: metaTitle,
    description: metaDescription,
    images: imagesURLs,
    url: baseUrl,
  },
  twitter: {
    card: "summary_large_image",
    images: imagesURLs,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${georama.className} antialiased bg-[#141414]`}
      >
        <Web3Provider>{children}</Web3Provider>
        <Toaster />
      </body>
    </html>
  );
}
