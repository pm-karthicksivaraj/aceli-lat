import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (country) {
      where.country = country;
    }
    if (status) {
      where.relationshipStatus = status;
    }
    if (search) {
      where.OR = [
        { institutionName: { contains: search } },
        { contactName: { contains: search } },
      ];
    }

    const lenders = await db.lender.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { meetings: true, activities: true },
        },
      },
    });

    return NextResponse.json(lenders);
  } catch (error) {
    console.error("Error fetching lenders:", error);
    return NextResponse.json({ error: "Failed to fetch lenders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lender = await db.lender.create({
      data: {
        institutionName: body.institutionName,
        contactName: body.contactName,
        country: body.country,
        relationshipStatus: body.relationshipStatus || "New",
        commitmentScore: body.commitmentScore || 0,
        productScore: body.productScore || 0,
        operationalScore: body.operationalScore || 0,
        riskScore: body.riskScore || 0,
        relationshipScore: body.relationshipScore || 0,
        marketScore: body.marketScore || 0,
      },
    });

    await db.activity.create({
      data: {
        lenderId: lender.id,
        type: "Note",
        description: `New lender added: ${lender.institutionName}`,
      },
    });

    return NextResponse.json(lender, { status: 201 });
  } catch (error) {
    console.error("Error creating lender:", error);
    return NextResponse.json({ error: "Failed to create lender" }, { status: 500 });
  }
}
