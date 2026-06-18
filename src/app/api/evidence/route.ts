import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const evidenceType = searchParams.get("evidenceType");
    const category = searchParams.get("category");
    const verificationStatus = searchParams.get("verificationStatus");
    const country = searchParams.get("country");
    const sourceSystem = searchParams.get("sourceSystem");

    const where: Record<string, unknown> = {};
    if (evidenceType) where.evidenceType = evidenceType;
    if (category) where.category = category;
    if (verificationStatus) where.verificationStatus = verificationStatus;
    if (country) where.country = country;
    if (sourceSystem) where.sourceSystem = sourceSystem;

    const [records, total] = await Promise.all([
      db.evidenceCapture.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.evidenceCapture.count({ where }),
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
    console.error("Error fetching evidence captures:", error);
    return NextResponse.json(
      { error: "Failed to fetch evidence captures" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      evidenceType,
      title,
      description,
      category,
      country,
      sourceSystem,
      evidenceData,
      collectedBy,
      collectedAt,
      relatedKpiId,
      relatedReportingTemplateId,
      expiryDate,
      notes,
    } = body as {
      evidenceType: string;
      title: string;
      description: string;
      category: string;
      country?: string;
      sourceSystem: string;
      evidenceData?: string;
      collectedBy: string;
      collectedAt?: string;
      relatedKpiId?: string;
      relatedReportingTemplateId?: string;
      expiryDate?: string;
      notes?: string;
    };

    if (!evidenceType || !title || !description || !category || !sourceSystem || !collectedBy) {
      return NextResponse.json(
        {
          error:
            "evidenceType, title, description, category, sourceSystem, and collectedBy are required",
        },
        { status: 400 }
      );
    }

    const record = await db.evidenceCapture.create({
      data: {
        evidenceType,
        title,
        description,
        category,
        country: country ?? null,
        sourceSystem,
        evidenceData: evidenceData ?? null,
        collectedBy,
        collectedAt: collectedAt ? new Date(collectedAt) : new Date(),
        relatedKpiId: relatedKpiId ?? null,
        relatedReportingTemplateId: relatedReportingTemplateId ?? null,
        verificationStatus: "Pending",
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("Error creating evidence capture:", error);
    return NextResponse.json(
      { error: "Failed to create evidence capture" },
      { status: 500 }
    );
  }
}
