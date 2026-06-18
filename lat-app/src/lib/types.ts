// Type definitions for Aceli LAT application

export type ViewType = "dashboard" | "lenders" | "meetings" | "review" | "offline";

export type Country = "Kenya" | "Uganda" | "Tanzania" | "Ethiopia" | "Nigeria";

export type RelationshipStatus = "Active" | "Dormant" | "New" | "At-Risk";

export type MeetingStatus = "Draft" | "Submitted" | "Processing" | "Reviewed" | "Approved";

export type SyncStatus = "Synced" | "Pending" | "Failed";

export type ActivationArea = "commitment" | "product" | "operational" | "risk" | "relationship" | "market";

export type ReviewStatus = "Pending" | "Approved" | "Rejected" | "Escalated";

export type ActivityType = "Note" | "Meeting" | "Extraction" | "Review" | "Sync";

export interface Lender {
  id: string;
  institutionName: string;
  contactName: string;
  country: Country;
  relationshipStatus: RelationshipStatus;
  commitmentScore: number;
  productScore: number;
  operationalScore: number;
  riskScore: number;
  relationshipScore: number;
  marketScore: number;
  lastContactDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  lenderId: string;
  lender?: Lender;
  meetingDate: string;
  status: MeetingStatus;
  typedNotes: string | null;
  audioBlobPath: string | null;
  transcript: string | null;
  duration: number;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Extraction {
  id: string;
  meetingId: string;
  meeting?: Meeting;
  activationArea: ActivationArea;
  fieldName: string;
  extractedValue: string;
  confidenceScore: number;
  reviewStatus: ReviewStatus;
  reviewerNotes: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  lenderId: string;
  lender?: Lender;
  meetingId: string | null;
  type: ActivityType;
  description: string;
  createdAt: string;
}

export interface DashboardStats {
  totalLenders: number;
  activeMeetings: number;
  pendingReviews: number;
  syncPending: number;
  lendersByCountry: Record<string, number>;
  lendersByStatus: Record<string, number>;
  recentActivityCount: number;
}

export interface SyncQueueItem {
  id: string;
  type: "meeting" | "extraction";
  action: "create" | "update";
  data: Record<string, unknown>;
  status: "pending" | "syncing" | "failed";
  retryCount: number;
  createdAt: number;
}

export const ACTIVATION_AREA_LABELS: Record<ActivationArea, string> = {
  commitment: "Lender Commitment",
  product: "Product Alignment",
  operational: "Operational Capacity",
  risk: "Risk Appetite",
  relationship: "Relationship Health",
  market: "Market Position",
};

export const ACTIVATION_AREA_ICONS: Record<ActivationArea, string> = {
  commitment: "🤝",
  product: "📦",
  operational: "⚙️",
  risk: "🛡️",
  relationship: "❤️",
  market: "📊",
};

export const COUNTRY_FLAGS: Record<Country, string> = {
  Kenya: "🇰🇪",
  Uganda: "🇺🇬",
  Tanzania: "🇹🇿",
  Ethiopia: "🇪🇹",
  Nigeria: "🇳🇬",
};

export const STATUS_COLORS: Record<RelationshipStatus, string> = {
  Active: "bg-green-100 text-green-800",
  Dormant: "bg-gray-100 text-gray-800",
  New: "bg-blue-100 text-blue-800",
  "At-Risk": "bg-red-100 text-red-800",
};

export function getConfidenceLevel(score: number): "green" | "amber" | "red" {
  if (score > 0.90) return "green";
  if (score >= 0.70) return "amber";
  return "red";
}

export function getConfidenceLabel(score: number): string {
  if (score > 0.90) return "Autonomous";
  if (score >= 0.70) return "Peer Review";
  return "Escalate";
}
