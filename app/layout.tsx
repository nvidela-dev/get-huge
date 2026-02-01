import type { Metadata, Viewport } from "next";
import { Cinzel, Cinzel_Decorative, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Get Huge",
  description: "Become the Elden Lord of Gains",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Get Huge",
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
  themeColor: "#0d0d0d",
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
          colorPrimary: "#c9a227",
          colorBackground: "#0d0d0d",
          colorInputBackground: "#1a1816",
          colorInputText: "#e8e2d6",
        },
      }}
    >
      <html lang="en" className="dark">
        <body
          className={`${inter.variable} ${cinzel.variable} ${cinzelDecorative.variable} antialiased bg-background text-foreground min-h-screen`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
