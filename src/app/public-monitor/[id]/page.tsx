'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { assessmentRepository } from '@/infrastructure/repositories/assessmentRepository';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Spinner } from '@/presentation/components/Spinner';
import { useToastStore } from '@/presentation/components/Toast';
import { 
  Activity, 
  User, 
  Award, 
  CheckCircle2, 
  UserCheck,
  AlertTriangle,
  PlayCircle,
  HelpCircle,
  Share2,
  Trophy
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

const ROW_HEIGHT = 72;

const formatDateRange = (startStr: string, endStr: string) => {
  if (!startStr) return '-';
  try {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    const start = new Date(startStr).toLocaleDateString('id-ID', options);
    if (!endStr) return start;
    const end = new Date(endStr).toLocaleDateString('id-ID', options);
    return `${start} s.d. ${end}`;
  } catch (e) {
    return startStr;
  }
};

export default function PublicMonitorPage({ params }: PageProps) {
  const { id } = use(params);
  const addToast = useToastStore((state) => state.addToast);

  const [assessment, setAssessment] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Score updates highlight tracking
  const [recentlyUpdated, setRecentlyUpdated] = useState<Record<string, boolean>>({});
  const prevScoresRef = useRef<Record<string, number>>({});

  // Auto-scrolling state for 20+ list (credits movie style)
  const [scrollIndex, setScrollIndex] = useState(0);

  // Fetch public monitoring data
  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await assessmentRepository.getPublicMonitor(id);
      setAssessment(data.assessment);
      
      // Sort sessions immediately by score descending, progress descending, then name
      const sorted = [...data.sessions].sort((a, b) => {
        const scoreA = parseFloat(a.total_score || 0);
        const scoreB = parseFloat(b.total_score || 0);
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        const ansA = a.answers_count || 0;
        const ansB = b.answers_count || 0;
        if (ansB !== ansA) {
          return ansB - ansA;
        }
        const nameA = a.user?.name || '';
        const nameB = b.user?.name || '';
        return nameA.localeCompare(nameB);
      });

      setSessions(sorted);
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Gagal Memuat Data',
        message: 'Tidak dapat memperbarui status monitoring publik.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, [id]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, 5000); // refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, id]);

  // Highlight session whenever their score increases
  useEffect(() => {
    if (sessions.length === 0) return;

    const newHighlights: Record<string, boolean> = { ...recentlyUpdated };
    let hasChanges = false;

    sessions.forEach((s) => {
      const prevScore = prevScoresRef.current[s.id];
      const currentScore = parseFloat(s.total_score || 0);

      if (prevScore !== undefined && currentScore > prevScore) {
        newHighlights[s.id] = true;
        hasChanges = true;

        // Clear highlight after 3 seconds
        setTimeout(() => {
          setRecentlyUpdated((prev) => {
            const updated = { ...prev };
            delete updated[s.id];
            return updated;
          });
        }, 3000);
      }

      // Update ref
      prevScoresRef.current[s.id] = currentScore;
    });

    if (hasChanges) {
      setRecentlyUpdated(newHighlights);
    }
  }, [sessions]);

  // Auto-scrolling interval logic (if total items > 20)
  useEffect(() => {
    if (sessions.length <= 20) {
      setScrollIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setScrollIndex((prev) => {
        const maxIndex = sessions.length - 20;
        // If we reach the end, wait a bit longer at the bottom before looping back
        if (prev >= maxIndex) {
          return 0; // wrap back to top
        }
        return prev + 1;
      });
    }, 3000); // shift by one row every 3 seconds

    return () => clearInterval(interval);
  }, [sessions.length]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      addToast({
        type: 'success',
        title: 'Tautan Disalin',
        message: 'Tautan monitor publik telah disalin ke papan klip.',
      });
    }
  };

  const maskEmail = (email: string) => {
    if (!email) return '-';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Spinner label="Menghubungkan ke Monitor Publik..." />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Card className="max-w-md w-full text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Ujian Tidak Ditemukan</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Monitor publik tidak tersedia atau tautan ujian salah.
          </p>
        </Card>
      </div>
    );
  }

  const totalQuestions = assessment.questions_count || 0;
  const totalParticipants = sessions.length;
  
  // Status counts
  const activeCount = sessions.filter(s => s.status === 'in_progress').length;
  const finishedCount = sessions.filter(s => s.status === 'completed' || s.status === 'force_submitted').length;
  const pendingCount = totalParticipants - activeCount - finishedCount;

  // Score statistics
  const finishedSessions = sessions.filter(s => s.status === 'completed' || s.status === 'force_submitted');
  const scores = finishedSessions.map(s => parseFloat(s.total_score || 0));
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '0';
  const maxScore = scores.length > 0 ? Math.max(...scores).toFixed(2) : '0';
  const minScore = scores.length > 0 ? Math.min(...scores).toFixed(2) : '0';

  const passingGrade = parseFloat(String(assessment.passing_grade || 50));
  const passedCount = finishedSessions.filter(s => parseFloat(s.total_score || 0) >= passingGrade).length;

  const scrollOffset = scrollIndex * ROW_HEIGHT;

  // Get unique categories list from assessment questions
  interface CategoryProgress {
    id: string;
    name: string;
    totalQuestions: number;
  }

  const categoriesMap: Record<string, CategoryProgress> = {};
  assessment.questions?.forEach((q: any) => {
    if (!q.category) return;
    if (!categoriesMap[q.category.id]) {
      categoriesMap[q.category.id] = {
        id: q.category.id,
        name: q.category.name,
        totalQuestions: 0,
      };
    }
    categoriesMap[q.category.id].totalQuestions += 1;
  });
  const categoriesList = Object.values(categoriesMap);

  // Map question ID to category ID for easy O(1) lookups
  const questionToCategoryMap: Record<string, string> = {};
  assessment.questions?.forEach((q: any) => {
    if (q.category) {
      questionToCategoryMap[q.id] = q.category.id;
    }
  });

  const hasCategories = categoriesList.length > 0;

  const dynamicGridStyle = {
    display: 'grid',
    gridTemplateColumns: hasCategories 
      ? `60px 1.5fr 120px repeat(${categoriesList.length}, 140px) 100px`
      : '60px 1.5fr 120px 200px 100px',
    alignItems: 'center',
    gap: '16px'
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-8 space-y-6 animate-fade-in pb-16">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {assessment.title}
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-extrabold animate-pulse">
              <Activity className="h-3.5 w-3.5" />
              <span>LIVE LEADERBOARD</span>
            </div>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Jadwal Ujian: <strong className="text-zinc-700 dark:text-zinc-300">{formatDateRange(assessment.start_date, assessment.end_date)}</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 focus:ring-blue-500 text-blue-600 cursor-pointer"
            />
            <span>Auto Refresh (5s)</span>
          </label>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-1.5 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Share2 className="h-4 w-4" />
            <span>Bagikan Monitor</span>
          </Button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Peserta */}
        <Card className="p-5 bg-white dark:bg-zinc-900 flex items-start gap-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/80">
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 dark:text-zinc-500">Total Peserta</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">{totalParticipants}</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">
              {pendingCount} belum mulai mengerjakan
            </p>
          </div>
        </Card>

        {/* Sedang Mengerjakan */}
        <Card className="p-5 bg-white dark:bg-zinc-900 flex items-start gap-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/80">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-500">
            <PlayCircle className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 dark:text-zinc-500">Mengerjakan</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">{activeCount}</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">
              Peserta sedang aktif menjawab
            </p>
          </div>
        </Card>

        {/* Selesai Ujian */}
        <Card className="p-5 bg-white dark:bg-zinc-900 flex items-start gap-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/80">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 dark:text-zinc-500">Selesai Ujian</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">{finishedCount}</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-455 mt-1 font-bold">
              {passedCount} peserta lulus KKM
            </p>
          </div>
        </Card>

        {/* Rata-rata Nilai */}
        <Card className="p-5 bg-white dark:bg-zinc-900 flex items-start gap-4 shadow-sm border border-zinc-200/60 dark:border-zinc-800/80">
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 dark:text-zinc-500">Rata-rata Nilai</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">{avgScore}</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">
              Min: {minScore} • Max: {maxScore}
            </p>
          </div>
        </Card>
      </div>

      {/* Leaderboard Table Panel */}
      <Card className="p-0 overflow-hidden bg-white dark:bg-zinc-900 shadow-lg border border-zinc-200/60 dark:border-zinc-800/80">
        {/* Table Header */}
        <div className="bg-zinc-50 dark:bg-zinc-950 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none">
          <div style={dynamicGridStyle}>
            <div className="text-center">Rank</div>
            <div>Nama Peserta</div>
            <div className="text-center">Status</div>
            {hasCategories ? (
              categoriesList.map((cat) => (
                <div key={cat.id} className="text-center font-bold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  <div>{cat.name}</div>
                  <div className="text-[9px] text-zinc-400/60 dark:text-zinc-600 mt-0.5">({cat.totalQuestions} Soal)</div>
                </div>
              ))
            ) : (
              <div>Progress Jawaban</div>
            )}
            <div className="text-right pr-4">Nilai</div>
          </div>
        </div>

        {/* Table Body (Relative height wrapper with sliding viewport) */}
        {sessions.length === 0 ? (
          <div className="p-16 text-center text-zinc-500 dark:text-zinc-400">
            <User className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">Belum ada data peserta yang masuk lembar jawab.</p>
            <p className="text-xs text-zinc-400 mt-1">Status monitor akan otomatis diperbarui secara live.</p>
          </div>
        ) : (
          <div 
            className="relative overflow-hidden transition-all duration-500"
            style={{ height: `${Math.min(sessions.length, 20) * ROW_HEIGHT}px` }}
          >
            <div 
              className="absolute left-0 right-0 top-0 transition-transform duration-1000 ease-in-out"
              style={{ transform: `translateY(-${scrollOffset}px)` }}
            >
              {sessions.map((session, index) => {
                const rank = index + 1;
                const isTimerActive = session.status === 'in_progress';
                const isFinished = session.status === 'completed' || session.status === 'force_submitted';
                
                // Answers Progress
                const answeredCount = session.answers_count || 0;
                const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

                // Calculate answer counts per category for this session
                const sessionAnswersCountByCategory: Record<string, number> = {};
                if (hasCategories) {
                  categoriesList.forEach((cat) => {
                    sessionAnswersCountByCategory[cat.id] = 0;
                  });
                  session.answers?.forEach((ans: any) => {
                    const catId = questionToCategoryMap[ans.question_id];
                    if (catId !== undefined) {
                      sessionAnswersCountByCategory[catId] = (sessionAnswersCountByCategory[catId] || 0) + 1;
                    }
                  });
                }
                
                // Score
                const rawScore = parseFloat(session.total_score || 0);
                const isPassed = rawScore >= passingGrade;

                // Highlight status if their score was recently updated
                const isHighlighted = recentlyUpdated[session.id];

                return (
                  <div
                    key={session.id}
                    className={`absolute left-0 right-0 px-6 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center transition-all duration-1000 ease-in-out ${
                      isHighlighted 
                        ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/30 dark:border-emerald-900/40 shadow-[inset_0_0_12px_rgba(16,185,129,0.08)] z-10' 
                        : 'bg-white dark:bg-zinc-900'
                    }`}
                    style={{ 
                      top: `${index * ROW_HEIGHT}px`, 
                      height: `${ROW_HEIGHT}px` 
                    }}
                  >
                    <div style={dynamicGridStyle} className="w-full">
                      {/* Rank Badge */}
                      <div className="flex justify-center">
                        {rank === 1 ? (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-yellow-350 animate-bounce">
                            <Trophy className="h-3.5 w-3.5" />
                          </div>
                        ) : rank === 2 ? (
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 text-white font-extrabold text-xs flex items-center justify-center shadow border border-zinc-200">
                            2
                          </div>
                        ) : rank === 3 ? (
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 text-white font-extrabold text-xs flex items-center justify-center shadow border border-amber-500">
                            3
                          </div>
                        ) : (
                          <div className="text-zinc-400 font-bold text-sm">
                            {rank}
                          </div>
                        )}
                      </div>

                      {/* Participant User Info */}
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 border border-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm select-none">
                            {session.user?.name?.slice(0, 2).toUpperCase() || 'P'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-800 dark:text-zinc-100 leading-tight truncate">
                              {session.user?.name || 'Peserta'}
                            </p>
                            <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                              {maskEmail(session.user?.email)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex justify-center">
                        {isFinished ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                            session.status === 'force_submitted' 
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/10'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
                          }`}>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{session.status === 'force_submitted' ? 'Selesai (Auto)' : 'Selesai'}</span>
                          </div>
                        ) : isTimerActive ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[10px] border border-blue-500/10">
                            <Activity className="h-3 w-3 animate-pulse" />
                            <span>Mengerjakan</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 font-bold text-[10px] border border-zinc-200 dark:border-zinc-800">
                            <HelpCircle className="h-3 w-3" />
                            <span>Belum Mulai</span>
                          </div>
                        )}
                      </div>

                      {/* Category progress or overall progress */}
                      {hasCategories ? (
                        categoriesList.map((cat) => {
                          const answeredInCat = sessionAnswersCountByCategory[cat.id] || 0;
                          const totalInCat = cat.totalQuestions;
                          const pct = totalInCat > 0 ? (answeredInCat / totalInCat) * 100 : 0;
                          return (
                            <div key={cat.id} className="text-center">
                              <span className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">
                                {answeredInCat}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-semibold ml-1">
                                / {totalInCat}
                              </span>
                              <div className="w-16 mx-auto bg-zinc-200 dark:bg-zinc-800 rounded-full h-1 overflow-hidden mt-1 shadow-inner">
                                <div 
                                  className="bg-blue-600 h-full rounded-full transition-all duration-555 ease-out" 
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-zinc-500">{answeredCount}/{totalQuestions} Soal</span>
                              <span className="text-zinc-500 dark:text-zinc-400">{Math.round(progressPct)}%</span>
                            </div>
                            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden shadow-inner">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Score */}
                      <div className="text-right pr-4">
                        {isFinished ? (
                          <div className={`text-sm font-black ${isPassed ? 'text-emerald-500' : 'text-red-500'}`}>
                            {rawScore.toFixed(2)}
                            <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wide mt-0.5">
                              {isPassed ? 'Lulus KKM' : 'Tidak Lulus'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-400 font-semibold text-xs">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
