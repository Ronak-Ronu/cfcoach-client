import { Navigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Loader } from './ui/Loader';

export const PublicRoute = () => {
  const { verifyToken } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await verifyToken();
      setIsAuthenticated(isValid);
    };
    checkAuth();
  }, [verifyToken]);

  if (isAuthenticated === null) {
    return <div className="text-foreground"><Loader/></div>;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};