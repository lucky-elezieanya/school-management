import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";
import {Toaster} from "sonner"

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Cozzi Schools",
	description:
		"A christian school management system built with Django and Next.js",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
     
	return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full relative bg-gray-10 flex flex-col">
        <div className="school-watermark" />
        <div className="relative z-10">
          <Providers>{children}</Providers>
          <Toaster richColors position="top-right" closeButton />
        </div>
      </body>
    </html>
  );
}
