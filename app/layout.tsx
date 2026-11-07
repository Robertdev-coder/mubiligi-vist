import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { PwaRegistration } from "@/frontend/components/layout/pwa-registration";
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
    default: "MUBILIGI VISIT DAY | MSGR MUBILIGI TSS",
    template: "%s | MUBILIGI VISIT DAY",
  },
  description:
    "Official visitor registration and visit-day attendance management for MSGR MUBILIGI TSS, Huye District, Rwanda.",
  applicationName: "MUBILIGI VISIT DAY",
  manifest: "/manifest.webmanifest",
  keywords: [
    "MSGR MUBILIGI TSS",
    "MUBILIGI VISIT DAY",
    "school visitor registration",
    "Huye",
    "Rwanda",
  ],
};

export const viewport: Viewport = {
  themeColor: "#071A3D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PwaRegistration />
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: { borderRadius: "14px", fontSize: "14px" },
          }}
        />
      </body>
    </html>
  );
}
