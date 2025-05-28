import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validation
const appointmentUpdateSchema = z.object({
  appointmentDate: z.string().datetime().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

// GET a specific appointment
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const id = params.id;
    
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Regular users can only view their own appointments
    if (session.user.role !== "ADMIN" && appointment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to view this appointment" },
        { status: 403 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// PATCH (update) a specific appointment
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const id = params.id;
    const body = await req.json();
    const { appointmentDate, status, notes } = appointmentUpdateSchema.parse(body);

    // Check if appointment exists
    const existingAppointment = await db.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Regular users can only update their own appointments and cannot mark as completed
    if (session.user.role !== "ADMIN") {
      if (existingAppointment.userId !== session.user.id) {
        return NextResponse.json(
          { error: "You don't have permission to update this appointment" },
          { status: 403 }
        );
      }
      
      // Regular users cannot mark appointments as completed
      if (status === "COMPLETED") {
        return NextResponse.json(
          { error: "Only administrators can mark appointments as completed" },
          { status: 403 }
        );
      }
    }

    // Update appointment
    const updatedData: any = {};
    if (appointmentDate) {
      const appointmentDateTime = new Date(appointmentDate);
      // Check if the appointment date is in the future
      if (appointmentDateTime < new Date() && status !== "CANCELLED") {
        return NextResponse.json(
          { error: "Appointment date must be in the future" },
          { status: 400 }
        );
      }
      updatedData.appointmentDate = appointmentDateTime;
    }
    if (status) updatedData.status = status;
    if (notes !== undefined) updatedData.notes = notes;

    const appointment = await db.appointment.update({
      where: { id },
      data: updatedData,
    });

    return NextResponse.json({ 
      appointment, 
      message: "Appointment updated successfully" 
    });
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

// DELETE a specific appointment
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const id = params.id;

    // Check if appointment exists
    const existingAppointment = await db.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Regular users can only delete their own appointments
    if (session.user.role !== "ADMIN" && existingAppointment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this appointment" },
        { status: 403 }
      );
    }

    // Delete appointment
    await db.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: "Appointment deleted successfully" 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
