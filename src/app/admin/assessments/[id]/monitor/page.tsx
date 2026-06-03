'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { assessmentRepository } from '@/infrastructure/repositories/assessmentRepository';
import { Assessment } from '@/core/types';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Spinner } from '@/presentation/components/Spinner';
import { useToastStore } from '@/presentation/components/Toast';
import { Modal } from '@/presentation/components/Modal';
import { 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  Activity, 
  User, 
  Award, 
  CheckCircle2, 
  UserCheck,
  AlertTriangle,
  PlayCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Share2,
  Trash2
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MonitorPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const addToast = useToastStore((state) => state.addToast);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Selection and deletion states
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Custom delete modal states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'bulk' | null>(null);
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  const [targetSessionName, setTargetSessionName] = useState<string | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

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

  // Fetch all monitoring data
  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [examDetail, sessionList] = await Promise.all([
        assessmentRepository.getAssessment(id),
        assessmentRepository.getAssessmentSessions(id),
      ]);
      setAssessment(examDetail);
      setSessions(sessionList);
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Gagal Memuat Data',
        message: 'Tidak dapat memperbarui status monitoring.',
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Spinner label="Menghubungkan ke Pemantauan Ujian..." />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Card className="max-w-md w-full text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Ujian Tidak Ditemukan</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Jadwal ujian ini tidak terdaftar di sistem.</p>
          <Button onClick={() => router.push('/admin/assessments')} className="w-full">
            Kembali ke Jadwal Ujian
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const totalQuestions = assessment.questions?.length || 0;
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

  // Filter sessions by search query
  const filteredSessions = sessions.filter(s => {
    const name = s.user?.name?.toLowerCase() || '';
    const email = s.user?.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  // Pagination calculations
  const ITEMS_PER_PAGE = 10;
  const totalItems = filteredSessions.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const activePage = Math.min(currentPage, totalPages);
  
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  const handleSelectRowToggle = (sessionId: string) => {
    setSelectedSessionIds(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId) 
        : [...prev, sessionId]
    );
  };

  const handleSelectAllToggle = () => {
    const paginatedIds = paginatedSessions.map(s => s.id);
    const allSelectedOnPage = paginatedIds.every(id => selectedSessionIds.includes(id));

    if (allSelectedOnPage) {
      // Deselect all on this page
      setSelectedSessionIds(prev => prev.filter(id => !paginatedIds.includes(id)));
    } else {
      // Select all on this page
      setSelectedSessionIds(prev => {
        const newSelection = [...prev];
        paginatedIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleDeleteSingle = (sessionId: string, userName: string) => {
    setDeleteType('single');
    setTargetSessionId(sessionId);
    setTargetSessionName(userName);
    setIsDeleteConfirmOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedSessionIds.length === 0) return;
    setDeleteType('bulk');
    setIsDeleteConfirmOpen(true);
  };

  const confirmSingleDelete = async () => {
    if (!targetSessionId) return;
    setIsDeletingSession(true);
    try {
      await assessmentRepository.deleteAssessmentSession(targetSessionId);
      addToast({
        type: 'success',
        title: 'Sesi Dihapus',
        message: `Sesi ujian ${targetSessionName || 'peserta'} berhasil dihapus.`,
      });
      // Filter out deleted session
      setSessions(prev => prev.filter(s => s.id !== targetSessionId));
      setSelectedSessionIds(prev => prev.filter(id => id !== targetSessionId));
      setIsDeleteConfirmOpen(false);
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Gagal Menghapus Sesi',
        message: err.response?.data?.message || 'Terjadi kesalahan saat menghapus sesi.',
      });
    } finally {
      setIsDeletingSession(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedSessionIds.length === 0) return;
    setIsDeletingSession(true);
    try {
      await assessmentRepository.bulkDeleteAssessmentSessions(selectedSessionIds);
      addToast({
        type: 'success',
        title: 'Sesi Masal Dihapus',
        message: `${selectedSessionIds.length} sesi ujian terpilih berhasil dihapus.`,
      });
      // Filter out deleted sessions
      setSessions(prev => prev.filter(s => !selectedSessionIds.includes(s.id)));
      setSelectedSessionIds([]);
      setIsDeleteConfirmOpen(false);
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Gagal Menghapus Sesi',
        message: err.response?.data?.message || 'Terjadi kesalahan saat menghapus sesi masal.',
      });
    } finally {
      setIsDeletingSession(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={() => router.push('/admin/assessments')}
            className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Jadwal</span>
          </button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Pemantauan Ujian Live
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-extrabold animate-pulse">
              <Activity className="h-3.5 w-3.5" />
              <span>LIVE</span>
            </div>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Ujian: <strong className="text-zinc-800 dark:text-zinc-200">{assessment.title}</strong>
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3 self-start md:self-center">
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
            onClick={() => fetchData(true)}
            isLoading={refreshing}
            className="flex items-center gap-1.5 border-zinc-200 dark:border-zinc-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Perbarui</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/public-monitor/${id}`, '_blank')}
            className="flex items-center gap-1.5 border-zinc-200 dark:border-zinc-800 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Monitor Publik</span>
          </Button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Peserta */}
        <Card className="p-4 bg-white dark:bg-zinc-900/30 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">Total Peserta</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">{totalParticipants}</h3>
            <p className="text-[10px] text-zinc-500 mt-1 font-semibold">
              {pendingCount} belum masuk lembar jawab
            </p>
          </div>
        </Card>

        {/* Sedang Mengerjakan */}
        <Card className="p-4 bg-white dark:bg-zinc-900/30 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
            <PlayCircle className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">Mengerjakan</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">{activeCount}</h3>
            <p className="text-[10px] text-zinc-500 mt-1 font-semibold">
              Sedang mengerjakan di kelas
            </p>
          </div>
        </Card>

        {/* Selesai / Lulus */}
        <Card className="p-4 bg-white dark:bg-zinc-900/30 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">Selesai Ujian</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">{finishedCount}</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-450 mt-1 font-bold">
              {passedCount} peserta lulus KKM
            </p>
          </div>
        </Card>

        {/* Rata-rata Nilai */}
        <Card className="p-4 bg-white dark:bg-zinc-900/30 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">Rata-rata Nilai</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">{avgScore}</h3>
            <p className="text-[10px] text-zinc-500 mt-1 font-semibold">
              Min: {minScore} • Max: {maxScore}
            </p>
          </div>
        </Card>
      </div>

      {/* Filter and Table Panel */}
      <Card className="p-0 overflow-hidden bg-white dark:bg-zinc-900/30">
        {/* Search Bar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nama peserta atau alamat email..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:text-white outline-none text-sm"
            />
          </div>
          {selectedSessionIds.length > 0 && (
            <Button
              onClick={handleBulkDelete}
              isLoading={isBulkDeleting}
              className="bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-1.5 cursor-pointer py-2 px-4 rounded-xl text-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>Hapus Terpilih ({selectedSessionIds.length})</span>
            </Button>
          )}
        </div>

        {/* Participant list Table */}
        <div className="overflow-x-auto">
          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
              <User className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Tidak ada data peserta ujian.</p>
              {searchQuery && <p className="text-xs text-zinc-400 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-3.5 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedSessions.length > 0 && paginatedSessions.every(s => selectedSessionIds.includes(s.id))}
                      onChange={handleSelectAllToggle}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 text-center w-12">No</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Nama Peserta</th>
                  <th className="py-3.5 px-4 w-44 text-center">Status</th>
                  <th className="py-3.5 px-4 w-48">Kemajuan Soal (Progress)</th>
                  <th className="py-3.5 px-4 w-40 text-center">Pelanggaran Layar</th>
                  <th className="py-3.5 px-4 w-32 text-center">Nilai</th>
                  <th className="py-3.5 px-4 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                {paginatedSessions.map((session, idx) => {
                  const isTimerActive = session.status === 'in_progress';
                  const isFinished = session.status === 'completed' || session.status === 'force_submitted';
                  
                  // Answers Progress
                  const answeredCount = session.answers_count || 0;
                  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
                  
                  // Violation warnings
                  const warningLogsCount = session.proctoring_logs_count || 0;
                  
                  // Score
                  const rawScore = parseFloat(session.total_score || 0);
                  const isPassed = rawScore >= passingGrade;

                  return (
                    <tr 
                      key={session.id} 
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors duration-150"
                    >
                      {/* Selection checkbox */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedSessionIds.includes(session.id)}
                          onChange={() => handleSelectRowToggle(session.id)}
                          className="h-4 w-4 rounded border-zinc-300 text-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* No */}
                      <td className="py-4 px-4 text-center text-zinc-400 font-bold">{startIndex + idx + 1}</td>
                      
                      {/* Participant User Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 border border-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm">
                            {session.user?.name?.slice(0, 2).toUpperCase() || 'P'}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-200 leading-tight">
                              {session.user?.name || 'Peserta'}
                            </p>
                            <p className="text-xs text-zinc-500 font-medium">
                              {session.user?.email || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {isFinished ? (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs border ${
                            session.status === 'force_submitted' 
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/10'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
                          }`}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{session.status === 'force_submitted' ? 'Selesai (Auto)' : 'Selesai'}</span>
                          </div>
                        ) : isTimerActive ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-500/10">
                            <Activity className="h-3.5 w-3.5 animate-pulse" />
                            <span>Mengerjakan</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 font-bold text-xs border border-zinc-200 dark:border-zinc-800">
                            <HelpCircle className="h-3.5 w-3.5" />
                            <span>Belum Mulai</span>
                          </div>
                        )}
                      </td>
                      
                      {/* Progress bar */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-zinc-500">{answeredCount} dari {totalQuestions} Soal</span>
                            <span className="text-zinc-500 dark:text-zinc-400">{Math.round(progressPct)}%</span>
                          </div>
                          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden shadow-inner">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out" 
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      
                      {/* Cheat Warnings */}
                      <td className="py-4 px-4 text-center">
                        {warningLogsCount > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold text-xs border border-rose-500/10">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>{warningLogsCount} Pelanggaran</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 font-semibold">Aman (0)</span>
                        )}
                      </td>
                      
                      {/* Score */}
                      <td className="py-4 px-4 text-center">
                        {isFinished ? (
                          <div className={`text-base font-extrabold ${isPassed ? 'text-emerald-500' : 'text-red-500'}`}>
                            {rawScore.toFixed(2)}
                            <div className="text-[10px] text-zinc-400 font-bold mt-0.5 uppercase tracking-wide">
                              {isPassed ? 'Lulus KKM' : 'Tidak Lulus'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-400 font-semibold text-xs">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleDeleteSingle(session.id, session.user?.name || 'Peserta')}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                          title="Hapus Sesi Ujian"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">
              Menampilkan <strong className="text-zinc-800 dark:text-zinc-200">{startIndex + 1}</strong> -{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{Math.min(endIndex, totalItems)}</strong> dari{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{totalItems}</strong> peserta
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
      </Card>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => !isDeletingSession && setIsDeleteConfirmOpen(false)}
        title={deleteType === 'bulk' ? 'Hapus Masal Sesi Ujian' : 'Hapus Sesi Ujian'}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-500">
            <AlertTriangle className="h-6 w-6 flex-shrink-0" />
            <h4 className="font-extrabold text-sm">Tindakan ini tidak dapat dibatalkan!</h4>
          </div>

          <p className="text-zinc-650 dark:text-zinc-400 text-sm leading-relaxed">
            {deleteType === 'bulk' ? (
              <>
                Apakah Anda yakin ingin menghapus <strong className="text-red-600 dark:text-red-400">{selectedSessionIds.length} sesi ujian</strong> yang terpilih secara permanen? Semua riwayat jawaban dan log kecurangan dari seluruh sesi yang dipilih akan dihapus secara permanen dari sistem.
              </>
            ) : (
              <>
                Apakah Anda yakin ingin menghapus sesi ujian untuk peserta <strong className="text-red-600 dark:text-red-400">"{targetSessionName}"</strong>? Semua riwayat jawaban dan log kecurangan peserta tersebut akan dihapus secara permanen dari sistem.
              </>
            )}
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeletingSession}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={deleteType === 'bulk' ? confirmBulkDelete : confirmSingleDelete}
              isLoading={isDeletingSession}
              className="bg-red-600 hover:bg-red-500 text-white cursor-pointer font-bold"
            >
              {isDeletingSession ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
