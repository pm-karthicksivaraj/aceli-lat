'use client'

import { useAppStore } from '@/store/useAppStore'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

// Sprint 3
import { DashboardView } from '@/components/dashboard/DashboardView'
import { AuditLogView } from '@/components/audit/AuditLogView'

// Sprint 4
import { LenderList } from '@/components/lenders/LenderList'
import { MeetingList } from '@/components/meetings/MeetingList'
import { ExtractionList } from '@/components/extractions/ExtractionList'
import { ActivationAreaView } from '@/components/activation/ActivationAreaView'

// Sprint 5
import { ReviewWorkbench } from '@/components/review/ReviewWorkbench'
import { ExceptionQueue } from '@/components/exceptions/ExceptionQueue'
import { SyncDashboard } from '@/components/sync/SyncDashboard'

// Sprint 6
import { HQDashboard } from '@/components/hq/HQDashboard'
import { ScorecardView } from '@/components/scorecards/ScorecardView'
import { BenchmarkingView } from '@/components/benchmarking/BenchmarkingView'
import { MigrationView } from '@/components/migration/MigrationView'

// Sprint 7
import { KPIDashboard } from '@/components/kpi/KPIDashboard'
import { DefectTracker } from '@/components/defects/DefectTracker'
import { RolloutWaveView } from '@/components/rollout/RolloutWaveView'
import { FeedbackView } from '@/components/feedback/FeedbackView'

// Sprint 8
import { CountryReadinessView } from '@/components/country/CountryReadinessView'
import { AdminHandoverView } from '@/components/handover/AdminHandoverView'
import { MonitoringView } from '@/components/monitoring/MonitoringView'
import { SupportTicketView } from '@/components/support/SupportTicketView'

// Sprint 9
import { WarrantyTracker } from '@/components/warranty/WarrantyTracker'
import { IncidentManager } from '@/components/incidents/IncidentManager'
import { BackupManager } from '@/components/backups/BackupManager'
import { DRPlanView } from '@/components/dr/DRPlanView'
import { KnownIssuesView } from '@/components/known-issues/KnownIssuesView'
import { MaintenanceRoadmap } from '@/components/maintenance/MaintenanceRoadmap'
import { MaturityAssessment } from '@/components/maturity/MaturityAssessment'

// Sprint 10
import { OutcomeKPIView } from '@/components/outcomes/OutcomeKPIView'
import { AdoptionMetricsView } from '@/components/adoption/AdoptionMetricsView'
import { ContinuousImprovementView } from '@/components/improvement/ContinuousImprovementView'
import { Month12ReviewView } from '@/components/review/Month12ReviewView'
import { ExecutiveReviewView } from '@/components/executive/ExecutiveReviewView'

import type { ViewType } from '@/lib/types'

const viewComponents: Record<ViewType, React.ComponentType> = {
  // Sprint 3
  dashboard: DashboardView,
  'audit-logs': AuditLogView,
  // Sprint 4
  lenders: LenderList,
  meetings: MeetingList,
  extractions: ExtractionList,
  'activation-areas': ActivationAreaView,
  // Sprint 5
  'review-workbench': ReviewWorkbench,
  exceptions: ExceptionQueue,
  'sync-records': SyncDashboard,
  // Sprint 6
  'hq-dashboard': HQDashboard,
  scorecards: ScorecardView,
  benchmarking: BenchmarkingView,
  migration: MigrationView,
  // Sprint 7
  kpis: KPIDashboard,
  defects: DefectTracker,
  rollout: RolloutWaveView,
  feedback: FeedbackView,
  // Sprint 8
  'country-readiness': CountryReadinessView,
  'admin-handover': AdminHandoverView,
  monitoring: MonitoringView,
  'support-tickets': SupportTicketView,
  // Sprint 9
  warranty: WarrantyTracker,
  incidents: IncidentManager,
  backups: BackupManager,
  'dr-plans': DRPlanView,
  'known-issues': KnownIssuesView,
  maintenance: MaintenanceRoadmap,
  maturity: MaturityAssessment,
  // Sprint 10
  'outcome-kpis': OutcomeKPIView,
  'adoption-metrics': AdoptionMetricsView,
  'continuous-improvement': ContinuousImprovementView,
  'month12-review': Month12ReviewView,
  'executive-review': ExecutiveReviewView,
}

export default function Home() {
  const { currentView, sidebarOpen } = useAppStore()
  const ViewComponent = viewComponents[currentView]

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 transition-all duration-200 ${sidebarOpen ? 'md:ml-0' : 'md:ml-0'}`}>
          {ViewComponent ? <ViewComponent /> : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              View not found
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
