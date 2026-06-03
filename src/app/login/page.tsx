'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authRepository } from '@/infrastructure/repositories/authRepository';
import { Input } from '@/presentation/components/Input';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { useToastStore } from '@/presentation/components/Toast';
import { KeyRound, Mail, GraduationCap } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((state) => state.addToast);

  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
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
    <Card className="border-white/5 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl">
      <form className="space-y-6" onSubmit={handleLogin}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 mt-6">
            <Mail className="h-5 w-5" />
          </div>
          <Input
            label="Email atau Username"
            placeholder="candidat@email.com atau username"
            type="text"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            error={errors.login}
            className="pl-10 text-white placeholder-zinc-500 border-zinc-700/50 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 mt-6">
            <KeyRound className="h-5 w-5" />
          </div>
          <Input
            label="Kata Sandi"
            placeholder="••••••••"
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            error={errors.password}
            className="pl-10 text-white placeholder-zinc-500 border-zinc-700/50 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-zinc-400">
              Ingat saya
            </label>
          </div>
          <a href="#" className="font-medium text-blue-400 hover:text-blue-300">
            Lupa sandi?
          </a>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl shadow-lg shadow-blue-500/20"
        >
          Masuk Sekarang
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-400">
        Belum terdaftar?{' '}
        <a href="/register" className="font-medium text-blue-400 hover:text-blue-300">
          Buat akun baru
        </a>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-950 to-zinc-900 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-inner">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
            Portal Ujian CBT
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Masuk untuk memulai pengerjaan ujian Anda
          </p>
        </div>

        <Suspense fallback={
          <Card className="border-white/5 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center min-h-[300px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="text-zinc-400 text-xs mt-3">Memuat form login...</p>
          </Card>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
