import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const alertType = searchParams.get("alertType");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const country = searchParams.get("country");
    const source = searchParams.get("source");
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 20;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Record<string, unknown> = {};
    if (alertType) where.alertType = alertType;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (country) where.country = country;
    if (source) where.source = source;

    const [records, total] = await Promise.all([
      db.monitoringAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.monitoringAlert.count({ where }),
    ]);

    return NextResponse.json({
      data: records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching monitoring alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch monitoring alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      alertType,
      severity,
      status,
      country,
      source,
      title,
      description,
      metricName,
      metricValue,
      thresholdValue,
      affectedEntities,
    } = body as {
      alertType: string;
      severity?: string;
      status?: string;
      country?: string;
      source: string;
      title: string;
      description: string;
      metricName?: string;
      metricValue?: number;
      thresholdValue?: number;
      affectedEntities?: string;
    };

    if (!alertType || !source || !title || !description) {
      return NextResponse.json(
        { error: "alertType, source, title, and description are required" },
        { status: 400 }
      );
    }

    const record = await db.monitoringAlert.create({
      data: {
        alertType,
        severity: severity ?? "Warning",
        status: status ?? "Active",
        country: country ?? null,
        source,
        title,
        description,
        metricName: metricName ?? null,
        metricValue: metricValue ?? null,
        thresholdValue: thresholdValue ?? null,
        affectedEntities: affectedEntities ?? null,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("Error creating monitoring alert:", error);
    return NextResponse.json(
      { error: "Failed to create monitoring alert" },
      { status: 500 }
    );
  }
}
