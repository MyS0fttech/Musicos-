import React, { useState } from 'react';
import { isValidSecurityCode } from '../config/admin';
import { useToast } from './ToastContainer';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';
import { Music, Lock, ArrowLeft, Key, LogIn, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCodeError(null);

    // Validate security code
    if (!isValidSecurityCode(securityCode)) {
      const msg = "Código de acceso incorrecto. Verifique e intente nuevamente.";
      setCodeError(msg);
      showToast('Código Incorrecto', 'El código de acceso ingresado no es válido.', 'error');
      setIsLoading(false);
      return;
    }

    showToast('Bienvenido', 'Acceso concedido al Panel Administrativo.', 'success');
    setIsLoading(false);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-amber-500/10 via-blue-900/20 to-transparent blur-3xl pointer-events-none" />

      {/* Header back to form & Theme toggle */}
      <header className="w-full max-w-md flex justify-between items-center z-10 py-2">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al formulario público</span>
        </Link>

        <button
          type="button"
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-all cursor-pointer flex items-center justify-center"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-amber-600" />}
        </button>
      </header>

      {/* Main Centered Login Card */}
      <main className="w-full max-w-md my-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative"
        >
          {/* Gold Header Accent */}
          <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-amber-500/10 dark:bg-slate-800 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Music className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span className="text-xs font-bold tracking-widest uppercase text-amber-600 dark:text-amber-400">
                MÚSICOS IPUC BUENOS AIRES
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-[#002147] dark:text-white font-poppins">
              Panel Administrativo
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ingrese el código de acceso autorizado para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Security Code Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Código de Acceso</span>
              </label>
              <input
                type="password"
                placeholder="Ingrese el código de acceso"
                value={securityCode}
                onChange={(e) => {
                  setSecurityCode(e.target.value);
                  setCodeError(null);
                }}
                className={`w-full bg-slate-50 dark:bg-slate-950/80 border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  codeError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-amber-500'
                }`}
                autoFocus
              />
              {codeError && (
                <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                  <span>•</span> {codeError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !securityCode.trim()}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-amber-500/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-slate-950">
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verificando...</span>
                </div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span className="text-sm">Ingresar al Panel</span>
                </>
              )}
            </button>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Acceso restringido para administración de Músicos IPUC Buenos Aires.
              </p>
            </div>
          </form>
        </motion.div>
      </main>

      <footer className="w-full text-center text-xs text-slate-500 dark:text-slate-400 z-10 py-4">
        © MÚSICOS IPUC BUENOS AIRES • Sistema de Gestión de Inventario
      </footer>
    </div>
  );
};



