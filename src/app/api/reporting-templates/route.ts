import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const templateType = searchParams.get("templateType");
    const status = searchParams.get("status");
    const audience = searchParams.get("audience");
    const country = searchParams.get("country");

    const where: Record<string, unknown> = {};
    if (templateType) where.templateType = templateType;
    if (status) where.status = status;
    if (audience) where.audience = audience;
    if (country) where.country = country;

    const [records, total] = await Promise.all([
      db.reportingTemplate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.reportingTemplate.count({ where }),
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
    console.error("Error fetching reporting templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch reporting templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      templateName,
      templateType,
      description,
      country,
      sections,
      frequency,
      audience,
    } = body as {
      templateName: string;
      templateType: string;
      description: string;
      country?: string;
      sections: string;
      frequency?: string;
      audience: string;
    };

    if (!templateName || !templateType || !description || !sections || !audience) {
      return NextResponse.json(
        {
          error:
            "templateName, templateType, description, sections, and audience are required",
        },
        { status: 400 }
      );
    }

    const record = await db.reportingTemplate.create({
      data: {
        templateName,
        templateType,
        description,
        country: country ?? null,
        sections,
        frequency: frequency ?? "Quarterly",
        audience,
        status: "Draft",
        version: 1,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("Error creating reporting template:", error);
    return NextResponse.json(
      { error: "Failed to create reporting template" },
      { status: 500 }
    );
  }
}
