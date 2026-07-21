import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { ReactQueryProvider } from "@/components/react-query-provider";
import { SerwistProvider } from "./serwist-provider";
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
  title: "Parking Locator Grenoble",
  description: "Carte interactive des parkings et zones de stationnement à Grenoble",
  applicationName: "Parking Locator Grenoble",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Parking Locator",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b373f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SerwistProvider swUrl="/sw.js">
          <NuqsAdapter>
            <ReactQueryProvider>
              {children}
            </ReactQueryProvider>
          </NuqsAdapter>
        </SerwistProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
