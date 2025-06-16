import type { Metadata } from "next/types";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProviders } from "./providers/QueryProviders";
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
  title: "RSS News Summarizer",
  description: "官公庁・企業のRSSフィードをAIで要約",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProviders>{children}</QueryProviders>
      </body>
    </html>
  );
}
