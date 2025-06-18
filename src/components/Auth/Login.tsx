import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios, { AxiosError } from '@/lib/axios';
import { AuthResponse } from '@/types';

interface LoginFormData {
  email: string;
  password: string;
}

export const Login = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const [error, setError] = useState<string>('');

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await axios.post<AuthResponse>('/auth/login', data);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Login failed');
        
      } else {
        setError('Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-foreground">Log In</h2>
        {error && <p className="text-destructive text-center">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="youremail@something.com"
              className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                errors.email ? 'border-destructive' : 'border-input'
              } focus:outline-none focus:ring-2 focus:ring-primary`}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="******"
              className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                errors.password ? 'border-destructive' : 'border-input'
              } focus:outline-none focus:ring-2 focus:ring-primary`}
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Log In
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};