export type EstadoMusico = 'En formación' | 'Músico activo';

export interface MusicoRegistro {
  id?: string;
  nombre: string;
  estado: EstadoMusico;
  necesidad: string;
  fechaHora: string; // Formatted date string for display (e.g. "26/07/2026, 14:05")
  createdAt: any; // Firestore Timestamp or string
}

export interface MusicoFormData {
  nombre: string;
  estado: EstadoMusico;
  necesidad: string;
}

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

export interface FilterOptions {
  search: string;
  estado: string; // 'Todos' | 'En formación' | 'Músico activo'
  sortDirection: 'desc' | 'asc';
  dateFrom?: string;
  dateTo?: string;
}
