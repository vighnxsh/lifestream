import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validation
const bloodRequestSchema = z.object({
  bloodType: z.enum([
    "A_POSITIVE", "A_NEGATIVE", 
    "B_POSITIVE", "B_NEGATIVE", 
    "AB_POSITIVE", "AB_NEGATIVE", 
    "O_POSITIVE", "O_NEGATIVE"
  ]),
  quantity: z.number().int().positive().default(1),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).default("NORMAL"),
  notes: z.string().optional(),
});

// GET all blood requests (admin sees all, recipients see only their own)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Admins can see all blood requests
    if (session.user.role === "ADMIN") {
      const bloodRequests = await db.bloodRequest.findMany({
        include: { 
          requester: { select: { id: true, name: true, email: true } },
          bloodInventory: true 
        },
        orderBy: { requestDate: "desc" },
      });
      return NextResponse.json({ bloodRequests });
    }

    // Regular users can only see their own blood requests
    const bloodRequests = await db.bloodRequest.findMany({
      where: { requesterId: session.user.id },
      include: { bloodInventory: true },
      orderBy: { requestDate: "desc" },
    });

    return NextResponse.json({ bloodRequests });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch blood requests" },
      { status: 500 }
    );
  }
}

// POST new blood request (recipients can request)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { bloodType, quantity, urgency, notes } = bloodRequestSchema.parse(body);

    // Create the blood request
    const bloodRequest = await db.bloodRequest.create({
      data: {
        requesterId: session.user.id,
        bloodType,
        quantity,
        urgency,
        notes,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { bloodRequest, message: "Blood request submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
