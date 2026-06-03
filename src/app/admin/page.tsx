'use client';

import React, { useEffect, useState } from 'react';
import { assessmentRepository } from '@/infrastructure/repositories/assessmentRepository';
import { Card } from '@/presentation/components/Card';
import { FolderKanban, HelpCircle, BookOpen, UserCheck, Shield } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    categories: 0,
    questions: 0,
    assessments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [cats, quests, exams] = await Promise.all([
          assessmentRepository.getCategories(),
          assessmentRepository.getQuestions(),
          assessmentRepository.getAssessments(),
        ]);
        setStats({
          categories: cats.length,
          questions: quests.length,
          assessments: exams.length,
        });
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 font-medium">Memuat Statistik...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Kategori Soal',
      value: stats.categories,
      icon: FolderKanban,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400',
      description: 'Pengelompokan bidang studi / sub-materi',
    },
    {
      name: 'Total Soal',
      value: stats.questions,
      icon: HelpCircle,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400',
      description: 'Kumpulan soal pilihan ganda & esai di database',
    },
    {
      name: 'Jadwal Ujian',
      value: stats.assessments,
      icon: BookOpen,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400',
      description: 'Ujian aktif yang dijadwalkan untuk kelas/grup',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.name} className="flex items-start gap-5 p-6 bg-white dark:bg-zinc-900/30">
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

      {/* Helper Instructions */}
      <Card className="p-6 bg-gradient-to-r from-blue-600/10 to-indigo-600/5 border-blue-500/10 dark:bg-blue-950/5">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-3">
          💡 Petunjuk Penggunaan Admin Panel
        </h2>
        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-decimal pl-5">
          <li><strong>Buat Kategori Soal</strong> terlebih dahulu pada menu "Kategori Soal" (misal: Matematika, Bahasa Indonesia).</li>
          <li><strong>Tambahkan Soal</strong> pada menu "Bank Soal". Anda bisa memilih tipe Pilihan Ganda (PG) dengan opsi kunci jawaban/bobot skor, atau tipe Esai.</li>
          <li><strong>Jadwalkan Ujian</strong> di menu "Jadwal Ujian". Tentukan nama ujian, durasi, KKM kelulusan, dan pilih soal mana saja yang dimasukkan ke dalam ujian tersebut.</li>
          <li>Ujian yang sudah dibuat akan langsung muncul di dashboard portal peserta kelas yang bersangkutan.</li>
        </ul>
      </Card>
    </div>
  );
}
