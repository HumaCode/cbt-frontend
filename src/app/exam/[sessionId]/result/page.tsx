'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { assessmentRepository } from '@/infrastructure/repositories/assessmentRepository';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { useToastStore } from '@/presentation/components/Toast';
import { 
  Award, 
  XCircle, 
  ArrowLeft, 
  Printer, 
  Calendar, 
  FileText, 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { AssessmentSession } from '@/core/types';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default function ResultPage({ params }: PageProps) {
  const router = useRouter();
  const { sessionId } = use(params);
  const addToast = useToastStore((state) => state.addToast);

  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchResult = async () => {
      try {
        // Safe check: call finishSession endpoint (POST) which returns the session
        // even if it's already finished.
        const sessionData = await assessmentRepository.finishSession(sessionId);
        setSession(sessionData);

        const score = parseFloat(String(sessionData.total_score || 0));
        const kkm = parseFloat(String(sessionData.assessment?.passing_grade || 0));
        const isPassed = score >= kkm;
        setPassed(isPassed);

        if (isPassed) {
          try {
            const certData = await assessmentRepository.getCertificate(sessionId);
            setCertificate(certData);
          } catch (certErr) {
            console.error('Failed to load/generate certificate', certErr);
          }
        }
      } catch (err: any) {
        console.error(err);
        addToast({
          type: 'error',
          title: 'Gagal Memuat Hasil',
          message: err.response?.data?.message || 'Gagal memuat hasil ujian.',
        });
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [sessionId, router, addToast, mounted]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Memproses Hasil Ujian...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const scoreNum = parseFloat(String(session.total_score || 0));
  const kkmNum = parseFloat(String(session.assessment?.passing_grade || 0));

  return (
    <div className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      <div className="max-w-4xl mx-auto space-y-8 print:max-w-none print:space-y-0">
        
        {/* Back Button - Hidden on Print */}
        <div className="flex items-center justify-between print:hidden">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Dashboard</span>
          </Button>
          
          {passed && certificate && (
            <Button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Sertifikat</span>
            </Button>
          )}
        </div>

        {/* Score Banner - Hidden on Print */}
        <Card className={`p-8 border-none shadow-xl print:hidden ${
          passed 
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' 
            : 'bg-gradient-to-r from-rose-600 to-red-600 text-white'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                {passed ? (
                  <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                    <Award className="h-7 w-7 text-white" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                    <XCircle className="h-7 w-7 text-white" />
                  </div>
                )}
                <h1 className="text-2xl font-extrabold tracking-tight">
                  {passed ? 'Selamat, Anda Lulus Ujian!' : 'Maaf, Anda Belum Lulus'}
                </h1>
              </div>
              <p className="text-white/80 max-w-xl text-sm leading-relaxed">
                {passed 
                  ? 'Anda berhasil mencapai batas kelulusan (KKM). Sertifikat kelulusan Anda telah diterbitkan secara otomatis oleh sistem.'
                  : 'Hasil ujian Anda belum memenuhi nilai kriteria kelulusan minimal (KKM). Tetap semangat dan silakan hubungi pengawas untuk jadwal remedial.'
                }
              </p>
            </div>

            {/* Score Wheel */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center h-32 w-32 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-md shadow-inner">
              <span className="text-3xl font-black">{scoreNum}</span>
              <span className="text-xs text-white/70 font-semibold uppercase mt-0.5">Skor Akhir</span>
            </div>
          </div>
        </Card>

        {/* Details Grid - Hidden on Print */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
          <Card className="flex items-center gap-4 bg-white dark:bg-zinc-900/30">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-zinc-400 uppercase">Ujian</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block line-clamp-1">
                {session.assessment?.title}
              </span>
            </div>
          </Card>

          <Card className="flex items-center gap-4 bg-white dark:bg-zinc-900/30">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-zinc-400 uppercase">Selesai Pada</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                {session.end_time ? new Date(session.end_time).toLocaleString('id-ID') : '-'}
              </span>
            </div>
          </Card>

          <Card className="flex items-center gap-4 bg-white dark:bg-zinc-900/30">
            <div className="p-3 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-zinc-400 uppercase">Standar KKM</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                Skor Minimal {kkmNum}
              </span>
            </div>
          </Card>
        </div>

        {/* Certificate Rendering Box */}
        {passed && certificate && (
          <div className="space-y-4 print:space-y-0">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 print:hidden flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-500" />
              <span>Sertifikat Digital Anda</span>
            </h2>

            {/* Printable Frame */}
            <div className="p-8 sm:p-12 rounded-3xl bg-white text-zinc-950 border-[12px] border-double border-zinc-200 shadow-2xl relative flex flex-col justify-between items-center min-h-[600px] print:shadow-none print:border-zinc-300 print:rounded-none">
              
              {/* Corner Ornaments */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-zinc-400/30 print:border-zinc-500" />
              <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-zinc-400/30 print:border-zinc-500" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-zinc-400/30 print:border-zinc-500" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-zinc-400/30 print:border-zinc-500" />

              {/* Logo / Heading */}
              <div className="text-center space-y-2 mt-4">
                <div className="flex justify-center text-zinc-600 print:text-zinc-700">
                  <Award className="h-14 w-14" />
                </div>
                <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Sertifikat Kelulusan</h3>
                <p className="text-[10px] font-mono text-zinc-400 print:text-zinc-500">No. {certificate.certificate_number}</p>
              </div>

              {/* Award Body */}
              <div className="text-center space-y-6 max-w-lg my-8">
                <p className="text-sm font-serif italic text-zinc-500">Dengan bangga diberikan kepada</p>
                
                <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 border-b border-zinc-200 pb-3 font-serif">
                  {certificate.assessment_session?.user?.name || 'Peserta Ujian'}
                </h2>
                
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Telah dinyatakan <strong className="text-emerald-700">LULUS</strong> dalam menyelesaikan ujian online 
                  <br />
                  <strong className="text-zinc-900">{certificate.assessment_session?.assessment?.title}</strong>
                  <br />
                  dengan pencapaian nilai kelulusan yang memuaskan.
                </p>
              </div>

              {/* Seals and Dates */}
              <div className="w-full flex justify-between items-end border-t border-zinc-100 pt-6 mt-4">
                <div className="text-left space-y-1">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Tanggal Terbit</p>
                  <p className="text-xs font-bold text-zinc-800">
                    {new Date(certificate.issue_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                {/* Digital Seal */}
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-emerald-600/20 text-emerald-600 text-[10px] font-bold tracking-tighter uppercase p-2 text-center rotate-12">
                  Verified CBT Secure
                </div>

                <div className="text-right space-y-1">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Otoritas Penerbit</p>
                  <p className="text-xs font-bold text-zinc-800">Sistem CBT Portal</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Failed Action Card - Hidden on Print */}
        {!passed && (
          <Card className="p-8 text-center space-y-5 border-dashed border-zinc-200 dark:border-zinc-800/80 bg-zinc-500/5 print:hidden">
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
              Butuh Nilai Lebih Baik?
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              Jangan berkecil hati. Mintalah izin remedial atau ulangan kepada assessor/administrator Anda. Anda dapat kembali ke halaman utama untuk melihat ujian lainnya.
            </p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 mx-auto bg-zinc-800 hover:bg-zinc-700 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Kembali ke Menu Utama</span>
            </Button>
          </Card>
        )}

      </div>
    </div>
  );
}
