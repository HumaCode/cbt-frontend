'use client';

import React, { useEffect, useState } from 'react';
import { assessmentRepository } from '@/infrastructure/repositories/assessmentRepository';
import { Question, Category, QuestionOption } from '@/core/types';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Modal } from '@/presentation/components/Modal';
import { Input } from '@/presentation/components/Input';
import { useToastStore } from '@/presentation/components/Toast';
import { Plus, Edit2, Trash2, HelpCircle, Check, X, Layers, ArrowLeft, Folder, Search, ChevronLeft, ChevronRight, FileUp, Download } from 'lucide-react';
import { Spinner } from '@/presentation/components/Spinner';
import { getMediaUrl } from '@/infrastructure/api';

export default function QuestionsPage() {
  const addToast = useToastStore((state) => state.addToast);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  
  // Category navigation state
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Load page from URL query string on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const page = parseInt(params.get('page') || '1', 10);
      if (page > 0) {
        setCurrentPage(page);
      }
    }
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', String(page));
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    handlePageChange(1); // reset to page 1 on filter
  };

  const handleCategoryChange = (catId: string | null) => {
    setActiveCategoryId(catId);
    handlePageChange(1);
    setSearchQuery(''); // reset search query on folder change
  };

  const downloadCSVTemplate = () => {
    const headers = [
      'soal',
      'tipe',
      'kesulitan',
      'pilihan_a',
      'pilihan_b',
      'pilihan_c',
      'pilihan_d',
      'pilihan_e',
      'kunci_jawaban',
      'bobot_a',
      'bobot_b',
      'bobot_c',
      'bobot_d',
      'bobot_e'
    ].join(',');
    
    const rowExample1 = [
      '"Siapakah presiden pertama Indonesia?"',
      'pg',
      'easy',
      '"Ir. Soekarno"',
      '"Moh. Hatta"',
      '"Soeharto"',
      '"B.J. Habibie"',
      '"Gus Dur"',
      'A',
      '5',
      '0',
      '0',
      '0',
      '0'
    ].join(',');
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rowExample1;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_import_soal.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || !activeCategoryId) return;

    setImporting(true);
    try {
      const result = await assessmentRepository.importQuestions(activeCategoryId, importFile);
      addToast({
        type: 'success',
        title: 'Import Berhasil',
        message: `Berhasil mengimpor ${result.imported_count} soal ke kategori ini.`,
      });
      setIsImportModalOpen(false);
      setImportFile(null);
      
      // Refresh question list
      setLoading(true);
      const data = await assessmentRepository.getQuestions({ category_id: activeCategoryId, per_page: 'all' });
      setQuestions(data);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Import Gagal',
        message: err.response?.data?.message || 'Gagal mengimpor file soal.',
      });
    } finally {
      setImporting(false);
    }
  };

  // File upload states
  const [questionImages, setQuestionImages] = useState<{
    id?: string;
    file?: File;
    previewUrl: string;
    isDeleted?: boolean;
  }[]>([]);
  const [deletedMediaIds, setDeletedMediaIds] = useState<string[]>([]);

  // Form states
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState('pg'); // 'pg' or 'essay'
  const [difficulty, setDifficulty] = useState('easy'); // 'easy', 'medium', 'hard'
  const [contentText, setContentText] = useState('');
  
  // Dynamic PG options state
  const [options, setOptions] = useState<{
    id?: string;
    option_text: string;
    is_correct: boolean;
    weight: number;
    imageFile?: File | null;
    imagePreviewUrl?: string | null;
    existingMediaUrl?: string | null;
    clear_image?: boolean;
  }[]>([
    { option_text: '', is_correct: true, weight: 10 },
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
    setCategoryId(activeCategoryId && activeCategoryId !== 'all' ? activeCategoryId : (categories[0]?.id || ''));
    setType('pg');
    setDifficulty('easy');
    setContentText('');
    setOptions([
      { option_text: '', is_correct: true, weight: 10, imageFile: null, imagePreviewUrl: null, existingMediaUrl: null },
      { option_text: '', is_correct: false, weight: 0, imageFile: null, imagePreviewUrl: null, existingMediaUrl: null },
      { option_text: '', is_correct: false, weight: 0, imageFile: null, imagePreviewUrl: null, existingMediaUrl: null },
      { option_text: '', is_correct: false, weight: 0, imageFile: null, imagePreviewUrl: null, existingMediaUrl: null },
    ]);
    setQuestionImages([]);
    setDeletedMediaIds([]);
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
          id: opt.id,
          option_text: opt.option_text,
          is_correct: !!opt.is_correct,
          weight: parseFloat(String(opt.weight || 0)),
          imageFile: null,
          imagePreviewUrl: null,
          existingMediaUrl: opt.media && opt.media.length > 0 ? getMediaUrl(opt.media[0].original_url || opt.media[0].url) : null,
        }))
      );
    } else {
      setOptions([]);
    }

    if (quest.media && quest.media.length > 0) {
      setQuestionImages(
        quest.media.map((med: any) => ({
          id: med.id,
          previewUrl: getMediaUrl(med.original_url || med.url),
        }))
      );
    } else {
      setQuestionImages([]);
    }
    setDeletedMediaIds([]);
    setIsOpen(true);
  };

  const handleAddOption = () => {
    setOptions([...options, { option_text: '', is_correct: false, weight: 0, imageFile: null, imagePreviewUrl: null, existingMediaUrl: null }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      if (field === 'is_correct' && value === true) {
        updated.forEach((opt, idx) => {
          if (idx !== index) {
            opt.is_correct = false;
            opt.weight = 0;
          } else {
            opt.weight = opt.weight || 10;
          }
        });
      }
      return updated;
    });
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
    const newAttachments = questionImages
      .filter((img) => img.file)
      .map((img) => img.file as File);

    // Filter out options with empty option_text first to align indices perfectly
    const activeOptions = type === 'pg' ? options.filter(opt => opt.option_text.trim() !== '') : [];
    const optionFiles = activeOptions.map((opt) => opt.imageFile || null);

    const payload = {
      category_id: categoryId,
      type,
      difficulty,
      content_text: contentText,
      options: type === 'pg'
        ? activeOptions.map((opt) => ({
            id: opt.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            weight: opt.weight,
            clear_image: opt.clear_image,
          }))
        : undefined,
      deleted_media_ids: deletedMediaIds.length > 0 ? deletedMediaIds : undefined,
    };

    try {
      if (selectedQuestion) {
        await assessmentRepository.updateQuestion(
          selectedQuestion.id,
          payload,
          newAttachments.length > 0 ? newAttachments : undefined,
          optionFiles
        );
        addToast({
          type: 'success',
          title: 'Berhasil',
          message: 'Soal berhasil diperbarui.',
        });
      } else {
        await assessmentRepository.createQuestion(
          payload,
          newAttachments.length > 0 ? newAttachments : undefined,
          optionFiles
        );
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

  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat.id] = questions.filter((q) => q.category_id === cat.id).length;
    return acc;
  }, {} as Record<string, number>);

  const activeCategoryName = activeCategoryId === 'all'
    ? 'Semua Soal'
    : categories.find((c) => c.id === activeCategoryId)?.name || 'Kategori';

  const filteredQuestions = activeCategoryId === 'all'
    ? questions
    : questions.filter((q) => q.category_id === activeCategoryId);

  // Search filter
  const searchedQuestions = filteredQuestions.filter((q) => {
    const text = q.content_text.toLowerCase();
    const diff = q.difficulty.toLowerCase();
    const catName = (categories.find((c) => c.id === q.category_id)?.name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return text.includes(query) || diff.includes(query) || catName.includes(query);
  });

  // Pagination calculations
  const ITEMS_PER_PAGE = 10;
  const totalItems = searchedQuestions.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const activePage = Math.min(currentPage, totalPages);
  
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedQuestions = searchedQuestions.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {activeCategoryId !== null && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCategoryChange(null)}
                className="p-2 rounded-xl text-zinc-550 border-zinc-200 hover:text-zinc-800 dark:border-zinc-800 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-550 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-blue-600" />
              Bank Soal {activeCategoryId !== null && `• ${activeCategoryName}`}
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {activeCategoryId === null
              ? 'Pilih kategori soal untuk mulai mengelola kumpulan pertanyaan.'
              : `Mengelola butir soal ujian untuk kategori ${activeCategoryName}.`}
          </p>
        </div>
        {activeCategoryId !== null && (
          <div className="flex items-center gap-2">
            {activeCategoryId !== 'all' && (
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
              >
                <FileUp className="h-4 w-4 text-zinc-500" />
                <span>Import Soal</span>
              </Button>
            )}
            <Button onClick={handleOpenCreate} className="flex items-center gap-2" disabled={categories.length === 0}>
              <Plus className="h-4 w-4" />
              <span>Tambah Soal</span>
            </Button>
          </div>
        )}
      </div>

      {categories.length === 0 && !loading && (
        <Card className="p-6 bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300">
          Buat minimal **Kategori Soal** terlebih dahulu sebelum Anda dapat membuat atau mengelola soal.
        </Card>
      )}

      {activeCategoryId !== null && filteredQuestions.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari soal berdasarkan teks pertanyaan, kategori, kesulitan, atau tipe..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white outline-none text-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Spinner label="Memuat Bank Soal..." />
        </div>
      ) : activeCategoryId === null ? (
        // Grid View of Categories (Folder Structure)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Virtual Folder "Semua Soal" */}
          <div
            onClick={() => handleCategoryChange('all')}
            className="group relative cursor-pointer overflow-hidden p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-blue-500/30"
          >
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                <Folder className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Semua Soal</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{questions.length} Butir Soal</p>
              </div>
            </div>
          </div>

          {/* Actual Categories list */}
          {categories.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            return (
              <div
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className="group relative cursor-pointer overflow-hidden p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-indigo-500/30"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                    <Folder className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{cat.name}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{count} Butir Soal</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-white dark:bg-zinc-900/10">
          <HelpCircle className="h-10 w-10 text-zinc-400 mb-3" />
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Belum Ada Soal</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
            Belum ada soal dalam kategori ini. Klik tombol "Tambah Soal" untuk menambahkan soal baru.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden bg-white dark:bg-zinc-900/30 p-0 border border-zinc-200/60 dark:border-zinc-800/80">
          {searchedQuestions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
              <Search className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Soal tidak ditemukan.</p>
              <p className="text-xs text-zinc-400 mt-1">Coba gunakan kata kunci pencarian lainnya.</p>
            </div>
          ) : (
            <>
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
                    {paginatedQuestions.map((quest) => {
                      const catName = categories.find((c) => c.id === quest.category_id)?.name || 'N/A';
                      return (
                        <tr key={quest.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-4">
                              {quest.media && quest.media.length > 0 && (
                                <div className="relative flex-shrink-0">
                                  <img
                                    src={getMediaUrl(quest.media[0].original_url || quest.media[0].url)}
                                    alt="Attachment"
                                    className="w-12 h-12 object-cover rounded-lg border border-zinc-200 dark:border-zinc-850"
                                  />
                                  {quest.media.length > 1 && (
                                    <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white dark:border-zinc-900 shadow">
                                      +{quest.media.length - 1}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 max-w-md">
                                  {quest.content_text}
                                </p>
                              </div>
                            </div>
                            {quest.type === 'pg' && quest.options && (
                              <div className="flex gap-2.5 mt-1.5 flex-wrap">
                                {quest.options.map((opt) => (
                                  <span
                                    key={opt.id}
                                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium border flex items-center gap-1.5 ${
                                      opt.is_correct
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-350 dark:border-emerald-900/50'
                                        : 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
                                    }`}
                                  >
                                    {opt.media && opt.media.length > 0 && (
                                      <img
                                        src={getMediaUrl(opt.media[0].original_url || opt.media[0].url)}
                                        alt="Opt"
                                        className="w-3.5 h-3.5 object-cover rounded"
                                      />
                                    )}
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
                              className="inline-flex items-center p-2 rounded-xl text-blue-600 border-zinc-200 dark:border-zinc-800 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:text-blue-400 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
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
                              className="inline-flex items-center p-2 rounded-xl text-red-600 border-zinc-200 dark:border-zinc-800 hover:text-red-700 hover:border-red-300 hover:bg-red-50/50 dark:hover:text-red-400 dark:hover:border-red-900/50 dark:hover:bg-red-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
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

              {/* Pagination Bar */}
              {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/10 text-xs">
                  <span className="text-zinc-500 font-medium">
                    Menampilkan <strong className="text-zinc-800 dark:text-zinc-200">{startIndex + 1}</strong> -{' '}
                    <strong className="text-zinc-800 dark:text-zinc-200">{Math.min(endIndex, totalItems)}</strong> dari{' '}
                    <strong className="text-zinc-800 dark:text-zinc-200">{totalItems}</strong> soal
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePageChange(activePage - 1)}
                      disabled={activePage === 1}
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-bold transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, pageIdx) => {
                      const pageNum = pageIdx + 1;
                      const isPageActive = pageNum === activePage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            isPageActive
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      type="button"
                      onClick={() => handlePageChange(activePage + 1)}
                      disabled={activePage === totalPages}
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-bold transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
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
        size="xl"
        hideScrollbar
      >
        <form onSubmit={handleSave} className="space-y-4">
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

          {/* Lampiran Gambar Ujian */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Lampiran Gambar Soal (Bisa lebih dari 1)
            </label>
            
            {/* Display list of images */}
            <div className="flex flex-wrap gap-3">
              {questionImages.map((img, idx) => {
                if (img.isDeleted) return null;
                return (
                  <div key={idx} className="relative w-36 h-24 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 flex-shrink-0">
                    <img
                      src={img.previewUrl}
                      alt={`Question Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (img.id) {
                          setDeletedMediaIds((prev) => [...prev, img.id!]);
                          setQuestionImages((prev) => {
                            const updated = [...prev];
                            updated[idx] = { ...updated[idx], isDeleted: true };
                            return updated;
                          });
                        } else {
                          setQuestionImages((prev) => prev.filter((_, i) => i !== idx));
                        }
                      }}
                      className="absolute top-1 right-1 bg-red-650 text-white rounded-full p-1 hover:bg-red-700 transition-colors cursor-pointer shadow-sm"
                      title="Hapus gambar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* Add New Attachment Button/Input */}
              <div className="relative w-36 h-24 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-blue-500 transition-colors flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 cursor-pointer overflow-hidden">
                <Plus className="h-6 w-6 text-zinc-400" />
                <span className="text-[10px] text-zinc-500 font-medium mt-1">Tambah Gambar</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      const newImages = Array.from(files).map((file) => ({
                        file,
                        previewUrl: URL.createObjectURL(file),
                      }));
                      setQuestionImages((prev) => [...prev, ...newImages]);
                    }
                  }}
                  disabled={submitting}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
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
                  <div key={idx} className="flex gap-3 items-center flex-wrap sm:flex-nowrap">
                    {/* Mark as Correct Answer checkbox */}
                    <button
                      type="button"
                      onClick={() => handleOptionChange(idx, 'is_correct', !opt.is_correct)}
                      className={`h-9 w-9 rounded-xl border flex-shrink-0 flex items-center justify-center transition-all ${
                        opt.is_correct
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25'
                          : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-zinc-300'
                      }`}
                    >
                      <Check className="h-4.5 w-4.5" />
                    </button>

                    {/* Option Image Thumbnail & Upload */}
                    <div className="relative h-9 w-12 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex-shrink-0 flex items-center justify-center overflow-hidden group/optimg">
                      {opt.imagePreviewUrl || (opt.existingMediaUrl && !opt.clear_image) ? (
                        <>
                          <img
                            src={opt.imagePreviewUrl || opt.existingMediaUrl || ''}
                            alt="Option image"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (opt.existingMediaUrl) {
                                handleOptionChange(idx, 'clear_image', true);
                              }
                              handleOptionChange(idx, 'imageFile', null);
                              handleOptionChange(idx, 'imagePreviewUrl', null);
                            }}
                            className="absolute inset-0 bg-red-650 text-white opacity-0 group-hover/optimg:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                            title="Hapus gambar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 text-zinc-400" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleOptionChange(idx, 'imageFile', file);
                                handleOptionChange(idx, 'imagePreviewUrl', URL.createObjectURL(file));
                                handleOptionChange(idx, 'clear_image', false);
                              }
                            }}
                            disabled={submitting}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </>
                      )}
                    </div>

                    {/* Option Text Input */}
                    <input
                      placeholder={`Opsi Jawaban ${idx + 1}`}
                      value={opt.option_text}
                      onChange={(e) => handleOptionChange(idx, 'option_text', e.target.value)}
                      disabled={submitting}
                      className="flex-1 min-w-[120px] px-4 py-2 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white outline-none text-sm"
                    />

                    {/* Score Weight input */}
                    <div className="w-20">
                      <input
                        type="number"
                        placeholder="Skor"
                        value={opt.weight}
                        onChange={(e) => handleOptionChange(idx, 'weight', parseFloat(e.target.value) || 0)}
                        disabled={submitting}
                        className="w-full px-2 py-2 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white outline-none text-sm text-center"
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
        <p className="text-zinc-600 dark:text-zinc-300 text-sm">
          Apakah Anda yakin ingin menghapus soal ini dari database? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>

      {/* Import Questions Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Soal (Excel/CSV)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsImportModalOpen(false)} disabled={importing}>
              Batal
            </Button>
            <Button
              onClick={handleImport}
              className="bg-blue-650 hover:bg-blue-700 text-white"
              isLoading={importing}
              disabled={!importFile}
            >
              Proses Import
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-[11px] text-blue-700 dark:text-blue-300 space-y-2 max-h-[300px] overflow-y-auto">
            <p className="font-bold text-xs">Panduan Format File Import:</p>
            <p>1. Mendukung format file **.csv**, **.xlsx**, atau **.xls**.</p>
            <p>2. Header kolom yang dikenali (tidak sensitif huruf besar/kecil):</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><code className="font-semibold bg-white/60 dark:bg-zinc-900/60 px-1 py-0.5 rounded">soal</code> / <code className="font-semibold bg-white/60 dark:bg-zinc-900/60 px-1 py-0.5 rounded">content_text</code>: Isi teks pertanyaan (wajib).</li>
              <li><code className="font-semibold bg-white/60 dark:bg-zinc-900/60 px-1 py-0.5 rounded">pilihan_a</code> s.d. <code className="font-semibold bg-white/60 dark:bg-zinc-900/60 px-1 py-0.5 rounded">pilihan_e</code>: Pilihan jawaban untuk Pilihan Ganda (PG).</li>
              <li><code className="font-semibold bg-white/60 dark:bg-zinc-900/60 px-1 py-0.5 rounded">kunci_jawaban</code> / <code className="font-semibold bg-white/60 dark:bg-zinc-900/60 px-1 py-0.5 rounded">correct_option</code>: Huruf kunci jawaban (A/B/C/D/E, wajib untuk PG).</li>
              <li><code className="font-semibold bg-white/60 dark:bg-zinc-900/60 px-1 py-0.5 rounded">bobot_a</code> s.d. <code className="font-semibold bg-white/60 dark:bg-zinc-900/60 px-1 py-0.5 rounded">bobot_e</code>: Skor bobot tiap opsi (opsional, jika kosong default 5 untuk opsi benar dan 0 untuk salah).</li>
              <li><code className="font-semibold bg-white/60 dark:bg-zinc-900/60 px-1 py-0.5 rounded">tipe</code> / <code className="font-semibold bg-white/60 dark:bg-zinc-900/60 px-1 py-0.5 rounded">type</code>: <code className="italic">pg</code> atau <code className="italic">essay</code> (default <code className="italic">pg</code>).</li>
              <li><code className="font-semibold bg-white/60 dark:bg-zinc-900/60 px-1 py-0.5 rounded">kesulitan</code> / <code className="font-semibold bg-white/60 dark:bg-zinc-900/60 px-1 py-0.5 rounded">difficulty</code>: <code className="italic">easy</code>, <code className="italic">medium</code>, atau <code className="italic">hard</code>.</li>
            </ul>
            <button
              type="button"
              onClick={downloadCSVTemplate}
              className="mt-2.5 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Template CSV Contoh</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Pilih File Soal</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileUp className="w-10 h-10 text-zinc-400 mb-2" />
                  {importFile ? (
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{importFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400"><span className="font-semibold">Klik untuk upload</span> atau drag & drop file</p>
                      <p className="text-xs text-zinc-400 mt-1">Format .csv, .xlsx, atau .xls</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={importing}
                />
              </label>
            </div>
            {importFile && (
              <div className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200 dark:border-zinc-900 mt-2">
                <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">{importFile.name}</span>
                <button
                  type="button"
                  onClick={() => setImportFile(null)}
                  className="text-red-500 hover:text-red-700 font-semibold"
                  disabled={importing}
                >
                  Hapus
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
