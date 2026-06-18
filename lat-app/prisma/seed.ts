import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:/home/z/my-project/db/custom.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.activity.deleteMany();
  await prisma.extraction.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.lender.deleteMany();

  // Create 15 lenders across 5 countries (3 per country)
  const lenders = await Promise.all([
    // Kenya
    prisma.lender.create({
      data: {
        institutionName: "Equity Bank Kenya",
        contactName: "Grace Wanjiku",
        country: "Kenya",
        relationshipStatus: "Active",
        commitmentScore: 0.82,
        productScore: 0.75,
        operationalScore: 0.88,
        riskScore: 0.65,
        relationshipScore: 0.90,
        marketScore: 0.78,
        lastContactDate: new Date("2025-03-10"),
      },
    }),
    prisma.lender.create({
      data: {
        institutionName: "KCB Group",
        contactName: "James Ochieng",
        country: "Kenya",
        relationshipStatus: "Active",
        commitmentScore: 0.70,
        productScore: 0.80,
        operationalScore: 0.72,
        riskScore: 0.60,
        relationshipScore: 0.85,
        marketScore: 0.82,
        lastContactDate: new Date("2025-03-08"),
      },
    }),
    prisma.lender.create({
      data: {
        institutionName: "NCBA Bank Kenya",
        contactName: "Faith Muthoni",
        country: "Kenya",
        relationshipStatus: "New",
        commitmentScore: 0.35,
        productScore: 0.40,
        operationalScore: 0.30,
        riskScore: 0.25,
        relationshipScore: 0.45,
        marketScore: 0.50,
        lastContactDate: new Date("2025-03-05"),
      },
    }),
    // Uganda
    prisma.lender.create({
      data: {
        institutionName: "Centenary Bank",
        contactName: "Rose Nakamya",
        country: "Uganda",
        relationshipStatus: "Active",
        commitmentScore: 0.85,
        productScore: 0.70,
        operationalScore: 0.78,
        riskScore: 0.55,
        relationshipScore: 0.88,
        marketScore: 0.65,
        lastContactDate: new Date("2025-03-09"),
      },
    }),
    prisma.lender.create({
      data: {
        institutionName: "Stanbic Bank Uganda",
        contactName: "Peter Mukasa",
        country: "Uganda",
        relationshipStatus: "At-Risk",
        commitmentScore: 0.45,
        productScore: 0.50,
        operationalScore: 0.55,
        riskScore: 0.35,
        relationshipScore: 0.40,
        marketScore: 0.60,
        lastContactDate: new Date("2025-02-20"),
      },
    }),
    prisma.lender.create({
      data: {
        institutionName: "Finance Trust Bank",
        contactName: "Annet Kyakuwa",
        country: "Uganda",
        relationshipStatus: "Dormant",
        commitmentScore: 0.30,
        productScore: 0.25,
        operationalScore: 0.35,
        riskScore: 0.40,
        relationshipScore: 0.20,
        marketScore: 0.30,
        lastContactDate: new Date("2025-01-15"),
      },
    }),
    // Tanzania
    prisma.lender.create({
      data: {
        institutionName: "CRDB Bank",
        contactName: "Halima Mwangi",
        country: "Tanzania",
        relationshipStatus: "Active",
        commitmentScore: 0.78,
        productScore: 0.82,
        operationalScore: 0.70,
        riskScore: 0.68,
        relationshipScore: 0.80,
        marketScore: 0.85,
        lastContactDate: new Date("2025-03-07"),
      },
    }),
    prisma.lender.create({
      data: {
        institutionName: "NMB Bank Tanzania",
        contactName: "Joseph Kimaro",
        country: "Tanzania",
        relationshipStatus: "Active",
        commitmentScore: 0.72,
        productScore: 0.65,
        operationalScore: 0.75,
        riskScore: 0.58,
        relationshipScore: 0.70,
        marketScore: 0.72,
        lastContactDate: new Date("2025-03-01"),
      },
    }),
    prisma.lender.create({
      data: {
        institutionName: "Azania Bank",
        contactName: "Mariam Hassan",
        country: "Tanzania",
        relationshipStatus: "New",
        commitmentScore: 0.25,
        productScore: 0.30,
        operationalScore: 0.28,
        riskScore: 0.20,
        relationshipScore: 0.35,
        marketScore: 0.32,
        lastContactDate: new Date("2025-03-04"),
      },
    }),
    // Ethiopia
    prisma.lender.create({
      data: {
        institutionName: "Dashen Bank",
        contactName: "Tigist Haile",
        country: "Ethiopia",
        relationshipStatus: "Active",
        commitmentScore: 0.80,
        productScore: 0.68,
        operationalScore: 0.75,
        riskScore: 0.62,
        relationshipScore: 0.85,
        marketScore: 0.70,
        lastContactDate: new Date("2025-03-06"),
      },
    }),
    prisma.lender.create({
      data: {
        institutionName: "Awash Bank",
        contactName: "Abel Tadesse",
        country: "Ethiopia",
        relationshipStatus: "Dormant",
        commitmentScore: 0.40,
        productScore: 0.35,
        operationalScore: 0.45,
        riskScore: 0.50,
        relationshipScore: 0.30,
        marketScore: 0.42,
        lastContactDate: new Date("2025-01-28"),
      },
    }),
    prisma.lender.create({
      data: {
        institutionName: "Amhara Bank",
        contactName: "Mekdes Alemu",
        country: "Ethiopia",
        relationshipStatus: "New",
        commitmentScore: 0.20,
        productScore: 0.22,
        operationalScore: 0.18,
        riskScore: 0.15,
        relationshipScore: 0.25,
        marketScore: 0.28,
        lastContactDate: new Date("2025-03-02"),
      },
    }),
    // Nigeria
    prisma.lender.create({
      data: {
        institutionName: "Access Bank Nigeria",
        contactName: "Chidi Eze",
        country: "Nigeria",
        relationshipStatus: "Active",
        commitmentScore: 0.88,
        productScore: 0.85,
        operationalScore: 0.82,
        riskScore: 0.72,
        relationshipScore: 0.90,
        marketScore: 0.88,
        lastContactDate: new Date("2025-03-11"),
      },
    }),
    prisma.lender.create({
      data: {
        institutionName: "FirstBank Nigeria",
        contactName: "Amina Bello",
        country: "Nigeria",
        relationshipStatus: "At-Risk",
        commitmentScore: 0.50,
        productScore: 0.55,
        operationalScore: 0.48,
        riskScore: 0.35,
        relationshipScore: 0.42,
        marketScore: 0.58,
        lastContactDate: new Date("2025-02-10"),
      },
    }),
    prisma.lender.create({
      data: {
        institutionName: "LAPO Microfinance",
        contactName: "Oluwaseun Adeyemi",
        country: "Nigeria",
        relationshipStatus: "Active",
        commitmentScore: 0.75,
        productScore: 0.72,
        operationalScore: 0.68,
        riskScore: 0.60,
        relationshipScore: 0.78,
        marketScore: 0.65,
        lastContactDate: new Date("2025-03-03"),
      },
    }),
  ]);

  // Create 8 meetings
  const meetings = await Promise.all([
    // Meeting 1 - Equity Bank Kenya (Reviewed)
    prisma.meeting.create({
      data: {
        lenderId: lenders[0].id,
        meetingDate: new Date("2025-03-10T10:00:00Z"),
        status: "Reviewed",
        typedNotes: "Discussed expansion of agricultural lending portfolio. Equity Bank expressed strong interest in the Aceli incentive framework. They want to pilot with 50 new SME loans in Q2. Key concern: operational capacity to handle increased volume in rural branches.",
        transcript: "Grace: We're very interested in expanding our agricultural lending... The Aceli incentives make this viable for us... We'd like to pilot with about 50 new SME loans... Our main concern is whether our rural branches can handle the volume...",
        duration: 2400,
        syncStatus: "Synced",
      },
    }),
    // Meeting 2 - Centenary Bank Uganda (Processing)
    prisma.meeting.create({
      data: {
        lenderId: lenders[3].id,
        meetingDate: new Date("2025-03-09T14:00:00Z"),
        status: "Processing",
        typedNotes: "Follow-up on product alignment discussion. Centenary Bank is ready to align their SACCO lending product with Aceli requirements. Need to schedule technical workshop for product mapping.",
        duration: 1800,
        syncStatus: "Synced",
      },
    }),
    // Meeting 3 - Stanbic Bank Uganda (Submitted)
    prisma.meeting.create({
      data: {
        lenderId: lenders[4].id,
        meetingDate: new Date("2025-02-20T09:00:00Z"),
        status: "Submitted",
        typedNotes: "Relationship health check. Stanbic expressed concerns about slow disbursement processes. Their risk team is hesitant about the incentive structure. Need to address their compliance questions before next meeting.",
        duration: 3600,
        syncStatus: "Pending",
      },
    }),
    // Meeting 4 - Access Bank Nigeria (Draft)
    prisma.meeting.create({
      data: {
        lenderId: lenders[12].id,
        meetingDate: new Date("2025-03-11T11:30:00Z"),
        status: "Draft",
        typedNotes: "Initial meeting notes: Access Bank very positive about Aceli LAT tool. They want to integrate with their existing CRM. Discussed market position in Lagos and Abuja regions.",
        duration: 1200,
        syncStatus: "Synced",
      },
    }),
    // Meeting 5 - CRDB Bank Tanzania (Approved)
    prisma.meeting.create({
      data: {
        lenderId: lenders[6].id,
        meetingDate: new Date("2025-03-07T15:00:00Z"),
        status: "Approved",
        typedNotes: "Final review meeting. CRDB has committed to full activation across all 6 areas. They will deploy the Aceli framework in their Dar es Salaam and Arusha branches starting next month. Excellent progress on product alignment and operational readiness.",
        transcript: "Halima: We're ready to go full deployment... Dar es Salaam and Arusha will be our first branches... The operational team is prepared... Product alignment looks solid... We're very happy with the progress...",
        duration: 3000,
        syncStatus: "Synced",
      },
    }),
    // Meeting 6 - KCB Group Kenya (Submitted)
    prisma.meeting.create({
      data: {
        lenderId: lenders[1].id,
        meetingDate: new Date("2025-03-08T16:00:00Z"),
        status: "Submitted",
        typedNotes: "KCB Group discussed their digital lending platform. James Ochieng outlined their interest in integrating Aceli scoring into their mobile banking app. They have strong market position but need guidance on risk appetite alignment.",
        duration: 2700,
        syncStatus: "Pending",
      },
    }),
    // Meeting 7 - Dashen Bank Ethiopia (Reviewed)
    prisma.meeting.create({
      data: {
        lenderId: lenders[9].id,
        meetingDate: new Date("2025-03-06T09:30:00Z"),
        status: "Reviewed",
        typedNotes: "Product alignment workshop with Dashen Bank. Tigist Haile presented their agricultural loan product line. Strong operational team in Addis Ababa but limited rural coverage. Discussed partnership potential with regional cooperatives.",
        duration: 4200,
        syncStatus: "Synced",
      },
    }),
    // Meeting 8 - LAPO Microfinance Nigeria (Draft)
    prisma.meeting.create({
      data: {
        lenderId: lenders[14].id,
        meetingDate: new Date("2025-03-03T13:00:00Z"),
        status: "Draft",
        typedNotes: "Field visit to LAPO Microfinance branches in Lagos. Oluwaseun showed strong commitment to MFI-specific Aceli products. Their operational capacity is adequate for a pilot program. Market position in micro-lending is very strong.",
        duration: 5400,
        syncStatus: "Synced",
      },
    }),
  ]);

  // Create 25 extractions for meetings that have been processed
  const extractions = await Promise.all([
    // Meeting 1 - Equity Bank Kenya (Reviewed)
    prisma.extraction.create({ data: { meetingId: meetings[0].id, activationArea: "commitment", fieldName: "commitment_level", extractedValue: "Strong commitment to pilot with 50 new SME loans in Q2 2025", confidenceScore: 0.92, reviewStatus: "Approved", reviewerNotes: "Verified by field officer", reviewedAt: new Date("2025-03-10T16:00:00Z"), reviewedBy: "field_officer_1" } }),
    prisma.extraction.create({ data: { meetingId: meetings[0].id, activationArea: "product", fieldName: "product_interest", extractedValue: "Agricultural lending portfolio expansion with Aceli incentive framework", confidenceScore: 0.88, reviewStatus: "Approved", reviewerNotes: "Confirmed in follow-up", reviewedAt: new Date("2025-03-10T16:05:00Z"), reviewedBy: "field_officer_1" } }),
    prisma.extraction.create({ data: { meetingId: meetings[0].id, activationArea: "operational", fieldName: "capacity_concern", extractedValue: "Rural branch capacity is a concern for handling increased loan volume", confidenceScore: 0.85, reviewStatus: "Approved", reviewedAt: new Date("2025-03-10T16:10:00Z"), reviewedBy: "field_officer_1" } }),
    prisma.extraction.create({ data: { meetingId: meetings[0].id, activationArea: "risk", fieldName: "risk_appetite", extractedValue: "Moderate risk appetite with incentive structure mitigating concerns", confidenceScore: 0.72, reviewStatus: "Pending" } }),
    prisma.extraction.create({ data: { meetingId: meetings[0].id, activationArea: "relationship", fieldName: "relationship_quality", extractedValue: "Strong relationship with high engagement and enthusiasm", confidenceScore: 0.95, reviewStatus: "Approved", reviewedAt: new Date("2025-03-10T16:15:00Z"), reviewedBy: "field_officer_1" } }),
    prisma.extraction.create({ data: { meetingId: meetings[0].id, activationArea: "market", fieldName: "market_position", extractedValue: "Leading position in Kenyan agricultural lending sector", confidenceScore: 0.78, reviewStatus: "Pending" } }),

    // Meeting 2 - Centenary Bank Uganda (Processing)
    prisma.extraction.create({ data: { meetingId: meetings[1].id, activationArea: "product", fieldName: "product_alignment", extractedValue: "SACCO lending product ready for alignment with Aceli requirements", confidenceScore: 0.91, reviewStatus: "Pending" } }),
    prisma.extraction.create({ data: { meetingId: meetings[1].id, activationArea: "operational", fieldName: "next_steps", extractedValue: "Technical workshop needed for product mapping exercise", confidenceScore: 0.83, reviewStatus: "Pending" } }),
    prisma.extraction.create({ data: { meetingId: meetings[1].id, activationArea: "commitment", fieldName: "commitment_indicator", extractedValue: "Ready to proceed with product alignment", confidenceScore: 0.76, reviewStatus: "Pending" } }),

    // Meeting 3 - Stanbic Bank Uganda (Submitted)
    prisma.extraction.create({ data: { meetingId: meetings[2].id, activationArea: "relationship", fieldName: "relationship_concern", extractedValue: "Slow disbursement processes causing frustration", confidenceScore: 0.87, reviewStatus: "Pending" } }),
    prisma.extraction.create({ data: { meetingId: meetings[2].id, activationArea: "risk", fieldName: "risk_hesitation", extractedValue: "Risk team hesitant about incentive structure compliance", confidenceScore: 0.68, reviewStatus: "Escalated", reviewerNotes: "Needs senior risk officer review", reviewedAt: new Date("2025-02-21T10:00:00Z"), reviewedBy: "regional_manager" } }),
    prisma.extraction.create({ data: { meetingId: meetings[2].id, activationArea: "operational", fieldName: "disbursement_issue", extractedValue: "Disbursement processes too slow for Aceli requirements", confidenceScore: 0.74, reviewStatus: "Pending" } }),

    // Meeting 5 - CRDB Bank Tanzania (Approved)
    prisma.extraction.create({ data: { meetingId: meetings[4].id, activationArea: "commitment", fieldName: "full_commitment", extractedValue: "Full commitment to activation across all 6 areas", confidenceScore: 0.96, reviewStatus: "Approved", reviewedAt: new Date("2025-03-08T09:00:00Z"), reviewedBy: "field_officer_2" } }),
    prisma.extraction.create({ data: { meetingId: meetings[4].id, activationArea: "product", fieldName: "product_readiness", extractedValue: "Product alignment solid and ready for deployment", confidenceScore: 0.93, reviewStatus: "Approved", reviewedAt: new Date("2025-03-08T09:05:00Z"), reviewedBy: "field_officer_2" } }),
    prisma.extraction.create({ data: { meetingId: meetings[4].id, activationArea: "operational", fieldName: "operational_readiness", extractedValue: "Operational team prepared for Dar es Salaam and Arusha deployment", confidenceScore: 0.89, reviewStatus: "Approved", reviewedAt: new Date("2025-03-08T09:10:00Z"), reviewedBy: "field_officer_2" } }),
    prisma.extraction.create({ data: { meetingId: meetings[4].id, activationArea: "market", fieldName: "market_strategy", extractedValue: "Dar es Salaam and Arusha branches selected for initial deployment", confidenceScore: 0.82, reviewStatus: "Approved", reviewedAt: new Date("2025-03-08T09:15:00Z"), reviewedBy: "field_officer_2" } }),
    prisma.extraction.create({ data: { meetingId: meetings[4].id, activationArea: "risk", fieldName: "risk_position", extractedValue: "Comfortable risk position with Aceli framework", confidenceScore: 0.79, reviewStatus: "Approved", reviewedAt: new Date("2025-03-08T09:20:00Z"), reviewedBy: "field_officer_2" } }),
    prisma.extraction.create({ data: { meetingId: meetings[4].id, activationArea: "relationship", fieldName: "relationship_strength", extractedValue: "Excellent partnership dynamics and very positive engagement", confidenceScore: 0.94, reviewStatus: "Approved", reviewedAt: new Date("2025-03-08T09:25:00Z"), reviewedBy: "field_officer_2" } }),

    // Meeting 4 - Access Bank Nigeria (Draft) - low confidence extractions
    prisma.extraction.create({ data: { meetingId: meetings[3].id, activationArea: "commitment", fieldName: "initial_interest", extractedValue: "Very positive initial response to Aceli LAT tool", confidenceScore: 0.65, reviewStatus: "Pending" } }),
    prisma.extraction.create({ data: { meetingId: meetings[3].id, activationArea: "market", fieldName: "market_regions", extractedValue: "Focus on Lagos and Abuja regions", confidenceScore: 0.58, reviewStatus: "Pending" } }),
    prisma.extraction.create({ data: { meetingId: meetings[3].id, activationArea: "operational", fieldName: "integration_need", extractedValue: "Wants to integrate with existing CRM system", confidenceScore: 0.71, reviewStatus: "Pending" } }),
    prisma.extraction.create({ data: { meetingId: meetings[3].id, activationArea: "product", fieldName: "product_discussion", extractedValue: "General discussion about product alignment", confidenceScore: 0.42, reviewStatus: "Pending" } }),

    // Meeting 6 - KCB Group Kenya (Submitted)
    prisma.extraction.create({ data: { meetingId: meetings[5].id, activationArea: "commitment", fieldName: "digital_commitment", extractedValue: "Interested in integrating Aceli scoring into mobile banking app", confidenceScore: 0.84, reviewStatus: "Pending" } }),
    prisma.extraction.create({ data: { meetingId: meetings[5].id, activationArea: "market", fieldName: "digital_market", extractedValue: "Strong market position in Kenyan digital lending space", confidenceScore: 0.90, reviewStatus: "Pending" } }),
    prisma.extraction.create({ data: { meetingId: meetings[5].id, activationArea: "risk", fieldName: "risk_guidance", extractedValue: "Needs guidance on risk appetite alignment with Aceli framework", confidenceScore: 0.55, reviewStatus: "Pending" } }),

    // Meeting 7 - Dashen Bank Ethiopia (Reviewed)
    prisma.extraction.create({ data: { meetingId: meetings[6].id, activationArea: "product", fieldName: "agri_product_line", extractedValue: "Agricultural loan product line presented with strong features", confidenceScore: 0.87, reviewStatus: "Approved", reviewedAt: new Date("2025-03-06T14:00:00Z"), reviewedBy: "field_officer_1" } }),
    prisma.extraction.create({ data: { meetingId: meetings[6].id, activationArea: "operational", fieldName: "rural_coverage", extractedValue: "Limited rural coverage outside Addis Ababa — needs cooperative partnerships", confidenceScore: 0.81, reviewStatus: "Approved", reviewedAt: new Date("2025-03-06T14:05:00Z"), reviewedBy: "field_officer_1" } }),
  ]);

  // Create 40 activities
  const now = new Date();
  const activities = await Promise.all([
    // Equity Bank Kenya activities (4)
    prisma.activity.create({ data: { lenderId: lenders[0].id, meetingId: meetings[0].id, type: "Meeting", description: "Quarterly review meeting completed with Grace Wanjiku", createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[0].id, meetingId: meetings[0].id, type: "Extraction", description: "AI extracted 6 activation area insights from meeting notes", createdAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[0].id, meetingId: meetings[0].id, type: "Review", description: "4 extractions approved, 2 pending review", createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[0].id, type: "Note", description: "Added note: Follow up on rural branch capacity assessment", createdAt: new Date(now.getTime() - 30 * 60 * 1000) } }),

    // Centenary Bank Uganda activities (2)
    prisma.activity.create({ data: { lenderId: lenders[3].id, meetingId: meetings[1].id, type: "Meeting", description: "Product alignment follow-up meeting with Rose Nakamya", createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[3].id, meetingId: meetings[1].id, type: "Extraction", description: "3 extractions created from meeting, pending review", createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000) } }),

    // Stanbic Bank Uganda activities (3)
    prisma.activity.create({ data: { lenderId: lenders[4].id, meetingId: meetings[2].id, type: "Meeting", description: "Relationship health check with Peter Mukasa", createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[4].id, meetingId: meetings[2].id, type: "Review", description: "Risk extraction escalated to senior risk officer", createdAt: new Date(now.getTime() - 22 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[4].id, type: "Note", description: "Status changed to At-Risk due to disbursement concerns", createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000) } }),

    // CRDB Bank Tanzania activities (3)
    prisma.activity.create({ data: { lenderId: lenders[6].id, meetingId: meetings[4].id, type: "Meeting", description: "Final activation review with Halima Mwangi", createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[6].id, meetingId: meetings[4].id, type: "Extraction", description: "All 6 activation areas extracted with high confidence", createdAt: new Date(now.getTime() - 47 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[6].id, meetingId: meetings[4].id, type: "Review", description: "All 6 extractions approved — full activation achieved", createdAt: new Date(now.getTime() - 46 * 60 * 60 * 1000) } }),

    // Access Bank Nigeria activities (2)
    prisma.activity.create({ data: { lenderId: lenders[12].id, meetingId: meetings[3].id, type: "Meeting", description: "Initial meeting with Chidi Eze at Access Bank", createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[12].id, type: "Note", description: "Access Bank keen on CRM integration", createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000) } }),

    // KCB Group Kenya activities (3)
    prisma.activity.create({ data: { lenderId: lenders[1].id, meetingId: meetings[5].id, type: "Meeting", description: "Digital lending platform discussion with James Ochieng", createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[1].id, type: "Note", description: "Scheduled follow-up meeting for next week", createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[1].id, type: "Sync", description: "Lender data synced successfully", createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000) } }),

    // NMB Bank Tanzania activities (2)
    prisma.activity.create({ data: { lenderId: lenders[7].id, type: "Note", description: "Joseph Kimaro confirmed attendance at regional workshop", createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[7].id, type: "Sync", description: "Meeting notes uploaded from field device", createdAt: new Date(now.getTime() - 34 * 60 * 60 * 1000) } }),

    // Dashen Bank Ethiopia activities (3)
    prisma.activity.create({ data: { lenderId: lenders[9].id, meetingId: meetings[6].id, type: "Meeting", description: "Product alignment workshop conducted", createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[9].id, meetingId: meetings[6].id, type: "Extraction", description: "2 key extractions from workshop — product and operational areas", createdAt: new Date(now.getTime() - 71 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[9].id, type: "Note", description: "Dashen Bank operational team very receptive", createdAt: new Date(now.getTime() - 70 * 60 * 60 * 1000) } }),

    // NCBA Bank Kenya activities (2)
    prisma.activity.create({ data: { lenderId: lenders[2].id, type: "Note", description: "New lender onboarding initiated", createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[2].id, type: "Sync", description: "Onboarding documents uploaded", createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000) } }),

    // FirstBank Nigeria activities (2)
    prisma.activity.create({ data: { lenderId: lenders[13].id, type: "Note", description: "Follow-up call scheduled — relationship health declining", createdAt: new Date(now.getTime() - 96 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[13].id, type: "Review", description: "Extraction rejected due to low confidence score", createdAt: new Date(now.getTime() - 94 * 60 * 60 * 1000) } }),

    // LAPO Microfinance activities (3)
    prisma.activity.create({ data: { lenderId: lenders[14].id, meetingId: meetings[7].id, type: "Meeting", description: "Field visit to LAPO Microfinance branches in Lagos", createdAt: new Date(now.getTime() - 15 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[14].id, type: "Sync", description: "Meeting data uploaded from field device", createdAt: new Date(now.getTime() - 14 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[14].id, type: "Note", description: "Oluwaseun interested in MFI-specific product features", createdAt: new Date(now.getTime() - 13 * 60 * 60 * 1000) } }),

    // Awash Bank Ethiopia activities (2)
    prisma.activity.create({ data: { lenderId: lenders[10].id, type: "Note", description: "No response to last 3 follow-up attempts", createdAt: new Date(now.getTime() - 120 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[10].id, type: "Sync", description: "Account flagged as dormant in system", createdAt: new Date(now.getTime() - 118 * 60 * 60 * 1000) } }),

    // Finance Trust Bank Uganda activities (2)
    prisma.activity.create({ data: { lenderId: lenders[5].id, type: "Note", description: "Dormant account — schedule re-engagement call", createdAt: new Date(now.getTime() - 168 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[5].id, type: "Sync", description: "Dormant status confirmed in latest sync", createdAt: new Date(now.getTime() - 166 * 60 * 60 * 1000) } }),

    // Recent global activities (4)
    prisma.activity.create({ data: { lenderId: lenders[0].id, type: "Sync", description: "All extraction data synced to server", createdAt: new Date(now.getTime() - 15 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[12].id, type: "Sync", description: "Draft meeting notes uploaded", createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000) } }),

    // Azania Bank Tanzania activities (2)
    prisma.activity.create({ data: { lenderId: lenders[8].id, type: "Note", description: "Initial contact made — Mariam Hassan is new relationship manager", createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[8].id, type: "Sync", description: "New lender profile created and synced", createdAt: new Date(now.getTime() - 17 * 60 * 60 * 1000) } }),

    // Amhara Bank Ethiopia activities (2)
    prisma.activity.create({ data: { lenderId: lenders[11].id, type: "Note", description: "Onboarding documents sent to Mekdes Alemu", createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { lenderId: lenders[11].id, type: "Note", description: "Awaiting response on Aceli participation terms", createdAt: new Date(now.getTime() - 22 * 60 * 60 * 1000) } }),
  ]);

  console.log("Seed data created successfully!");
  console.log(`  - ${lenders.length} lenders`);
  console.log(`  - ${meetings.length} meetings`);
  console.log(`  - ${extractions.length} extractions`);
  console.log(`  - ${activities.length} activities`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
