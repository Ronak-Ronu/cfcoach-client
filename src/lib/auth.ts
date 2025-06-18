import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from './axios';
import { AuthResponse, LoginFormData, SignupFormData } from '@/types';

export const useAuth = () => {
  const navigate = useNavigate();

  const login = async (data: LoginFormData) => {
    try {
      const res = await axios.post<AuthResponse>('/auth/login', data);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      throw err instanceof AxiosError ? new Error(err.response?.data?.message || 'Login failed') : new Error('Login failed');
    }
  };

  const signup = async (data: SignupFormData) => {
    try {
      const res = await axios.post<AuthResponse>('/auth/signup', data);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      throw err instanceof AxiosError ? new Error(err.response?.data?.message || 'Signup failed') : new Error('Signup failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const verifyToken = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      await axios.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return true;
    } catch {
      localStorage.removeItem('token');
      return false;
    }
  };

  return { login, signup, logout, verifyToken };
};