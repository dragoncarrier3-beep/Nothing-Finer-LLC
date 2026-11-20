import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { AuthProvider } from '@/contexts/AuthContext';

// Phones: toasts at the top (bottom-sheet dialogs and the tab bar live at the bottom). Desktop: bottom-right.
const isPhone = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster position={isPhone ? 'top-center' : 'bottom-right'} richColors closeButton offset={24} mobileOffset={{ top: 108, left: 12, right: 12 }} toastOptions={{ style: { fontFamily: 'Inter, sans-serif' } }} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
