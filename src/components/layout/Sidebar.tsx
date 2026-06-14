'use client'

import { useState, useSyncExternalStore } from 'react'
import {
  LayoutDashboard,
  ScrollText,
  Building2,
  CalendarDays,
  FileSearch,
  MapPin,
  ClipboardCheck,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Trophy,
  GitCompareArrows,
  ArrowRightLeft,
  Target,
  Bug,
  Rocket,
  MessageSquare,
  Globe,
  ShieldCheck,
  Activity,
  Headset,
  ShieldAlert,
  Siren,
  Database,
  HardHat,
  Info,
  Wrench,
  TrendingUp,
  LineChart,
  Users,
  Lightbulb,
  CalendarClock,
  Presentation,
  ChevronDown,
  ChevronRight,
  Zap,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/useAppStore'
import type { ViewType } from '@/lib/types'
import { VIEW_LABELS } from '@/lib/types'

// ─── Navigation structure ───────────────────────────────────────────────────

interface NavItem {
  view: ViewType
  icon: React.ElementType
}

interface NavGroup {
  label: string
  icon: React.ElementType
  sprint: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Platform',
    icon: Zap,
    sprint: 'Sprint 3',
    items: [
      { view: 'dashboard', icon: LayoutDashboard },
      { view: 'audit-logs', icon: ScrollText },
    ],
  },
  {
    label: 'Field Capture',
    icon: ClipboardCheck,
    sprint: 'Sprint 4',
    items: [
      { view: 'lenders', icon: Building2 },
      { view: 'meetings', icon: CalendarDays },
      { view: 'extractions', icon: FileSearch },
      { view: 'activation-areas', icon: MapPin },
    ],
  },
  {
    label: 'Review & Governance',
    icon: ShieldCheck,
    sprint: 'Sprint 5',
    items: [
      { view: 'review-workbench', icon: ClipboardCheck },
      { view: 'exceptions', icon: AlertTriangle },
      { view: 'sync-records', icon: RefreshCw },
    ],
  },
  {
    label: 'HQ & Analytics',
    icon: BarChart3,
    sprint: 'Sprint 6',
    items: [
      { view: 'hq-dashboard', icon: BarChart3 },
      { view: 'scorecards', icon: Trophy },
      { view: 'benchmarking', icon: GitCompareArrows },
      { view: 'migration', icon: ArrowRightLeft },
    ],
  },
  {
    label: 'Rollout',
    icon: Rocket,
    sprint: 'Sprint 7-8',
    items: [
      { view: 'kpis', icon: Target },
      { view: 'defects', icon: Bug },
      { view: 'rollout', icon: Rocket },
      { view: 'feedback', icon: MessageSquare },
      { view: 'country-readiness', icon: Globe },
      { view: 'admin-handover', icon: ShieldCheck },
      { view: 'monitoring', icon: Activity },
      { view: 'support-tickets', icon: Headset },
    ],
  },
  {
    label: 'Operations',
    icon: ShieldAlert,
    sprint: 'Sprint 9',
    items: [
      { view: 'warranty', icon: ShieldAlert },
      { view: 'incidents', icon: Siren },
      { view: 'backups', icon: Database },
      { view: 'dr-plans', icon: HardHat },
      { view: 'known-issues', icon: Info },
      { view: 'maintenance', icon: Wrench },
      { view: 'maturity', icon: TrendingUp },
    ],
  },
  {
    label: 'Outcomes',
    icon: LineChart,
    sprint: 'Sprint 10',
    items: [
      { view: 'outcome-kpis', icon: Target },
      { view: 'adoption-metrics', icon: Users },
      { view: 'continuous-improvement', icon: Lightbulb },
      { view: 'month12-review', icon: CalendarClock },
      { view: 'executive-review', icon: Presentation },
    ],
  },
]

// ─── Collapsible group ──────────────────────────────────────────────────────

function NavGroupSection({
  group,
  currentView,
  setCurrentView,
}: {
  group: NavGroup
  currentView: ViewType
  setCurrentView: (v: ViewType) => void
}) {
  const isActive = group.items.some((item) => item.view === currentView)
  const [open, setOpen] = useState(true)

  const handleToggle = () => {
    setOpen((prev) => !prev)
  }

  const GroupIcon = group.icon

  return (
    <div className="py-1">
      {/* Group header */}
      <button
        onClick={handleToggle}
        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
          isActive
            ? 'text-foreground bg-muted/40'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
        aria-expanded={open}
      >
        <GroupIcon className="size-3.5 shrink-0" />
        <span className="flex-1 text-left truncate">{group.label}</span>
        <span className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground/60 hidden lg:inline">
          {group.sprint}
        </span>
        {open ? (
          <ChevronDown className="size-3.5 shrink-0 ml-1" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 ml-1" />
        )}
      </button>

      {/* Group items */}
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          maxHeight: open ? `${group.items.length * 40}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="space-y-0.5 px-1">
          {group.items.map((item) => {
            const ItemIcon = item.icon
            const active = item.view === currentView
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`
                  group flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors cursor-pointer
                  ${
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
                aria-current={active ? 'page' : undefined}
              >
                <ItemIcon
                  className={`size-4 shrink-0 ${
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                />
                <span className="truncate">{VIEW_LABELS[item.view]}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar content (shared between desktop & mobile) ──────────────────────

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const { currentView, setCurrentView } = useAppStore()

  const handleNavClick = (view: ViewType) => {
    setCurrentView(view)
    onItemClick?.()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sidebar header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <Zap className="size-5 text-primary shrink-0" />
        <span className="text-sm font-semibold tracking-tight">Aceli LAT</span>
      </div>
      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
        {NAV_GROUPS.map((group) => (
          <NavGroupSection
            key={group.label}
            group={group}
            currentView={currentView}
            setCurrentView={handleNavClick}
          />
        ))}
      </nav>

      {/* Footer */}
      <Separator />
      <div className="px-4 py-3">
        <p className="text-[10px] text-muted-foreground">
          v0.1.0 · Mobilization
        </p>
      </div>
    </div>
  )
}

// ─── Desktop sidebar ────────────────────────────────────────────────────────

function DesktopSidebar() {
  const { sidebarOpen } = useAppStore()

  return (
    <aside
      className={`
        hidden md:flex flex-col border-r bg-background transition-all duration-300 ease-in-out shrink-0
        ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}
      `}
      aria-label="Sidebar navigation"
    >
      <div className="w-64 h-full">
        <SidebarContent />
      </div>
    </aside>
  )
}

// ─── Mobile sidebar (sheet overlay) ─────────────────────────────────────────

function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!mounted) return null

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-xl md:hidden
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Mobile sidebar navigation"
      >
        {/* Close button */}
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            <span className="text-sm font-semibold">Aceli LAT</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </Button>
        </div>
        <Separator />
        <div className="h-[calc(100%-52px)] overflow-y-auto">
          <SidebarContent onItemClick={() => setSidebarOpen(false)} />
        </div>
      </div>
    </>
  )
}

// ─── Exported component ─────────────────────────────────────────────────────

export function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  )
}
