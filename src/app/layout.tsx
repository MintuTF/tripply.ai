import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TripProvider } from "@/context/TripContext";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { AdSenseProvider } from "@/components/ads/AdSenseProvider";
import { GlobalBoardWidget } from "@/components/board/GlobalBoardWidget";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Plan Your Perfect Trip`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    title: `${SITE_NAME} - Plan Your Perfect Trip`,
    description: SITE_DESCRIPTION,
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: `${SITE_NAME} - Plan Your Perfect Trip`,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d9488',
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
        {/* Google AdSense Script - beforeInteractive ensures it's in initial HTML for crawler verification */}
        {adsenseEnabled && adsenseClientId && (
          <Script
            id="adsbygoogle-init"
            strategy="beforeInteractive"
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
              <GlobalBoardWidget />
            </OnboardingProvider>
          </TripProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
