import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Simulated AI transcription and extraction
const EXTRACTION_TEMPLATES = [
  { area: "commitment", fields: ["commitment_level", "commitment_indicator", "commitment_timeline"] },
  { area: "product", fields: ["product_interest", "product_alignment", "product_readiness"] },
  { area: "operational", fields: ["capacity_assessment", "operational_readiness", "infrastructure_status"] },
  { area: "risk", fields: ["risk_appetite", "risk_concerns", "risk_mitigation"] },
  { area: "relationship", fields: ["relationship_quality", "engagement_level", "partnership_potential"] },
  { area: "market", fields: ["market_position", "market_strategy", "competitive_landscape"] },
];

const VALUE_TEMPLATES: Record<string, string[]> = {
  commitment_level: [
    "Strong commitment expressed toward Aceli program objectives",
    "Moderate commitment with conditions attached",
    "Initial commitment pending further evaluation",
  ],
  commitment_indicator: [
    "Willing to allocate dedicated resources for implementation",
    "Expressed interest in phased approach starting Q2",
    "Awaiting board approval before full commitment",
  ],
  commitment_timeline: [
    "Targeting full commitment by end of quarter",
    "6-month pilot period proposed before scaling",
    "Immediate commitment possible with incentive structure",
  ],
  product_interest: [
    "High interest in agricultural lending products",
    "Interest in SACCO-based product structure",
    "Interest in MFI-specific product features",
  ],
  product_alignment: [
    "Existing product portfolio aligns well with Aceli framework",
    "Product redesign needed to meet Aceli requirements",
    "Partial alignment — some products ready, others need work",
  ],
  product_readiness: [
    "Product ready for immediate deployment",
    "Product needs minor adjustments before deployment",
    "Product development still in early stages",
  ],
  capacity_assessment: [
    "Sufficient operational capacity for current volume",
    "Capacity concerns for rural branch operations",
    "Capacity gaps identified — training needed",
  ],
  operational_readiness: [
    "Operational team prepared for deployment",
    "Operational readiness requires additional staffing",
    "Operational processes need streamlining",
  ],
  infrastructure_status: [
    "IT infrastructure supports Aceli integration",
    "Infrastructure upgrade needed for full integration",
    "CRM integration required before deployment",
  ],
  risk_appetite: [
    "Comfortable risk position with incentive structure",
    "Moderate risk appetite — incentive framework mitigating concerns",
    "Conservative risk stance — needs further alignment",
  ],
  risk_concerns: [
    "Compliance concerns around incentive structure",
    "Credit risk assessment processes need alignment",
    "Regulatory risk identified in cross-border operations",
  ],
  risk_mitigation: [
    "Risk sharing through Aceli guarantee mechanism",
    "Phased risk exposure with monitoring framework",
    "Risk mitigation through portfolio diversification",
  ],
  relationship_quality: [
    "Strong relationship with high engagement and enthusiasm",
    "Good relationship with consistent communication",
    "Relationship needs strengthening — low recent engagement",
  ],
  engagement_level: [
    "Proactive engagement — multiple follow-up meetings scheduled",
    "Responsive engagement — participates when contacted",
    "Passive engagement — slow to respond to outreach",
  ],
  partnership_potential: [
    "Excellent partnership dynamics — ready for deep collaboration",
    "Good partnership potential with some areas to develop",
    "Partnership potential exists but needs cultivation",
  ],
  market_position: [
    "Leading position in target market segment",
    "Strong regional presence with growth potential",
    "Niche market player with specialized expertise",
  ],
  market_strategy: [
    "Expanding into new geographic regions",
    "Deepening existing market penetration",
    "Diversifying product offerings for new segments",
  ],
  competitive_landscape: [
    "Competitive advantage in agricultural lending",
    "Competitive in urban markets, expanding to rural",
    "Differentiated through MFI specialization",
  ],
};

function randomConfidence(): number {
  const r = Math.random();
  if (r < 0.3) return 0.92 + Math.random() * 0.07; // High confidence
  if (r < 0.7) return 0.70 + Math.random() * 0.20; // Medium confidence
  return 0.40 + Math.random() * 0.30; // Low confidence
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const meeting = await db.meeting.findUnique({
      where: { id },
      include: { lender: true },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Update meeting status to Processing
    await db.meeting.update({
      where: { id },
      data: { status: "Processing" },
    });

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create simulated transcript
    const transcriptText = meeting.typedNotes
      ? `AI Transcription Summary:\n\nBased on the meeting notes provided, the following key points were extracted regarding the engagement with ${meeting.lender.institutionName}.\n\n${meeting.typedNotes}\n\nEnd of transcription.`
      : `AI Transcription:\n\nVoice memo processing completed for meeting with ${meeting.lender.institutionName}. Key themes identified across activation areas.`;

    await db.meeting.update({
      where: { id },
      data: { transcript: transcriptText },
    });

    // Generate extractions for each activation area
    const extractions = [];
    for (const template of EXTRACTION_TEMPLATES) {
      // Pick 1-2 fields per area
      const numFields = Math.random() > 0.5 ? 2 : 1;
      const selectedFields = template.fields.slice(0, numFields);

      for (const field of selectedFields) {
        const values = VALUE_TEMPLATES[field] || ["Information extracted from meeting discussion"];
        const value = values[Math.floor(Math.random() * values.length)];
        const confidence = randomConfidence();

        const extraction = await db.extraction.create({
          data: {
            meetingId: id,
            activationArea: template.area,
            fieldName: field,
            extractedValue: value,
            confidenceScore: Math.round(confidence * 100) / 100,
            reviewStatus: "Pending",
          },
        });
        extractions.push(extraction);
      }
    }

    // Update meeting status to Reviewed (ready for review)
    await db.meeting.update({
      where: { id },
      data: { status: "Reviewed" },
    });

    // Create activity log
    await db.activity.create({
      data: {
        lenderId: meeting.lenderId,
        meetingId: id,
        type: "Extraction",
        description: `AI extracted ${extractions.length} insights from meeting with ${meeting.lender.institutionName}`,
      },
    });

    return NextResponse.json({
      success: true,
      transcript: transcriptText,
      extractions,
      message: `Successfully extracted ${extractions.length} insights across 6 activation areas`,
    });
  } catch (error) {
    console.error("Error transcribing meeting:", error);
    return NextResponse.json({ error: "Failed to process transcription" }, { status: 500 });
  }
}
