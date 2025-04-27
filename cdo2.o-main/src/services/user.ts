import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  company?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive';
  company?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

class UserService {
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await api.get<User[]>('/auth/users');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  }

  async createUser(data: CreateUserData): Promise<User> {
    try {
      const response = await api.post<{ user: User }>('/auth/register', data);
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const response = await api.put<User>(`/auth/users/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await api.delete(`/auth/users/${id}`);
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  }

  async updateUserStatus(id: string, status: 'active' | 'inactive'): Promise<User> {
    try {
      const response = await api.patch<User>(`/auth/users/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }
      throw new Error(error.response?.data?.message || 'Failed to update user status');
    }
  }
}

export const userService = new UserService(); 