'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, Zap, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-tr from-slate-900 via-indigo-950 to-zinc-900 text-white relative overflow-hidden">
      {/* Background blur decorative circles */}
      <div className="absolute top-0 left-1/4 -z-10 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-1/4 -z-10 h-[450px] w-[450px] rounded-full bg-indigo-600/10 blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />

      {/* Navigation */}
      <nav className="w-full border-b border-white/5 bg-zinc-950/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/20">
              <GraduationCap className="h-5.5 w-5.5" />
            </div>
            <span className="font-bold text-lg tracking-tight">Portal CBT</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                Daftar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <span>Sistem Ujian Terkunci & Aman</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
            Platform Ujian <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Computer Based Test
            </span>
          </h1>

          <p className="max-w-xl text-lg text-zinc-400 leading-relaxed mx-auto lg:mx-0">
            Sistem evaluasi online terintegrasi dengan pengawasan ketat berbasis browser API, pencatatan log real-time, dan penerbitan sertifikat digital otomatis setelah ujian selesai.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/20 group">
                <span>Masuk ke Portal Ujian</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:text-white">
                Buat Akun Peserta
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <Card className="bg-zinc-900/40 border-white/5 p-6 backdrop-blur-md">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Anti-Curang (Proctoring)</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Mendeteksi perpindahan tab browser, menutup paksa mode non-fullscreen, dan memblokir pintasan tombol salin-tempel.
            </p>
          </Card>

          <Card className="bg-zinc-900/40 border-white/5 p-6 backdrop-blur-md">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Waktu Akurat (Sync)</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Penghitung waktu ujian presisi yang tersinkronisasi langsung dengan sistem server untuk auto-submit instan.
            </p>
          </Card>

          <Card className="bg-zinc-900/40 border-white/5 p-6 backdrop-blur-md">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Sertifikat Otomatis</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Menerbitkan dokumen sertifikat resmi secara otomatis langsung setelah peserta memenuhi kriteria KKM kelulusan.
            </p>
          </Card>

          <Card className="bg-zinc-900/40 border-white/5 p-6 backdrop-blur-md">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-4">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Terintegrasi Laravel</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Menggunakan Next.js App Router sebagai presentation layer yang terhubung dengan Laravel API yang solid.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 bg-zinc-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© 2026 Portal Ujian CBT. All Rights Reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-400">Kebijakan Privasi</a>
            <a href="#" className="hover:text-zinc-400">Ketentuan Layanan</a>
            <a href="#" className="hover:text-zinc-400">Bantuan</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

