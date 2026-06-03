import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/presentation/components/Toast";

import { BackgroundParticles } from "@/presentation/components/BackgroundParticles";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CBT Portal - Sistem Ujian Online Terintegrasi",
  description: "Platform Computer Based Test (CBT) modern dengan sistem keamanan tinggi, pengawasan real-time, dan sertifikat otomatis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                document.documentElement.classList.remove('dark');
                localStorage.theme = 'light';
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="relative min-h-full flex flex-col font-sans bg-zinc-50 text-zinc-955 dark:bg-zinc-950 dark:text-zinc-50 overflow-x-hidden">
        <BackgroundParticles />
        <div className="relative z-10 flex-1 flex flex-col min-h-full">
          {children}
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}

