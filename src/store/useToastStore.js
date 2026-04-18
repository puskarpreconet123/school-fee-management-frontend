import { create } from 'zustand';

let id = 0;

const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 4000) => {
    const toast = { id: ++id, message, type, duration };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== toast.id) }));
      }, duration);
    }
    return toast.id;
  },

  removeToast: (toastId) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== toastId) })),

  // Convenience wrappers
  success: (msg, dur) => useToastStore.getState().addToast(msg, 'success', dur),
  error: (msg, dur) => useToastStore.getState().addToast(msg, 'error', dur),
  info: (msg, dur) => useToastStore.getState().addToast(msg, 'info', dur),
}));

export default useToastStore;

// Helper for use outside React (e.g., service layer)
export const toast = {
  success: (msg, dur) => useToastStore.getState().success(msg, dur),
  error: (msg, dur) => useToastStore.getState().error(msg, dur),
  info: (msg, dur) => useToastStore.getState().info(msg, dur),
};
