import { create } from 'zustand'
import { GPS_STATE } from '../config/constants.js'

export const useGeoStore = create((set) => ({
  gpsState: GPS_STATE.OFF,
  lat: null,
  lng: null,
  updatedAt: null,
  setPosition: (lat, lng) => set({ lat, lng, updatedAt: Date.now(), gpsState: GPS_STATE.PRECISE }),
  setCoarse: () => set({ gpsState: GPS_STATE.COARSE }),
  setOff: () => set({ gpsState: GPS_STATE.OFF, lat: null, lng: null }),
}))
