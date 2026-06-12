import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  role: null,      // 'admin' | 'staff' | null
  staffProfile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setStaffProfile: (staffProfile) => set({ staffProfile }),
  setLoading: (loading) => set({ loading }),
}))
