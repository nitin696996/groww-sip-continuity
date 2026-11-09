import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SipStudioProvider } from "@/lib/studio-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Groww SIP Continuity Studio",
  description: "SIP recovery workspace and SEBI eval inspector",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <SipStudioProvider>{children}</SipStudioProvider>
      </body>
    </html>
  );
}
