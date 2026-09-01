import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

interface UIStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  modals: Record<string, ModalState>;
  openModal: (key: string, data?: unknown) => void;
  closeModal: (key: string) => void;
  notifications: number;
  setNotifications: (count: number) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    if (toast.duration) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),

  modals: {},
  openModal: (key, data) =>
    set((state) => ({ modals: { ...state.modals, [key]: { isOpen: true, data } } })),
  closeModal: (key) =>
    set((state) => ({ modals: { ...state.modals, [key]: { isOpen: false } } })),

  notifications: 0,
  setNotifications: (count) => set({ notifications: count }),
}));
