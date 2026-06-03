'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authRepository } from '@/infrastructure/repositories/authRepository';
import { Input } from '@/presentation/components/Input';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { useToastStore } from '@/presentation/components/Toast';
import { UserPlus, User, Mail, Lock, GraduationCap, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            Daftarkan diri Anda untuk mengikuti ujian online
          </p>
        </div>

        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/30 p-8 shadow-xl shadow-zinc-200/30 dark:shadow-none backdrop-blur-xl rounded-3xl">
          <form className="space-y-4" onSubmit={handleRegister}>
            <Input
              label="Nama Lengkap"
              placeholder="John Doe"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              leftIcon={<User className="h-4.5 w-4.5" />}
              className="border-zinc-250 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-650"
              disabled={isLoading}
            />

            <Input
              label="Username"
              placeholder="johndoe"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={errors.username}
              leftIcon={<UserPlus className="h-4.5 w-4.5" />}
              className="border-zinc-250 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-650"
              disabled={isLoading}
            />

            <Input
              label="Alamat Email"
              placeholder="johndoe@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<Mail className="h-4.5 w-4.5" />}
              className="border-zinc-250 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-650"
              disabled={isLoading}
            />

            <Input
              label="Kata Sandi"
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              leftIcon={<Lock className="h-4.5 w-4.5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              }
              className="border-zinc-250 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-650"
              disabled={isLoading}
            />

            <Input
              label="Konfirmasi Kata Sandi"
              placeholder="••••••••"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              error={errors.password_confirmation}
              leftIcon={<Lock className="h-4.5 w-4.5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              }
              className="border-zinc-250 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-650"
              disabled={isLoading}
            />

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full justify-center bg-gradient-to-r from-blue-650 to-indigo-650 hover:from-blue-600 hover:to-indigo-600 text-white py-3 rounded-xl shadow-lg shadow-blue-500/10 mt-2 cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Daftar Sekarang
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Sudah punya akun?{' '}
            <a href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              Masuk di sini
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
