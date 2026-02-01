import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LiftTrack",
  description: "Track your lifts. Get huge.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LiftTrack",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#dc2626",
          colorBackground: "#0a0a0a",
          colorInputBackground: "#1c1c1c",
          colorInputText: "#f5f5f5",
        },
      }}
    >
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} antialiased bg-background text-foreground min-h-screen`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
