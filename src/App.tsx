import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { isAuthorizedAdmin } from './config/admin';
import { AdminUser } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ToastContainer';
import { PublicForm } from './components/PublicForm';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';

const AdminRouteContainer: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    // Check if user authenticated with security code session
    const isCodeAuthed = sessionStorage.getItem('admin_code_auth') === 'true';
    if (isCodeAuthed) {
      setCurrentUser({
        uid: 'admin-code-session',
        email: 'admin@ipucbuenosaires.org',
        displayName: 'Administrador IPUC',
      });
      setAuthChecking(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user && isAuthorizedAdmin(user.email)) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        setCurrentUser(null);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    sessionStorage.setItem('admin_code_auth', 'true');
    setCurrentUser({
      uid: 'admin-code-session',
      email: 'admin@ipucbuenosaires.org',
      displayName: 'Administrador IPUC',
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_code_auth');
    setCurrentUser(null);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Verificando acceso de administrador...</p>
      </div>
    );
  }

  if (currentUser) {
    return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicForm />} />
            <Route path="/admin" element={<AdminRouteContainer />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
