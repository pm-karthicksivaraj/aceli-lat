'use client'

import { useState, useRef, useEffect } from 'react'
import { Zap, Menu, User, Settings, LogOut, Bell, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import { VIEW_LABELS } from '@/lib/types'
import { getLabel } from '@/lib/utils'

interface HeaderProps {
  onLogout: () => void
}

export function Header({ onLogout }: HeaderProps) {
  const { currentView, toggleSidebar, user } = useAppStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AU'

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Close menu on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    if (menuOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="shrink-0"
      >
        <Menu className="size-5" />
      </Button>

      {/* App title & subtitle */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5">
          <Zap className="size-5 text-primary shrink-0" />
          <h1 className="text-base font-semibold tracking-tight whitespace-nowrap">
            Aceli LAT
          </h1>
        </div>
        <span className="hidden sm:inline text-muted-foreground">&middot;</span>
        <span className="hidden sm:inline text-sm text-muted-foreground truncate">
          {VIEW_LABELS[currentView]}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
        </Button>

        {/* User avatar dropdown — custom implementation */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none hover:bg-muted transition-colors cursor-pointer"
            aria-label="User menu"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
              {initials}
            </div>
            <span className="hidden md:inline text-sm font-medium">{user?.name ?? 'User'}</span>
            <ChevronDown className="size-3.5 text-muted-foreground hidden md:block" />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 z-50">
              {/* User info */}
              <div className="px-2 py-1.5 border-b mb-1">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm">{user?.name ?? 'User'}</span>
                  <span className="text-xs text-muted-foreground">{user?.email ?? ''}</span>
                  {user?.role && (
                    <span className="text-xs text-primary font-medium">{getLabel(user.role)}</span>
                  )}
                </div>
              </div>

              {/* Menu items */}
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                onClick={() => setMenuOpen(false)}
              >
                <User className="size-4" />
                Profile
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="size-4" />
                Settings
              </button>

              {/* Separator */}
              <div className="my-1 h-px bg-border" />

              {/* Logout */}
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors cursor-pointer"
                onClick={() => {
                  setMenuOpen(false)
                  onLogout()
                }}
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
