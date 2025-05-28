import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validation
const appointmentSchema = z.object({
  appointmentDate: z.string().datetime(),
  notes: z.string().optional(),
});

// GET all appointments (admin sees all, users see only their own)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Admins can see all appointments
    if (session.user.role === "ADMIN") {
      const appointments = await db.appointment.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { appointmentDate: "desc" },
      });
      return NextResponse.json({ appointments });
    }

    // Regular users can only see their own appointments
    const appointments = await db.appointment.findMany({
      where: { userId: session.user.id },
      orderBy: { appointmentDate: "desc" },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST new appointment (donors can schedule)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Only donors can schedule appointments
    if (session.user.role !== "DONOR" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only donors can schedule appointments" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { appointmentDate, notes } = appointmentSchema.parse(body);

    // Check if the appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime < new Date()) {
      return NextResponse.json(
        { error: "Appointment date must be in the future" },
        { status: 400 }
      );
    }

    // Create the appointment
    const appointment = await db.appointment.create({
      data: {
        userId: session.user.id,
        appointmentDate: appointmentDateTime,
        notes,
        status: "SCHEDULED",
      },
    });

    return NextResponse.json(
      { appointment, message: "Appointment scheduled successfully" },
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
