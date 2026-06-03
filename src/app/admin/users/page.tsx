'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Input } from '@/presentation/components/Input';
import { Modal } from '@/presentation/components/Modal';
import { Spinner } from '@/presentation/components/Spinner';
import { useToastStore } from '@/presentation/components/Toast';
import { userRepository, UserInput } from '@/infrastructure/repositories/userRepository';
import { groupRepository, Group } from '@/infrastructure/repositories/groupRepository';
import { User } from '@/core/types';
import { 
  Users, 
  UserPlus, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FolderPlus, 
  Layers, 
  Mail, 
  User as UserIcon, 
  Phone, 
  Lock, 
  Settings, 
  Check, 
  Info,
  X
} from 'lucide-react';

export default function UsersAdminPage() {
  const addToast = useToastStore((state) => state.addToast);
  
  // Navigation & Page State
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('');

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    telp: '',
    gender: 'male' as 'male' | 'female',
    groupIds: [] as string[]
  });
  const [userErrors, setUserErrors] = useState<Record<string, string>>({});

  // Group Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: ''
  });
  const [groupErrors, setGroupErrors] = useState<Record<string, string>>({});

  // Manage Group Members Modal State
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  // Delete Confirm Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'user' | 'group'>('user');
  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [deleteTargetName, setDeleteTargetName] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allGroups] = await Promise.all([
        userRepository.getUsers(),
        groupRepository.getGroups()
      ]);
      setUsers(allUsers);
      setGroups(allGroups);
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Gagal memuat data peserta atau grup.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- USER ACTIONS ---
  const handleOpenUserModal = (user: User | null = null) => {
    setSelectedUser(user);
    setUserErrors({});
    if (user) {
      setUserFormData({
        name: user.name,
        username: (user as any).username || '',
        email: user.email,
        password: '',
        telp: (user as any).telp || '',
        gender: (user as any).gender || 'male',
        groupIds: user.groups?.map(g => g.id) || []
      });
    } else {
      setUserFormData({
        name: '',
        username: '',
        email: '',
        password: '',
        telp: '',
        gender: 'male',
        groupIds: []
      });
    }
    setIsUserModalOpen(true);
  };

  const handleUserGroupToggle = (groupId: string) => {
    setUserFormData(prev => {
      const exists = prev.groupIds.includes(groupId);
      if (exists) {
        return { ...prev, groupIds: prev.groupIds.filter(id => id !== groupId) };
      } else {
        return { ...prev, groupIds: [...prev.groupIds, groupId] };
      }
    });
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserErrors({});

    // Client-side validations
    const errors: Record<string, string> = {};
    if (!userFormData.name) errors.name = 'Nama lengkap wajib diisi.';
    if (!userFormData.username) errors.username = 'Username wajib diisi.';
    if (!userFormData.email) errors.email = 'Email wajib diisi.';
    if (!selectedUser && !userFormData.password) errors.password = 'Password wajib diisi.';
    if (userFormData.password && userFormData.password.length < 6) errors.password = 'Password minimal 6 karakter.';

    if (Object.keys(errors).length > 0) {
      setUserErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const input: UserInput = {
        name: userFormData.name,
        username: userFormData.username,
        email: userFormData.email,
        telp: userFormData.telp || undefined,
        gender: userFormData.gender,
        group_ids: userFormData.groupIds
      };

      if (userFormData.password) {
        input.password = userFormData.password;
      }

      if (selectedUser) {
        await userRepository.updateUser(selectedUser.id, input);
        addToast({
          type: 'success',
          title: 'Berhasil',
          message: 'Informasi peserta berhasil diperbarui.'
        });
      } else {
        await userRepository.createUser(input);
        addToast({
          type: 'success',
          title: 'Berhasil',
          message: 'Peserta baru berhasil ditambahkan.'
        });
      }

      setIsUserModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      const backendErrors = err.response?.data?.errors;
      if (backendErrors) {
        const formattedErrors: Record<string, string> = {};
        Object.keys(backendErrors).forEach(key => {
          formattedErrors[key] = backendErrors[key][0];
        });
        setUserErrors(formattedErrors);
      } else {
        addToast({
          type: 'error',
          title: 'Gagal Menyimpan',
          message: err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- GROUP ACTIONS ---
  const handleOpenGroupModal = (group: Group | null = null) => {
    setSelectedGroup(group);
    setGroupErrors({});
    if (group) {
      setGroupFormData({
        name: group.name,
        description: group.description || ''
      });
    } else {
      setGroupFormData({
        name: '',
        description: ''
      });
    }
    setIsGroupModalOpen(true);
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupErrors({});

    const errors: Record<string, string> = {};
    if (!groupFormData.name) errors.name = 'Nama grup wajib diisi.';

    if (Object.keys(errors).length > 0) {
      setGroupErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedGroup) {
        await groupRepository.updateGroup(selectedGroup.id, groupFormData);
        addToast({
          type: 'success',
          title: 'Berhasil',
          message: 'Detail grup berhasil diperbarui.'
        });
      } else {
        await groupRepository.createGroup(groupFormData);
        addToast({
          type: 'success',
          title: 'Berhasil',
          message: 'Grup baru berhasil dibuat.'
        });
      }

      setIsGroupModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      const backendErrors = err.response?.data?.errors;
      if (backendErrors) {
        const formattedErrors: Record<string, string> = {};
        Object.keys(backendErrors).forEach(key => {
          formattedErrors[key] = backendErrors[key][0];
        });
        setGroupErrors(formattedErrors);
      } else {
        addToast({
          type: 'error',
          title: 'Gagal Menyimpan',
          message: err.response?.data?.message || 'Terjadi kesalahan saat menyimpan grup.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DELETE CONFIRMATION ---
  const handleOpenDeleteModal = (type: 'user' | 'group', id: string, name: string) => {
    setDeleteType(type);
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      if (deleteType === 'user') {
        await userRepository.deleteUser(deleteTargetId);
        addToast({
          type: 'success',
          title: 'Berhasil Dihapus',
          message: `Peserta "${deleteTargetName}" telah dihapus.`
        });
      } else {
        await groupRepository.deleteGroup(deleteTargetId);
        addToast({
          type: 'success',
          title: 'Berhasil Dihapus',
          message: `Grup "${deleteTargetName}" telah dihapus.`
        });
      }
      setIsDeleteModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.response?.data?.message || 'Gagal menghapus data. Pastikan tidak ada dependensi aktif.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- MANAGE GROUP MEMBERS ---
  const handleOpenMembersModal = (group: Group) => {
    setManagingGroup(group);
    setMemberSearchTerm('');
    // Find all users currently belonging to this group
    const currentMembers = users.filter(u => u.groups?.some(g => g.id === group.id)).map(u => u.id);
    setSelectedMemberIds(currentMembers);
    setIsMembersModalOpen(true);
  };

  const handleMemberToggle = (userId: string) => {
    setSelectedMemberIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSaveMembers = async () => {
    if (!managingGroup) return;
    setIsSubmitting(true);
    try {
      await groupRepository.syncMembers(managingGroup.id, selectedMemberIds);
      addToast({
        type: 'success',
        title: 'Sinkronisasi Berhasil',
        message: `Daftar anggota untuk grup "${managingGroup.name}" berhasil diperbarui.`
      });
      setIsMembersModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Gagal Sinkronisasi',
        message: err.response?.data?.message || 'Gagal memperbarui anggota grup.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered users for display
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((user as any).username || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = filterGroup === '' || user.groups?.some(g => g.id === filterGroup);
    
    return matchesSearch && matchesGroup;
  });

  // Filtered users inside the member management list
  const filteredMembersList = users.filter(user => 
    user.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">Manajemen Peserta & Grup</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Daftarkan peserta ujian dan kelompokkan mereka ke dalam grup agar peserta tidak bisa sembarangan mengikuti ujian.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'users' ? (
            <Button
              onClick={() => handleOpenUserModal()}
              className="flex items-center gap-2 shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <UserPlus className="h-4.5 w-4.5" />
              <span>Tambah Peserta</span>
            </Button>
          ) : (
            <Button
              onClick={() => handleOpenGroupModal()}
              className="flex items-center gap-2 shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <FolderPlus className="h-4.5 w-4.5" />
              <span>Buat Grup Baru</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition-all duration-200 cursor-pointer ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          <span>Daftar Peserta</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition-all duration-200 cursor-pointer ${
            activeTab === 'groups'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <Layers className="h-4.5 w-4.5" />
          <span>Grup Peserta Ujian</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {groups.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center bg-white/50 dark:bg-zinc-900/10 min-h-[300px]">
          <Spinner label="Memuat Data..." />
        </Card>
      ) : activeTab === 'users' ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <Card className="p-4 bg-white dark:bg-zinc-900/30">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search */}
              <div className="flex-1">
                <Input
                  placeholder="Cari peserta berdasarkan nama, email, atau username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>

              {/* Group Filter */}
              <div className="w-full md:w-64">
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm transition-colors duration-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 cursor-pointer"
                >
                  <option value="">Semua Grup</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* User Table Card */}
          <Card className="overflow-hidden p-0 border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <th className="py-4 px-6">Nama Lengkap</th>
                    <th className="py-4 px-6">Kredensial</th>
                    <th className="py-4 px-6">Informasi Kontak</th>
                    <th className="py-4 px-6">Grup Terdaftar</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-sm">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-400 dark:text-zinc-500 font-medium">
                        Tidak ada data peserta ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10 transition-colors">
                        <td className="py-4.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100/50 dark:border-blue-900/20">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-zinc-50">{user.name}</div>
                              <div className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">Role: Peserta</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4.5 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                              <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{(user as any).username || ''}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                              <Mail className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4.5 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                              <Phone className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{(user as any).telp || '-'}</span>
                            </div>
                            <div className="text-xs text-zinc-400 dark:text-zinc-500 capitalize">
                              Gender: {(user as any).gender === 'male' ? 'Laki-laki' : (user as any).gender === 'female' ? 'Perempuan' : '-'}
                            </div>
                          </div>
                        </td>
                        <td className="py-4.5 px-6">
                          <div className="flex flex-wrap gap-1.5">
                            {user.groups && user.groups.length > 0 ? (
                              user.groups.map(g => (
                                <span 
                                  key={g.id} 
                                  className="inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30"
                                >
                                  {g.name}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/20">
                                Mandiri (Belum Ada Grup)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenUserModal(user)}
                              className="p-2 rounded-xl text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/30 transition-all cursor-pointer"
                              title="Edit Peserta"
                            >
                              <Edit className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal('user', user.id, user.name)}
                              className="p-2 rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-450 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                              title="Hapus Peserta"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        /* Groups View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length === 0 ? (
            <div className="col-span-full">
              <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <Layers className="h-10 w-10 text-zinc-400 mb-3" />
                <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Grup Kosong</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                  Belum ada grup peserta yang dibuat. Buat grup terlebih dahulu untuk menampung peserta ujian.
                </p>
              </Card>
            </div>
          ) : (
            groups.map((group) => (
              <Card 
                key={group.id} 
                className="flex flex-col justify-between h-full bg-white dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="h-11 w-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20 shadow-sm">
                      <Users className="h-5.5 w-5.5" />
                    </div>
                    <span className="inline-flex px-2.5 py-1 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/40 dark:border-zinc-800/40">
                      {group.users_count || 0} Anggota
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3">
                      {group.description || 'Tidak ada deskripsi grup.'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenMembersModal(group)}
                    className="flex items-center gap-1.5"
                  >
                    <Settings className="h-4 w-4 text-blue-500" />
                    <span>Kelola Anggota</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenGroupModal(group)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/20 transition-all cursor-pointer"
                      title="Edit Grup"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal('group', group.id, group.name)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-red-650 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-450 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                      title="Hapus Grup"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* --- ADD / EDIT USER MODAL --- */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => !isSubmitting && setIsUserModalOpen(false)}
        title={selectedUser ? 'Edit Peserta Ujian' : 'Tambah Peserta Baru'}
        size="md"
      >
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap peserta"
              value={userFormData.name}
              onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
              error={userErrors.name}
              disabled={isSubmitting}
            />

            <Input
              label="Username"
              placeholder="Masukkan username unik"
              value={userFormData.username}
              onChange={(e) => setUserFormData(prev => ({ ...prev, username: e.target.value }))}
              error={userErrors.username}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="contoh@domain.com"
              value={userFormData.email}
              onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
              error={userErrors.email}
              disabled={isSubmitting}
            />

            <Input
              label={selectedUser ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}
              type="password"
              placeholder="Minimal 6 karakter"
              value={userFormData.password}
              onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
              error={userErrors.password}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nomor Telepon"
              placeholder="Masukkan nomor telepon (opsional)"
              value={userFormData.telp}
              onChange={(e) => setUserFormData(prev => ({ ...prev, telp: e.target.value }))}
              disabled={isSubmitting}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Jenis Kelamin</label>
              <div className="flex gap-4 py-2.5">
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={userFormData.gender === 'male'}
                    onChange={() => setUserFormData(prev => ({ ...prev, gender: 'male' }))}
                    disabled={isSubmitting}
                    className="accent-blue-600"
                  />
                  <span>Laki-laki</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={userFormData.gender === 'female'}
                    onChange={() => setUserFormData(prev => ({ ...prev, gender: 'female' }))}
                    disabled={isSubmitting}
                    className="accent-blue-600"
                  />
                  <span>Perempuan</span>
                </label>
              </div>
            </div>
          </div>

          {/* Group Checklist Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Hubungkan ke Grup Ujian</label>
            {groups.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">Belum ada grup yang tersedia. Silakan buat grup terlebih dahulu.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 max-h-36 overflow-y-auto">
                {groups.map((group) => {
                  const isChecked = userFormData.groupIds.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => handleUserGroupToggle(group.id)}
                      disabled={isSubmitting}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left cursor-pointer ${
                        isChecked
                          ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-400'
                          : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      <span className="truncate pr-2">{group.name}</span>
                      {isChecked && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUserModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- ADD / EDIT GROUP MODAL --- */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => !isSubmitting && setIsGroupModalOpen(false)}
        title={selectedGroup ? 'Edit Grup Ujian' : 'Buat Grup Ujian Baru'}
        size="sm"
      >
        <form onSubmit={handleGroupSubmit} className="space-y-4">
          <Input
            label="Nama Grup"
            placeholder="Masukkan nama grup (cth: Kelas XII-A)"
            value={groupFormData.name}
            onChange={(e) => setGroupFormData(prev => ({ ...prev, name: e.target.value }))}
            error={groupErrors.name}
            disabled={isSubmitting}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Deskripsi</label>
            <textarea
              placeholder="Tuliskan deskripsi grup atau target ujian grup ini..."
              value={groupFormData.description}
              onChange={(e) => setGroupFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm transition-colors duration-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-blue-500 dark:focus:ring-blue-500 min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGroupModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- MANAGE MEMBERS MODAL --- */}
      <Modal
        isOpen={isMembersModalOpen}
        onClose={() => !isSubmitting && setIsMembersModalOpen(false)}
        title={`Kelola Anggota: ${managingGroup?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-3.5 text-xs text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400 flex items-start gap-2.5">
            <Info className="h-4.5 w-4.5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Pilih peserta ujian yang berhak masuk ke grup ini. Peserta yang terhubung dengan grup ini akan otomatis berhak mengikuti semua ujian yang dijadwalkan untuk grup ini.
            </p>
          </div>

          {/* Member Search */}
          <Input
            placeholder="Cari peserta berdasarkan nama..."
            value={memberSearchTerm}
            onChange={(e) => setMemberSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />

          {/* Members list with checkboxes */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/10 p-2 max-h-[300px] overflow-y-auto space-y-1">
            {filteredMembersList.length === 0 ? (
              <p className="text-center py-8 text-xs text-zinc-400">Tidak ada peserta ditemukan.</p>
            ) : (
              filteredMembersList.map((user) => {
                const isSelected = selectedMemberIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleMemberToggle(user.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-400'
                        : 'bg-white border-zinc-150 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected 
                          ? 'bg-blue-200/50 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' 
                          : 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-xs truncate">{user.name}</p>
                        <p className="text-[10px] text-zinc-450 dark:text-zinc-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950'
                    }`}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {selectedMemberIds.length} peserta terpilih
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsMembersModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveMembers}
                isLoading={isSubmitting}
              >
                Simpan Anggota
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Apakah Anda yakin ingin menghapus {deleteType === 'user' ? 'peserta' : 'grup'}{' '}
            <strong className="text-zinc-950 dark:text-zinc-50">"{deleteTargetName}"</strong>? 
            {deleteType === 'group' 
              ? ' Anggota grup tidak akan terhapus, tetapi grup tidak dapat lagi digunakan untuk membatasi akses ujian.' 
              : ' Semua data terkait peserta ini akan dihapus dari sistem.'}
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              isLoading={isSubmitting}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
