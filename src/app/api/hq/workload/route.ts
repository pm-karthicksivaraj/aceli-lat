import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ReviewWorkloadItem } from "@/lib/types";

interface ReviewerBucket {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  escalatedCount: number;
  confidenceScores: number[];
}

export async function GET() {
  try {
    // Fetch all extractions with relevant fields
    const extractions = await db.extraction.findMany({
      select: {
        reviewStatus: true,
        reviewedBy: true,
        confidenceScore: true,
      },
    });

    // Aggregate by reviewer
    const reviewerBuckets: Record<string, ReviewerBucket> = {};

    for (const ext of extractions) {
      if (ext.reviewStatus === "Pending") {
        // Pending extractions are grouped under "Unassigned"
        const key = "Unassigned";
        if (!reviewerBuckets[key]) {
          reviewerBuckets[key] = {
            pendingCount: 0,
            approvedCount: 0,
            rejectedCount: 0,
            escalatedCount: 0,
            confidenceScores: [],
          };
        }
        reviewerBuckets[key].pendingCount += 1;
        reviewerBuckets[key].confidenceScores.push(ext.confidenceScore);
      } else {
        // Reviewed extractions are grouped by reviewedBy
        const reviewer = ext.reviewedBy || "Unknown";
        if (!reviewerBuckets[reviewer]) {
          reviewerBuckets[reviewer] = {
            pendingCount: 0,
            approvedCount: 0,
            rejectedCount: 0,
            escalatedCount: 0,
            confidenceScores: [],
          };
        }

        const bucket = reviewerBuckets[reviewer];
        switch (ext.reviewStatus) {
          case "Approved":
            bucket.approvedCount += 1;
            break;
          case "Rejected":
            bucket.rejectedCount += 1;
            break;
          case "Escalated":
            bucket.escalatedCount += 1;
            break;
          default:
            // FollowUp or other statuses count toward the reviewer's total
            break;
        }
        bucket.confidenceScores.push(ext.confidenceScore);
      }
    }

    // Build the result array
    const result: ReviewWorkloadItem[] = Object.entries(reviewerBuckets).map(
      ([reviewer, bucket]) => {
        const totalReviewed =
          bucket.approvedCount + bucket.rejectedCount + bucket.escalatedCount;
        const avgConfidenceScore =
          bucket.confidenceScores.length > 0
            ? Math.round(
                (bucket.confidenceScores.reduce((sum, s) => sum + s, 0) /
                  bucket.confidenceScores.length) *
                  100
              ) / 100
            : 0;

        return {
          reviewer,
          pendingCount: bucket.pendingCount,
          approvedCount: bucket.approvedCount,
          rejectedCount: bucket.rejectedCount,
          escalatedCount: bucket.escalatedCount,
          totalReviewed,
          avgConfidenceScore,
        };
      }
    );

    // Sort by pendingCount descending
    result.sort((a, b) => b.pendingCount - a.pendingCount);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching HQ workload:", error);
    return NextResponse.json(
      { error: "Failed to fetch review workload" },
      { status: 500 }
    );
  }
}
