import { create } from 'zustand';

export const useAegisStore = create((set) => ({
  events: [],
  isConnected: false,
  currentThreatLevel: "LOW",

  addEvent: (event) => set((state) => ({ 
    events: [event, ...state.events].slice(0, 100),
    currentThreatLevel: event.severity === 'CRITICAL' || event.severity === 'HIGH' ? event.severity : state.currentThreatLevel
  })),
  setConnected: (isConnected) => set({ isConnected }),
  setThreatLevel: (level) => set({ currentThreatLevel: level }),
  setEvents: (events) => set({ events })
}));
