export type ViewType =
  // Sprint 3
  | 'dashboard'
  | 'audit-logs'
  // Sprint 4
  | 'lenders'
  | 'meetings'
  | 'extractions'
  | 'activation-areas'
  // Sprint 5
  | 'review-workbench'
  | 'exceptions'
  | 'sync-records'
  // Sprint 6
  | 'hq-dashboard'
  | 'scorecards'
  | 'benchmarking'
  | 'migration'
  // Sprint 7
  | 'kpis'
  | 'defects'
  | 'rollout'
  | 'feedback'
  // Sprint 8
  | 'country-readiness'
  | 'admin-handover'
  | 'monitoring'
  | 'support-tickets'
  // Sprint 9
  | 'warranty'
  | 'incidents'
  | 'backups'
  | 'dr-plans'
  | 'known-issues'
  | 'maintenance'
  | 'maturity'
  // Sprint 10
  | 'outcome-kpis'
  | 'adoption-metrics'
  | 'continuous-improvement'
  | 'month12-review'
  | 'executive-review'

export const VIEW_LABELS: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  'audit-logs': 'Audit Logs',
  lenders: 'Lenders',
  meetings: 'Meetings',
  extractions: 'Extractions',
  'activation-areas': 'Activation Areas',
  'review-workbench': 'Review Workbench',
  exceptions: 'Exceptions',
  'sync-records': 'Sync Records',
  'hq-dashboard': 'HQ Dashboard',
  scorecards: 'Scorecards',
  benchmarking: 'Benchmarking',
  migration: 'Migration',
  kpis: 'KPIs',
  defects: 'Defects',
  rollout: 'Rollout',
  feedback: 'Feedback',
  'country-readiness': 'Country Readiness',
  'admin-handover': 'Admin Handover',
  monitoring: 'Monitoring',
  'support-tickets': 'Support Tickets',
  warranty: 'Warranty',
  incidents: 'Incidents',
  backups: 'Backups',
  'dr-plans': 'DR Plans',
  'known-issues': 'Known Issues',
  maintenance: 'Maintenance',
  maturity: 'Maturity',
  'outcome-kpis': 'Outcome KPIs',
  'adoption-metrics': 'Adoption Metrics',
  'continuous-improvement': 'Continuous Improvement',
  'month12-review': 'Month-12 Review',
  'executive-review': 'Executive Review',
}
