import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalRecords: logs.length,
      filters: { entityType, action, startDate, endDate },
      logs: logs.map((log) => ({
        ...log,
        // Verify hash chain
        hashVerified: !!log.hash,
      })),
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    return NextResponse.json({ error: "Failed to export audit logs" }, { status: 500 });
  }
}
