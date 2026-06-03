'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authRepository } from '@/infrastructure/repositories/authRepository';
import { Input } from '@/presentation/components/Input';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { useToastStore } from '@/presentation/components/Toast';
import { KeyRound, Mail, GraduationCap, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((state) => state.addToast);

  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!loginInput) newErrors.login = 'Email atau username wajib diisi.';
    if (!passwordInput) newErrors.password = 'Password wajib diisi.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authRepository.login(loginInput, passwordInput);
      addToast({
        type: 'success',
        title: 'Login Berhasil',
        message: `Selamat datang kembali, ${response.user.name}!`,
      });

      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (err: any) {
      setIsLoading(false);
      console.error(err);

      if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        const mappedErrors: Record<string, string> = {};
        
        Object.keys(backendErrors).forEach((key) => {
          if (Array.isArray(backendErrors[key]) && backendErrors[key].length > 0) {
            mappedErrors[key] = backendErrors[key][0];
          }
        });
        setErrors(mappedErrors);
      }

      addToast({
        type: 'error',
        title: 'Login Gagal',
        message: err.response?.data?.message || 'Kredensial salah atau akun dinonaktifkan.',
      });
    }
  };

  return (
    <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/30 p-8 shadow-xl shadow-zinc-200/30 dark:shadow-none backdrop-blur-xl rounded-3xl">
      <form className="space-y-6" onSubmit={handleLogin}>
        <div className="relative">
          <div className="absolute top-[34px] left-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            <Mail className="h-4.5 w-4.5" />
          </div>
          <Input
            label="Email atau Username"
            placeholder="candidat@email.com atau username"
            type="text"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            error={errors.login}
            className="pl-10 border-zinc-250 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-650"
            disabled={isLoading}
          />
        </div>

        <div className="relative">
          <div className="absolute top-[34px] left-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            <KeyRound className="h-4.5 w-4.5" />
          </div>
          <Input
            label="Kata Sandi"
            placeholder="••••••••"
            type={showPassword ? "text" : "password"}
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            error={errors.password}
            className="pl-10 pr-10 border-zinc-250 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-650"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-[34px] right-3.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-blue-650 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-zinc-600 dark:text-zinc-400 cursor-pointer font-medium">
              Ingat saya
            </label>
          </div>
          <a href="#" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            Lupa sandi?
          </a>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full justify-center bg-gradient-to-r from-blue-650 to-indigo-650 hover:from-blue-600 hover:to-indigo-600 text-white py-3 rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Masuk Sekarang
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Belum terdaftar?{' '}
        <a href="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
          Buat akun baru
        </a>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 dark:bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-600/5 dark:bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20 shadow-md">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Portal Ujian CBT
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Masuk untuk memulai pengerjaan ujian Anda
          </p>
        </div>

        <Suspense fallback={
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/30 p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center min-h-[300px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-3">Memuat form login...</p>
          </Card>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
