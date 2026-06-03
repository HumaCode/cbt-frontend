import { api } from '../api';

export interface Group {
  id: string;
  name: string;
  description?: string;
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GroupInput {
  name: string;
  description?: string;
}

export const groupRepository = {
  async getGroups(): Promise<Group[]> {
    const response = await api.get('/groups');
    const resData = response.data.data;
    if (Array.isArray(resData)) {
      return resData as Group[];
    }
    return [];
  },

  async createGroup(data: GroupInput): Promise<Group> {
    const response = await api.post('/groups', data);
    return response.data.data as Group;
  },

  async updateGroup(id: string, data: GroupInput): Promise<Group> {
    const response = await api.put(`/groups/${id}`, data);
    return response.data.data as Group;
  },

  async deleteGroup(id: string): Promise<void> {
    await api.delete(`/groups/${id}`);
  },

  async syncMembers(groupId: string, userIds: string[]): Promise<any> {
    const response = await api.post(`/groups/${groupId}/members`, { user_ids: userIds });
    return response.data.data;
  },
};
