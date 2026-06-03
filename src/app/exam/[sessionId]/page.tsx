'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useExamStore } from '@/application/useExamStore';
import { useTimer } from '@/application/useTimer';
import { useToastStore } from '@/presentation/components/Toast';
import { getMediaUrl } from '@/infrastructure/api';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { Modal } from '@/presentation/components/Modal';
import { Spinner } from '@/presentation/components/Spinner';
import { 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckSquare, 
  AlertTriangle, 
  Maximize2,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}


export default function ExamPage({ params }: PageProps) {
  const router = useRouter();
  const { sessionId } = use(params);
  const addToast = useToastStore((state) => state.addToast);
  
  // Zustand Exam Store
  const {
    currentSession,
    questions,
    currentQuestionIndex,
    localAnswers,
    warningCount,
    isLoading,
    error,
    startExamSession,
    startExamTimer,
    selectQuestion,
    saveAnswerLocally,
    syncAnswerWithApi,
    incrementWarning,
    finishExamSession,
  } = useExamStore();

  // Local state
  const [mounted, setMounted] = useState(false);
  const [isSecureModeInitialized, setIsSecureModeInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Restore session on refresh
  useEffect(() => {
    if (isExiting) return;

    if (!currentSession) {
      const activeAssessmentId = localStorage.getItem('cbt_active_assessment_id');
      if (activeAssessmentId) {
        startExamSession(activeAssessmentId).catch(() => {
          router.push('/dashboard');
        });
      } else {
        router.push('/dashboard');
      }
    }
  }, [currentSession, startExamSession, router, isExiting]);

  // Fullscreen State Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (isSecureModeInitialized && !isFull) {
        incrementWarning('fullscreen_exit', 'Peserta keluar dari mode layar penuh.');
        addToast({
          type: 'warning',
          title: 'Peringatan Pengawasan',
          message: 'Dilarang keluar dari mode layar penuh selama ujian!',
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isSecureModeInitialized, incrementWarning, addToast]);

  // Page Visibility Listener (Tab Focus Loss)
  useEffect(() => {
    if (!isSecureModeInitialized) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        incrementWarning('tab_switch', 'Peserta membuka tab lain atau meminimalkan browser.');
        addToast({
          type: 'error',
          title: 'Peringatan Keras',
          message: 'Ujian terdeteksi tidak fokus (berpindah tab/aplikasi)! Tindakan ini dicatat.',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSecureModeInitialized, incrementWarning, addToast]);

  // Disable browser defaults (Right click, Copy, Paste, Shortcuts)
  useEffect(() => {
    if (!isSecureModeInitialized) return;

    const preventDefaults = (e: Event) => {
      e.preventDefault();
      addToast({
        type: 'warning',
        title: 'Tindakan Dicegah',
        message: 'Klik kanan dan salin-tempel dinonaktifkan untuk keamanan.',
      });
    };

    document.addEventListener('contextmenu', preventDefaults);
    document.addEventListener('copy', preventDefaults);
    document.addEventListener('paste', preventDefaults);
    document.addEventListener('cut', preventDefaults);

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyLower = e.key.toLowerCase();
      const isCopyPasteShortcut = 
        (e.ctrlKey && (keyLower === 'c' || keyLower === 'v' || keyLower === 'x')) ||
        (e.metaKey && (keyLower === 'c' || keyLower === 'v' || keyLower === 'x'));

      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (keyLower === 'i' || keyLower === 'j')) ||
        (e.ctrlKey && keyLower === 'u') ||
        (e.ctrlKey && keyLower === 's') ||
        isCopyPasteShortcut
      ) {
        e.preventDefault();
        
        let reason = `Mencoba menekan pintasan keyboard: ${e.key}`;
        let toastMsg = 'Dilarang membuka fitur Developer Tools atau menyimpan halaman.';
        
        if (isCopyPasteShortcut) {
          reason = 'Mencoba menyalin/menempel teks (Copy-Paste shortcut)';
          toastMsg = 'Dilarang melakukan salin-tempel (copy-paste) teks selama ujian!';
        }

        incrementWarning('unauthorized_action', reason);
        addToast({
          type: 'error',
          title: 'Aksi Dilarang',
          message: toastMsg,
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', preventDefaults);
      document.removeEventListener('copy', preventDefaults);
      document.removeEventListener('paste', preventDefaults);
      document.removeEventListener('cut', preventDefaults);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSecureModeInitialized, incrementWarning, addToast]);

  // Auto-submit Exam on Time Up
  const handleTimeUp = async () => {
    addToast({
      type: 'warning',
      title: 'Waktu Ujian Habis',
      message: 'Waktu Anda telah habis. Ujian sedang dikirim secara otomatis...',
    });
    await submitExam();
  };

  // Setup Timer Hook
  const { formattedTime } = useTimer({
    endTime: currentSession?.end_time || new Date(),
    onTimeUp: handleTimeUp,
    disabled: !currentSession || isExiting || isSubmitting,
  });

  const enterFullscreenAndStart = async () => {
    setIsStarting(true);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }

      // Start/reset countdown timer on backend only when candidate enters exam sheet
      if (currentSession) {
        await startExamTimer(currentSession.id);
      }

      setIsSecureModeInitialized(true);
      setIsFullscreen(true);
      // Save active assessment id helper
      if (currentSession?.assessment_id) {
        localStorage.setItem('cbt_active_assessment_id', currentSession.assessment_id);
      }

      addToast({
        type: 'success',
        title: 'Ujian Dimulai',
        message: 'Selamat mengerjakan ujian!',
      });
    } catch (e) {
      console.error(e);
      addToast({
        type: 'error',
        title: 'Gagal Masuk Mode Aman',
        message: 'Mohon izinkan akses layar penuh di browser Anda.',
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    saveAnswerLocally(questionId, optionId);
    // Submit in background
    syncAnswerWithApi(questionId, optionId);
  };

  const toggleFlagQuestion = (questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const submitExam = async () => {
    setIsSubmitting(true);
    setIsExiting(true);
    setIsSecureModeInitialized(false);
    try {
      // Exit Fullscreen if active
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      const finishedSession = await finishExamSession();
      // Remove local backup helper
      localStorage.removeItem('cbt_active_assessment_id');
      
      addToast({
        type: 'success',
        title: 'Ujian Selesai',
        message: 'Hasil ujian Anda telah disimpan.',
      });
      router.push(`/exam/${sessionId}/result`);
    } catch (e) {
      console.error(e);
      // Re-enable if failed
      setIsSecureModeInitialized(true);
      setIsExiting(false);
      addToast({
        type: 'error',
        title: 'Gagal Mengirim Ujian',
        message: 'Terjadi kesalahan saat mengirim jawaban.',
      });
    } finally {
      setIsSubmitting(false);
      setIsSubmitModalOpen(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Card className="max-w-md w-full text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Terjadi Kesalahan</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{error}</p>
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Kembali ke Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 dark:bg-blue-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-600/5 dark:bg-indigo-600/10 blur-[120px] pointer-events-none" />
        
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/30 p-8 shadow-xl shadow-zinc-200/30 dark:shadow-none backdrop-blur-xl rounded-3xl max-w-xs w-full text-center animate-pulse">
          <Spinner label="Menyiapkan Lembar Soal..." />
        </Card>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 dark:bg-blue-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-600/5 dark:bg-indigo-600/10 blur-[120px] pointer-events-none" />
        
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/30 p-8 shadow-xl shadow-zinc-200/30 dark:shadow-none backdrop-blur-xl rounded-3xl max-w-xs w-full text-center">
          <Spinner label="Mengirim Lembar Jawaban..." />
        </Card>
      </div>
    );
  }

  if (!currentSession || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 dark:bg-blue-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-600/5 dark:bg-indigo-600/10 blur-[120px] pointer-events-none" />
        
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/30 p-8 shadow-xl shadow-zinc-200/30 dark:shadow-none backdrop-blur-xl rounded-3xl max-w-xs w-full text-center">
          <Spinner label="Menyiapkan Lembar Soal..." />
        </Card>
      </div>
    );
  }

  // Pre-exam Secure Screen
  if (!isSecureModeInitialized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-950 to-zinc-900 px-4">
        <Card className="max-w-lg w-full bg-zinc-900/50 border-white/5 shadow-2xl p-8 text-center space-y-6 backdrop-blur-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mx-auto">
            <ShieldAlert className="h-9 w-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Inisialisasi Mode Ujian Aman</h2>
            <p className="text-sm text-zinc-400">
              Sistem akan mematikan beberapa fungsi default browser dan mengunci pengerjaan di layar penuh.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-950/40 text-left border border-zinc-800 text-sm text-zinc-300 space-y-2">
            <h4 className="font-semibold text-white">Sebelum memulai, pastikan:</h4>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Semua tab browser lain ditutup.</li>
              <li>Aplikasi pesan instan atau screen sharing dimatikan.</li>
              <li>Browser memiliki izin untuk mengaktifkan Layar Penuh.</li>
            </ul>
          </div>
          <Button
            onClick={enterFullscreenAndStart}
            isLoading={isStarting}
            disabled={isStarting}
            className="w-full justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 text-base shadow-lg shadow-blue-500/10"
          >
            {isStarting ? 'Sedang proses...' : 'Masuk Mode Aman & Mulai'}
          </Button>
        </Card>
      </div>
    );
  }

  // Active Blocking Screen when exiting fullscreen
  if (!isFullscreen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-red-950/40 backdrop-blur-md px-4 z-[9999]">
        <Card className="max-w-md w-full bg-zinc-900/90 border-red-500/20 shadow-2xl p-8 text-center space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 mx-auto">
            <AlertTriangle className="h-9 w-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Layar Penuh Dinonaktifkan</h2>
            <p className="text-sm text-zinc-400">
              Anda keluar dari mode aman. Tindakan ini dicatat sebagai pelanggaran. Silakan masuk kembali ke mode fullscreen.
            </p>
          </div>
          <Button
            onClick={enterFullscreenAndStart}
            variant="danger"
            className="w-full justify-center py-3 text-base shadow-lg"
          >
            <Maximize2 className="h-5 w-5" />
            <span>Aktifkan Layar Penuh</span>
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isQuestionAnswered = (id: string) => localAnswers[id] !== undefined && localAnswers[id] !== null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 select-none">
      {/* Secure Header */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-zinc-950 dark:text-zinc-50">
            {currentSession.assessment?.title}
          </span>
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200/20">
            Secure Mode Active
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Warning Tracker */}
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold animate-pulse">
              <AlertTriangle className="h-4 w-4" />
              <span>Pelanggaran: {warningCount}</span>
            </div>
          )}

          {/* Countdown timer */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 font-mono font-bold text-zinc-900 dark:text-zinc-100 text-lg">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>{formattedTime}</span>
          </div>

          <Button
            variant="success"
            size="sm"
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-2 shadow-sm font-semibold"
          >
            <CheckSquare className="h-4.5 w-4.5" />
            <span>Selesai Ujian</span>
          </Button>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto p-6 gap-6 overflow-hidden">
        {/* Left Side: Question Pane */}
        <div className="flex-1 flex flex-col gap-6">
          <Card className="flex-1 flex flex-col gap-6 justify-between min-h-[500px]">
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
              <span className="font-semibold text-zinc-500 text-sm">
                SOAL NOMOR {currentQuestionIndex + 1} DARI {questions.length}
              </span>
              <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 capitalize">
                {currentQuestion.difficulty}
              </span>
            </div>

            {/* Question Text */}
            <div className="flex-1 py-4 space-y-4">
              <p className="text-zinc-950 dark:text-zinc-50 text-lg leading-relaxed font-semibold">
                {currentQuestion.content_text}
              </p>
              
              {currentQuestion.media && currentQuestion.media.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4">
                  {currentQuestion.media.map((med: any, mIdx: number) => (
                    <div key={mIdx} className="max-w-xs rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 p-1">
                      <img
                        src={getMediaUrl(med.original_url || med.url)}
                        alt={`Gambar Soal ${mIdx + 1}`}
                        className="w-full h-auto max-h-[250px] object-contain rounded-xl mx-auto cursor-zoom-in hover:opacity-95 transition-opacity"
                        onClick={() => setLightboxImageUrl(getMediaUrl(med.original_url || med.url))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Options or Essay Textarea */}
            <div className="flex-1 py-4">
              {currentQuestion.type === 'essay' ? (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Jawaban Anda
                  </label>
                  <textarea
                    value={localAnswers[currentQuestion.id] || ''}
                    onChange={(e) => saveAnswerLocally(currentQuestion.id, e.target.value)}
                    onBlur={(e) => syncAnswerWithApi(currentQuestion.id, e.target.value)}
                    placeholder="Tuliskan jawaban lengkap Anda di sini..."
                    className="w-full min-h-[220px] p-4 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-zinc-900 dark:border-zinc-850 dark:bg-zinc-950 dark:text-white placeholder-zinc-500 outline-none resize-y transition-all text-base leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-xs text-zinc-400">
                    <span>Jawaban Anda disimpan secara lokal otomatis saat mengetik.</span>
                    <span>{(localAnswers[currentQuestion.id] || '').length} karakter</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = localAnswers[currentQuestion.id] === option.id;
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D...

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                        className={`w-full text-left px-5 py-4 rounded-xl border flex items-start gap-4 transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 text-blue-900 shadow-sm dark:bg-blue-950/20 dark:border-blue-500 dark:text-blue-200 font-semibold'
                            : 'border-zinc-200 bg-white hover:bg-zinc-50/50 hover:border-zinc-350 dark:border-zinc-800/80 dark:bg-zinc-900/20 dark:hover:bg-zinc-800/30'
                        }`}
                      >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white dark:bg-blue-500'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/50 dark:border-transparent'
                        }`}>
                          {letter}
                        </span>
                        <div className="flex-1 flex flex-col gap-2">
                          <span className={`font-medium ${
                            isSelected 
                              ? 'text-blue-900 dark:text-blue-200' 
                              : 'text-zinc-800 dark:text-zinc-200'
                          }`}>
                            {option.option_text}
                          </span>
                          {(() => {
                            const mediaItem = option.media?.[0];
                            if (!mediaItem) return null;
                            const mediaUrl = getMediaUrl(mediaItem.original_url || mediaItem.url);
                            return (
                              <div className="max-w-xs rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1">
                                <img
                                  src={mediaUrl}
                                  alt={`Pilihan Jawaban ${letter}`}
                                  className="w-full h-auto max-h-[150px] object-contain rounded-md cursor-zoom-in hover:opacity-95 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxImageUrl(mediaUrl);
                                  }}
                                />
                              </div>
                            );
                          })()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800/60 mt-auto">
              <Button
                variant="outline"
                onClick={() => selectQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-1.5"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
                <span>Sebelumnya</span>
              </Button>

              <Button
                variant={flaggedQuestions[currentQuestion.id] ? 'success' : 'outline'}
                onClick={() => toggleFlagQuestion(currentQuestion.id)}
                className={`flex items-center gap-1.5 ${
                  flaggedQuestions[currentQuestion.id]
                    ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow-amber-500/10'
                    : ''
                }`}
              >
                <Flag className="h-4.5 w-4.5" />
                <span>Ragu-ragu / Tandai</span>
              </Button>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <span>Selesai</span>
                  <CheckCircle className="h-4.5 w-4.5" />
                </Button>
              ) : (
                <Button
                  onClick={() => selectQuestion(currentQuestionIndex + 1)}
                  className="flex items-center gap-1.5"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="h-4.5 w-4.5" />
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Sidebar Navigation Grid */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <Card className="flex flex-col h-full justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-800/60 pb-3 text-base">
                Navigasi Soal
              </h3>

              <div className="grid grid-cols-5 gap-3 max-h-[300px] lg:max-h-[500px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = isQuestionAnswered(q.id);
                  const isFlagged = flaggedQuestions[q.id];

                  let btnStyle = 'border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:bg-zinc-950/20 dark:hover:bg-zinc-900/30';
                  
                  if (isAnswered) {
                    btnStyle = 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/10';
                  }
                  if (isFlagged) {
                    btnStyle = 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/10';
                  }
                  if (isCurrent) {
                    btnStyle = 'ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-zinc-900 bg-blue-600 text-white border-blue-600';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => selectQuestion(idx)}
                      className={`flex h-11 items-center justify-center rounded-xl border text-sm font-bold transition-all duration-200 cursor-pointer ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-4 mt-6 text-xs text-zinc-500 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-emerald-600" />
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-amber-500" />
                <span>Ragu-ragu / Tandai</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/20" />
                <span>Belum Dijawab</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Konfirmasi Selesai Ujian"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSubmitModalOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={submitExam} isLoading={isSubmitting} variant="success">
              Kirim Jawaban
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-300">
            Apakah Anda yakin ingin mengakhiri sesi ujian ini? Jawaban Anda akan dihitung dan tidak dapat diubah lagi.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-sm">
            <div className="text-center p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50">
              <span className="block text-xs text-zinc-500 font-medium uppercase">Sudah Dijawab</span>
              <span className="block text-2xl font-extrabold text-emerald-600 mt-1">
                {questions.filter(q => isQuestionAnswered(q.id)).length} Soal
              </span>
            </div>
            <div className="text-center p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50">
              <span className="block text-xs text-zinc-500 font-medium uppercase">Belum Dijawab</span>
              <span className="block text-2xl font-extrabold text-red-500 mt-1">
                {questions.filter(q => !isQuestionAnswered(q.id)).length} Soal
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Lightbox Modal */}
      {lightboxImageUrl && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 cursor-zoom-out select-none"
          onClick={() => setLightboxImageUrl(null)}
        >
          <button
            onClick={() => setLightboxImageUrl(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all duration-200 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
          <div 
            className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImageUrl}
              alt="Zoomed View"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-white/10 cursor-default select-text"
            />
          </div>
        </div>
      )}
    </div>
  );
}
