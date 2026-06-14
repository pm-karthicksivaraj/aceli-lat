'use client'

import { Zap, Menu, User, Settings, LogOut, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store/useAppStore'
import { VIEW_LABELS } from '@/lib/types'

export function Header() {
  const { currentView, toggleSidebar } = useAppStore()

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
        <span className="hidden sm:inline text-muted-foreground">·</span>
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

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none hover:bg-muted transition-colors cursor-pointer"
            aria-label="User menu"
          >
            <Avatar size="sm">
              <AvatarImage src="" alt="Admin User" />
              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                AU
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-sm font-medium">Admin User</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">Admin User</span>
                <span className="text-xs text-muted-foreground">admin@aceli.org</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <User className="size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
