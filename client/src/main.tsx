import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import App from './App';
import './index.css';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="trend-drop-theme">
      <App />
      <Toaster />
    </ThemeProvider>
  </QueryClientProvider>
);