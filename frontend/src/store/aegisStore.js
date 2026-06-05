import { create } from 'zustand';

const useAegisStore = create((set) => ({
  events: [],
  stats: {},
  agentStatus: { sanitizer: "ONLINE", governor: "ONLINE", auditor: "ONLINE" },
  isConnected: false,
  currentThreatLevel: "LOW",

  addEvent: (event) => set((state) => ({ 
    events: [event, ...state.events].slice(0, 100)
  })),
  setStats: (stats) => set({ stats }),
  setConnected: (isConnected) => set({ isConnected }),
  setThreatLevel: (level) => set({ currentThreatLevel: level }),
  setEvents: (events) => set({ events })
}));

export default useAegisStore;
