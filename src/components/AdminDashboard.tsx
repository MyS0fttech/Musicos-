import React, { useEffect, useState, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { MusicoRegistro, EstadoMusico, AdminUser } from '../types';
import { useToast } from './ToastContainer';
import { useTheme } from '../context/ThemeContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Users,
  UserCheck,
  GraduationCap,
  Calendar,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  Eye,
  Edit2,
  Trash2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Music,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface AdminDashboardProps {
  user: AdminUser;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [musicos, setMusicos] = useState<MusicoRegistro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showToast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('Todos');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal States
  const [selectedMusico, setSelectedMusico] = useState<MusicoRegistro | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Edit Form State
  const [editNombre, setEditNombre] = useState('');
  const [editEstado, setEditEstado] = useState<EstadoMusico>('En formación');
  const [editNecesidad, setEditNecesidad] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create Form State
  const [newNombre, setNewNombre] = useState('');
  const [newEstado, setNewEstado] = useState<EstadoMusico>('En formación');
  const [newNecesidad, setNewNecesidad] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch Firestore Data in Realtime
  const fetchMusicos = () => {
    setIsRefreshing(true);
    const q = query(collection(db, 'musicos'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: MusicoRegistro[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            nombre: data.nombre || '',
            estado: data.estado || 'En formación',
            necesidad: data.necesidad || '',
            fechaHora: data.fechaHora || '',
            createdAt: data.createdAt,
          });
        });
        setMusicos(list);
        setIsLoading(false);
        setIsRefreshing(false);
      },
      (error) => {
        console.error('Error escuchando la colección musicos:', error);
        showToast('Error', 'No se pudieron cargar los registros', 'error');
        setIsLoading(false);
        setIsRefreshing(false);
      }
    );

    return unsubscribe;
  };

  useEffect(() => {
    const unsub = fetchMusicos();
    return () => unsub();
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Actualizado', 'Datos sincronizados correctamente', 'info');
    }, 600);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Cierre de sesión local:', err);
    }
    showToast('Sesión cerrada', 'Has salido del panel administrativo', 'info');
    onLogout();
  };

  // Filtered & Sorted List
  const filteredMusicos = useMemo(() => {
    return musicos
      .filter((m) => {
        const matchesSearch =
          m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.necesidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.fechaHora.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesEstado =
          estadoFilter === 'Todos' ? true : m.estado === estadoFilter;

        return matchesSearch && matchesEstado;
      })
      .sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [musicos, searchTerm, estadoFilter, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredMusicos.length / itemsPerPage) || 1;
  const paginatedMusicos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMusicos.slice(start, start + itemsPerPage);
  }, [filteredMusicos, currentPage, itemsPerPage]);

  // Statistics
  const totalRegistros = musicos.length;
  const musicosActivos = musicos.filter((m) => m.estado === 'Músico activo').length;
  const enFormacion = musicos.filter((m) => m.estado === 'En formación').length;

  const registrosHoy = useMemo(() => {
    const today = new Date().toLocaleDateString('es-CL');
    return musicos.filter((m) => {
      if (m.fechaHora && m.fechaHora.includes(today)) return true;
      if (m.createdAt?.toDate) {
        return m.createdAt.toDate().toLocaleDateString('es-CL') === today;
      }
      return false;
    }).length;
  }, [musicos]);

  // Chart Data Setup
  const doughnutData = {
    labels: ['Músicos Activos', 'En formación'],
    datasets: [
      {
        data: [musicosActivos, enFormacion],
        backgroundColor: ['#3B82F6', '#F59E0B'],
        borderColor: isDarkMode ? '#0F172A' : '#FFFFFF',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDarkMode ? '#CBD5E1' : '#334155',
          font: { family: 'Inter', size: 12 },
          usePointStyle: true,
          padding: 16,
        },
      },
    },
  };

  // Actions: Open View Modal
  const openViewModal = (musico: MusicoRegistro) => {
    setSelectedMusico(musico);
    setViewModalOpen(true);
  };

  // Actions: Open Edit Modal
  const openEditModal = (musico: MusicoRegistro) => {
    setSelectedMusico(musico);
    setEditNombre(musico.nombre);
    setEditEstado(musico.estado);
    setEditNecesidad(musico.necesidad);
    setEditModalOpen(true);
  };

  // Actions: Save Edit
  const handleSaveEdit = async () => {
    if (!selectedMusico || !selectedMusico.id) return;
    if (!editNombre.trim() || !editNecesidad.trim()) {
      showToast('Error', 'Todos los campos son obligatorios', 'error');
      return;
    }

    setIsSavingEdit(true);
    try {
      const docRef = doc(db, 'musicos', selectedMusico.id);
      await updateDoc(docRef, {
        nombre: editNombre.trim(),
        estado: editEstado,
        necesidad: editNecesidad.trim(),
      });
      showToast('Actualizado', 'Registro modificado con éxito', 'success');
      setEditModalOpen(false);
    } catch (err) {
      console.error('Error al actualizar:', err);
      showToast('Error', 'No se pudo actualizar el registro', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Actions: Open Delete Modal
  const openDeleteModal = (musico: MusicoRegistro) => {
    setSelectedMusico(musico);
    setDeleteModalOpen(true);
  };

  // Actions: Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedMusico || !selectedMusico.id) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'musicos', selectedMusico.id));
      showToast('Eliminado', 'El registro ha sido eliminado del inventario', 'success');
      setDeleteModalOpen(false);
    } catch (err) {
      console.error('Error al eliminar:', err);
      showToast('Error', 'No se pudo eliminar el registro', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Actions: Create New Record
  const handleOpenCreateModal = () => {
    setNewNombre('');
    setNewEstado('En formación');
    setNewNecesidad('');
    setCreateModalOpen(true);
  };

  const handleCreateNew = async () => {
    if (!newNombre.trim()) {
      showToast('Campo Incompleto', 'Por favor ingrese el nombre completo', 'error');
      return;
    }
    if (!newNecesidad.trim()) {
      showToast('Campo Incompleto', 'Por favor escriba en detalle la información requerida', 'error');
      return;
    }

    setIsCreating(true);
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
        nombre: newNombre.trim(),
        estado: newEstado,
        necesidad: newNecesidad.trim(),
        fechaHora: fechaHoraStr,
        createdAt: serverTimestamp(),
      });

      showToast('Registro Creado', 'Nuevo registro agregado exitosamente al inventario', 'success');
      setCreateModalOpen(false);
      setNewNombre('');
      setNewEstado('En formación');
      setNewNecesidad('');
    } catch (err) {
      console.error('Error al crear registro:', err);
      showToast('Error', 'No se pudo crear el registro', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Export Excel
  const exportToExcel = () => {
    const dataToExport = filteredMusicos.map((m, idx) => ({
      N: idx + 1,
      Nombre: m.nombre,
      Estado: m.estado,
      Necesidad: m.necesidad,
      'Fecha y Hora': m.fechaHora,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Musicos_IPUC');
    XLSX.writeFile(
      workbook,
      `Musicos_IPUC_BuenosAires_Inventario_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    showToast('Exportación', 'Archivo Excel generado exitosamente', 'success');
  };

  // Export PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    // PDF Title
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('MÚSICOS IPUC BUENOS AIRES - Reporte de Inventario', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Generado el: ${new Date().toLocaleString('es-CL')} | Total: ${filteredMusicos.length} registros`,
      14,
      28
    );

    const tableRows = filteredMusicos.map((m, i) => [
      i + 1,
      m.nombre,
      m.estado,
      m.necesidad,
      m.fechaHora,
    ]);

    autoTable(doc, {
      head: [['#', 'Nombre', 'Estado', 'Necesidad / Requerimiento', 'Fecha y Hora']],
      body: tableRows,
      startY: 34,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 33, 71], // Navy #002147
        textColor: [212, 175, 55], // Gold #D4AF37
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
    });

    doc.save(`Musicos_IPUC_BuenosAires_Reporte_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('Exportación', 'Documento PDF generado exitosamente', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col justify-between">
      <div>
        {/* Top Navbar with Navy background and 4px Gold border */}
        <header className="sticky top-0 z-30 bg-[#002147] border-b-4 border-[#D4AF37] text-white px-4 sm:px-8 py-3.5 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-[#002147] flex items-center justify-center font-extrabold shadow-md">
                <Music className="w-6 h-6 text-[#002147]" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold font-poppins text-white flex items-center gap-2 tracking-tight">
                  <span>MÚSICOS IPUC BUENOS AIRES</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#002147] font-bold uppercase tracking-wider">
                    Panel Admin
                  </span>
                </h1>
                <p className="text-[11px] uppercase tracking-widest text-slate-300 font-medium">
                  Panel Administrativo de Inventario
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#D4AF37] border border-white/20 transition-all cursor-pointer"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-[#D4AF37]" />}
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                title="Actualizar datos"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#D4AF37]' : ''}`} />
              </button>

              {/* User Profile Badge */}
              <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-slate-100 max-w-[160px] truncate">
                  {user.email || 'Admin'}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs font-semibold bg-white/10 hover:bg-rose-500/20 text-slate-200 hover:text-rose-300 border border-white/20 hover:border-rose-500/30 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 pb-16">
          
          {/* KPI Stats Grid with Left Border Accents */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-[#002147] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Registros
                  </p>
                  <h3 className="text-3xl font-bold text-[#002147] dark:text-white font-poppins mt-2">
                    {isLoading ? '...' : totalRegistros}
                  </h3>
                </div>
                <div className="p-3 bg-[#002147]/10 text-[#002147] dark:text-blue-400 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Inventario consolidado
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-[#D4AF37] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Músicos Activos
                  </p>
                  <h3 className="text-3xl font-bold text-[#002147] dark:text-white font-poppins mt-2">
                    {isLoading ? '...' : musicosActivos}
                  </h3>
                </div>
                <div className="p-3 bg-[#D4AF37]/15 text-[#D4AF37] rounded-xl">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden">
                <div
                  className="bg-[#D4AF37] h-1.5 rounded-full transition-all"
                  style={{ width: totalRegistros ? `${Math.round((musicosActivos / totalRegistros) * 100)}%` : '0%' }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-400 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    En Formación
                  </p>
                  <h3 className="text-3xl font-bold text-[#002147] dark:text-white font-poppins mt-2">
                    {isLoading ? '...' : enFormacion}
                  </h3>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-400 h-1.5 rounded-full transition-all"
                  style={{ width: totalRegistros ? `${Math.round((enFormacion / totalRegistros) * 100)}%` : '0%' }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Registros Hoy
                  </p>
                  <h3 className="text-3xl font-bold text-[#002147] dark:text-white font-poppins mt-2">
                    {isLoading ? '...' : registrosHoy}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Requerimientos recibidos hoy
              </div>
            </motion.div>
          </section>

          {/* Analytics Chart & Export Actions Banner */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Card */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#002147] dark:text-white uppercase tracking-wider mb-1">
                  Distribución de Músicos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Proporción entre activos y en formación
                </p>
              </div>
              <div className="h-56 relative flex items-center justify-center py-2">
                {totalRegistros > 0 ? (
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                ) : (
                  <div className="text-xs text-slate-400 text-center py-10">
                    No hay suficientes datos para generar el gráfico
                  </div>
                )}
              </div>
            </div>

            {/* Export Actions & Public View Card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#002147] dark:text-white uppercase tracking-wider">
                      Exportación y Reportes
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Descargue el inventario actualizado en formato Excel o PDF
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <button
                    onClick={exportToExcel}
                    disabled={musicos.length === 0}
                    className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 transition-all flex items-center gap-3 group cursor-pointer disabled:opacity-50"
                  >
                    <div className="p-2.5 rounded-lg bg-emerald-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold">Exportar Excel</h4>
                      <p className="text-xs opacity-80">Hoja de cálculo (.xlsx)</p>
                    </div>
                  </button>

                  <button
                    onClick={exportToPDF}
                    disabled={musicos.length === 0}
                    className="p-4 rounded-xl border border-[#002147]/30 bg-[#002147]/5 dark:bg-slate-800/80 hover:bg-[#002147]/10 text-[#002147] dark:text-amber-300 transition-all flex items-center gap-3 group cursor-pointer disabled:opacity-50"
                  >
                    <div className="p-2.5 rounded-lg bg-[#002147] text-[#D4AF37] shadow-sm group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold">Exportar PDF</h4>
                      <p className="text-xs opacity-80">Documento imprimible (.pdf)</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Registros mostrados: <strong>{filteredMusicos.length}</strong> de {musicos.length}</span>
                <span>Orden: <strong>{sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguos primero'}</strong></span>
              </div>
            </div>
          </section>

          {/* Data Table Section */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Table Search & Controls Bar */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
              {/* Search Input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar músico o necesidad..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters & Sorting */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                {/* Estado Filter */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Estado:</span>
                  <select
                    value={estadoFilter}
                    onChange={(e) => {
                      setEstadoFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
                  >
                    <option value="Todos">Todos</option>
                    <option value="En formación">En formación</option>
                    <option value="Músico activo">Músico activo</option>
                  </select>
                </div>

                {/* Sort Direction */}
                <button
                  onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {sortOrder === 'desc' ? '📅 Más recientes' : '📅 Más antiguos'}
                </button>

                {/* Add New Record Button */}
                <button
                  onClick={handleOpenCreateModal}
                  className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Registro</span>
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    <th className="py-3.5 px-4 sm:px-6">Músico</th>
                    <th className="py-3.5 px-4 sm:px-6">Estado</th>
                    <th className="py-3.5 px-4 sm:px-6">Necesidad</th>
                    <th className="py-3.5 px-4 sm:px-6">Fecha</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36 mb-1" />
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48" />
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-20 mx-auto" />
                        </td>
                      </tr>
                    ))
                  ) : paginatedMusicos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto">
                          <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                          <p className="font-semibold text-slate-700 dark:text-slate-300">
                            No se encontraron registros
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Pruebe cambiando los filtros de búsqueda o registre un nuevo músico.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedMusicos.map((musico) => (
                      <tr
                        key={musico.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Nombre */}
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900 dark:text-white">
                          {musico.nombre}
                        </td>

                        {/* Estado Tag */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              musico.estado === 'Músico activo'
                                ? 'bg-[#DCFCE7] text-[#166534] dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {musico.estado === 'Músico activo' ? 'Activo' : 'Formación'}
                          </span>
                        </td>

                        {/* Necesidad */}
                        <td className="py-3.5 px-4 sm:px-6 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {musico.necesidad}
                        </td>

                        {/* Fecha y Hora */}
                        <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400">
                          {musico.fechaHora || 'Sin fecha'}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 sm:px-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-xs">
                            <button
                              onClick={() => openViewModal(musico)}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                            >
                              Ver
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <button
                              onClick={() => openEditModal(musico)}
                              className="text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                            >
                              Editar
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <button
                              onClick={() => openDeleteModal(musico)}
                              className="text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                            >
                              Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredMusicos.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Mostrar:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs cursor-pointer text-slate-900 dark:text-slate-100"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>por página</span>
                </div>

                <div className="flex items-center gap-2">
                  <span>
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

        </main>
      </div>

      {/* Floating Action Button (FAB) in Gold with Navy Accent */}
      <button
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        title="Actualizar datos del inventario"
        className="fixed bottom-10 right-10 z-40 w-14 h-14 bg-[#D4AF37] text-[#002147] rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform border-4 border-white dark:border-slate-900 cursor-pointer"
      >
        <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>

      {/* Institutional Footer */}
      <footer className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 font-medium gap-2">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#002147] dark:text-amber-400">© MÚSICOS IPUC BUENOS AIRES</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>Sistema de Gestión de Inventario</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-slate-600 dark:text-slate-300">Sincronizado con Firebase</span>
          </div>
        </div>
      </footer>


      {/* VIEW MODAL */}
      <AnimatePresence>
        {viewModalOpen && selectedMusico && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold font-poppins text-slate-900 dark:text-white">
                  Detalle del Registro
                </h3>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Nombre Completo</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedMusico.nombre}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Estado del Músico</span>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      {selectedMusico.estado}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Necesidad / Inventario</span>
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-700">
                    {selectedMusico.necesidad}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Fecha de Registro</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {selectedMusico.fechaHora}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editModalOpen && selectedMusico && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold font-poppins text-slate-900 dark:text-white">
                  Editar Registro
                </h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Estado del músico
                  </label>
                  <select
                    value={editEstado}
                    onChange={(e) => setEditEstado(e.target.value as EstadoMusico)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/50 focus:outline-none cursor-pointer"
                  >
                    <option value="En formación">En formación</option>
                    <option value="Músico activo">Músico activo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Necesidad / Inventario
                  </label>
                  <textarea
                    rows={4}
                    value={editNecesidad}
                    onChange={(e) => setEditNecesidad(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteModalOpen && selectedMusico && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold font-poppins text-slate-900 dark:text-white">
                  ¿Confirmar eliminación?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  ¿Está seguro de que desea eliminar el registro de{' '}
                  <strong className="text-slate-900 dark:text-slate-200">{selectedMusico.nombre}</strong>? Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE NEW RECORD MODAL */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold font-poppins text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-500" />
                  <span>Nuevo Registro de Inventario</span>
                </h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Estado del músico
                  </label>
                  <select
                    value={newEstado}
                    onChange={(e) => setNewEstado(e.target.value as EstadoMusico)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/50 focus:outline-none cursor-pointer"
                  >
                    <option value="En formación">En formación</option>
                    <option value="Músico activo">Músico activo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Información de Necesidad / Inventario
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Escriba en detalle la información..."
                    value={newNecesidad}
                    onChange={(e) => setNewNecesidad(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateNew}
                  disabled={isCreating}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCreating ? 'Guardando...' : 'Guardar Registro'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
