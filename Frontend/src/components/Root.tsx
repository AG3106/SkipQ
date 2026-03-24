import { Outlet, useLocation, useNavigate } from 'react-router';
import { Header } from './Header';
import { useEffect, useState } from 'react';

const publicRoutes = ['/login', '/register', '/pin-setup', '/forgot-password'];

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPublicRoute = publicRoutes.includes(location.pathname);

  useEffect(() => {
    const user = localStorage.getItem('skipq-user');
    const pin = localStorage.getItem('skipq-wallet-pin');

    if (!isPublicRoute) {
      if (!user) {
        navigate('/login');
      } else if (!pin && location.pathname !== '/pin-setup') {
        navigate('/pin-setup');
      }
    }
  }, [location.pathname, isPublicRoute, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {!isPublicRoute && <Header />}
      <main className={!isPublicRoute ? 'pt-16' : ''}>
        <Outlet />
      </main>
    </div>
  );
}