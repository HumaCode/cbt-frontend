'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authRepository } from '@/infrastructure/repositories/authRepository';
import { assessmentRepository } from '@/infrastructure/repositories/assessmentRepository';
import { useExamStore } from '@/application/useExamStore';
import { useToastStore } from '@/presentation/components/Toast';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Modal } from '@/presentation/components/Modal';
import { ThemeToggle } from '@/presentation/components/ThemeToggle';
import { User, Assessment } from '@/core/types';
import { 
  GraduationCap, 
  LogOut, 
  Calendar, 
  Clock, 
  Award, 
  ArrowRight, 
  AlertCircle, 
  BookOpen,
  UserCheck,
  LayoutDashboard
} from 'lucide-react';

import { Spinner } from '@/presentation/components/Spinner';

export default function DashboardPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const startExamSession = useExamStore((state) => state.startExamSession);

  const [user, setUser] = useState<User | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isStartingExam, setIsStartingExam] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await authRepository.me();
        setUser(userData);

        const activeAssessments = await assessmentRepository.getAssessments({ active: 1 });
        setAssessments(activeAssessments);
      } catch (err: any) {
        console.error(err);
        addToast({
          type: 'error',
          title: 'Gagal Memuat Data',
          message: err.response?.data?.message || 'Gagal memuat profil atau daftar ujian.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addToast]);

  const handleLogout = async () => {
    try {
      await authRepository.logout();
      addToast({
        type: 'success',
        title: 'Logout Berhasil',
        message: 'Sampai jumpa kembali!',
      });
      router.push('/login');
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Logout Gagal',
        message: 'Gagal melakukan logout.',
      });
    }
  };

  const handleOpenStartModal = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsStartModalOpen(true);
  };

  const handleStartExam = async () => {
    if (!selectedAssessment) return;
    setIsStartingExam(true);
    try {
      const session = await startExamSession(selectedAssessment.id);
      addToast({
        type: 'success',
        title: 'Ujian Dimulai',
        message: 'Selamat mengerjakan ujian!',
      });
      setIsStartModalOpen(false);
      router.push(`/exam/${session.id}`);
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Gagal Memulai Ujian',
        message: err.response?.data?.message || 'Anda tidak diizinkan memulai ujian ini.',
      });
    } finally {
      setIsStartingExam(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 dark:bg-blue-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-600/5 dark:bg-indigo-600/10 blur-[120px] pointer-events-none" />
        
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/30 p-8 shadow-xl shadow-zinc-200/30 dark:shadow-none backdrop-blur-xl rounded-3xl max-w-xs w-full text-center">
          <Spinner label="Memuat Portal CBT..." />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/55 bg-white/80 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
              <GraduationCap className="h-5.5 w-5.5" />
            </div>
            <span className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Portal CBT</span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user?.roles?.includes('Super Admin') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:border-blue-950 dark:hover:bg-blue-950/20 dark:hover:text-red-300"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin Panel</span>
              </Button>
            )}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              <UserCheck className="h-4 w-4 text-blue-500" />
              <span>{user?.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-950 dark:hover:bg-red-950/20 dark:hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-xl space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight">Selamat Datang, {user?.name}!</h1>
            <p className="text-blue-100 leading-relaxed text-base">
              Siapkan diri Anda dengan baik sebelum memulai ujian. Pastikan koneksi internet stabil dan gunakan browser yang direkomendasikan.
            </p>
          </div>
        </div>

        {/* Exam List Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Daftar Ujian Aktif</h2>
          </div>

          {assessments.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed dark:bg-zinc-900/20">
              <AlertCircle className="h-10 w-10 text-zinc-400 mb-3" />
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Tidak Ada Ujian Tersedia</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                Saat ini belum ada jadwal ujian aktif untuk kelas atau kelompok Anda.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.map((assessment) => (
                <Card key={assessment.id} hoverable className="flex flex-col justify-between h-full bg-white dark:bg-zinc-900/30">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                        Aktif
                      </span>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 line-clamp-2">
                        {assessment.title}
                      </h3>
                    </div>

                    <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-zinc-400" />
                        <span>Durasi: {assessment.duration_minutes} Menit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-zinc-400" />
                        <span>Kriteria Kelulusan: KKM {assessment.passing_grade}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-zinc-400 mt-0.5" />
                        <div className="flex flex-col">
                          <span>Mulai: {new Date(assessment.start_date).toLocaleString('id-ID')}</span>
                          <span>Selesai: {new Date(assessment.end_date).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                    <Button
                      onClick={() => handleOpenStartModal(assessment)}
                      className="w-full justify-center group"
                    >
                      <span>Mulai Ujian</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        title="Konfirmasi Mulai Ujian"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsStartModalOpen(false)} disabled={isStartingExam}>
              Batal
            </Button>
            <Button onClick={handleStartExam} isLoading={isStartingExam}>
              Mulai Sekarang
            </Button>
          </>
        }
      >
        {selectedAssessment && (
          <div className="space-y-4">
            <p className="text-zinc-600 dark:text-zinc-300">
              Anda akan memulai ujian: <strong className="text-zinc-900 dark:text-zinc-100">{selectedAssessment.title}</strong>.
            </p>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-sm space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
                Peraturan & Petunjuk Ujian:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Waktu ujian adalah {selectedAssessment.duration_minutes} menit dan akan terus berjalan.</li>
                <li>Dilarang keluar dari mode fullscreen atau berpindah tab browser. Tindakan mencurigakan akan dicatat oleh sistem proctoring.</li>
                <li>Ujian akan otomatis dikirim jika waktu habis.</li>
                <li>Pastikan koneksi internet Anda stabil hingga proses selesai.</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
