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
    
    const bloodRequest = await db.bloodRequest.findUnique({
      where: { id },
      include: { 
        requester: { select: { id: true, name: true, email: true } },
        bloodInventory: true 
      },
    });

    if (!bloodRequest) {
      return NextResponse.json(
        { error: "Blood request not found" },
        { status: 404 }
      );
    }

    // Regular users can only view their own blood requests
    if (session.user.role !== "ADMIN" && bloodRequest.requesterId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to view this blood request" },
        { status: 403 }
      );
    }

    return NextResponse.json({ bloodRequest });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch blood request" },
      { status: 500 }
    );
  }
}

// PATCH (update) a specific blood request
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
    const { 
      bloodType, quantity, urgency, status, 
      notes, bloodInventoryId, fulfilledDate 
    } = bloodRequestUpdateSchema.parse(body);

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

    // Regular users can only update their own blood requests and only certain fields
    if (session.user.role !== "ADMIN") {
      if (existingRequest.requesterId !== session.user.id) {
        return NextResponse.json(
          { error: "You don't have permission to update this blood request" },
          { status: 403 }
        );
      }
      
      // Regular users can only update urgency, notes, or cancel their requests
      const allowedUpdates: any = {};
      if (urgency) allowedUpdates.urgency = urgency;
      if (notes !== undefined) allowedUpdates.notes = notes;
      if (status === "CANCELLED") allowedUpdates.status = status;
      
      // Regular users cannot change status to anything other than CANCELLED
      if (status && status !== "CANCELLED") {
        return NextResponse.json(
          { error: "You don't have permission to change the status to " + status },
          { status: 403 }
        );
      }

      const bloodRequest = await db.bloodRequest.update({
        where: { id },
        data: allowedUpdates,
      });

      return NextResponse.json({ 
        bloodRequest, 
        message: "Blood request updated successfully" 
      });
    }

    // Admin updates
    const updatedData: any = {};
    if (bloodType) updatedData.bloodType = bloodType;
    if (quantity !== undefined) updatedData.quantity = quantity;
    if (urgency) updatedData.urgency = urgency;
    if (status) updatedData.status = status;
    if (notes !== undefined) updatedData.notes = notes;
    if (bloodInventoryId !== undefined) updatedData.bloodInventoryId = bloodInventoryId;
    
    // If status is changed to FULFILLED, set fulfilledDate
    if (status === "FULFILLED") {
      updatedData.fulfilledDate = fulfilledDate ? new Date(fulfilledDate) : new Date();
      
      // If blood inventory is assigned, update its status
      if (bloodInventoryId) {
        await db.bloodInventory.update({
          where: { id: bloodInventoryId },
          data: { status: "USED" },
        });
      }
    }

    const bloodRequest = await db.bloodRequest.update({
      where: { id },
      data: updatedData,
      include: { bloodInventory: true },
    });

    return NextResponse.json({ 
      bloodRequest, 
      message: "Blood request updated successfully" 
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

// DELETE a specific blood request
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

    // Regular users can only delete their own blood requests
    if (session.user.role !== "ADMIN" && existingRequest.requesterId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this blood request" },
        { status: 403 }
      );
    }

    // Delete blood request
    await db.bloodRequest.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: "Blood request deleted successfully" 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
