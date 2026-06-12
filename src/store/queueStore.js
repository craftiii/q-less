import { create } from 'zustand'

export const useQueueStore = create((set) => ({
  entries: [],
  loading: false,
  error: null,
  setEntries: (entries) => set({ entries }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
