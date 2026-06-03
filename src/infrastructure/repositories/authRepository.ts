import { api, setCookie, deleteCookie } from '../api';
import { User } from '../../core/types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export const authRepository = {
  async login(loginInput: string, passwordInput: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', {
      login: loginInput,
      password: passwordInput,
    });
    
    const data = response.data.data as LoginResponse;
    // Set cookie for authentication
    setCookie('cbt_token', data.access_token, 7);
    return data;
  },

  async register(nameInput: string, usernameInput: string, emailInput: string, passwordInput: string, passwordConfirmationInput: string): Promise<any> {
    const response = await api.post('/auth/register', {
      name: nameInput,
      username: usernameInput,
      email: emailInput,
      password: passwordInput,
      password_confirmation: passwordConfirmationInput,
    });
    return response.data;
  },

  async me(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data as User;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    deleteCookie('cbt_token');
  },
};
