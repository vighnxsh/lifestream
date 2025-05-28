import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for validation
const bloodRequestUpdateSchema = z.object({
  bloodType: z.enum([
    "A_POSITIVE", "A_NEGATIVE", 
    "B_POSITIVE", "B_NEGATIVE", 
    "AB_POSITIVE", "AB_NEGATIVE", 
    "O_POSITIVE", "O_NEGATIVE"
  ]).optional(),
  quantity: z.number().int().positive().optional(),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["PENDING", "APPROVED", "FULFILLED", "REJECTED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
  bloodInventoryId: z.string().optional().nullable(),
  fulfilledDate: z.string().datetime().optional().nullable(),
});

// GET a specific blood request
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

    // Get the blood request without including relations to avoid type errors
    const bloodRequest = await db.bloodRequest.findUnique({
      where: { id }
    });
    
    // If needed, fetch the user separately
    const user = bloodRequest ? await db.user.findUnique({
      where: { id: bloodRequest.userId },
      select: { id: true, name: true, email: true }
    }) : null;

    if (!bloodRequest) {
      return NextResponse.json(
        { error: "Blood request not found" },
        { status: 404 }
      );
    }

    // Regular users can only view their own requests
    if (session.user.role !== "ADMIN" && bloodRequest.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized. You can only view your own requests." },
        { status: 403 }
      );
    }

    return NextResponse.json({ bloodRequest });
  } catch (err) {
    console.error("Error fetching blood request:", err);
    return NextResponse.json(
      { error: "Failed to fetch blood request" },
      { status: 500 }
    );
  }
}

// PATCH (update) a specific blood request
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

    // Check if blood request exists
    const existingRequest = await db.bloodRequest.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Blood request not found" },
        { status: 404 }
      );
    }

    // Regular users can only update their own requests and only if they are pending
    if (
      session.user.role !== "ADMIN" && 
      (existingRequest.userId !== session.user.id || existingRequest.status !== "PENDING")
    ) {
      return NextResponse.json(
        { error: "Unauthorized. You can only update your own pending requests." },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Parse and validate the request body
    const validatedData = bloodRequestUpdateSchema.parse(body);

    // Prepare update data
    const updateData = {};
    
    // Regular users can only update certain fields
    if (session.user.role === "RECIPIENT") {
      // Recipients can only update urgency, notes, or cancel their request
      if (validatedData.urgency) updateData.urgency = validatedData.urgency;
      if (validatedData.notes) updateData.notes = validatedData.notes;
      if (validatedData.status === "CANCELLED") updateData.status = "CANCELLED";
    } else if (session.user.role === "ADMIN") {
      // Admins can update all fields
      if (validatedData.bloodType) updateData.bloodType = validatedData.bloodType;
      if (validatedData.quantity) updateData.quantity = validatedData.quantity;
      if (validatedData.urgency) updateData.urgency = validatedData.urgency;
      if (validatedData.status) updateData.status = validatedData.status;
      if (validatedData.notes) updateData.notes = validatedData.notes;
      
      // Handle fulfillment
      if (validatedData.status === "FULFILLED") {
        if (!validatedData.bloodInventoryId) {
          return NextResponse.json(
            { error: "Blood inventory ID is required to fulfill a request" },
            { status: 400 }
          );
        }
        
        updateData.bloodInventoryId = validatedData.bloodInventoryId;
        updateData.fulfilledDate = new Date();
        
        // Update blood inventory status to USED
        await db.bloodInventory.update({
          where: { id: validatedData.bloodInventoryId },
          data: { status: "USED" },
        });
      }
    }

    // Update blood request
    const updatedRequest = await db.bloodRequest.update({
      where: { id },
      data: updateData,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ bloodRequest: updatedRequest });
  } catch (err) {
    console.error("Error updating blood request:", err);
    return NextResponse.json(
      { error: "Failed to update blood request" },
      { status: 500 }
    );
  }
}

// DELETE a specific blood request
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

    // Check if blood request exists
    const existingRequest = await db.bloodRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Blood request not found" },
        { status: 404 }
      );
    }

    // Regular users can only delete their own pending requests
    if (
      session.user.role !== "ADMIN" && 
      (existingRequest.userId !== session.user.id || existingRequest.status !== "PENDING")
    ) {
      return NextResponse.json(
        { error: "Unauthorized. You can only delete your own pending requests." },
        { status: 403 }
      );
    }

    // Delete blood request
    await db.bloodRequest.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Blood request deleted successfully" });
  } catch (err) {
    console.error("Error deleting blood request:", err);
    return NextResponse.json(
      { error: "Failed to delete blood request" },
      { status: 500 }
    );
  }
}
