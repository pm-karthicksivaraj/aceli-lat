import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a snake_case or lowercase value into a proper Title Case label.
 * Examples:
 *   "in_progress" → "In Progress"
 *   "field_visit" → "Field Visit"
 *   "needs_followup" → "Needs Followup"
 *   "active" → "Active"
 *   "hq_analyst" → "HQ Analyst"
 *   "lat_to_sf" → "Lat To SF"
 */
export function formatLabel(value: string): string {
  if (!value) return ''
  return value
    .split('_')
    .map((word) => {
      // Known abbreviations that should stay uppercase
      const upperWords = ['hq', 'sf', 'lat', 'kpi', 'kpis', 'dr', 'sla', 'ux', 'nbfi', 'dfi', 'rto', 'rpo']
      if (upperWords.includes(word.toLowerCase())) {
        return word.toUpperCase()
      }
      // Regular word — capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * A label map for common enum values that need custom display text
 * (not just Title Case). Use this for values where formatLabel()
 * alone doesn't produce the right result.
 */
export const DISPLAY_LABELS: Record<string, string> = {
  // Lender status
  active: 'Active',
  dormant: 'Dormant',
  exited: 'Exited',
  // Lender institution types
  bank: 'Bank',
  microfinance: 'Microfinance',
  dfi: 'DFI',
  cooperative: 'Cooperative',
  nbfi: 'NBFI',
  // Lender source
  lat: 'LAT',
  salesforce: 'Salesforce',
  migration: 'Migration',
  // Meeting types
  field_visit: 'Field Visit',
  call: 'Call',
  hq_meeting: 'HQ Meeting',
  conference: 'Conference',
  // Meeting status
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  // Sync status
  synced: 'Synced',
  pending: 'Pending',
  failed: 'Failed',
  conflict: 'Conflict',
  // Narrative source
  typed: 'Typed',
  voice_extracted: 'Voice Extracted',
  ai_generated: 'AI Generated',
  // Voice memo status
  recorded: 'Recorded',
  transcribing: 'Transcribing',
  transcribed: 'Transcribed',
  // Extraction status
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  needs_followup: 'Needs Follow-up',
  // Review decisions
  edited: 'Edited',
  // Exception types
  missing_field: 'Missing Field',
  low_confidence: 'Low Confidence',
  invalid_transition: 'Invalid Transition',
  sync_failed: 'Sync Failed',
  reviewer_rejection: 'Reviewer Rejection',
  // Exception severity
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
  // Exception status
  open: 'Open',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
  // Sync direction
  lat_to_sf: 'LAT → Salesforce',
  sf_to_lat: 'Salesforce → LAT',
  // Validation rule types
  required: 'Required',
  range: 'Range',
  format: 'Format',
  unique: 'Unique',
  custom: 'Custom',
  // Benchmarking status
  validated: 'Validated',
  published: 'Published',
  // Migration status
  mapped: 'Mapped',
  skipped: 'Skipped',
  // Migration source
  google_sheets: 'Google Sheets',
  manual: 'Manual',
  // Defect categories
  functional: 'Functional',
  performance: 'Performance',
  data: 'Data',
  integration: 'Integration',
  security: 'Security',
  // Defect status
  investigating: 'Investigating',
  verified: 'Verified',
  closed: 'Closed',
  wontfix: "Won't Fix",
  blocker: 'Blocker',
  // Rollout wave status
  on_hold: 'On Hold',
  // Feedback categories
  bug: 'Bug',
  feature: 'Feature',
  workflow: 'Workflow',
  other: 'Other',
  // Feedback priority
  // Feedback status
  submitted: 'Submitted',
  implemented: 'Implemented',
  // Admin handover sections
  system_access: 'System Access',
  data_management: 'Data Management',
  integrations: 'Integrations',
  monitoring: 'Monitoring',
  support: 'Support',
  training: 'Training',
  // Monitoring alert types
  sync_failure: 'Sync Failure',
  availability: 'Availability',
  data_quality: 'Data Quality',
  // Monitoring severity
  info: 'Info',
  warning: 'Warning',
  // Monitoring status
  acknowledged: 'Acknowledged',
  // Support ticket categories
  technical: 'Technical',
  access: 'Access',
  // Warranty status
  expiring: 'Expiring',
  expired: 'Expired',
  extended: 'Extended',
  // Incident status
  reported: 'Reported',
  mitigated: 'Mitigated',
  // Backup types
  full: 'Full',
  incremental: 'Incremental',
  snapshot: 'Snapshot',
  // Backup scope
  database: 'Database',
  files: 'Files',
  configuration: 'Configuration',
  // Backup status
  scheduled: 'Scheduled',
  // DR plan strategy
  active_passive: 'Active-Passive',
  active_active: 'Active-Active',
  backup_restore: 'Backup & Restore',
  // DR plan status
  tested: 'Tested',
  // Known issue status
  workaround_available: 'Workaround Available',
  fix_planned: 'Fix Planned',
  fixed: 'Fixed',
  // Maintenance categories
  enhancement: 'Enhancement',
  tech_debt: 'Tech Debt',
  compliance: 'Compliance',
  // Maintenance effort
  small: 'Small',
  large: 'Large',
  // Maintenance status
  backlog: 'Backlog',
  deferred: 'Deferred',
  // Service maturity dimensions
  reliability: 'Reliability',
  observability: 'Observability',
  documentation: 'Documentation',
  // Outcome KPI categories
  activation: 'Activation',
  adoption: 'Adoption',
  efficiency: 'Efficiency',
  quality: 'Quality',
  impact: 'Impact',
  // Outcome KPI status
  baseline_set: 'Baseline Set',
  tracking: 'Tracking',
  achieved: 'Achieved',
  missed: 'Missed',
  defined: 'Defined',
  // Outcome KPI measurement units
  percent: 'Percent',
  hours: 'Hours',
  count: 'Count',
  score: 'Score',
  ratio: 'Ratio',
  // Adoption metrics
  daily_active_users: 'Daily Active Users',
  weekly_active_users: 'Weekly Active Users',
  meetings_logged: 'Meetings Logged',
  extractions_reviewed: 'Extractions Reviewed',
  sync_success_rate: 'Sync Success Rate',
  // CI categories
  process: 'Process',
  technology: 'Technology',
  user_experience: 'User Experience',
  // CI status
  identified: 'Identified',
  analyzed: 'Analyzed',
  // Month-12 review sections
  executive_summary: 'Executive Summary',
  kpi_outcomes: 'KPI Outcomes',
  adoption_analysis: 'Adoption Analysis',
  impact_stories: 'Impact Stories',
  lessons_learned: 'Lessons Learned',
  recommendations: 'Recommendations',
  next_steps: 'Next Steps',
  // Executive review sections
  overview: 'Overview',
  kpi_dashboard: 'KPI Dashboard',
  country_highlights: 'Country Highlights',
  risk_assessment: 'Risk Assessment',
  financial_impact: 'Financial Impact',
  strategic_recommendations: 'Strategic Recommendations',
  // Executive review audience
  board: 'Board',
  executive: 'Executive',
  program_team: 'Program Team',
  donors: 'Donors',
  // User roles
  country_director: 'Country Director',
  country_manager: 'Country Manager',
  hq_analyst: 'HQ Analyst',
  hq_executive: 'HQ Executive',
  admin: 'Admin',
  product_owner: 'Product Owner',
  // Narrative areas
  lending_volume: 'Lending Volume',
  terms: 'Terms',
  products: 'Products',
  pipeline: 'Pipeline',
  constraints: 'Constraints',
  relationship: 'Relationship',
  // Activation area categories
  lending: 'Lending',
}

/**
 * Get a display label for a value, using DISPLAY_LABELS if available,
 * otherwise falling back to formatLabel().
 */
export function getLabel(value: string): string {
  return DISPLAY_LABELS[value] ?? formatLabel(value)
}

