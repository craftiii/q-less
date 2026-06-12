import { create } from 'zustand'

export const useProviderStore = create((set) => ({
  provider: null,
  services: [],
  setProvider: (provider) => set({ provider }),
  setServices: (services) => set({ services }),
}))
