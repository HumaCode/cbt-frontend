'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authRepository } from '@/infrastructure/repositories/authRepository';
import { Input } from '@/presentation/components/Input';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { useToastStore } from '@/presentation/components/Toast';
import { UserPlus, User, Mail, Lock, GraduationCap } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!name) newErrors.name = 'Nama lengkap wajib diisi.';
    if (!username) newErrors.username = 'Username wajib diisi.';
    if (!email) newErrors.email = 'Email wajib diisi.';
    if (!password) newErrors.password = 'Password wajib diisi.';
    if (password !== passwordConfirmation) {
      newErrors.password_confirmation = 'Konfirmasi password tidak cocok.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      await authRepository.register(name, username, email, password, passwordConfirmation);
      addToast({
        type: 'success',
        title: 'Registrasi Berhasil',
        message: 'Akun Anda berhasil dibuat. Silakan login.',
      });
      router.push('/login');
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
        title: 'Registrasi Gagal',
        message: err.response?.data?.message || 'Gagal mendaftarkan akun baru.',
      });
    }
  };

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
            Daftarkan diri Anda untuk mengikuti ujian online
          </p>
        </div>

        <Card className="border-white/5 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl">
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 mt-6">
                <User className="h-5 w-5" />
              </div>
              <Input
                label="Nama Lengkap"
                placeholder="John Doe"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                className="pl-10 text-white placeholder-zinc-500 border-zinc-700/50 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 mt-6">
                <UserPlus className="h-5 w-5" />
              </div>
              <Input
                label="Username"
                placeholder="johndoe"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={errors.username}
                className="pl-10 text-white placeholder-zinc-500 border-zinc-700/50 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 mt-6">
                <Mail className="h-5 w-5" />
              </div>
              <Input
                label="Alamat Email"
                placeholder="johndoe@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                className="pl-10 text-white placeholder-zinc-500 border-zinc-700/50 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 mt-6">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                label="Kata Sandi"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                className="pl-10 text-white placeholder-zinc-500 border-zinc-700/50 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 mt-6">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                label="Konfirmasi Kata Sandi"
                placeholder="••••••••"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                error={errors.password_confirmation}
                className="pl-10 text-white placeholder-zinc-500 border-zinc-700/50 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl shadow-lg shadow-blue-500/20 mt-2"
            >
              Daftar Sekarang
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-400">
            Sudah punya akun?{' '}
            <a href="/login" className="font-medium text-blue-400 hover:text-blue-300">
              Masuk di sini
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
