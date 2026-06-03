'use client';

import React, { useEffect, useState } from 'react';
import { assessmentRepository } from '@/infrastructure/repositories/assessmentRepository';
import { Question, Category, QuestionOption } from '@/core/types';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Modal } from '@/presentation/components/Modal';
import { Input } from '@/presentation/components/Input';
import { useToastStore } from '@/presentation/components/Toast';
import { Plus, Edit2, Trash2, HelpCircle, Check, X, Layers } from 'lucide-react';

export default function QuestionsPage() {
  const addToast = useToastStore((state) => state.addToast);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Form states
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState('pg'); // 'pg' or 'essay'
  const [difficulty, setDifficulty] = useState('easy'); // 'easy', 'medium', 'hard'
  const [contentText, setContentText] = useState('');
  
  // Dynamic PG options state
  const [options, setOptions] = useState<{ option_text: string; is_correct: boolean; weight: number }[]>([
    { option_text: '', is_correct: false, weight: 0 },
    { option_text: '', is_correct: false, weight: 0 },
  ]);

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quests, cats] = await Promise.all([
        assessmentRepository.getQuestions(),
        assessmentRepository.getCategories(),
      ]);
      setQuestions(quests);
      setCategories(cats);
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Gagal Memuat Data',
        message: 'Tidak dapat mengambil data soal atau kategori.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedQuestion(null);
    setCategoryId(categories[0]?.id || '');
    setType('pg');
    setDifficulty('easy');
    setContentText('');
    setOptions([
      { option_text: '', is_correct: true, weight: 10 },
      { option_text: '', is_correct: false, weight: 0 },
      { option_text: '', is_correct: false, weight: 0 },
      { option_text: '', is_correct: false, weight: 0 },
    ]);
    setIsOpen(true);
  };

  const handleOpenEdit = (quest: Question) => {
    setSelectedQuestion(quest);
    setCategoryId(quest.category_id);
    setType(quest.type);
    setDifficulty(quest.difficulty);
    setContentText(quest.content_text);
    
    if (quest.type === 'pg' && quest.options) {
      setOptions(
        quest.options.map((opt) => ({
          option_text: opt.option_text,
          is_correct: !!opt.is_correct,
          weight: parseFloat(String(opt.weight || 0)),
        }))
      );
    } else {
      setOptions([]);
    }
    setIsOpen(true);
  };

  const handleAddOption = () => {
    setOptions([...options, { option_text: '', is_correct: false, weight: 0 }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    const updated = [...options];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    // If setting correct, optionally reset other options if only 1 is allowed correct
    if (field === 'is_correct' && value === true) {
      updated.forEach((opt, idx) => {
        if (idx !== index) {
          opt.is_correct = false;
          opt.weight = 0;
        } else {
          opt.weight = opt.weight || 10; // Default weight for correct answer
        }
      });
    }
    setOptions(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !contentText.trim()) {
      addToast({
        type: 'warning',
        title: 'Formulir Belum Lengkap',
        message: 'Kategori dan konten soal wajib diisi.',
      });
      return;
    }

    if (type === 'pg') {
      const validOptions = options.filter(opt => opt.option_text.trim() !== '');
      if (validOptions.length < 2) {
        addToast({
          type: 'warning',
          title: 'Opsi Jawaban Kurang',
          message: 'Ujian pilihan ganda memerlukan minimal 2 opsi jawaban.',
        });
        return;
      }
      const hasCorrect = validOptions.some(opt => opt.is_correct);
      if (!hasCorrect) {
        addToast({
          type: 'warning',
          title: 'Kunci Jawaban Belum Dipilih',
          message: 'Pilih minimal satu jawaban benar untuk soal Pilihan Ganda.',
        });
        return;
      }
    }

    setSubmitting(true);
    const payload = {
      category_id: categoryId,
      type,
      difficulty,
      content_text: contentText,
      options: type === 'pg' ? options.filter(opt => opt.option_text.trim() !== '') : undefined,
    };

    try {
      if (selectedQuestion) {
        await assessmentRepository.updateQuestion(selectedQuestion.id, payload);
        addToast({
          type: 'success',
          title: 'Berhasil',
          message: 'Soal berhasil diperbarui.',
        });
      } else {
        await assessmentRepository.createQuestion(payload);
        addToast({
          type: 'success',
          title: 'Berhasil',
          message: 'Soal baru berhasil ditambahkan.',
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
    if (!selectedQuestion) return;
    setSubmitting(true);
    try {
      await assessmentRepository.deleteQuestion(selectedQuestion.id);
      addToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Soal berhasil dihapus.',
      });
      setIsDeleting(false);
      fetchData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.response?.data?.message || 'Gagal menghapus soal dari database.',
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
            <HelpCircle className="h-6 w-6 text-blue-600" />
            Bank Soal
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Kelola koleksi soal ujian pilihan ganda dan esai Anda.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2" disabled={categories.length === 0}>
          <Plus className="h-4 w-4" />
          <span>Tambah Soal</span>
        </Button>
      </div>

      {categories.length === 0 && !loading && (
        <Card className="p-6 bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300">
          Buat minimal **Kategori Soal** terlebih dahulu sebelum Anda dapat membuat atau mengelola soal.
        </Card>
      )}

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-zinc-500 font-medium">Memuat Bank Soal...</p>
          </div>
        </div>
      ) : questions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-white dark:bg-zinc-900/10">
          <HelpCircle className="h-10 w-10 text-zinc-400 mb-3" />
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Belum Ada Soal</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
            Klik tombol "Tambah Soal" di atas untuk menambahkan butir pertanyaan pertama Anda.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden bg-white dark:bg-zinc-900/30 p-0 border border-zinc-200/60 dark:border-zinc-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200/60 dark:border-zinc-800/80">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Pertanyaan</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-36">Kategori</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-28">Tipe</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-28">Kesulitan</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/80">
                {questions.map((quest) => {
                  const catName = categories.find((c) => c.id === quest.category_id)?.name || 'N/A';
                  return (
                    <tr key={quest.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 max-w-md">
                          {quest.content_text}
                        </p>
                        {quest.type === 'pg' && quest.options && (
                          <div className="flex gap-2.5 mt-1.5 flex-wrap">
                            {quest.options.map((opt) => (
                              <span
                                key={opt.id}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                                  opt.is_correct
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-350 dark:border-emerald-900/50'
                                    : 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
                                }`}
                              >
                                {opt.option_text} {opt.is_correct && `( Skor: ${parseFloat(String(opt.weight || 0))} )`}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        <span className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-zinc-400" />
                          {catName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold uppercase">
                        <span className={`inline-flex px-2 py-0.5 rounded-full ${
                          quest.type === 'pg'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                            : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                        }`}>
                          {quest.type === 'pg' ? 'Pilihan Ganda' : 'Esai'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold capitalize">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg ${
                          quest.difficulty === 'hard'
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                            : quest.difficulty === 'medium'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                        }`}>
                          {quest.difficulty === 'easy' ? 'Mudah' : quest.difficulty === 'medium' ? 'Sedang' : 'Sulit'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(quest)}
                          className="inline-flex items-center p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedQuestion(quest);
                            setIsDeleting(true);
                          }}
                          className="inline-flex items-center p-2 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedQuestion ? 'Edit Soal' : 'Tambah Soal'}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white outline-none text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Type Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipe Soal</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white outline-none text-sm"
              >
                <option value="pg">Pilihan Ganda</option>
                <option value="essay">Esai</option>
              </select>
            </div>

            {/* Difficulty Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tingkat Kesulitan</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white outline-none text-sm"
              >
                <option value="easy">Mudah</option>
                <option value="medium">Sedang</option>
                <option value="hard">Sulit</option>
              </select>
            </div>
          </div>

          {/* Question Textarea */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Konten Pertanyaan / Soal</label>
            <textarea
              placeholder="Tuliskan butir pertanyaan ujian di sini..."
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              required
              disabled={submitting}
              className="w-full p-4 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white outline-none min-h-[120px] text-sm"
            />
          </div>

          {/* Multiple Choice Options Panel */}
          {type === 'pg' && (
            <div className="space-y-3 pt-3 border-t border-zinc-250 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Opsi Pilihan Jawaban</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  disabled={submitting}
                >
                  Tambah Opsi
                </Button>
              </div>

              <div className="space-y-3">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    {/* Mark as Correct Answer checkbox */}
                    <button
                      type="button"
                      onClick={() => handleOptionChange(idx, 'is_correct', !opt.is_correct)}
                      className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all ${
                        opt.is_correct
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25'
                          : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-zinc-300'
                      }`}
                    >
                      <Check className="h-4.5 w-4.5" />
                    </button>

                    {/* Option Text Input */}
                    <input
                      placeholder={`Opsi Jawaban ${idx + 1}`}
                      value={opt.option_text}
                      onChange={(e) => handleOptionChange(idx, 'option_text', e.target.value)}
                      disabled={submitting}
                      className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white outline-none text-sm"
                    />

                    {/* Score Weight input */}
                    <div className="w-24">
                      <input
                        type="number"
                        placeholder="Skor"
                        value={opt.weight}
                        onChange={(e) => handleOptionChange(idx, 'weight', parseFloat(e.target.value) || 0)}
                        disabled={submitting}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white outline-none text-sm text-center"
                      />
                    </div>

                    {/* Remove Option Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveOption(idx)}
                      disabled={options.length <= 2 || submitting}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-2.5"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        title="Hapus Soal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleting(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" isLoading={submitting}>
              Hapus Soal
            </Button>
          </>
        }
      >
        <p className="text-zinc-650 dark:text-zinc-300 text-sm">
          Apakah Anda yakin ingin menghapus soal ini dari database? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
