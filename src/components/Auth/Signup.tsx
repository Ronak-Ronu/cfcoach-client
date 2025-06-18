import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios, { AxiosError } from '@/lib/axios';
import { AuthResponse } from '@/types';

interface SignupFormData {
  name: string;
  email: string;
  password: string;
}

export const Signup = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });
  const [error, setError] = useState<string>('');

  const onSubmit = async (data: SignupFormData) => {
    try {
      const res = await axios.post<AuthResponse>('/auth/signup', data);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    }  catch (err) {
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
        <h2 className="text-2xl font-bold text-center text-foreground">Sign Up</h2>
        {error && <p className="text-destructive text-center">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Name
            </label>
            <input
              id="name"
              placeholder="Your Name Coach!"
              className={`w-full px-3 py-2 border rounded-md bg-background text-foreground ${
                errors.name ? 'border-destructive' : 'border-input'
              } focus:outline-none focus:ring-2 focus:ring-primary`}
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="coachemail@something.com"
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
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />
            {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Sign Up
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};