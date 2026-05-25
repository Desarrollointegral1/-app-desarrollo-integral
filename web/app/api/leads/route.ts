import { NextRequest, NextResponse } from "next/server";

interface LeadData {
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadData = await request.json();

    // Validate required fields
    if (!body.name?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Log the lead (replace with DB/CRM integration as needed)
    console.log("[LEAD]", {
      timestamp: new Date().toISOString(),
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      message: body.message || null,
    });

    // TODO: Integrate with CRM (HubSpot, etc.) or send email notification
    // Example:
    // await sendNotificationEmail({ to: "ariel@desarrollointegral.com", lead: body });

    return NextResponse.json(
      { success: true, message: "Lead received" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LEADS API ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
