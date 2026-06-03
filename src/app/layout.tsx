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
      <body className="min-h-full flex flex-col font-sans bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}

