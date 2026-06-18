import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const assignedTeam = searchParams.get("assignedTeam");
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 20;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedTeam) where.assignedTeam = assignedTeam;

    const [records, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.supportTicket.count({ where }),
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
    console.error("Error fetching support tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch support tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      description,
      category,
      priority,
      country,
      reportedBy,
      reportedByEmail,
      assignedTo,
      assignedToEmail,
      assignedTeam,
      lenderId,
      meetingId,
      screenUrl,
      stepsToReproduce,
      workaround,
      dueByDate,
    } = body as {
      title: string;
      description: string;
      category: string;
      priority?: string;
      country: string;
      reportedBy: string;
      reportedByEmail?: string;
      assignedTo?: string;
      assignedToEmail?: string;
      assignedTeam?: string;
      lenderId?: string;
      meetingId?: string;
      screenUrl?: string;
      stepsToReproduce?: string;
      workaround?: string;
      dueByDate?: string;
    };

    if (!title || !description || !category || !country || !reportedBy) {
      return NextResponse.json(
        {
          error:
            "title, description, category, country, and reportedBy are required",
        },
        { status: 400 }
      );
    }

    // Auto-generate ticketNumber: SUP-001, SUP-002, etc.
    const ticketCount = await db.supportTicket.count();
    const ticketNumber = `SUP-${String(ticketCount + 1).padStart(3, "0")}`;

    // Ensure uniqueness in case of race conditions
    const existingTicket = await db.supportTicket.findUnique({
      where: { ticketNumber },
    });
    const finalTicketNumber = existingTicket
      ? `SUP-${String(ticketCount + 2).padStart(3, "0")}`
      : ticketNumber;

    const record = await db.supportTicket.create({
      data: {
        ticketNumber: finalTicketNumber,
        title,
        description,
        category,
        priority: priority ?? "Normal",
        status: assignedTo ? "Assigned" : "Open",
        country,
        reportedBy,
        reportedByEmail: reportedByEmail ?? null,
        assignedTo: assignedTo ?? null,
        assignedToEmail: assignedToEmail ?? null,
        assignedTeam: assignedTeam ?? null,
        lenderId: lenderId ?? null,
        meetingId: meetingId ?? null,
        screenUrl: screenUrl ?? null,
        stepsToReproduce: stepsToReproduce ?? null,
        workaround: workaround ?? null,
        dueByDate: dueByDate ? new Date(dueByDate) : null,
        firstResponseAt: null,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return NextResponse.json(
      { error: "Failed to create support ticket" },
      { status: 500 }
    );
  }
}
