import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/presentation/components/Toast";

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
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-zinc-50 text-zinc-955 dark:bg-zinc-950 dark:text-zinc-50">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}

