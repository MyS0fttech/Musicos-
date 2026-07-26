import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from './ToastContainer';
import { useTheme } from '../context/ThemeContext';
import { Music, CheckCircle2, Send, Sparkles, User, Tag, FileText, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

const formSchema = z.object({
  nombre: z.string().min(3, 'El nombre completo es obligatorio (mínimo 3 caracteres)'),
  estado: z.enum(['En formación', 'Músico activo'], {
    message: 'Por favor seleccione el estado del músico',
  }),
  necesidad: z.string().min(3, 'Por favor especifique lo que hace falta para el inventario'),
});

type FormValues = z.infer<typeof formSchema>;

export const PublicForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { showToast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      estado: 'En formación',
      necesidad: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const now = new Date();
      const fechaHoraStr = now.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) + ', ' + now.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      });

      await addDoc(collection(db, 'musicos'), {
        nombre: data.nombre.trim(),
        estado: data.estado,
        necesidad: data.necesidad.trim(),
        fechaHora: fechaHoraStr,
        createdAt: serverTimestamp(),
      });

      setIsSuccess(true);
      showToast('Registro enviado', 'Información enviada correctamente al sistema', 'success');
      reset();
    } catch (error) {
      console.error('Error enviando formulario:', error);
      showToast('Error de envío', 'Ocurrió un error al guardar los datos. Intente nuevamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Decorative Gold & Deep Blue Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-blue-500/10 dark:from-blue-900/30 via-amber-500/10 to-transparent blur-3xl pointer-events-none -z-0" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-amber-500/10 blur-3xl rounded-full pointer-events-none -z-0" />

      {/* Top Bar with Brand, Theme Toggle & Admin Link */}
      <header className="w-full max-w-2xl flex justify-between items-center z-10 py-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-bold">
            <Music className="w-5 h-5 text-slate-950" />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-wider text-[#002147] dark:text-amber-400">IPUC BUENOS AIRES</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-all cursor-pointer flex items-center justify-center"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-amber-600" />}
          </button>

          <Link
            to="/admin"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 px-3.5 py-2 rounded-full transition-all duration-200 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Panel Admin</span>
          </Link>
        </div>
      </header>

      {/* Centered Main Card */}
      <main className="w-full max-w-xl my-auto z-10 py-6">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl relative"
            >
              {/* Subtle Gold Accent Line at Top */}
              <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

              {/* Title & Subtitle */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-amber-500/10 dark:bg-slate-800/90 border border-amber-500/20 text-amber-600 dark:text-amber-400 mb-3 shadow-inner">
                  <Music className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#002147] dark:text-white font-poppins">
                  MÚSICOS IPUC BUENOS AIRES
                </h1>
                <p className="text-sm sm:text-base font-medium text-amber-600 dark:text-amber-400/90 mt-1 tracking-wide">
                  Registro e Inventario de Necesidades
                </p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-amber-500 to-amber-300 mx-auto mt-3 rounded-full" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Nombre completo */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Nombre completo</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    {...register('nombre')}
                    className={`w-full bg-slate-50 dark:bg-slate-950/80 border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                      errors.nombre
                        ? 'border-rose-500/80 focus:border-rose-500'
                        : 'border-slate-200 dark:border-slate-800 focus:border-amber-500/80'
                    }`}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                      <span>•</span> {errors.nombre.message}
                    </p>
                  )}
                </div>

                {/* Estado del músico */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Estado del músico</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="relative flex items-center justify-center p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-all group has-[:checked]:border-amber-500/80 has-[:checked]:bg-amber-500/10 has-[:checked]:ring-1 has-[:checked]:ring-amber-500/50">
                      <input
                        type="radio"
                        value="En formación"
                        {...register('estado')}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-has-[:checked]:text-amber-600 dark:group-has-[:checked]:text-amber-300 transition-colors">
                        En formación
                      </span>
                    </label>

                    <label className="relative flex items-center justify-center p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-all group has-[:checked]:border-amber-500/80 has-[:checked]:bg-amber-500/10 has-[:checked]:ring-1 has-[:checked]:ring-amber-500/50">
                      <input
                        type="radio"
                        value="Músico activo"
                        {...register('estado')}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-has-[:checked]:text-amber-600 dark:group-has-[:checked]:text-amber-300 transition-colors">
                        Músico activo
                      </span>
                    </label>
                  </div>
                  {errors.estado && (
                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                      <span>•</span> {errors.estado.message}
                    </p>
                  )}
                </div>

                {/* ¿Qué necesita o qué hace falta para el inventario? */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>¿Qué necesita o qué hace falta para el inventario?</span>
                  </label>

                  <textarea
                    rows={4}
                    placeholder="Escriba en detalle la información..."
                    {...register('necesidad')}
                    className={`w-full bg-slate-50 dark:bg-slate-950/80 border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                      errors.necesidad
                        ? 'border-rose-500/80 focus:border-rose-500'
                        : 'border-slate-200 dark:border-slate-800 focus:border-amber-500/80'
                    }`}
                  />
                  {errors.necesidad && (
                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                      <span>•</span> {errors.necesidad.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer text-base"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Guardando registro...</span>
                    </div>
                  ) : (
                    <>
                      <span>Enviar información</span>
                      <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            /* Success Screen Animation */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
              className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden"
            >
              <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-950 shadow-lg shadow-amber-500/30">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002147] dark:text-white font-poppins mb-2">
                ¡Registro Recibido!
              </h2>

              <blockquote className="text-lg font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 py-3 px-4 rounded-xl my-4">
                Información enviada correctamente.
              </blockquote>

              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
                Los datos ingresados se han guardado con éxito en el inventario del programa MÚSICOS IPUC BUENOS AIRES.
              </p>

              <button
                onClick={() => setIsSuccess(false)}
                className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 font-semibold py-3 px-6 rounded-xl border border-amber-500/30 transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Realizar otro registro</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-slate-500 dark:text-slate-400 z-10 py-4">
        <p>© {new Date().getFullYear()} MÚSICOS IPUC BUENOS AIRES • Inventario y Registro Oficial</p>
      </footer>
    </div>
  );
};

