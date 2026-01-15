import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TripProvider } from "@/context/TripContext";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { AdSenseProvider } from "@/components/ads/AdSenseProvider";
import { isAdSenseEnabled, getAdSenseClientId } from "@/lib/adsense/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voyagr - Plan Your Perfect Trip",
  description: "Discover and plan your perfect trip with Voyagr",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseEnabled = isAdSenseEnabled();
  const adsenseClientId = getAdSenseClientId();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google AdSense Script */}
        {adsenseEnabled && adsenseClientId && (
          <Script
            id="adsbygoogle-init"
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <TripProvider>
            <OnboardingProvider>
              <AdSenseProvider>{children}</AdSenseProvider>
            </OnboardingProvider>
          </TripProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
