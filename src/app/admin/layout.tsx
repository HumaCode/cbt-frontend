'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authRepository } from '@/infrastructure/repositories/authRepository';
import { User } from '@/core/types';
import { useToastStore } from '@/presentation/components/Toast';
import { Button } from '@/presentation/components/Button';
import { ThemeToggle } from '@/presentation/components/ThemeToggle';
import { Spinner } from '@/presentation/components/Spinner';
import { Modal } from '@/presentation/components/Modal';
import { 
  GraduationCap, 
  LayoutDashboard, 
  FolderKanban, 
  HelpCircle, 
  BookOpen, 
  Users,
  ArrowLeft,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const addToast = useToastStore((state) => state.addToast);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authRepository.me();
        if (!userData.roles?.includes('Super Admin')) {
          addToast({
            type: 'error',
            title: 'Akses Ditolak',
            message: 'Anda tidak memiliki hak akses administrator.',
          });
          router.push('/dashboard');
          return;
        }
        setUser(userData);
      } catch (err) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router, addToast]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authRepository.logout();
      addToast({
        type: 'success',
        title: 'Logout Berhasil',
        message: 'Sampai jumpa kembali!',
      });
      router.push('/login');
    } catch (err) {
      console.error(err);
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Spinner label="Memverifikasi Hak Akses Admin..." />
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Kategori Soal', path: '/admin/categories', icon: FolderKanban },
    { name: 'Bank Soal', path: '/admin/questions', icon: HelpCircle },
    { name: 'Jadwal Ujian', path: '/admin/assessments', icon: BookOpen },
    { name: 'Peserta & Grup', path: '/admin/users', icon: Users },
  ];

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 sticky top-0 h-screen z-20">
        <div className="h-16 px-6 border-b border-zinc-200/60 dark:border-zinc-800/80 flex items-center gap-3 bg-white dark:bg-zinc-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
            <GraduationCap className="h-5.5 w-5.5" />
          </div>
          <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-50 dark:to-zinc-300 bg-clip-text text-transparent">Admin Panel</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200/60 dark:border-zinc-800/80 space-y-2 bg-white dark:bg-zinc-900">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="w-full justify-center gap-2 border-zinc-200 dark:border-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Portal Peserta</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full justify-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </Button>
        </div>
      </aside>

      {/* Sidebar Mobile Dialog */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-zinc-900/60 backdrop-blur-sm transition-opacity duration-300">
          <aside className="w-64 max-w-xs flex flex-col bg-white dark:bg-zinc-900 h-full shadow-2xl relative">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="h-16 px-6 border-b border-zinc-200/60 dark:border-zinc-800/80 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <GraduationCap className="h-5.5 w-5.5" />
              </div>
              <span className="font-extrabold text-base">Admin Panel</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      router.push(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-zinc-200/60 dark:border-zinc-800/80 space-y-2">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Portal Peserta</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full justify-center gap-2 text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar</span>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 flex items-center justify-between px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{user?.name}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Administrator</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
              {user?.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Dashboard Main Page Content */}
        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Konfirmasi Keluar"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            Apakah Anda yakin ingin keluar dari akun Anda? Anda harus memasukkan kredensial login kembali untuk mengakses ujian dan data Anda.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => !isLoggingOut && setIsLogoutModalOpen(false)}
              className="cursor-pointer"
              disabled={isLoggingOut}
            >
              Batal
            </Button>
            <Button
              onClick={handleLogout}
              isLoading={isLoggingOut}
              className="bg-red-600 hover:bg-red-500 text-white cursor-pointer"
            >
              {isLoggingOut ? 'Sedang proses...' : 'Keluar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
