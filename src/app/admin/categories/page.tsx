'use client';

import React, { useEffect, useState } from 'react';
import { assessmentRepository } from '@/infrastructure/repositories/assessmentRepository';
import { Category } from '@/core/types';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Modal } from '@/presentation/components/Modal';
import { Input } from '@/presentation/components/Input';
import { useToastStore } from '@/presentation/components/Toast';
import { Plus, Edit2, Trash2, FolderKanban } from 'lucide-react';

export default function CategoriesPage() {
  const addToast = useToastStore((state) => state.addToast);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-zinc-500 font-medium">Memuat data kategori...</p>
          </div>
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
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">{cat.name}</td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{cat.description || '-'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(cat)}
                        className="inline-flex items-center p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20"
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
                        className="inline-flex items-center p-2 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <p className="text-zinc-650 dark:text-zinc-300 text-sm">
          Apakah Anda yakin ingin menghapus kategori <strong className="text-zinc-900 dark:text-zinc-100">{selectedCategory?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
