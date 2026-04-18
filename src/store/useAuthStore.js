import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null, // 'admin' | 'student'

      setAuth: (token, user, role) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        set({ token, user, role });
      },

      updateUser: (user) => set((s) => ({ user: { ...s.user, ...user } })),

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        set({ token: null, user: null, role: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ token: s.token, user: s.user, role: s.role }),
    }
  )
);

export default useAuthStore;
