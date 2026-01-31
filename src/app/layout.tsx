import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "ZenAnime - Ver anime sin anuncios",
  description: "Busca y mira anime sin anuncios molestos. Streaming de anime gratis.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ZenAnime",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white min-h-screen flex flex-col`}
      >
        <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 w-fit active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ZenAnime
              </span>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 flex-1">
          {children}
        </main>
        <footer className="border-t border-gray-800 py-4 sm:py-6 mt-auto">
          <div className="container mx-auto px-3 sm:px-4 text-center text-gray-500 text-xs sm:text-sm">
            ZenAnime - Streaming de anime sin interrupciones
          </div>
        </footer>
      </body>
    </html>
  );
}
