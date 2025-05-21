import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/shared/auth/AuthContext';
import StoreProvider from '@/shared/store/StoreProvider';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Корневой провайдер для всего приложения,
 * включающий маршрутизацию, аутентификацию и хранилище данных
 */
export const Providers = ({ children }: ProvidersProps) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          {children}
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Providers;
