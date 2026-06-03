import { api } from '../api';
import { User } from '../../core/types';

export interface UserInput {
  name: string;
  username: string;
  email: string;
  password?: string;
  telp?: string;
  gender?: 'male' | 'female';
  group_ids?: string[];
}

export const userRepository = {
  async getUsers(params?: { search?: string; group_id?: string }): Promise<User[]> {
    const response = await api.get('/users', { params });
    const resData = response.data.data;
    if (Array.isArray(resData)) {
      return resData as User[];
    }
    return [];
  },

  async createUser(data: UserInput): Promise<User> {
    const response = await api.post('/users', data);
    return response.data.data as User;
  },

  async updateUser(id: string, data: UserInput): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data.data as User;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async importUsers(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};
