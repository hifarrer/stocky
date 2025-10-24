import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/grid-layout.css";
import { AppProviders } from "@/contexts";
import { Footer } from "@/components/layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "BlockyFi - Customizable Financial Dashboard",
  description: "Professional financial dashboard for real-time market analysis, stock tracking, and cryptocurrency monitoring.",
  keywords: "stocks, crypto, dashboard, trading, finance, real-time, market data",
  authors: [{ name: "BlockyFi Team" }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // In a real app, these would come from environment variables or user session
  const apiKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY || "demo";
  const userId = "demo-user";

  return (
        <html lang="en" className="dark">
          <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen`}>
            <AppProviders
          apiKey={apiKey} 
          userId={userId}
          autoConnectWebSocket={true}
        >
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
