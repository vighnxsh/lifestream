import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validation
const donationUpdateSchema = z.object({
  bloodType: z.enum([
    "A_POSITIVE", "A_NEGATIVE", 
    "B_POSITIVE", "B_NEGATIVE", 
    "AB_POSITIVE", "AB_NEGATIVE", 
    "O_POSITIVE", "O_NEGATIVE"
  ]).optional(),
  quantity: z.number().int().positive().optional(),
  status: z.enum(["PENDING", "COMPLETED", "REJECTED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

// GET a specific donation
export async function GET(
  request: Request
) {
  try {
    // Extract id from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const donation = await db.donation.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    // Regular users can only view their own donations
    if (session.user.role !== "ADMIN" && donation.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized. You can only view your own donations." },
        { status: 403 }
      );
    }

    return NextResponse.json({ donation });
  } catch (err) {
    console.error("Error fetching donation:", err);
    return NextResponse.json(
      { error: "Failed to fetch donation" },
      { status: 500 }
    );
  }
}

// PATCH (update) a specific donation
export async function PATCH(
  request: Request
) {
  try {
    // Extract id from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Check if donation exists
    const existingDonation = await db.donation.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!existingDonation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    // Regular users can only update their own donations and only if they are pending
    if (
      session.user.role !== "ADMIN" && 
      (existingDonation.userId !== session.user.id || existingDonation.status !== "PENDING")
    ) {
      return NextResponse.json(
        { error: "Unauthorized. You can only update your own pending donations." },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Parse and validate the request body
    const validatedData = donationUpdateSchema.parse(body);

    // Prepare update data
    const updateData = {};
    
    // Regular users can only update notes or cancel their donation
    if (session.user.role === "DONOR") {
      if (validatedData.notes) updateData.notes = validatedData.notes;
      if (validatedData.status === "CANCELLED") updateData.status = "CANCELLED";
    } else if (session.user.role === "ADMIN") {
      // Admins can update all fields
      if (validatedData.bloodType) updateData.bloodType = validatedData.bloodType;
      if (validatedData.quantity) updateData.quantity = validatedData.quantity;
      if (validatedData.status) updateData.status = validatedData.status;
      if (validatedData.notes) updateData.notes = validatedData.notes;
      
      // If status is changed to COMPLETED, add to blood inventory
      if (validatedData.status === "COMPLETED" && existingDonation.status !== "COMPLETED") {
        // Create a new blood inventory entry
        await db.bloodInventory.create({
          data: {
            bloodType: existingDonation.bloodType,
            quantity: existingDonation.quantity,
            status: "AVAILABLE",
            donationId: id,
            expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000), // 42 days from now
          },
        });
      }
    }

    // Update donation
    const updatedDonation = await db.donation.update({
      where: { id },
      data: updateData,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ donation: updatedDonation });
  } catch (err) {
    console.error("Error updating donation:", err);
    return NextResponse.json(
      { error: "Failed to update donation" },
      { status: 500 }
    );
  }
}

// DELETE a specific donation
export async function DELETE(
  request: Request
) {
  try {
    // Extract id from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Check if donation exists
    const existingDonation = await db.donation.findUnique({
      where: { id },
    });

    if (!existingDonation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    // Regular users can only delete their own pending donations
    if (
      session.user.role !== "ADMIN" && 
      (existingDonation.userId !== session.user.id || existingDonation.status !== "PENDING")
    ) {
      return NextResponse.json(
        { error: "Unauthorized. You can only delete your own pending donations." },
        { status: 403 }
      );
    }

    // Delete donation
    await db.donation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Donation deleted successfully" });
  } catch (err) {
    console.error("Error deleting donation:", err);
    return NextResponse.json(
      { error: "Failed to delete donation" },
      { status: 500 }
    );
  }
}
