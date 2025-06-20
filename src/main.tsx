import './assets/styles/global.css'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme-provider';
import App from './App.tsx';
import { ToastProvider } from './components/toast-provider.tsx';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
            <ToastProvider>
            <App />
            </ToastProvider>
          </ThemeProvider>
        </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);