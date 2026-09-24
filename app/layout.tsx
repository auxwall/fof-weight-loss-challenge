import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Club Weight Loss Challenge — Dubai 2026",
  description: "Official 30-day Club Weight Loss Challenge across Dubai clubs: Al Rashidiya, Al Barsha, Abu Hail, and Al Nahda. Free registration with total prizes of 19,000 AED Cash Prize (10,000 AED 1st, 5,000 AED 2nd, and 3,000 AED 3rd).",
  keywords: ["club challenge", "weight loss challenge", "dubai fitness club", "free registration", "al barsha", "al rashidiya"],
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${poppins.variable}`}>
      <body className={`${poppins.className} font-sans bg-background text-white antialiased min-h-screen selection:bg-gymRed selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
