'use client';

import React, { useEffect, useState } from 'react';
import { assessmentRepository } from '@/infrastructure/repositories/assessmentRepository';
import { Spinner } from '@/presentation/components/Spinner';
import { Card } from '@/presentation/components/Card';
import { 
  FolderKanban, 
  HelpCircle, 
  BookOpen, 
  UserCheck, 
  Shield, 
  ShieldAlert, 
  Activity, 
  Clock, 
  ArrowUpRight, 
  Award,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await assessmentRepository.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner label="Memuat Statistik Dashboard..." />
      </div>
    );
  }

  // Format Date Helper
  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  };

  const statCards = [
    {
      name: 'Kategori Soal',
      value: stats.categories_count,
      icon: FolderKanban,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400',
      description: 'Pengelompokan bidang studi / sub-materi',
    },
    {
      name: 'Total Soal',
      value: stats.questions_count,
      icon: HelpCircle,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400',
      description: 'Kumpulan soal pilihan ganda & esai',
    },
    {
      name: 'Jadwal Ujian',
      value: stats.assessments_count,
      icon: BookOpen,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400',
      description: `${stats.active_assessments_count} Jadwal Sedang Aktif / Berjalan`,
    },
    {
      name: 'Total Sesi Ujian',
      value: stats.total_sessions_count,
      icon: UserCheck,
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/20 dark:text-violet-400',
      description: 'Sesi ujian peserta terdaftar',
    },
    {
      name: 'Tingkat Kelulusan',
      value: `${stats.passing_rate}%`,
      icon: Award,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400',
      description: `${stats.passed_sessions_count} dari ${stats.finished_sessions_count} sesi ujian lulus KKM`,
    },
    {
      name: 'Pelanggaran Layar',
      value: stats.violations_count,
      icon: ShieldAlert,
      color: stats.violations_count > 0 
        ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 animate-pulse'
        : 'text-zinc-600 bg-zinc-50 dark:bg-zinc-950/20 dark:text-zinc-400',
      description: 'Aktivitas keluar layar / pindah tab browser',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2.5">
          <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          Dashboard Admin
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Selamat datang di halaman manajemen ujian. Kelola bank soal, kategori, dan jadwal ujian di sini.
        </p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.name} className="flex items-start gap-5 p-6 bg-white dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className={`p-4 rounded-2xl ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{card.name}</p>
                <h3 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{card.value}</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium pt-1">{card.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Two Column Layout: Question Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Question Distribution */}
        <Card className="p-6 bg-white dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-blue-600" />
              Distribusi Soal per Kategori
            </h2>
            <span className="text-xs text-zinc-500 font-semibold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
              Top 5 Terbanyak
            </span>
          </div>

          <div className="space-y-5">
            {stats.question_distribution.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">Belum ada kategori dengan soal.</p>
            ) : (
              stats.question_distribution.map((cat: any) => {
                // Calculate percentage against total questions count
                const totalQ = stats.questions_count || 1;
                const percentage = Math.round((cat.count / totalQ) * 100);

                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[70%]">{cat.name}</span>
                      <span className="text-zinc-500">{cat.count} Soal ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Column: Recent Activity */}
        <Card className="p-6 bg-white dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Aktivitas Ujian Terbaru
            </h2>
            <span className="text-xs text-zinc-500 font-semibold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
              Sesi Terbaru
            </span>
          </div>

          <div className="space-y-4">
            {stats.recent_sessions.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">Belum ada aktivitas ujian saat ini.</p>
            ) : (
              stats.recent_sessions.map((sess: any) => (
                <div key={sess.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-950/10 text-xs">
                  <div className="space-y-1 min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{sess.candidate_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        sess.status === 'finished' || sess.status === 'force_submitted'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : sess.status === 'started' || sess.status === 'inprogress'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-850 dark:text-zinc-400'
                      }`}>
                        {sess.status === 'force_submitted' ? 'Selesai (Paksa)' : sess.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate">{sess.assessment_title}</p>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(sess.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-semibold text-zinc-400 uppercase">Skor</span>
                    <span className="font-black text-lg text-blue-600 dark:text-blue-400">
                      {sess.score !== null ? sess.score : '—'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Helper Instructions */}
      <Card className="p-6 bg-gradient-to-r from-blue-600/10 to-indigo-600/5 border border-blue-500/10 dark:bg-blue-950/5">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-3">
          💡 Petunjuk Penggunaan Admin Panel
        </h2>
        <ul className="space-y-2 text-sm text-zinc-650 dark:text-zinc-400 list-decimal pl-5">
          <li><strong>Buat Kategori Soal</strong> terlebih dahulu pada menu "Kategori Soal" (misal: Matematika, Bahasa Indonesia).</li>
          <li><strong>Tambahkan Soal</strong> pada menu "Bank Soal". Anda bisa memilih tipe Pilihan Ganda (PG) dengan opsi kunci jawaban/bobot skor, atau tipe Esai.</li>
          <li><strong>Jadwalkan Ujian</strong> di menu "Jadwal Ujian". Tentukan nama ujian, durasi, KKM kelulusan, dan pilih soal mana saja yang dimasukkan ke dalam ujian tersebut.</li>
          <li>Ujian yang sudah dibuat akan langsung muncul di dashboard portal peserta kelas yang bersangkutan.</li>
        </ul>
      </Card>
    </div>
  );
}
