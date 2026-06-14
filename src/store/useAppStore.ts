import { create } from 'zustand'
import type { ViewType } from '@/lib/types'

interface User {
  userId: string
  email: string
  name: string
  role: string
}

interface AppState {
  // Navigation
  currentView: ViewType
  sidebarOpen: boolean
  setCurrentView: (view: ViewType) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Auth
  user: User | null
  authenticated: boolean
  authLoading: boolean
  setUser: (user: User | null) => void
  setAuthLoading: (loading: boolean) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'dashboard',
  sidebarOpen: true,
  setCurrentView: (view) => set({ currentView: view }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Auth
  user: null,
  authenticated: false,
  authLoading: true,
  setUser: (user) => set({ user, authenticated: !!user, authLoading: false }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  logout: () => set({ user: null, authenticated: false, authLoading: false, currentView: 'dashboard' }),
}))
