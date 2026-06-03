'use client';

import React, { useEffect, useState } from 'react';
import { assessmentRepository } from '@/infrastructure/repositories/assessmentRepository';
import { Category } from '@/core/types';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Modal } from '@/presentation/components/Modal';
import { Input } from '@/presentation/components/Input';
import { useToastStore } from '@/presentation/components/Toast';
import { Plus, Edit2, Trash2, FolderKanban, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from '@/presentation/components/Spinner';

export default function CategoriesPage() {
  const addToast = useToastStore((state) => state.addToast);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await assessmentRepository.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Gagal Memuat Kategori',
        message: 'Tidak dapat mengambil data kategori dari server.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setName('');
    setDescription('');
    setIsOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (selectedCategory) {
        // Edit
        await assessmentRepository.updateCategory(selectedCategory.id, { name, description });
        addToast({
          type: 'success',
          title: 'Berhasil',
          message: 'Kategori berhasil diperbarui.',
        });
      } else {
        // Create
        await assessmentRepository.createCategory({ name, description });
        addToast({
          type: 'success',
          title: 'Berhasil',
          message: 'Kategori baru berhasil ditambahkan.',
        });
      }
      setIsOpen(false);
      fetchCategories();
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
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      await assessmentRepository.deleteCategory(selectedCategory.id);
      addToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Kategori berhasil dihapus.',
      });
      setIsDeleting(false);
      fetchCategories();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.response?.data?.message || 'Gategori ini kemungkinan sedang digunakan oleh soal.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter categories by search query
  const filteredCategories = categories.filter((cat) => {
    const name = cat.name.toLowerCase();
    const desc = (cat.description || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || desc.includes(query);
  });

  // Pagination calculations
  const ITEMS_PER_PAGE = 10;
  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const activePage = Math.min(currentPage, totalPages);
  
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-blue-600" />
            Manajemen Kategori Soal
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Daftar kelompok kategori bidang studi atau materi ujian.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Tambah Kategori</span>
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari kategori berdasarkan nama atau deskripsi..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white outline-none text-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Spinner label="Memuat data kategori..." />
        </div>
      ) : categories.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-white dark:bg-zinc-900/10">
          <FolderKanban className="h-10 w-10 text-zinc-400 mb-3" />
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Belum Ada Kategori</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
            Klik tombol "Tambah Kategori" di atas untuk menambahkan kategori pertama Anda.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden bg-white dark:bg-zinc-900/30 p-0 border border-zinc-200/60 dark:border-zinc-800/80">
          {filteredCategories.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
              <Search className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Kategori tidak ditemukan.</p>
              <p className="text-xs text-zinc-400 mt-1">Coba gunakan kata kunci pencarian lainnya.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200/60 dark:border-zinc-800/80">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-1/4">Nama Kategori</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Deskripsi</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right w-36">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/80">
                    {paginatedCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                        <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">{cat.name}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{cat.description || '-'}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(cat)}
                            className="inline-flex items-center p-2 rounded-xl text-blue-600 border-zinc-200 dark:border-zinc-800 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:text-blue-400 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCategory(cat);
                              setIsDeleting(true);
                            }}
                            className="inline-flex items-center p-2 rounded-xl text-red-600 border-zinc-200 dark:border-zinc-800 hover:text-red-700 hover:border-red-300 hover:bg-red-50/50 dark:hover:text-red-400 dark:hover:border-red-900/50 dark:hover:bg-red-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/10 text-xs">
                  <span className="text-zinc-500 font-medium">
                    Menampilkan <strong className="text-zinc-800 dark:text-zinc-200">{startIndex + 1}</strong> -{' '}
                    <strong className="text-zinc-800 dark:text-zinc-200">{Math.min(endIndex, totalItems)}</strong> dari{' '}
                    <strong className="text-zinc-800 dark:text-zinc-200">{totalItems}</strong> kategori
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
        title={selectedCategory ? 'Edit Kategori' : 'Tambah Kategori'}
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
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nama Kategori"
            placeholder="Masukkan nama kategori (misal: Matematika)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submitting}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Deskripsi (Opsional)</label>
            <textarea
              placeholder="Deskripsi singkat kategori ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              className="w-full p-3 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white outline-none min-h-[100px] text-sm"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        title="Hapus Kategori"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleting(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" isLoading={submitting}>
              Hapus Kategori
            </Button>
          </>
        }
      >
        <p className="text-zinc-600 dark:text-zinc-300 text-sm">
          Apakah Anda yakin ingin menghapus kategori <strong className="text-zinc-900 dark:text-zinc-100">{selectedCategory?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
