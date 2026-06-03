'use client';

import React, { useEffect, useState } from 'react';
import { assessmentRepository } from '@/infrastructure/repositories/assessmentRepository';
import { Assessment, Question } from '@/core/types';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Modal } from '@/presentation/components/Modal';
import { Input } from '@/presentation/components/Input';
import { useToastStore } from '@/presentation/components/Toast';
import { Plus, Edit2, Trash2, BookOpen, Clock, Award, Calendar, CheckSquare, Square } from 'lucide-react';
import { Spinner } from '@/presentation/components/Spinner';

export default function AssessmentsPage() {
  const addToast = useToastStore((state) => state.addToast);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [passingGrade, setPassingGrade] = useState(50.00);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  
  // Selected Questions mapping
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Record<string, boolean>>({});

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [exams, quests] = await Promise.all([
        assessmentRepository.getAssessments(),
        assessmentRepository.getQuestions(),
      ]);
      setAssessments(exams);
      setQuestions(quests);
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Gagal Memuat Data',
        message: 'Tidak dapat mengambil jadwal ujian atau daftar soal.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDateTimeLocal = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // Adjust timezone offsets for HTML5 datetime-local input (YYYY-MM-DDTHH:MM)
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localTime = new Date(date.getTime() - tzOffset);
    return localTime.toISOString().slice(0, 16);
  };

  const handleOpenCreate = () => {
    setSelectedAssessment(null);
    setTitle('');
    
    // Default dates: now and now + 7 days
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setStartDate(formatDateTimeLocal(now.toISOString()));
    setEndDate(formatDateTimeLocal(nextWeek.toISOString()));
    
    setDurationMinutes(60);
    setMaxAttempts(1);
    setPassingGrade(50.00);
    setRandomizeQuestions(false);
    setRandomizeOptions(false);
    setSelectedQuestionIds({});
    setIsOpen(true);
  };

  const handleOpenEdit = async (exam: Assessment) => {
    setLoading(true);
    try {
      // Fetch full details (which returns questions list loaded)
      const detail = await assessmentRepository.getAssessment(exam.id);
      setSelectedAssessment(detail);
      setTitle(detail.title);
      setStartDate(formatDateTimeLocal(detail.start_date));
      setEndDate(formatDateTimeLocal(detail.end_date));
      setDurationMinutes(detail.duration_minutes);
      setMaxAttempts(detail.max_attempts || 1);
      setPassingGrade(parseFloat(String(detail.passing_grade || 50.00)));
      setRandomizeQuestions(!!detail.randomize_questions);
      setRandomizeOptions(!!detail.randomize_options);

      // Map active question ids
      const mappedIds: Record<string, boolean> = {};
      if (detail.questions) {
        detail.questions.forEach((q) => {
          mappedIds[q.id] = true;
        });
      }
      setSelectedQuestionIds(mappedIds);
      setIsOpen(true);
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Gagal Memuat Detail',
        message: 'Gagal memuat rincian soal untuk ujian ini.',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionSelection = (qId: string) => {
    setSelectedQuestionIds((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    // Filter questions array payload
    const finalQuestionIds = Object.keys(selectedQuestionIds).filter((id) => selectedQuestionIds[id]);

    setSubmitting(true);
    const payload = {
      title,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      duration_minutes: Number(durationMinutes),
      max_attempts: Number(maxAttempts),
      passing_grade: Number(passingGrade),
      randomize_questions: randomizeQuestions,
      randomize_options: randomizeOptions,
      questions: finalQuestionIds, // Send questions ID array
    };

    try {
      if (selectedAssessment) {
        await assessmentRepository.updateAssessment(selectedAssessment.id, payload);
        addToast({
          type: 'success',
          title: 'Berhasil',
          message: 'Jadwal ujian berhasil diperbarui.',
        });
      } else {
        await assessmentRepository.createAssessment(payload);
        addToast({
          type: 'success',
          title: 'Berhasil',
          message: 'Jadwal ujian baru berhasil dibuat.',
        });
      }
      setIsOpen(false);
      fetchData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssessment) return;
    setSubmitting(true);
    try {
      await assessmentRepository.deleteAssessment(selectedAssessment.id);
      addToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Jadwal ujian berhasil dihapus.',
      });
      setIsDeleting(false);
      fetchData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.response?.data?.message || 'Gagal menghapus jadwal ujian dari database.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Jadwal & Agenda Ujian
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Jadwalkan lembar ujian aktif dan kelompokkan butir soal yang diujikan.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2" disabled={questions.length === 0}>
          <Plus className="h-4 w-4" />
          <span>Tambah Ujian</span>
        </Button>
      </div>

      {questions.length === 0 && !loading && (
        <Card className="p-6 bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300">
          Buat minimal **1 butir Soal** di Bank Soal terlebih dahulu sebelum Anda dapat menjadwalkan Ujian.
        </Card>
      )}

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Spinner label="Memuat Jadwal Ujian..." />
        </div>
      ) : assessments.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-white dark:bg-zinc-900/10">
          <BookOpen className="h-10 w-10 text-zinc-400 mb-3" />
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Belum Ada Ujian</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
            Klik tombol "Tambah Ujian" di atas untuk menjadwalkan ujian pertama Anda.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((exam) => (
            <Card key={exam.id} className="flex flex-col justify-between bg-white dark:bg-zinc-900/30">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 line-clamp-2">
                    {exam.title}
                  </h3>
                </div>

                <div className="space-y-2 text-sm text-zinc-650 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span>Durasi: {exam.duration_minutes} Menit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-zinc-400" />
                    <span>Passing Grade: KKM {parseFloat(String(exam.passing_grade || 50))}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-zinc-400 mt-0.5" />
                    <div className="flex flex-col text-xs">
                      <span>Mulai: {new Date(exam.start_date).toLocaleString('id-ID')}</span>
                      <span>Selesai: {new Date(exam.end_date).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(exam)}
                  className="flex items-center gap-1.5 text-blue-600 border-zinc-200 dark:border-zinc-800 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:text-blue-400 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAssessment(exam);
                    setIsDeleting(true);
                  }}
                  className="flex items-center gap-1.5 text-red-600 border-zinc-200 dark:border-zinc-800 hover:text-red-700 hover:border-red-300 hover:bg-red-50/50 dark:hover:text-red-400 dark:hover:border-red-900/50 dark:hover:bg-red-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Hapus</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedAssessment ? 'Edit Ujian' : 'Tambah Ujian'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleSave} isLoading={submitting}>
              Simpan
            </Button>
          </>
        }
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input
            label="Judul Ujian"
            placeholder="Masukkan judul ujian (misal: Ujian Akhir Semester Fisika)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={submitting}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Tanggal Mulai"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              type="datetime-local"
              label="Tanggal Selesai"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              type="number"
              label="Durasi (Menit)"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              required
              disabled={submitting}
            />
            <Input
              type="number"
              label="Max Batas Percobaan"
              min={1}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              required
              disabled={submitting}
            />
            <Input
              type="number"
              label="Kriteria Kelulusan (KKM)"
              min={0}
              max={100}
              step={0.01}
              value={passingGrade}
              onChange={(e) => setPassingGrade(parseFloat(e.target.value) || 0)}
              required
              disabled={submitting}
            />
          </div>

          <div className="flex gap-6 py-2">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={randomizeQuestions}
                onChange={(e) => setRandomizeQuestions(e.target.checked)}
                disabled={submitting}
                className="h-4.5 w-4.5 rounded border-zinc-300 focus:ring-blue-500 text-blue-600 cursor-pointer"
              />
              Acak Soal
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={randomizeOptions}
                onChange={(e) => setRandomizeOptions(e.target.checked)}
                disabled={submitting}
                className="h-4.5 w-4.5 rounded border-zinc-300 focus:ring-blue-500 text-blue-600 cursor-pointer"
              />
              Acak Opsi Pilihan
            </label>
          </div>

          {/* Question List Checklist */}
          <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
              Pilih Butir Soal yang Diujikan
            </label>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto border border-zinc-250 dark:border-zinc-800 rounded-xl p-3.5 bg-zinc-50/50 dark:bg-zinc-950/20">
              {questions.map((q) => {
                const isChecked = !!selectedQuestionIds[q.id];
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => toggleQuestionSelection(q.id)}
                    className="w-full text-left flex items-start gap-3 p-2.5 rounded-lg hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                  >
                    {isChecked ? (
                      <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Square className="h-5 w-5 text-zinc-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1">{q.content_text}</p>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{q.type === 'pg' ? 'Pilihan Ganda' : 'Esai'} • {q.difficulty}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        title="Hapus Ujian"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleting(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" isLoading={submitting}>
              Hapus Ujian
            </Button>
          </>
        }
      >
        <p className="text-zinc-650 dark:text-zinc-300 text-sm">
          Apakah Anda yakin ingin menghapus jadwal ujian <strong className="text-zinc-900 dark:text-zinc-100">{selectedAssessment?.title}</strong>? Peserta tidak akan bisa mengikuti ujian ini lagi.
        </p>
      </Modal>
    </div>
  );
}
