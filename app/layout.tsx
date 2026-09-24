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
  title: "Gym Weight Loss Challenge — Dubai 2026",
  description: "Official 30-day Gym Weight Loss Challenge across Dubai clubs: Al Rashidiya, Al Barsha, Abu Hail, and Al Nahda. Total prizes of 18,000 AED.",
  keywords: ["gym challenge", "weight loss", "dubai gym", "fitness challenge", "al barsha", "al rashidiya"],
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
